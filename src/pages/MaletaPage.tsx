import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Briefcase, Download, Eye, Plus, Printer, DollarSign, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { toast } from '@/lib/toast';
import { getCashExpenses, nextCode, type MaletaCut } from '@/lib/posStore';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import MetricStat from '@/components/ui/MetricStat';
import SegmentedControl from '@/components/ui/SegmentedControl';
import RegisterDetailsModal from './point-of-sale-pos/components/RegisterDetailsModal';
import {
  crearCorteMaleta,
  obtenerCortesMaleta,
  obtenerResumenCajaHoy,
} from '@/services/maleta.service';
import { useAuth } from '@/context/AuthContext';

export default function MaletaPage() {
  const { user } = useAuth();
  const [cuts, setCuts] = useState<MaletaCut[]>([]);
  const [bagAmount, setBagAmount] = useState('70000');
  const [selected, setSelected] = useState<MaletaCut | null>(null);
  const [tab, setTab] = useState<'cut' | 'history'>('cut');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState({ cash: 0, card: 0, transfer: 0, credit: 0 });
  const [salesTotal, setSalesTotal] = useState(0);
  const [refundsTotal, setRefundsTotal] = useState(0);
  const [productsSold, setProductsSold] = useState<
    { sku: string; barcode: string; name: string; qty: number; total: number }[]
  >([]);
  const [brandsSold, setBrandsSold] = useState<{ brand: string; qty: number; total: number }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cortes, resumen] = await Promise.all([obtenerCortesMaleta(), obtenerResumenCajaHoy()]);
      setCuts(cortes);
      setPayments(resumen.payments);
      setSalesTotal(resumen.salesTotal);
      setRefundsTotal(resumen.refundsTotal);
      setProductsSold(resumen.productsSold);
      setBrandsSold(resumen.brandsSold);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cargar maleta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const expensesToday = getCashExpenses()
    .filter((e) => e.date === new Date().toISOString().slice(0, 10))
    .reduce((s, e) => s + e.amount, 0);
  const initialCash = 5000;
  const expectedCash = initialCash + payments.cash - expensesToday - refundsTotal;
  const bag = parseFloat(bagAmount) || 0;
  const remaining = expectedCash - bag;

  const previousBags = useMemo(
    () =>
      cuts
        .filter((c) => c.date === new Date().toISOString().slice(0, 10))
        .reduce((s, c) => s + c.bagAmount, 0),
    [cuts]
  );
  const dayCashClose = previousBags + (cuts.length ? remaining : expectedCash);

  const registerCut = async () => {
    if (bag <= 0) {
      toast.error('Indica el monto a enviar a maleta');
      return;
    }
    if (bag > expectedCash) {
      toast.error('El monto de maleta no puede superar el efectivo esperado');
      return;
    }
    const now = new Date();
    const cut: MaletaCut = {
      id: `mal-${Date.now()}`,
      cutNumber: nextCode('MAL', cuts.length),
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      user: user?.name || 'Usuario',
      cashier: 'Caja #1',
      branch: 'Sucursal Principal',
      expectedCash,
      bagAmount: bag,
      remainingCash: remaining,
      salesTotal,
      expensesTotal: expensesToday,
      refundsTotal,
      payments,
      productsSold,
      brandsSold,
      status: 'completed',
    };

    setSaving(true);
    try {
      const saved = await crearCorteMaleta(cut);
      setCuts(await obtenerCortesMaleta());
      setSelected(saved);
      toast.success(`Maleta ${saved.cutNumber} registrada — ${formatMoneyPdf(bag)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar el corte');
    } finally {
      setSaving(false);
    }
  };

  const exportCut = (cut: MaletaCut) => {
    exportTableToPdf({
      title: `Maleta ${cut.cutNumber}`,
      subtitle: `${cut.date} ${cut.time} · ${cut.user} · ${cut.cashier}`,
      filename: `maleta-${cut.cutNumber}`,
      headers: ['Concepto', 'Monto'],
      rows: [
        ['Efectivo esperado', formatMoneyPdf(cut.expectedCash)],
        ['Enviado a maleta', formatMoneyPdf(cut.bagAmount)],
        ['Restante en caja', formatMoneyPdf(cut.remainingCash)],
        ['Ventas totales', formatMoneyPdf(cut.salesTotal)],
        ['Gastos', formatMoneyPdf(cut.expensesTotal)],
        ['Reembolsos', formatMoneyPdf(cut.refundsTotal)],
      ],
    });
  };

  const tabOptions = [
    { id: 'cut' as const, label: 'Nuevo Corte / Retiro' },
    { id: 'history' as const, label: `Historial de Retiros (${cuts.length})` },
  ];

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface2)] text-[var(--ink2)] border border-[var(--border)]">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                Seguridad & Arqueo en Turno
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
              Maleta & Retiros Parciales
            </h1>
            <p className="text-xs text-[var(--ink2)] mt-0.5">
              Envío seguro de efectivo a bóveda o supervisor sin cerrar la jornada del cajero.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
              <span>Auditar Turno Activo</span>
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
          <MetricStat
            label="Efectivo Esperado"
            value={expectedCash.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            prefix="RD$"
            secondaryText="En gaveta actualmente"
            valueColor="text-emerald-600 dark:text-emerald-400"
          />
          <MetricStat
            label="Retiros a Maleta Hoy"
            value={previousBags.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            prefix="RD$"
            secondaryText="Enviado a bóveda"
          />
          <MetricStat
            label="Ventas Registradas"
            value={salesTotal.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            prefix="RD$"
            secondaryText="Facturación del turno"
          />
          <MetricStat
            label="Gastos de Caja"
            value={expensesToday.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            prefix="RD$"
            secondaryText={expensesToday > 0 ? 'Salidas operativas' : 'Sin gastos hoy'}
            highlightWarn={expensesToday > 0}
          />
        </div>

        {/* Toolbar */}
        <div className="bg-[var(--surface)] p-2 rounded-xl border border-[var(--border)] w-fit">
          <SegmentedControl
            options={tabOptions}
            value={tab}
            onChange={setTab}
            ariaLabel="Vistas de maleta"
          />
        </div>

        {loading ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center text-xs text-[var(--ink2)]">
            Cargando estado de gaveta y arqueo del día…
          </div>
        ) : tab === 'cut' ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              {/* Payment Methods */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
                <h3 className="text-xs font-bold text-[var(--ink)] mb-3">
                  Desglose por Método de Pago en Turno
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[var(--surface2)]/50 border border-[var(--border)] rounded-lg p-3">
                    <p className="text-[11px] text-[var(--ink3)]">Fondo Inicial</p>
                    <p className="font-bold text-xs mt-0.5">{formatMoneyPdf(initialCash)}</p>
                  </div>
                  <div className="bg-[var(--surface2)]/50 border border-[var(--border)] rounded-lg p-3">
                    <p className="text-[11px] text-[var(--ink3)]">Efectivo (Ventas)</p>
                    <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatMoneyPdf(payments.cash)}
                    </p>
                  </div>
                  <div className="bg-[var(--surface2)]/50 border border-[var(--border)] rounded-lg p-3">
                    <p className="text-[11px] text-[var(--ink3)]">Tarjeta POS</p>
                    <p className="font-bold text-xs mt-0.5">{formatMoneyPdf(payments.card)}</p>
                  </div>
                  <div className="bg-[var(--surface2)]/50 border border-[var(--border)] rounded-lg p-3">
                    <p className="text-[11px] text-[var(--ink3)]">Transferencias</p>
                    <p className="font-bold text-xs mt-0.5">{formatMoneyPdf(payments.transfer)}</p>
                  </div>
                  <div className="bg-[var(--surface2)]/50 border border-[var(--border)] rounded-lg p-3">
                    <p className="text-[11px] text-[var(--ink3)]">Ventas a Crédito</p>
                    <p className="font-bold text-xs mt-0.5">{formatMoneyPdf(payments.credit)}</p>
                  </div>
                  <div className="bg-[var(--surface2)]/50 border border-[var(--border)] rounded-lg p-3">
                    <p className="text-[11px] text-[var(--ink3)]">Gastos / Egresos</p>
                    <p className="font-bold text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      {formatMoneyPdf(expensesToday)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cash Extraction Card */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--ink)]">
                    Registrar Extracción a Bóveda
                  </h3>
                  <span className="text-[11px] text-[var(--ink2)]">
                    Efectivo en caja: <strong className="text-[var(--ink)]">{formatMoneyPdf(expectedCash)}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                    Monto a Enviar en Maleta (RD$)
                  </label>
                  <input
                    type="number"
                    value={bagAmount}
                    onChange={(e) => setBagAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  />
                </div>

                <div className="flex justify-between items-center text-xs border-t border-[var(--border)] pt-2.5">
                  <span className="text-[var(--ink2)]">Efectivo restante en caja tras el retiro:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      remaining < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {formatMoneyPdf(remaining)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void registerCut()}
                  className="w-full py-2 px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{saving ? 'Procesando retiro…' : 'Registrar Retiro a Maleta'}</span>
                </button>
              </div>

              {/* Products Sold Table */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
                <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface2)]/40 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--ink)]">
                    Productos Despachados en Turno
                  </h3>
                  <span className="text-[11px] text-[var(--ink3)]">
                    {productsSold.length} artículos
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface2)]/20 text-[var(--ink3)] text-[11px]">
                        <th className="py-2 px-3.5">SKU / Código</th>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-3 text-right">Cant.</th>
                        <th className="py-2 px-3.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                      {productsSold.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-xs text-[var(--ink3)]">
                            Sin productos vendidos en el turno actual
                          </td>
                        </tr>
                      ) : (
                        productsSold.map((p) => (
                          <tr key={p.sku} className="hover:bg-[var(--surface2)]/30">
                            <td className="py-2 px-3.5 font-mono text-[11px] text-[var(--ink2)]">
                              {p.sku || p.barcode}
                            </td>
                            <td className="py-2 px-3 font-medium">{p.name}</td>
                            <td className="py-2 px-3 text-right font-mono">{p.qty}</td>
                            <td className="py-2 px-3.5 text-right font-mono font-medium">
                              {formatMoneyPdf(p.total)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar / Last Cut receipt */}
            <div className="space-y-4">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs space-y-2">
                <h3 className="text-xs font-bold text-[var(--ink)] border-b border-[var(--border)] pb-2 mb-2">
                  Datos Operativos del Arqueo
                </h3>
                <div className="text-xs space-y-1.5 text-[var(--ink2)]">
                  <div className="flex justify-between">
                    <span>Responsable:</span>
                    <strong className="text-[var(--ink)]">{user?.name || 'Administrador'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminal / Caja:</span>
                    <span className="font-mono text-[var(--ink)]">Caja #1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sucursal:</span>
                    <span className="text-[var(--ink)]">Principal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha y hora:</span>
                    <span className="text-[var(--ink)]">{new Date().toLocaleString('es-DO')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--surface)] border border-emerald-500/30 rounded-xl p-4 shadow-xs space-y-1.5 bg-emerald-500/5">
                <h3 className="text-xs font-bold text-[var(--ink)]">
                  Cierre de Caja Estimado del Día
                </h3>
                <p className="text-[11px] text-[var(--ink2)]">
                  Total efectivo del día = Maletas enviadas + Efectivo restante
                </p>
                <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 pt-1">
                  {formatMoneyPdf(dayCashClose)}
                </p>
                <p className="text-[11px] text-[var(--ink3)]">
                  Maletas previas: {formatMoneyPdf(previousBags)}
                </p>
              </div>

              {selected && (
                <>
                  {/* Thermal Receipt Print (Preserved perfectly) */}
                  <div className="hidden print:block printable-document bg-white text-black p-8 font-sans max-w-lg mx-auto text-xs">
                    <div className="text-center pb-3 border-b border-black space-y-1">
                      <h2 className="text-base font-black uppercase text-black">
                        MERCATO SUPERMERCADO S.R.L.
                      </h2>
                      <p className="text-xs font-bold text-black uppercase tracking-wider">
                        COMPROBANTE DE CORTE / MALETA
                      </p>
                      <p className="text-xs font-mono font-bold text-black">
                        {selected.cutNumber} · {selected.date} {selected.time}
                      </p>
                    </div>
                    <div className="py-3 border-b border-black/40 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Cajero / Responsable:</span>
                        <span className="font-bold">{selected.user}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Caja / Terminal:</span>
                        <span className="font-bold">{selected.cashier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sucursal:</span>
                        <span>{selected.branch}</span>
                      </div>
                    </div>
                    <div className="py-3 border-b border-black/40 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span>Efectivo Esperado en Caja:</span>
                        <span className="font-mono">{formatMoneyPdf(selected.expectedCash)}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm">
                        <span>MONTO ENVIADO A MALETA:</span>
                        <span className="font-mono">{formatMoneyPdf(selected.bagAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Efectivo Restante en Caja:</span>
                        <span className="font-mono">{formatMoneyPdf(selected.remainingCash)}</span>
                      </div>
                    </div>
                    <div className="pt-10 pb-4 grid grid-cols-2 gap-8 text-center text-[10px]">
                      <div>
                        <div className="border-t border-black w-36 mx-auto mb-1" />
                        <p className="font-bold">Firma Cajero(a)</p>
                      </div>
                      <div>
                        <div className="border-t border-black w-36 mx-auto mb-1" />
                        <p className="font-bold">Firma Receptor / Bóveda</p>
                      </div>
                    </div>
                    <div className="text-center pt-2 text-[9px] text-black/60">
                      <p>Generado por Sistema ERP Mercato</p>
                    </div>
                  </div>

                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-2.5 print:hidden shadow-xs">
                    <h3 className="text-xs font-bold text-[var(--ink)]">
                      Último Retiro #{selected.cutNumber}
                    </h3>
                    <div className="text-xs space-y-1 text-[var(--ink2)] font-mono">
                      <div className="flex justify-between">
                        <span>Maleta:</span>
                        <strong className="text-[var(--ink)]">{formatMoneyPdf(selected.bagAmount)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Restante en gaveta:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {formatMoneyPdf(selected.remainingCash)}
                        </strong>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[var(--ink)] hover:bg-[var(--border)] transition-colors cursor-pointer flex-1"
                        onClick={() => window.print()}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer flex-1"
                        onClick={() => exportCut(selected)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface2)]/50 text-[var(--ink2)] font-medium">
                    <th className="py-2.5 px-3.5">Código Retiro</th>
                    <th className="py-2.5 px-3">Fecha & Hora</th>
                    <th className="py-2.5 px-3">Responsable</th>
                    <th className="py-2.5 px-3">Caja</th>
                    <th className="py-2.5 px-3 text-right">Monto Maleta</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                  {cuts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[var(--ink3)]">
                        Sin retiros registrados a maleta
                      </td>
                    </tr>
                  ) : (
                    cuts.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--surface2)]/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-xs text-[var(--ink)]">
                          {c.cutNumber}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-[var(--ink2)]">
                          {c.date} · {c.time}
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">{c.user}</td>
                        <td className="py-2.5 px-3 text-[11px] font-mono text-[var(--ink2)]">
                          {c.cashier}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {formatMoneyPdf(c.bagAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Completado
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelected(c)}
                              className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                              title="Ver ficha de retiro"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => exportCut(c)}
                              className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                              title="Exportar comprobante PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="py-2.5 px-3.5 border-t border-[var(--border)] bg-[var(--surface2)]/30 flex items-center justify-between text-[11px] text-[var(--ink2)]">
              <span>Mostrando {cuts.length} corte{cuts.length === 1 ? '' : 's'} de maleta</span>
            </div>
          </div>
        )}
      </div>

      {showDetailsModal && (
        <RegisterDetailsModal onClose={() => setShowDetailsModal(false)} />
      )}
    </AppLayout>
  );
}
