import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Plus, Search, Filter, Download, Eye, Edit2, Trash2, Wallet, Clock, AlertTriangle, CheckCircle2, Printer, FileSpreadsheet, X, FileText
} from 'lucide-react';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { logAuditEvent } from '@/lib/auditStore';
import { toast } from 'sonner';

type PayableStatus = 'pending' | 'partial' | 'overdue' | 'paid';

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  method: string;
  note: string;
}

interface Payable {
  id: number;
  code: string;
  purchase: string;
  supplier: string;
  issueDate: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  status: PayableStatus;
  daysOverdue: number;
  payments: PaymentHistoryItem[];
}

const initialPayables: Payable[] = [
  { id: 1, code: 'CXP-001', purchase: 'OC-002', supplier: 'Importadora del Caribe', issueDate: '2026-07-14', dueDate: '2026-07-28', total: 21830, paid: 0, balance: 21830, status: 'pending', daysOverdue: 0, payments: [] },
  { id: 2, code: 'CXP-002', purchase: 'OC-004', supplier: 'Bebidas y Más', issueDate: '2026-07-12', dueDate: '2026-07-22', total: 14160, paid: 5000, balance: 9160, status: 'partial', daysOverdue: 4, payments: [{ id: 'p-1', date: '2026-07-18', amount: 5000, method: 'Transferencia', note: 'Abono orden compra' }] },
  { id: 3, code: 'CXP-003', purchase: 'OC-006', supplier: 'Distribuidora Nacional S.A.', issueDate: '2026-06-18', dueDate: '2026-07-08', total: 38500, paid: 0, balance: 38500, status: 'overdue', daysOverdue: 18, payments: [] },
  { id: 4, code: 'CXP-004', purchase: 'OC-001', supplier: 'Distribuidora Nacional S.A.', issueDate: '2026-07-05', dueDate: '2026-07-15', total: 53100, paid: 53100, balance: 0, status: 'paid', daysOverdue: 0, payments: [{ id: 'p-2', date: '2026-07-15', amount: 53100, method: 'Cheque', note: 'Liquidación total' }] },
  { id: 5, code: 'CXP-005', purchase: 'OC-007', supplier: 'Alimentos Frescos RD', issueDate: '2026-07-11', dueDate: '2026-07-26', total: 9200, paid: 0, balance: 9200, status: 'pending', daysOverdue: 0, payments: [] },
];

const statusMap: Record<PayableStatus, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  partial: { label: 'Parcial', cls: 'badge-info' },
  overdue: { label: 'Vencida', cls: 'badge-danger' },
  paid: { label: 'Pagada', cls: 'badge-success' },
};

