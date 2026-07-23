import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Briefcase, Download, Eye, Plus, Printer } from 'lucide-react';
import { toast } from 'sonner';
import {
  addMaletaCut,
  getCashExpenses,
  getMaletaCuts,
  getPosReturns,
  nextCode,
  type MaletaCut,
} from '@/lib/posStore';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';

const mockProductsSold = [
  { sku: 'ARR-SEL-5LB', barcode: '7891000100103', name: 'Arroz Selecto 5lb', qty: 42, total: 11970 },
  { sku: 'ACE-VEG-1L', barcode: '7891000200104', name: 'Aceite Vegetal 1L', qty: 28, total: 5460 },
  { sku: 'POL-ENT-LB', barcode: '7891000300105', name: 'Pollo Entero', qty: 65, total: 6370 },
  { sku: 'LEC-EVA-410', barcode: '7891000400106', name: 'Leche Evaporada', qty: 33, total: 4785 },
];

const mockBrands = [
  { brand: 'Molinos Modernos', qty: 42, total: 11970 },
  { brand: 'Mazola', qty: 28, total: 5460 },
  { brand: 'Pollo Rey', qty: 65, total: 6370 },
  { brand: 'Carnation', qty: 33, total: 4785 },
];

export default function MaletaPage() {
  const [cuts, setCuts] = useState<MaletaCut[]>(() => getMaletaCuts());
  const [bagAmount, setBagAmount] = useState('70000');
  const [selected, setSelected] = useState<MaletaCut | null>(null);
  const [tab, setTab] = useState<'cut' | 'history'>('cut');

  const payments = { cash: 52429.65, card: 18200, transfer: 6400, credit: 3200 };
  const salesTotal = payments.cash + payments.card + payments.transfer + payments.credit;
  const expensesToday = getCashExpenses()
    .filter((e) => e.date === new Date().toISOString().slice(0, 10))
    .reduce((s, e) => s + e.amount, 0);
  const refundsTotal = getPosReturns()
    .filter((r) => r.date === new Date().toISOString().slice(0, 10))
    .reduce((s, r) => s + r.total, 0);
  const initialCash = 5000;
  const expectedCash = initialCash + payments.cash - expensesToday - refundsTotal;
  const bag = parseFloat(bagAmount) || 0;
  const remaining = expectedCash - bag;

  const previousBags = useMemo(
    () => cuts.filter((c) => c.date === new Date().toISOString().slice(0, 10)).reduce((s, c) => s + c.bagAmount, 0),
    [cuts]
  );
  const dayCashClose = previousBags + (cuts.length ? remaining : expectedCash);

  const registerCut = () => {
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
      user: 'Admin General',
      cashier: 'Caja #1',
      branch: 'Sucursal Principal',
      expectedCash,
      bagAmount: bag,
      remainingCash: remaining,
      salesTotal,
      expensesTotal: expensesToday,
      refundsTotal,
      payments,
      productsSold: mockProductsSold,
      brandsSold: mockBrands,
      status: 'completed',
    };
    addMaletaCut(cut);
    setCuts(getMaletaCuts());
    setSelected(cut);
    toast.success(`Maleta ${cut.cutNumber} registrada — ${formatMoneyPdf(bag)}`);
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

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase size={24} className="text-primary" /> Maleta / Retiros de caja
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Retiros parciales sin cerrar la jornada</p>
          </div>
          <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
            <button type="button" onClick={() => setTab('cut')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'cut' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Nuevo corte</button>
            <button type="button" onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'history' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Historial</button>
          </div>
        </div>

        {tab === 'cut' ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <div className="card p-5">
                <h3 className="font-semibold text-foreground mb-3">Resumen por método de pago</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="border border-border rounded-lg p-3"><p className="text-xs text-muted-foreground">Dinero inicial</p><p className="font-bold">{formatMoneyPdf(initialCash)}</p></div>
                  <div className="border border-border rounded-lg p-3"><p className="text-xs text-muted-foreground">Efectivo (ventas)</p><p className="font-bold">{formatMoneyPdf(payments.cash)}</p></div>
                  <div className="border border-border rounded-lg p-3"><p className="text-xs text-muted-foreground">Tarjeta</p><p className="font-bold">{formatMoneyPdf(payments.card)}</p></div>
                  <div className="border border-border rounded-lg p-3"><p className="text-xs text-muted-foreground">Transferencia</p><p className="font-bold">{formatMoneyPdf(payments.transfer)}</p></div>
                  <div className="border border-border rounded-lg p-3"><p className="text-xs text-muted-foreground">Crédito</p><p className="font-bold">{formatMoneyPdf(payments.credit)}</p></div>
                  <div className="border border-border rounded-lg p-3"><p className="text-xs text-muted-foreground">Gastos de caja</p><p className="font-bold text-danger">{formatMoneyPdf(expensesToday)}</p></div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-foreground mb-3">Totales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Ventas totales</p><p className="font-bold">{formatMoneyPdf(salesTotal)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Reembolsos</p><p className="font-bold">{formatMoneyPdf(refundsTotal)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Total efectivo</p><p className="font-bold text-success">{formatMoneyPdf(payments.cash)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Total tarjeta</p><p className="font-bold">{formatMoneyPdf(payments.card)}</p></div>
                </div>
              </div>

              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Movimiento de efectivo</h3>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Efectivo esperado</span><span className="font-bold">{formatMoneyPdf(expectedCash)}</span></div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Monto enviado a maleta</label>
                  <input className="input-field font-bold tabular-nums" type="number" value={bagAmount} onChange={(e) => setBagAmount(e.target.value)} />
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground">Efectivo restante en caja</span>
                  <span className={`font-bold ${remaining < 0 ? 'text-danger' : 'text-primary'}`}>{formatMoneyPdf(remaining)}</span>
                </div>
                <button type="button" className="btn-primary w-full flex items-center justify-center gap-2" onClick={registerCut}>
                  <Plus size={16} /> Registrar retiro a maleta
                </button>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-foreground mb-3">Productos vendidos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-xs text-muted-foreground uppercase"><th className="py-2 text-left">SKU</th><th className="text-left">Código</th><th className="text-left">Producto</th><th className="text-right">Cant.</th><th className="text-right">Total</th></tr></thead>
                    <tbody>
                      {mockProductsSold.map((p) => (
                        <tr key={p.sku} className="border-b border-border"><td className="py-2 font-mono text-xs">{p.sku}</td><td className="font-mono text-xs">{p.barcode}</td><td>{p.name}</td><td className="text-right">{p.qty}</td><td className="text-right font-medium">{formatMoneyPdf(p.total)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-foreground mb-3">Productos por marca</h3>
                <div className="space-y-2">
                  {mockBrands.map((b) => (
                    <div key={b.brand} className="flex justify-between text-sm border-b border-border pb-2">
                      <span>{b.brand} · {b.qty} uds</span>
                      <span className="font-semibold">{formatMoneyPdf(b.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="card p-5 space-y-2">
                <h3 className="font-semibold text-foreground">Información del corte</h3>
                <p className="text-sm text-muted-foreground">Usuario: Admin General</p>
                <p className="text-sm text-muted-foreground">Caja: #1</p>
                <p className="text-sm text-muted-foreground">Sucursal: Principal</p>
                <p className="text-sm text-muted-foreground">Fecha: {new Date().toLocaleString('es-DO')}</p>
              </div>
              <div className="card p-5 space-y-2 bg-primary/5 border-primary/20">
                <h3 className="font-semibold text-foreground">Cierre de caja (estimado)</h3>
                <p className="text-xs text-muted-foreground">Total efectivo del día = Maletas + Restante</p>
                <p className="text-2xl font-bold text-primary">{formatMoneyPdf(dayCashClose)}</p>
                <p className="text-xs text-muted-foreground">Maletas hoy: {formatMoneyPdf(previousBags)}</p>
              </div>
              {selected && (
                <div className="card p-5 space-y-3">
                  <h3 className="font-semibold text-foreground">Último corte {selected.cutNumber}</h3>
                  <p className="text-sm">Maleta: {formatMoneyPdf(selected.bagAmount)}</p>
                  <p className="text-sm">Restante: {formatMoneyPdf(selected.remainingCash)}</p>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary text-xs flex-1" onClick={() => window.print()}><Printer size={14} /> Imprimir</button>
                    <button type="button" className="btn-primary text-xs flex-1" onClick={() => exportCut(selected)}><Download size={14} /> PDF</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 text-left">Corte</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Hora</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Caja</th>
                  <th className="px-4 py-3 text-right">Maleta</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuts.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Sin retiros registrados</td></tr>
                ) : cuts.map((c) => (
                  <tr key={c.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{c.cutNumber}</td>
                    <td className="px-4 py-3">{c.date}</td>
                    <td className="px-4 py-3">{c.time}</td>
                    <td className="px-4 py-3">{c.user}</td>
                    <td className="px-4 py-3">{c.cashier}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoneyPdf(c.bagAmount)}</td>
                    <td className="px-4 py-3"><span className="badge-success">Completado</span></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className="p-1.5 hover:bg-secondary rounded-lg" onClick={() => setSelected(c)} title="Ver"><Eye size={14} /></button>
                      <button type="button" className="p-1.5 hover:bg-secondary rounded-lg" onClick={() => exportCut(c)} title="PDF"><Download size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
