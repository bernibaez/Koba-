import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Plus, Search, Filter, Download, Eye, Edit2, Trash2, HandCoins, Clock, AlertTriangle, CheckCircle2, Printer, FileSpreadsheet, X, FileText
} from 'lucide-react';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { logAuditEvent } from '@/lib/auditStore';
import { toast } from 'sonner';

type ReceivableStatus = 'pending' | 'partial' | 'overdue' | 'paid';

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  method: string;
  note: string;
}

interface Receivable {
  id: number;
  code: string;
  invoice: string;
  customer: string;
  creditLimit: number;
  issueDate: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  status: ReceivableStatus;
  daysOverdue: number;
  payments: PaymentHistoryItem[];
}

const initialReceivables: Receivable[] = [
  {
    id: 1,
    code: 'CXC-001',
    invoice: 'FAC-003',
    customer: 'Rosa Jiménez',
    creditLimit: 25000,
    issueDate: '2026-07-14',
    dueDate: '2026-07-28',
    total: 1003,
    paid: 0,
    balance: 1003,
    status: 'pending',
    daysOverdue: 0,
    payments: [],
  },
  {
    id: 2,
    code: 'CXC-002',
    invoice: 'FAC-008',
    customer: 'Empresa ABC S.R.L.',
    creditLimit: 100000,
    issueDate: '2026-07-05',
    dueDate: '2026-07-20',
    total: 18500,
    paid: 5000,
    balance: 13500,
    status: 'partial',
    daysOverdue: 6,
    payments: [
      { id: 'p-1', date: '2026-07-15', amount: 5000, method: 'Transferencia', note: 'Abono inicial a factura' },
    ],
  },
  {
    id: 3,
    code: 'CXC-003',
    invoice: 'FAC-010',
    customer: 'Distribuidora XYZ',
    creditLimit: 150000,
    issueDate: '2026-06-20',
    dueDate: '2026-07-10',
    total: 42000,
    paid: 0,
    balance: 42000,
    status: 'overdue',
    daysOverdue: 16,
    payments: [],
  },
  {
    id: 4,
    code: 'CXC-004',
    invoice: 'FAC-012',
    customer: 'Juan Pérez',
    creditLimit: 15000,
    issueDate: '2026-07-02',
    dueDate: '2026-07-16',
    total: 4500,
    paid: 4500,
    balance: 0,
    status: 'paid',
    daysOverdue: 0,
    payments: [
      { id: 'p-2', date: '2026-07-16', amount: 4500, method: 'Efectivo', note: 'Pago total de saldo' },
    ],
  },
];

const statusMap: Record<ReceivableStatus, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  partial: { label: 'Parcial', cls: 'badge-info' },
  overdue: { label: 'Vencida', cls: 'badge-danger' },
  paid: { label: 'Cobrada', cls: 'badge-success' },
};

