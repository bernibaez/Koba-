import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Plus, Search, Download, Eye, Wallet, Clock, AlertTriangle, CheckCircle2, Printer, FileSpreadsheet, X, FileText,
} from 'lucide-react';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { logAuditEvent } from '@/lib/auditStore';
import { toast } from 'sonner';
import { useCxp } from '@/hooks/useCxp';
import type { CuentaPagarUi, CxStatusUi } from '@/services/cxp.service';

const statusMap: Record<CxStatusUi, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  partial: { label: 'Parcial', cls: 'badge-info' },
  overdue: { label: 'Vencida', cls: 'badge-danger' },
  paid: { label: 'Pagada', cls: 'badge-success' },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AccountsPayablePage() {
  const { cuentas, proveedores, loading, error, crear, registrarPago } = useCxp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CxStatusUi>('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<CuentaPagarUi | null>(null);
  const [saving, setSaving] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentNote, setPaymentNote] = useState('');

  const [formProveedor, setFormProveedor] = useState('');
  const [formMonto, setFormMonto] = useState('');
  const [formEmision, setFormEmision] = useState(today());
  const [formVence, setFormVence] = useState(plusDays(15));

  useEffect(() => {
    if (!selected) return;
    const fresh = cuentas.find((c) => c.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [cuentas, selected?.id]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cuentas.filter((p) => {
      const matchSearch =
        p.code.toLowerCase().includes(q) ||
        p.purchase.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cuentas, search, statusFilter]);

  const totalPending = cuentas.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.balance, 0);
  const totalOverdue = cuentas.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.balance, 0);
  const totalPaid = cuentas.reduce((s, p) => s + p.paid, 0);
  const overdueCount = cuentas.filter((p) => p.status === 'overdue').length;

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Cuentas por Pagar (Proveedores)',
      filename: 'cuentas-por-pagar',
      headers: ['Código', 'Compra', 'Proveedor', 'Emisión', 'Vence', 'Total', 'Pagado', 'Saldo Pendiente', 'Estado'],
      rows: filtered.map((p) => [
        p.code, p.purchase, p.supplier, p.issueDate, p.dueDate,
        formatMoneyPdf(p.total), formatMoneyPdf(p.paid), formatMoneyPdf(p.balance), statusMap[p.status].label,
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Reporte de Cuentas por Pagar (Proveedores)',
      filename: 'cuentas-por-pagar',
      headers: ['Código', 'Compra Ref', 'Proveedor', 'Emisión', 'Vencimiento', 'Monto Total', 'Monto Pagado', 'Saldo Pendiente', 'Estado', 'Días Mora'],
      rows: filtered.map((p) => [
        p.code, p.purchase, p.supplier, p.issueDate, p.dueDate,
        p.total, p.paid, p.balance, statusMap[p.status].label, p.daysOverdue,
      ]),
    });
  };

  const handleProcessPayment = async () => {
    if (!selected) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Ingresa un monto válido para el pago al proveedor');
      return;
    }
    setSaving(true);
    try {
      await registrarPago({
        cuenta_id: selected.id,
        monto: amount,
        metodo_pago: paymentMethod,
        nota: paymentNote || 'Pago a proveedor registrado',
      });
      logAuditEvent({
        user: 'Usuario',
        role: 'Sistema',
        action: 'Pago',
        module: 'Cuentas por Pagar',
        details: `Pago de RD$ ${amount.toLocaleString()} a ${selected.supplier} (${selected.code})`,
        before: { balance: selected.balance },
        after: { paid: selected.paid + amount },
      });
      toast.success(`Pago de RD$ ${amount.toLocaleString()} registrado`);
      setSelected(null);
      setPaymentAmount('');
      setPaymentNote('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const monto = parseFloat(formMonto);
    if (!formProveedor) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (!monto || monto <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setSaving(true);
    try {
      await crear({
        proveedor_id: formProveedor,
        monto_total: monto,
        fecha_emision: formEmision,
        fecha_vencimiento: formVence,
      });
      toast.success('Cuenta por pagar registrada');
      setShowModal(false);
      setFormProveedor('');
      setFormMonto('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="text-warning" size={24} />
              Cuentas por Pagar (Proveedores)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control de facturas de compra, vencimientos, pagos a proveedores y estado de cuenta
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Nueva Cuenta por Pagar
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
              <p className="text-xs text-muted-foreground">Por pagar total</p>
              <Wallet size={16} className="text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              RD$ {totalPending.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Vencidas (Mora)</p>
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <p className="text-2xl font-bold text-danger">
              RD$ {totalOverdue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{overdueCount} compras pendientes</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Pagado acum.</p>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <p className="text-2xl font-bold text-success">
              RD$ {totalPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Documentos</p>
              <Clock size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{loading ? '…' : cuentas.length}</p>
          </div>
        </div>

        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-field pl-9"
              placeholder="Buscar por código, compra o proveedor..."
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
            <option value="paid">Pagada</option>
          </select>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Compra</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Emisión</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Vencimiento</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Pagado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Saldo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Cargando…</td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      No hay cuentas por pagar registradas
                    </td>
                  </tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-bold text-foreground font-mono">{p.code}</td>
                    <td className="px-4 py-3 text-primary font-mono font-semibold">{p.purchase}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{p.supplier}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{p.issueDate}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {p.dueDate}
                      {p.daysOverdue > 0 && (
                        <span className="block text-xs text-danger font-bold">+{p.daysOverdue} días mora</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">RD$ {p.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-success font-semibold">RD$ {p.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-danger">RD$ {p.balance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={statusMap[p.status].cls}>{statusMap[p.status].label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => setSelected(p)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                          >
                            Pagar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelected(p)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="Ver estado de cuenta de proveedor"
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

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setSelected(null)}>
            <div className="card w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-warning" size={20} />
                  <h3 className="font-bold text-foreground text-lg">Estado de Cuenta Proveedor — {selected.supplier}</h3>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-secondary/40 rounded-xl p-3 text-xs">
                <div><span className="text-muted-foreground block">Compra Ref.</span><span className="font-bold text-primary">{selected.purchase}</span></div>
                <div><span className="text-muted-foreground block">Monto Total</span><span className="font-bold text-foreground">RD$ {selected.total.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground block">Saldo Pendiente</span><span className="font-bold text-danger">RD$ {selected.balance.toLocaleString()}</span></div>
              </div>

              {selected.balance > 0 && (
                <div className="border border-warning/20 bg-warning/5 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-warning">Registrar Pago a Proveedor</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">Monto a Pagar (RD$) *</label>
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
                      <select className="input-field text-xs" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="Transferencia">Transferencia Banco</option>
                        <option value="Cheque">Cheque Empresarial</option>
                        <option value="Efectivo">Efectivo Caja</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nota / Comprobante</label>
                    <input
                      className="input-field text-xs"
                      placeholder="Ej: Transf. #456123 o recibo firmado..."
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
                    <Wallet size={16} /> Confirmar Pago de RD$ {parseFloat(paymentAmount) || 0}
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial de Pagos Efectuados</p>
                {selected.payments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No hay pagos previos registrados.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selected.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center bg-card border border-border p-2 rounded-lg text-xs">
                        <div>
                          <span className="font-bold text-foreground">{p.date}</span> · <span className="text-muted-foreground">{p.method}</span>
                          <p className="text-[11px] text-muted-foreground">{p.note}</p>
                        </div>
                        <span className="font-bold text-success text-sm">+ RD$ {p.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5 text-xs">
                  <Printer size={14} /> Imprimir Estado de Cuenta
                </button>
                <button type="button" onClick={() => setSelected(null)} className="btn-primary text-xs">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowModal(false)}>
            <div className="card w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-foreground">Nueva Cuenta por Pagar</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Proveedor *</label>
                  <select className="input-field text-xs" value={formProveedor} onChange={(e) => setFormProveedor(e.target.value)}>
                    <option value="">Seleccionar proveedor…</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Monto Total *</label>
                  <input className="input-field text-xs" type="number" placeholder="0.00" value={formMonto} onChange={(e) => setFormMonto(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Emisión</label>
                  <input className="input-field text-xs" type="date" value={formEmision} onChange={(e) => setFormEmision(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Vencimiento</label>
                  <input className="input-field text-xs" type="date" value={formVence} onChange={(e) => setFormVence(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn-primary text-xs" disabled={saving} onClick={handleCreate}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
