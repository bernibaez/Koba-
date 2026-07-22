import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Plus, Search, Filter, Download, Eye, Edit2, Trash2, Wallet, Clock, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

type PayableStatus = 'pending' | 'partial' | 'overdue' | 'paid';

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
}

const mockPayables: Payable[] = [
  { id: 1, code: 'CXP-001', purchase: 'OC-002', supplier: 'Importadora del Caribe', issueDate: '2024-01-14', dueDate: '2024-01-28', total: 21830, paid: 0, balance: 21830, status: 'pending', daysOverdue: 0 },
  { id: 2, code: 'CXP-002', purchase: 'OC-004', supplier: 'Bebidas y Más', issueDate: '2024-01-12', dueDate: '2024-01-22', total: 14160, paid: 5000, balance: 9160, status: 'partial', daysOverdue: 0 },
  { id: 3, code: 'CXP-003', purchase: 'OC-006', supplier: 'Distribuidora Nacional S.A.', issueDate: '2023-12-18', dueDate: '2024-01-08', total: 38500, paid: 0, balance: 38500, status: 'overdue', daysOverdue: 14 },
  { id: 4, code: 'CXP-004', purchase: 'OC-001', supplier: 'Distribuidora Nacional S.A.', issueDate: '2024-01-05', dueDate: '2024-01-15', total: 53100, paid: 53100, balance: 0, status: 'paid', daysOverdue: 0 },
  { id: 5, code: 'CXP-005', purchase: 'OC-007', supplier: 'Alimentos Frescos RD', issueDate: '2024-01-11', dueDate: '2024-01-26', total: 9200, paid: 0, balance: 9200, status: 'pending', daysOverdue: 0 },
  { id: 6, code: 'CXP-006', purchase: 'OC-008', supplier: 'Lácteos del Cibao', issueDate: '2023-12-30', dueDate: '2024-01-14', total: 15600, paid: 6000, balance: 9600, status: 'overdue', daysOverdue: 8 },
];

const statusMap: Record<PayableStatus, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  partial: { label: 'Parcial', cls: 'badge-info' },
  overdue: { label: 'Vencida', cls: 'badge-danger' },
  paid: { label: 'Pagada', cls: 'badge-success' },
};

export default function AccountsPayablePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PayableStatus>('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = mockPayables.filter((p) => {
    const matchSearch =
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.purchase.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = mockPayables.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.balance, 0);
  const totalOverdue = mockPayables.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.balance, 0);
  const totalPaid = mockPayables.reduce((s, p) => s + p.paid, 0);
  const overdueCount = mockPayables.filter((p) => p.status === 'overdue').length;

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Cuentas por Pagar',
      filename: 'cuentas-por-pagar',
      headers: ['Código', 'Compra', 'Proveedor', 'Emisión', 'Vence', 'Total', 'Pagado', 'Saldo', 'Estado', 'Días mora'],
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
        p.daysOverdue,
      ]),
      landscape: true,
    });
  };

  const handleRegisterPayment = (code: string) => {
    toast.success(`Pago registrado para ${code}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cuentas por Pagar</h1>
            <p className="text-sm text-muted-foreground mt-1">Control de saldos pendientes con proveedores</p>
          </div>
          <button type="button" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-fit">
            <Plus size={16} />
            Nueva cuenta
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Por pagar</p>
              <Wallet size={16} className="text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">RD$ {totalPending.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Vencidas</p>
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <p className="text-2xl font-bold text-danger">RD$ {totalOverdue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{overdueCount} documentos</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Pagado</p>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <p className="text-2xl font-bold text-success">RD$ {totalPaid.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Documentos</p>
              <Clock size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{mockPayables.length}</p>
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
            onChange={(e) => setStatusFilter(e.target.value as 'all' | PayableStatus)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="overdue">Vencida</option>
            <option value="paid">Pagada</option>
          </select>
          <button type="button" className="btn-secondary flex items-center gap-2">
            <Filter size={16} />
            Filtrar
          </button>
          <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-2">
            <Download size={16} />
            Exportar PDF
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {['Código', 'Compra', 'Proveedor', 'Emisión', 'Vence', 'Total', 'Pagado', 'Saldo', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{p.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.purchase}</td>
                    <td className="px-4 py-3 text-foreground">{p.supplier}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.issueDate}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {p.dueDate}
                      {p.daysOverdue > 0 && (
                        <span className="block text-xs text-danger">+{p.daysOverdue} días</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">RD$ {p.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-success whitespace-nowrap">RD$ {p.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">RD$ {p.balance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={statusMap[p.status].cls}>{statusMap[p.status].label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {p.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleRegisterPayment(p.code)}
                            className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            Pagar
                          </button>
                        )}
                        <button type="button" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <Eye size={14} />
                        </button>
                        <button type="button" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <Edit2 size={14} />
                        </button>
                        <button type="button" className="p-1.5 rounded-lg text-muted-foreground hover:bg-danger-bg hover:text-danger">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowModal(false)}>
            <div className="card w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-foreground">Nueva cuenta por pagar</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Proveedor *</label>
                  <select className="input-field">
                    <option>Seleccionar...</option>
                    <option>Distribuidora Nacional S.A.</option>
                    <option>Importadora del Caribe</option>
                    <option>Alimentos Frescos RD</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Orden de compra *</label>
                  <input className="input-field" placeholder="OC-000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Monto *</label>
                  <input className="input-field" type="number" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Emisión</label>
                  <input className="input-field" type="date" defaultValue="2024-01-15" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Vencimiento</label>
                  <input className="input-field" type="date" defaultValue="2024-01-30" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    toast.success('Cuenta por pagar creada');
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