export default function AccountsReceivablePage() {
  const [receivables, setReceivables] = useState<Receivable[]>(initialReceivables);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReceivableStatus>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);

  // Payment registration modal state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentNote, setPaymentNote] = useState('');

  const filtered = receivables.filter((r) => {
    const matchSearch =
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.invoice.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = receivables.filter((r) => r.status !== 'paid').reduce((s, r) => s + r.balance, 0);
  const totalOverdue = receivables.filter((r) => r.status === 'overdue').reduce((s, r) => s + r.balance, 0);
  const totalCollected = receivables.reduce((s, r) => s + r.paid, 0);
  const overdueCount = receivables.filter((r) => r.status === 'overdue').length;

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Cuentas por Cobrar (Clientes)',
      filename: 'cuentas-por-cobrar',
      headers: ['Código', 'Factura', 'Cliente', 'Límite Crédito', 'Emisión', 'Vence', 'Total', 'Pagado', 'Saldo Pendiente', 'Estado'],
      rows: filtered.map((r) => [
        r.code,
        r.invoice,
        r.customer,
        formatMoneyPdf(r.creditLimit),
        r.issueDate,
        r.dueDate,
        formatMoneyPdf(r.total),
        formatMoneyPdf(r.paid),
        formatMoneyPdf(r.balance),
        statusMap[r.status].label,
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
        r.code,
        r.invoice,
        r.customer,
        r.creditLimit,
        r.issueDate,
        r.dueDate,
        r.total,
        r.paid,
        r.balance,
        statusMap[r.status].label,
        r.daysOverdue,
      ]),
    });
  };

  const handleProcessPayment = () => {
    if (!selectedReceivable) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Ingresa un monto válido para el cobro/abono');
      return;
    }

    if (amount > selectedReceivable.balance) {
      toast.error(`El monto supera el saldo pendiente de RD$ ${selectedReceivable.balance}`);
      return;
    }

    const newPaid = selectedReceivable.paid + amount;
    const newBalance = selectedReceivable.balance - amount;
    const newStatus: ReceivableStatus = newBalance <= 0 ? 'paid' : 'partial';

    const newPayment: PaymentHistoryItem = {
      id: `p-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount,
      method: paymentMethod,
      note: paymentNote || 'Abono/Cobro registrado',
    };

    const updatedList = receivables.map((r) =>
      r.id === selectedReceivable.id
        ? {
            ...r,
            paid: newPaid,
            balance: newBalance,
            status: newStatus,
            payments: [newPayment, ...r.payments],
          }
        : r
    );

    setReceivables(updatedList);

    // Audit Log
    logAuditEvent({
      user: 'Admin General',
      role: 'Administrador',
      action: 'Pago',
      module: 'Cuentas por Cobrar',
      details: `Cobro/Abono de RD$ ${amount.toLocaleString()} registrado para ${selectedReceivable.customer} (${selectedReceivable.code})`,
      before: { balance: selectedReceivable.balance },
      after: { paid: newPaid, balance: newBalance, status: newStatus },
    });

    toast.success(`Pago de RD$ ${amount.toLocaleString()} registrado correctamente`);
    setSelectedReceivable(null);
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
              <HandCoins className="text-primary" size={24} />
              Cuentas por Cobrar (Crédito Clientes)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Control de saldos, límites de crédito, pagos parciales/totales y estados de cuenta</p>
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

        {/* Stats */}
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
            <p className="text-2xl font-bold text-foreground">{receivables.length}</p>
          </div>
        </div>

        {/* Filters */}
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
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ReceivableStatus)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="overdue">Vencida</option>
            <option value="paid">Cobrada</option>
          </select>
        </div>

        {/* Table */}
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
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-bold text-foreground font-mono">{r.code}</td>
                    <td className="px-4 py-3 text-primary font-mono font-semibold">{r.invoice}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{r.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">RD$ {r.creditLimit.toLocaleString()}</td>
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
                            onClick={() => setSelectedReceivable(r)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            Cobrar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedReceivable(r)}
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

        {/* Modal: Registrar Pago & Estado de Cuenta */}
        {selectedReceivable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setSelectedReceivable(null)}>
            <div className="card w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  <h3 className="font-bold text-foreground text-lg">Estado de Cuenta y Cobro — {selectedReceivable.customer}</h3>
                </div>
                <button type="button" onClick={() => setSelectedReceivable(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-secondary/40 rounded-xl p-3 text-xs">
                <div><span className="text-muted-foreground block">Factura</span><span className="font-bold text-primary">{selectedReceivable.invoice}</span></div>
                <div><span className="text-muted-foreground block">Monto Total</span><span className="font-bold text-foreground">RD$ {selectedReceivable.total.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground block">Saldo Pendiente</span><span className="font-bold text-danger">RD$ {selectedReceivable.balance.toLocaleString()}</span></div>
              </div>

              {/* Process Payment Form if not fully paid */}
              {selectedReceivable.balance > 0 && (
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Registrar Pago / Abono Parcial o Total</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">Monto a Cobrar (RD$) *</label>
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
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia Banco</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nota / Referencia</label>
                    <input
                      className="input-field text-xs"
                      placeholder="Ej: Depósito #98721 o recibo..."
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                  <button type="button" onClick={handleProcessPayment} className="btn-primary w-full py-2 font-bold flex items-center justify-center gap-1.5">
                    <HandCoins size={16} /> Confirmar Cobro de RD$ {parseFloat(paymentAmount) || 0}
                  </button>
                </div>
              )}

              {/* Payment History */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial de Abonos / Pagos Registrados</p>
                {selectedReceivable.payments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No hay pagos previos para este documento.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedReceivable.payments.map((p) => (
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
                <button type="button" onClick={() => setSelectedReceivable(null)} className="btn-primary text-xs">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: New Account Receivable */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowModal(false)}>
            <div className="card w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-foreground">Nueva Cuenta por Cobrar</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente *</label>
                  <select className="input-field text-xs">
                    <option>Juan Pérez</option>
                    <option>Empresa ABC S.R.L.</option>
                    <option>Rosa Jiménez</option>
                    <option>Distribuidora XYZ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Factura *</label>
                  <input className="input-field text-xs" placeholder="FAC-000" />
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
                    toast.success('Cuenta por cobrar registrada');
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
