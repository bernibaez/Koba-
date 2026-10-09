import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Plus, Search, Download, Eye, HandCoins, Clock, AlertTriangle, CheckCircle2, Printer, FileSpreadsheet, FileText,
} from 'lucide-react';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { logAuditEvent } from '@/lib/auditStore';
import { toast } from '@/lib/toast';
import { useCxc } from '@/hooks/useCxc';
import { obtenerClientes } from '@/services/clientes.service';
import type { CuentaCobrarUi, CxStatusUi } from '@/services/cxc.service';
import type { Cliente } from '@/types/database';
import { ButtonSpinner, InlineLoader, PageContentSkeleton } from '@/components/ui/LoadingSkeleton';
import PrintableAccountStatement from '@/components/printing/PrintableAccountStatement';

const statusMap: Record<CxStatusUi, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  partial: { label: 'Parcial', cls: 'badge-info' },
  overdue: { label: 'Vencida', cls: 'badge-danger' },
  paid: { label: 'Cobrada', cls: 'badge-success' },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AccountsReceivablePage() {
  const { cuentas, loading, error, crear, registrarPago } = useCxc();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CxStatusUi>('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<CuentaCobrarUi | null>(null);
  const [saving, setSaving] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentNote, setPaymentNote] = useState('');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formCliente, setFormCliente] = useState('');
  const [formFactura, setFormFactura] = useState('');
  const [formMonto, setFormMonto] = useState('');
  const [formEmision, setFormEmision] = useState(today());
  const [formVence, setFormVence] = useState(plusDays(15));

  useEffect(() => {
    obtenerClientes({ limite: 200 })
      .then((r) => setClientes(r.datos))
      .catch(() => setClientes([]));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const fresh = cuentas.find((c) => c.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [cuentas, selected?.id]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cuentas.filter((r) => {
      const matchSearch =
        r.code.toLowerCase().includes(q) ||
        r.invoice.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cuentas, search, statusFilter]);

  const totalPending = cuentas.filter((r) => r.status !== 'paid').reduce((s, r) => s + r.balance, 0);
  const totalOverdue = cuentas.filter((r) => r.status === 'overdue').reduce((s, r) => s + r.balance, 0);
  const totalCollected = cuentas.reduce((s, r) => s + r.paid, 0);
  const overdueCount = cuentas.filter((r) => r.status === 'overdue').length;

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Cuentas por Cobrar (Clientes)',
      filename: 'cuentas-por-cobrar',
      headers: ['Código', 'Factura', 'Cliente', 'Límite Crédito', 'Emisión', 'Vence', 'Total', 'Pagado', 'Saldo Pendiente', 'Estado'],
      rows: filtered.map((r) => [
        r.code, r.invoice, r.customer, formatMoneyPdf(r.creditLimit), r.issueDate, r.dueDate,
        formatMoneyPdf(r.total), formatMoneyPdf(r.paid), formatMoneyPdf(r.balance), statusMap[r.status].label,
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Reporte de Cuentas por Cobrar (Clientes)',
      filename: 'cuentas-por-cobrar',
      headers: ['Código', 'Factura', 'Cliente', 'Límite Crédito', 'Emisión', 'Vencimiento', 'Monto Total', 'Monto Pagado', 'Saldo Pendiente', 'Estado', 'Días Mora'],
      rows: filtered.map((r) => [
        r.code, r.invoice, r.customer, r.creditLimit, r.issueDate, r.dueDate,
        r.total, r.paid, r.balance, statusMap[r.status].label, r.daysOverdue,
      ]),
    });
  };

  const closeCreateForm = () => {
    setShowModal(false);
    setFormCliente('');
    setFormFactura('');
    setFormMonto('');
    setFormEmision(today());
    setFormVence(plusDays(15));
  };

  const closeDetail = () => {
    setSelected(null);
    setPaymentAmount('');
    setPaymentNote('');
  };

  const handleProcessPayment = async () => {
    if (!selected) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Ingresa un monto válido para el cobro/abono');
      return;
    }
    setSaving(true);
    try {
      await registrarPago({
        cuenta_id: selected.id,
        monto: amount,
        metodo_pago: paymentMethod,
        nota: paymentNote || 'Abono/Cobro registrado',
      });
      logAuditEvent({
        user: 'Usuario',
        role: 'Sistema',
        action: 'Pago',
        module: 'Cuentas por Cobrar',
        details: `Cobro/Abono de RD$ ${amount.toLocaleString()} para ${selected.customer} (${selected.code})`,
        before: { balance: selected.balance },
        after: { paid: selected.paid + amount },
      });
      toast.success(`Pago de RD$ ${amount.toLocaleString()} registrado`);
      closeDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const monto = parseFloat(formMonto);
    if (!formCliente) {
      toast.error('Selecciona un cliente');
      return;
    }
    if (!monto || monto <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setSaving(true);
    try {
      await crear({
        cliente_id: formCliente,
        numero_factura: formFactura || null,
        monto_total: monto,
        fecha_emision: formEmision,
        fecha_vencimiento: formVence,
      });
      toast.success('Cuenta por cobrar registrada');
      closeCreateForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
    } finally {
      setSaving(false);
    }
  };

  if (loading && cuentas.length === 0) {
    return (
      <AppLayout>
        <PageContentSkeleton kpiCount={4} tableCols={10} tableRows={6} />
      </AppLayout>
    );
  }

  if (showModal) {
    return (
      <AppLayout>
        <div className="space-y-6 slide-up">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <HandCoins className="text-primary" size={24} />
                Nueva Cuenta por Cobrar
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Registra un crédito a cliente con factura, emisión y vencimiento
              </p>
            </div>
            <button type="button" onClick={closeCreateForm} className="btn-secondary" disabled={saving}>
              ← Volver a Cuentas por Cobrar
            </button>
          </div>

          <div className="card p-5 sm:p-6 space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente *</label>
                <select
                  className="input-field"
                  value={formCliente}
                  onChange={(e) => setFormCliente(e.target.value)}
                >
                  <option value="">Seleccionar cliente…</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Factura</label>
                <input
                  className="input-field"
                  placeholder="FAC-000"
                  value={formFactura}
                  onChange={(e) => setFormFactura(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Monto Total *</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="0.00"
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Emisión</label>
                <input
                  className="input-field"
                  type="date"
                  value={formEmision}
                  onChange={(e) => setFormEmision(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Vencimiento</label>
                <input
                  className="input-field"
                  type="date"
                  value={formVence}
                  onChange={(e) => setFormVence(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button type="button" className="btn-secondary" disabled={saving} onClick={closeCreateForm}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" disabled={saving} onClick={handleCreate}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (selected) {
    return (
      <AppLayout>
        {/* COMPROBANTE OFICIAL PARA IMPRESIÓN (SOLO VISIBLE EN PRINT) */}
        <div className="hidden print:block printable-document">
          <PrintableAccountStatement
            type="receivable"
            code={selected.id}
            name={selected.customer}
            phone={clientes.find((c) => c.id === selected.customerId)?.telefono || undefined}
            invoiceCode={selected.invoice}
            totalAmount={selected.total}
            paidAmount={selected.paid}
            pendingBalance={selected.balance}
            dueDate={selected.dueDate}
            payments={selected.payments.map((p) => ({
              date: p.date,
              amount: p.amount,
              method: p.method,
              note: p.note,
            }))}
          />
        </div>

        {/* VISTA INTERACTIVA WEB (OCULTA EN PRINT) */}
        <div className="print:hidden space-y-6 slide-up">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText className="text-primary" size={24} />
                Estado de Cuenta — {selected.customer}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Consulta saldo, registra cobros/abonos y revisa el historial
              </p>
            </div>
            <button type="button" onClick={closeDetail} className="btn-secondary" disabled={saving}>
              ← Volver a Cuentas por Cobrar
            </button>
          </div>

          <div className="card p-5 sm:p-6 space-y-4 max-w-3xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-secondary/40 rounded-xl p-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Factura</span>
                <span className="font-bold text-primary">{selected.invoice}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Monto Total</span>
                <span className="font-bold text-foreground">RD$ {selected.total.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Saldo Pendiente</span>
                <span className="font-bold text-danger">RD$ {selected.balance.toLocaleString()}</span>
              </div>
            </div>

            {selected.balance > 0 && (
              <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Registrar Pago / Abono Parcial o Total
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Monto a Cobrar (RD$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="input-field font-bold tabular-nums"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Método de Pago</label>
                    <select
                      className="input-field text-xs"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia Banco</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Nota / Referencia
                  </label>
                  <input
                    className="input-field text-xs"
                    placeholder="Ej: Depósito #98721 o recibo..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleProcessPayment}
                  className="btn-primary w-full py-2 font-bold flex items-center justify-center gap-1.5"
                >
                  {saving ? <ButtonSpinner /> : <HandCoins size={16} />}
                  {saving ? 'Registrando…' : `Confirmar Cobro de RD$ ${parseFloat(paymentAmount) || 0}`}
                </button>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Historial de Abonos / Pagos Registrados
              </p>
              {selected.payments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No hay pagos previos para este documento.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selected.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center bg-card border border-border p-2 rounded-lg text-xs"
                    >
                      <div>
                        <span className="font-bold text-foreground">{p.date}</span> ·{' '}
                        <span className="text-muted-foreground">{p.method}</span>
                        <p className="text-[11px] text-muted-foreground">{p.note}</p>
                      </div>
                      <span className="font-bold text-success text-sm">+ RD$ {p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-1.5 text-xs"
              >
                <Printer size={14} /> Imprimir Estado de Cuenta
              </button>
              <button type="button" disabled={saving} onClick={closeDetail} className="btn-primary text-xs">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HandCoins className="text-primary" size={24} />
              Cuentas por Cobrar (Crédito Clientes)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control de saldos, límites de crédito, pagos parciales/totales y estados de cuenta
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Nueva Cuenta por Cobrar
            </button>
            <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-1.5">
              <Download size={16} /> PDF
            </button>
            <button type="button" onClick={handleExportExcel} className="btn-secondary flex items-center gap-1.5">
              <FileSpreadsheet size={16} /> Excel
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Por cobrar total</p>
              <HandCoins size={16} className="text-info" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              RD$ {totalPending.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Cuentas Vencidas</p>
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <p className="text-2xl font-bold text-danger">
              RD$ {totalOverdue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{overdueCount} facturas en mora</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Cobrado acum.</p>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <p className="text-2xl font-bold text-success">
              RD$ {totalCollected.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Documentos</p>
              <Clock size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{cuentas.length}</p>
          </div>
        </div>

        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-field pl-9"
              placeholder="Buscar por código, factura o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-full sm:w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | CxStatusUi)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="overdue">Vencida</option>
            <option value="paid">Cobrada</option>
          </select>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Factura</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Límite Créd.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Vencimiento</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Pagado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Saldo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && <InlineLoader colSpan={10} message="Cargando cuentas por cobrar…" />}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      No hay cuentas por cobrar registradas
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-bold text-foreground font-mono">{r.code}</td>
                    <td className="px-4 py-3 text-primary font-mono font-semibold">{r.invoice}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{r.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                      RD$ {r.creditLimit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {r.dueDate}
                      {r.daysOverdue > 0 && (
                        <span className="block text-xs text-danger font-bold">+{r.daysOverdue} días mora</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">RD$ {r.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-success font-semibold">RD$ {r.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-danger">RD$ {r.balance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={statusMap[r.status].cls}>{statusMap[r.status].label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            Cobrar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelected(r)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="Ver estado de cuenta e historial"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
