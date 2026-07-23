import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  BarChart2,
  TrendingUp,
  Package,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  Users,
  UserCheck,
  FileText,
  Download,
  Printer,
  Filter,
  Wallet,
  Truck,
  ClipboardList,
  Sliders,
} from 'lucide-react';
import ProfitLossReport from './reports/ProfitLossReport';
import SalesReport from './reports/SalesReport';
import PurchasesReport from './reports/PurchasesReport';
import InventoryReport from './reports/InventoryReport';
import StockDetailReport from './reports/StockDetailReport';
import AdjustmentsReport from './reports/AdjustmentsReport';
import ExpensesReport from './reports/ExpensesReport';
import CustomersReport from './reports/CustomersReport';
import SuppliersReport from './reports/SuppliersReport';
import AgentsReport from './reports/AgentsReport';
import FiscalDGIIReport from './reports/FiscalDGIIReport';
import CashierReport from './reports/CashierReport';
import { exportReportPdf } from './reports/exportReportPdf';

type ReportId =
  | 'profit-loss'
  | 'sales'
  | 'purchases'
  | 'stock'
  | 'stock-detail'
  | 'adjustments'
  | 'expenses'
  | 'customers'
  | 'suppliers'
  | 'agents'
  | 'fiscal'
  | 'cashier';

const reportTypes: { id: ReportId; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'profit-loss', label: 'Ganancias y Pérdidas', icon: <TrendingUp size={18} />, color: 'text-success' },
  { id: 'sales', label: 'Ventas', icon: <ShoppingCart size={18} />, color: 'text-info' },
  { id: 'purchases', label: 'Compras', icon: <ShoppingBag size={18} />, color: 'text-warning' },
  { id: 'stock', label: 'Inventario', icon: <Package size={18} />, color: 'text-primary' },
  { id: 'stock-detail', label: 'Informe Stock', icon: <ClipboardList size={18} />, color: 'text-primary' },
  { id: 'adjustments', label: 'Informe Ajustes', icon: <Sliders size={18} />, color: 'text-warning' },
  { id: 'expenses', label: 'Gastos', icon: <DollarSign size={18} />, color: 'text-danger' },
  { id: 'customers', label: 'Clientes', icon: <Users size={18} />, color: 'text-info' },
  { id: 'suppliers', label: 'Proveedores', icon: <Truck size={18} />, color: 'text-warning' },
  { id: 'agents', label: 'Agentes', icon: <UserCheck size={18} />, color: 'text-primary' },
  { id: 'fiscal', label: 'Informe Fiscal DGII', icon: <FileText size={18} />, color: 'text-warning' },
  { id: 'cashier', label: 'Informe de Caja', icon: <Wallet size={18} />, color: 'text-success' },
];

function renderReport(id: ReportId) {
  switch (id) {
    case 'profit-loss':
      return <ProfitLossReport />;
    case 'sales':
      return <SalesReport />;
    case 'purchases':
      return <PurchasesReport />;
    case 'stock':
      return <InventoryReport />;
    case 'stock-detail':
      return <StockDetailReport />;
    case 'adjustments':
      return <AdjustmentsReport />;
    case 'expenses':
      return <ExpensesReport />;
    case 'customers':
      return <CustomersReport />;
    case 'suppliers':
      return <SuppliersReport />;
    case 'agents':
      return <AgentsReport />;
    case 'fiscal':
      return <FiscalDGIIReport />;
    case 'cashier':
      return <CashierReport />;
    default:
      return <ProfitLossReport />;
  }
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportId>('sales');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-31');
  const [branch, setBranch] = useState('all');
  const [generated, setGenerated] = useState(true);

  const activeLabel = reportTypes.find((r) => r.id === activeReport)?.label ?? 'Informe';

  const handleGenerate = () => {
    setGenerated(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Informes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análisis y reportes del negocio — {activeLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimir
            </button>
            <button type="button" className="btn-primary flex items-center gap-2" onClick={() => exportReportPdf(activeReport, activeLabel, dateFrom, dateTo)}>
              <Download size={16} />
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card p-3 space-y-1 h-fit">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
              Tipo de Informe
            </p>
            {reportTypes.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setActiveReport(r.id);
                  setGenerated(true);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  activeReport === r.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <span className={activeReport === r.id ? 'text-primary' : r.color}>{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="card p-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Desde</label>
                <input
                  type="date"
                  className="input-field"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasta</label>
                <input
                  type="date"
                  className="input-field"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Sucursal</label>
                <select
                  className="input-field"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  <option value="all">Todas las sucursales</option>
                  <option value="main">Sucursal Principal</option>
                  <option value="north">Sucursal Norte</option>
                  <option value="east">Sucursal Este</option>
                </select>
              </div>
              <button type="button" className="btn-primary flex items-center gap-2" onClick={handleGenerate}>
                <Filter size={16} />
                Generar
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <BarChart2 size={14} />
              Periodo: {dateFrom} → {dateTo}
              {branch !== 'all' && (
                <span>
                  ·{' '}
                  {branch === 'main'
                    ? 'Sucursal Principal'
                    : branch === 'north'
                      ? 'Sucursal Norte'
                      : 'Sucursal Este'}
                </span>
              )}
            </div>

            {generated ? (
              renderReport(activeReport)
            ) : (
              <div className="card p-12 text-center text-muted-foreground">
                Selecciona un periodo y pulsa <strong>Generar</strong> para ver el informe.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
