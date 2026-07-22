import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Plus, Search, Filter, Download, Eye, Edit2, Trash2, HandCoins, Clock, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

type ReceivableStatus = 'pending' | 'partial' | 'overdue' | 'paid';

interface Receivable {
  id: number;
  code: string;
  invoice: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  status: ReceivableStatus;
  daysOverdue: number;
}

const mockReceivables: Receivable[] = [
  { id: 1, code: 'CXC-001', invoice: 'FAC-003', customer: 'Rosa Jiménez', issueDate: '2024-01-14', dueDate: '2024-01-28', total: 1003, paid: 0, balance: 1003, status: 'pending', daysOverdue: 0 },
  { id: 2, code: 'CXC-002', invoice: 'FAC-008', customer: 'Empresa ABC S.R.L.', issueDate: '2024-01-05', dueDate: '2024-01-20', total: 18500, paid: 5000, balance: 13500, status: 'partial', daysOverdue: 2 },
  { id: 3, code: 'CXC-003', invoice: 'FAC-010', customer: 'Distribuidora XYZ', issueDate: '2023-12-20', dueDate: '2024-01-10', total: 42000, paid: 0, balance: 42000, status: 'overdue', daysOverdue: 12 },
  { id: 4, code: 'CXC-004', invoice: 'FAC-012', customer: 'Juan Pérez', issueDate: '2024-01-02', dueDate: '2024-01-16', total: 4500, paid: 4500, balance: 0, status: 'paid', daysOverdue: 0 },
  { id: 5, code: 'CXC-005', invoice: 'FAC-015', customer: 'Carmen Reyes', issueDate: '2024-01-10', dueDate: '2024-01-25', total: 2800, paid: 0, balance: 2800, status: 'pending', daysOverdue: 0 },
  { id: 6, code: 'CXC-006', invoice: 'FAC-018', customer: 'Pedro Martínez', issueDate: '2023-12-28', dueDate: '2024-01-12', total: 6700, paid: 2000, balance: 4700, status: 'overdue', daysOverdue: 10 },
];

const statusMap: Record<ReceivableStatus, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  partial: { label: 'Parcial', cls: 'badge-info' },
  overdue: { label: 'Vencida', cls: 'badge-danger' },
  paid: { label: 'Cobrada', cls: 'badge-success' },
};

export default function AccountsReceivablePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReceivableStatus>('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = mockReceivables.filter((r) => {
    const matchSearch =
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.invoice.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = mockReceivables.filter((r) => r.status !== 'paid').reduce((s, r) => s + r.balance, 0);
  const totalOverdue = mockReceivables.filter((r) => r.status === 'overdue').reduce((s, r) => s + r.balance, 0);
  const totalCollected = mockReceivables.reduce((s, r) => s + r.paid, 0);
  const overdueCount = mockReceivables.filter((r) => r.status === 'overdue').length;

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Cuentas por Cobrar',
      filename: 'cuentas-por-cobrar',
      headers: ['Código', 'Factura', 'Cliente', 'Emisión', 'Vence', 'Total', 'Pagado', 'Saldo', 'Estado', 'Días mora'],
      rows: filtered.map((r) => [
        r.code,
        r.invoice,
        r.customer,
        r.issueDate,
        r.dueDate,
        formatMoneyPdf(r.total),
        formatMoneyPdf(r.paid),
        formatMoneyPdf(r.balance),
        statusMap[r.status].label,
        r.daysOverdue,
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
            <h1 className="text-2xl font-bold text-foreground">Cuentas por Cobrar</h1>
            <p className="text-sm text-muted-foreground mt-1">Control de saldos pendientes de clientes</p>
          </div>
          <button type="button" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-fit">
            <Plus size={16} />
            Nueva cuenta
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Por cobrar</p>
              <HandCoins size={16} className="text-info" />
            </div>
            <p className="text-2xl font-bold text-foreground">RD$ {totalPending.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Vencidas</p>
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <p className="text-2xl font-bold text-danger">RD$ {totalOverdue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{overdueCount} facturas</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Cobrado</p>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <p className="text-2xl font-bold text-success">RD$ {totalCollected.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Documentos</p>
              <Clock size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{mockReceivables.length}</p>
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
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ReceivableStatus)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="overdue">Vencida</option>
            <option value="paid">Cobrada</option>
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
                  {['Código', 'Factura', 'Cliente', 'Emisión', 'Vence', 'Total', 'Pagado', 'Saldo', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{r.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.invoice}</td>
                    <td className="px-4 py-3 text-foreground">{r.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.issueDate}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {r.dueDate}
                      {r.daysOverdue > 0 && (
                        <span className="block text-xs text-danger">+{r.daysOverdue} días</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">RD$ {r.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-success whitespace-nowrap">RD$ {r.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">RD$ {r.balance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={statusMap[r.status].cls}>{statusMap[r.status].label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleRegisterPayment(r.code)}
                            className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            Cobrar
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
              <h3 className="text-lg font-bold text-foreground">Nueva cuenta por cobrar</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente *</label>
                  <select className="input-field">
                    <option>Seleccionar...</option>
                    <option>Juan Pérez</option>
                    <option>Empresa ABC S.R.L.</option>
                    <option>Rosa Jiménez</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Factura *</label>
                  <input className="input-field" placeholder="FAC-000" />
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
                    toast.success('Cuenta por cobrar creada');
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
