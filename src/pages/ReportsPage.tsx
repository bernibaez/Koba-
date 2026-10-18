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
  Tag,
  Boxes,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import ProfitLossReport from './reports/ProfitLossReport';
import ProductProfitReport from './reports/ProductProfitReport';
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
import CombosReport from './reports/CombosReport';
import { exportReportPdf } from './reports/exportReportPdf';

type ReportId =
  | 'profit-loss'
  | 'product-profit'
  | 'combos'
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
  { id: 'profit-loss', label: 'Ganancias y Pérdidas', icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-500' },
  { id: 'product-profit', label: 'Ganancias por Producto', icon: <Tag className="w-4 h-4" />, color: 'text-blue-500' },
  { id: 'combos', label: 'Informe de Combos', icon: <Boxes className="w-4 h-4" />, color: 'text-purple-500' },
  { id: 'sales', label: 'Ventas y Facturación', icon: <ShoppingCart className="w-4 h-4" />, color: 'text-indigo-500' },
  { id: 'purchases', label: 'Compras y Recepciones', icon: <ShoppingBag className="w-4 h-4" />, color: 'text-amber-500' },
  { id: 'stock', label: 'Valoración Inventario', icon: <Package className="w-4 h-4" />, color: 'text-blue-500' },
  { id: 'stock-detail', label: 'Informe Stock Detallado', icon: <ClipboardList className="w-4 h-4" />, color: 'text-cyan-500' },
  { id: 'adjustments', label: 'Ajustes y Mermas', icon: <Sliders className="w-4 h-4" />, color: 'text-amber-500' },
  { id: 'expenses', label: 'Gastos Operativos', icon: <DollarSign className="w-4 h-4" />, color: 'text-rose-500' },
  { id: 'customers', label: 'Clientes y Cobros', icon: <Users className="w-4 h-4" />, color: 'text-blue-500' },
  { id: 'suppliers', label: 'Proveedores y Pagos', icon: <Truck className="w-4 h-4" />, color: 'text-amber-500' },
  { id: 'agents', label: 'Vendedores y Comisiones', icon: <UserCheck className="w-4 h-4" />, color: 'text-indigo-500' },
  { id: 'fiscal', label: 'Informe Fiscal DGII 606/607', icon: <FileText className="w-4 h-4" />, color: 'text-purple-500' },
  { id: 'cashier', label: 'Cuadre y Cajas', icon: <Wallet className="w-4 h-4" />, color: 'text-emerald-500' },
];

function renderReport(id: ReportId, dateFrom: string, dateTo: string) {
  const period = { dateFrom, dateTo };
  switch (id) {
    case 'profit-loss':
      return <ProfitLossReport {...period} />;
    case 'product-profit':
      return <ProductProfitReport {...period} />;
    case 'combos':
      return <CombosReport {...period} />;
    case 'sales':
      return <SalesReport {...period} />;
    case 'purchases':
      return <PurchasesReport {...period} />;
    case 'stock':
      return <InventoryReport {...period} />;
    case 'stock-detail':
      return <StockDetailReport {...period} />;
    case 'adjustments':
      return <AdjustmentsReport {...period} />;
    case 'expenses':
      return <ExpensesReport {...period} />;
    case 'customers':
      return <CustomersReport {...period} />;
    case 'suppliers':
      return <SuppliersReport {...period} />;
    case 'agents':
      return <AgentsReport {...period} />;
    case 'fiscal':
      return <FiscalDGIIReport {...period} />;
    case 'cashier':
      return <CashierReport {...period} />;
    default:
      return <ProfitLossReport {...period} />;
  }
}

function defaultDateRange() {
  const now = new Date();
  const hasta = now.toISOString().slice(0, 10);
  const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  return { desde, hasta };
}

export default function ReportsPage() {
  const defaults = defaultDateRange();
  const [activeReport, setActiveReport] = useState<ReportId>('profit-loss');
  const [dateFrom, setDateFrom] = useState(defaults.desde);
  const [dateTo, setDateTo] = useState(defaults.hasta);
  const [branch, setBranch] = useState('all');
  const [generated, setGenerated] = useState(true);

  const activeLabel = reportTypes.find((r) => r.id === activeReport)?.label ?? 'Informe';

  const handleGenerate = () => {
    setGenerated(true);
  };

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface2)] text-[var(--ink2)] border border-[var(--border)]">
                <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
                Inteligencia de Negocios & Auditoría
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
              Informes & Análisis
            </h1>
            <p className="text-xs text-[var(--ink2)] mt-0.5">
              Estados financieros, rentabilidad por SKU, informes fiscales DGII y conciliación de cajas.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
              onClick={() => window.print()}
            >
              <Printer className="w-3.5 h-3.5 text-[var(--ink2)]" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              onClick={() => {
                void exportReportPdf(activeReport, activeLabel, dateFrom, dateTo);
              }}
            >
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 print:block">
          {/* Report Categories Navigation */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2 space-y-0.5 h-fit print:hidden shadow-xs">
            <p className="text-[10px] font-bold text-[var(--ink3)] uppercase tracking-wider px-2.5 py-2">
              Tipos de Informes
            </p>
            {reportTypes.map((r) => {
              const isActive = activeReport === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setActiveReport(r.id);
                    setGenerated(true);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] font-semibold shadow-xs'
                      : 'text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)]'
                  }`}
                >
                  <span className={isActive ? 'text-[var(--primary-contrast,#ffffff)]' : r.color}>
                    {r.icon}
                  </span>
                  <span className="truncate">{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Report Viewport */}
          <div className="lg:col-span-3 space-y-3.5 print:w-full print:p-0">
            {/* Header for Printed Format */}
            <div className="hidden print:block pb-4 mb-4 border-b border-black text-center">
              <h2 className="text-base font-black uppercase text-black">MERCATO SUPERMERCADO S.R.L.</h2>
              <h3 className="text-sm font-bold uppercase text-black">{activeLabel}</h3>
              <p className="text-xs text-black/70">
                Período: {dateFrom || 'Inicio'} al {dateTo || 'Actualidad'} · Generado el{' '}
                {new Date().toLocaleDateString('es-DO')}
              </p>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 flex flex-wrap gap-3 items-end print:hidden shadow-xs">
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="flex-1 min-w-[130px]">
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Sucursal
                </label>
                <select
                  className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  <option value="all">Todas las sucursales</option>
                  <option value="main">Sucursal Principal</option>
                </select>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                onClick={handleGenerate}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Actualizar Informe</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[var(--ink3)] px-1">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>
                Reporte: <strong>{activeLabel}</strong> · Rango: {dateFrom} → {dateTo} · Conectado en tiempo real
              </span>
            </div>

            {/* Report Content */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
              {generated ? (
                renderReport(activeReport, dateFrom, dateTo)
              ) : (
                <div className="p-12 text-center text-xs text-[var(--ink2)]">
                  Selecciona un periodo y pulsa <strong>Actualizar Informe</strong> para ver los datos.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
