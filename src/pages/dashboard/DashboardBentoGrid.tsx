import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  AlertTriangle,
  Clock,
  Users,
  Truck,
  DollarSign,
  BarChart2,
  Receipt,
  Layers,
} from 'lucide-react';

interface KpiCardProps {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: string; positive: boolean };
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  alert?: boolean;
  warning?: boolean;
  colSpan?: string;
  progress?: number;
  progressColor?: string;
}

const kpiData: KpiCardProps[] = [
  {
    id: 'kpi-ventas-dia',
    label: 'Ventas del Día',
    value: 'RD$ 87,420',
    subValue: 'vs RD$ 74,300 ayer',
    trend: { value: '+17.7%', positive: true },
    icon: <ShoppingCart size={24} />,
    iconBg: 'bg-primary/15 border border-primary/20',
    iconColor: 'text-primary',
    colSpan: 'col-span-1 md:col-span-2',
  },
  {
    id: 'kpi-ventas-mes',
    label: 'Ventas del Mes',
    value: 'RD$ 1,842,650',
    subValue: 'Meta: RD$ 2,000,000',
    trend: { value: '+8.3%', positive: true },
    icon: <TrendingUp size={24} />,
    iconBg: 'bg-info-bg border border-info/30',
    iconColor: 'text-info',
    progress: 92,
    progressColor: 'bg-info',
  },
  {
    id: 'kpi-ganancias',
    label: 'Ganancias Brutas',
    value: 'RD$ 412,180',
    subValue: 'Margen: 22.4%',
    trend: { value: '+5.1%', positive: true },
    icon: <DollarSign size={24} />,
    iconBg: 'bg-success-bg border border-success/30',
    iconColor: 'text-success',
  },
  {
    id: 'kpi-compras',
    label: 'Compras del Mes',
    value: 'RD$ 1,284,300',
    subValue: '42 órdenes emitidas',
    trend: { value: '-3.2%', positive: true },
    icon: <Truck size={24} />,
    iconBg: 'bg-secondary border border-border',
    iconColor: 'text-foreground/80',
  },
  {
    id: 'kpi-productos-vendidos',
    label: 'Productos Vendidos Hoy',
    value: '1,247',
    subValue: 'en 318 transacciones',
    trend: { value: '+12.4%', positive: true },
    icon: <BarChart2 size={24} />,
    iconBg: 'bg-primary/15 border border-primary/20',
    iconColor: 'text-primary',
  },
  {
    id: 'kpi-stock-bajo',
    label: 'Productos Stock Bajo',
    value: '23',
    subValue: '8 en estado crítico',
    trend: { value: '+5', positive: false },
    icon: <AlertTriangle size={24} />,
    iconBg: 'bg-warning-bg border border-warning/30',
    iconColor: 'text-warning',
    warning: true,
  },
  {
    id: 'kpi-por-vencer',
    label: 'Próximos a Vencer',
    value: '14',
    subValue: '5 vencen esta semana',
    icon: <Clock size={24} />,
    iconBg: 'bg-danger-bg border border-danger/30',
    iconColor: 'text-danger',
    alert: true,
  },
  {
    id: 'kpi-clientes',
    label: 'Clientes Registrados',
    value: '4,821',
    subValue: '+18 este mes',
    trend: { value: '+18', positive: true },
    icon: <Users size={24} />,
    iconBg: 'bg-info-bg border border-info/30',
    iconColor: 'text-info',
  },
  {
    id: 'kpi-proveedores',
    label: 'Proveedores Activos',
    value: '87',
    subValue: '12 con pedidos pendientes',
    icon: <Truck size={24} />,
    iconBg: 'bg-secondary border border-border',
    iconColor: 'text-foreground/80',
  },
  {
    id: 'kpi-stock-total',
    label: 'Stock Total',
    value: '48,392',
    subValue: 'unidades en inventario',
    icon: <Layers size={24} />,
    iconBg: 'bg-primary/15 border border-primary/20',
    iconColor: 'text-primary',
    progress: 78,
    progressColor: 'bg-primary',
  },
  {
    id: 'kpi-facturas',
    label: 'Facturas Pendientes',
    value: '18',
    subValue: 'RD$ 94,200 por cobrar',
    trend: { value: '-3', positive: true },
    icon: <Receipt size={24} />,
    iconBg: 'bg-warning-bg border border-warning/30',
    iconColor: 'text-warning',
    warning: true,
  },
  {
    id: 'kpi-caja',
    label: 'Efectivo en Caja',
    value: 'RD$ 32,840',
    subValue: 'Apertura: RD$ 5,000',
    icon: <Package size={24} />,
    iconBg: 'bg-success-bg border border-success/30',
    iconColor: 'text-success',
  },
];

function KpiCard({
  label, value, subValue, trend, icon, iconBg, iconColor,
  alert, warning, colSpan, progress, progressColor,
}: KpiCardProps) {
  const borderClass = alert
    ? 'border-danger/40 bg-danger-bg/20'
    : warning
    ? 'border-warning/40 bg-warning-bg/20' :'';

  return (
    <div
      className={`card p-6 flex flex-col justify-between gap-4 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-200 ${colSpan || ''} ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>

      <div>
        <p className="text-3xl lg:text-3xl 2xl:text-4xl font-extrabold tabular-nums text-foreground tracking-tight leading-tight">{value}</p>
        {subValue && (
          <p className="text-sm font-semibold text-muted-foreground/90 mt-1.5">{subValue}</p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-2 mt-1">
          {trend.positive ? (
            <TrendingUp size={16} className="text-success" />
          ) : (
            <TrendingDown size={16} className="text-danger" />
          )}
          <span className={`text-sm font-extrabold ${trend.positive ? 'text-success' : 'text-danger'}`}>
            {trend.value}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">vs ayer</span>
        </div>
      )}

      {progress !== undefined && progressColor && (
        <div className="space-y-1.5 mt-1">
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span>Progreso</span>
            <span className="tabular-nums font-extrabold">{progress}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {(alert || warning) && (
        <div className="flex items-center gap-2 mt-1">
          <AlertTriangle size={15} className={alert ? 'text-danger' : 'text-warning'} />
          <span className={`text-xs font-bold ${alert ? 'text-danger' : 'text-warning'}`}>
            {alert ? 'Requiere atención inmediata' : 'Revisar pronto'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function DashboardBentoGrid() {
  // Grid plan: 12 cards
  // Row 1: hero card (col-span-2) + 2 regular = 4 cols total
  // Row 2: 4 regular cards
  // Row 3: 4 regular cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-6">
      {kpiData.map((kpi) => (
        <KpiCard key={kpi.id} {...kpi} />
      ))}
    </div>
  );
}