export default function AccountsPayablePage() {
  const [payables, setPayables] = useState<Payable[]>(initialPayables);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PayableStatus>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentNote, setPaymentNote] = useState('');

  const filtered = payables.filter((p) => {
    const matchSearch =
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.purchase.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = payables.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.balance, 0);
  const totalOverdue = payables.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.balance, 0);
  const totalPaid = payables.reduce((s, p) => s + p.paid, 0);
  const overdueCount = payables.filter((p) => p.status === 'overdue').length;

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Cuentas por Pagar (Proveedores)',
      filename: 'cuentas-por-pagar',
      headers: ['Código', 'Compra', 'Proveedor', 'Emisión', 'Vence', 'Total', 'Pagado', 'Saldo Pendiente', 'Estado'],
      rows: filtered.map((p) => [
        p.code,
        p.purchase,
        p.supplier,
        p.issueDate,
        p.dueDate,
        formatMoneyPdf(p.total),
        formatMoneyPdf(p.paid),
        formatMoneyPdf(p.balance),
        statusMap[p.status].label,
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
        p.code,
        p.purchase,
        p.supplier,
        p.issueDate,
        p.dueDate,
        p.total,
        p.paid,
        p.balance,
        statusMap[p.status].label,
        p.daysOverdue,
      ]),
    });
  };

  const handleProcessPayment = () => {
    if (!selectedPayable) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Ingresa un monto válido para el pago al proveedor');
      return;
    }

    if (amount > selectedPayable.balance) {
      toast.error(`El monto supera el saldo pendiente de RD$ ${selectedPayable.balance}`);
      return;
    }

    const newPaid = selectedPayable.paid + amount;
    const newBalance = selectedPayable.balance - amount;
    const newStatus: PayableStatus = newBalance <= 0 ? 'paid' : 'partial';

    const newPayment: PaymentHistoryItem = {
      id: `p-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount,
      method: paymentMethod,
      note: paymentNote || 'Pago a proveedor registrado',
    };

    const updatedList = payables.map((p) =>
      p.id === selectedPayable.id
        ? {
            ...p,
            paid: newPaid,
            balance: newBalance,
            status: newStatus,
            payments: [newPayment, ...p.payments],
          }
        : p
    );

    setPayables(updatedList);

    // Audit Log
    logAuditEvent({
      user: 'Admin General',
      role: 'Administrador',
      action: 'Pago',
      module: 'Cuentas por Pagar',
      details: `Pago de RD$ ${amount.toLocaleString()} a proveedor ${selectedPayable.supplier} (${selectedPayable.code})`,
      before: { balance: selectedPayable.balance },
      after: { paid: newPaid, balance: newBalance, status: newStatus },
    });

    toast.success(`Pago de RD$ ${amount.toLocaleString()} a proveedor registrado`);
    setSelectedPayable(null);
    setPaymentAmount('');
    setPaymentNote('');
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="text-warning" size={24} />
              Cuentas por Pagar (Proveedores)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Control de facturas de compra, vencimientos, pagos a proveedores y estado de cuenta</p>
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

        {/* Stats */}
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
            <p className="text-2xl font-bold text-foreground">{payables.length}</p>
          </div>
        </div>

        {/* Filters */}
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
            onChange={(e) => setStatusFilter(e.target.value as 'all' | PayableStatus)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="overdue">Vencida</option>
            <option value="paid">Pagada</option>
          </select>
        </div>

        {/* Table */}
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
                            onClick={() => setSelectedPayable(p)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                          >
                            Pagar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedPayable(p)}
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

        {/* Modal: Registrar Pago Proveedor & Estado de Cuenta */}
        {selectedPayable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setSelectedPayable(null)}>
            <div className="card w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-warning" size={20} />
                  <h3 className="font-bold text-foreground text-lg">Estado de Cuenta Proveedor — {selectedPayable.supplier}</h3>
                </div>
                <button type="button" onClick={() => setSelectedPayable(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-secondary/40 rounded-xl p-3 text-xs">
                <div><span className="text-muted-foreground block">Compra Ref.</span><span className="font-bold text-primary">{selectedPayable.purchase}</span></div>
                <div><span className="text-muted-foreground block">Monto Total</span><span className="font-bold text-foreground">RD$ {selectedPayable.total.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground block">Saldo Pendiente</span><span className="font-bold text-danger">RD$ {selectedPayable.balance.toLocaleString()}</span></div>
              </div>

              {/* Process Payment Form if not fully paid */}
              {selectedPayable.balance > 0 && (
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
                  <button type="button" onClick={handleProcessPayment} className="btn-primary w-full py-2 font-bold flex items-center justify-center gap-1.5">
                    <Wallet size={16} /> Confirmar Pago de RD$ {parseFloat(paymentAmount) || 0}
                  </button>
                </div>
              )}

              {/* Payment History */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial de Pagos Efectuados</p>
                {selectedPayable.payments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No hay pagos previos registrados.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedPayable.payments.map((p) => (
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

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5 text-xs">
                  <Printer size={14} /> Imprimir Estado de Cuenta
                </button>
                <button type="button" onClick={() => setSelectedPayable(null)} className="btn-primary text-xs">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: New Account Payable */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowModal(false)}>
            <div className="card w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-foreground">Nueva Cuenta por Pagar</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Proveedor *</label>
                  <select className="input-field text-xs">
                    <option>Distribuidora Nacional S.A.</option>
                    <option>Importadora del Caribe</option>
                    <option>Alimentos Frescos RD</option>
                    <option>Bebidas y Más</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Orden / Compra *</label>
                  <input className="input-field text-xs" placeholder="OC-000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Monto Total *</label>
                  <input className="input-field text-xs" type="number" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Emisión</label>
                  <input className="input-field text-xs" type="date" defaultValue="2026-07-26" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Vencimiento</label>
                  <input className="input-field text-xs" type="date" defaultValue="2026-08-10" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowModal(false)}>Cancelar</button>
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={() => {
                    toast.success('Cuenta por pagar registrada');
                    setShowModal(false);
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
