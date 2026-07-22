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
    icon: <ShoppingCart size={20} />,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    colSpan: 'col-span-1 md:col-span-2',
  },
  {
    id: 'kpi-ventas-mes',
    label: 'Ventas del Mes',
    value: 'RD$ 1,842,650',
    subValue: 'Meta: RD$ 2,000,000',
    trend: { value: '+8.3%', positive: true },
    icon: <TrendingUp size={20} />,
    iconBg: 'bg-info-bg',
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
    icon: <DollarSign size={20} />,
    iconBg: 'bg-success-bg',
    iconColor: 'text-success',
  },
  {
    id: 'kpi-compras',
    label: 'Compras del Mes',
    value: 'RD$ 1,284,300',
    subValue: '42 órdenes emitidas',
    trend: { value: '-3.2%', positive: true },
    icon: <Truck size={20} />,
    iconBg: 'bg-secondary',
    iconColor: 'text-secondary-foreground',
  },
  {
    id: 'kpi-productos-vendidos',
    label: 'Productos Vendidos Hoy',
    value: '1,247',
    subValue: 'en 318 transacciones',
    trend: { value: '+12.4%', positive: true },
    icon: <BarChart2 size={20} />,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    id: 'kpi-stock-bajo',
    label: 'Productos Stock Bajo',
    value: '23',
    subValue: '8 en estado crítico',
    trend: { value: '+5', positive: false },
    icon: <AlertTriangle size={20} />,
    iconBg: 'bg-warning-bg',
    iconColor: 'text-warning',
    warning: true,
  },
  {
    id: 'kpi-por-vencer',
    label: 'Próximos a Vencer',
    value: '14',
    subValue: '5 vencen esta semana',
    icon: <Clock size={20} />,
    iconBg: 'bg-danger-bg',
    iconColor: 'text-danger',
    alert: true,
  },
  {
    id: 'kpi-clientes',
    label: 'Clientes Registrados',
    value: '4,821',
    subValue: '+18 este mes',
    trend: { value: '+18', positive: true },
    icon: <Users size={20} />,
    iconBg: 'bg-info-bg',
    iconColor: 'text-info',
  },
  {
    id: 'kpi-proveedores',
    label: 'Proveedores Activos',
    value: '87',
    subValue: '12 con pedidos pendientes',
    icon: <Truck size={20} />,
    iconBg: 'bg-secondary',
    iconColor: 'text-secondary-foreground',
  },
  {
    id: 'kpi-stock-total',
    label: 'Stock Total',
    value: '48,392',
    subValue: 'unidades en inventario',
    icon: <Layers size={20} />,
    iconBg: 'bg-primary/10',
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
    icon: <Receipt size={20} />,
    iconBg: 'bg-warning-bg',
    iconColor: 'text-warning',
    warning: true,
  },
  {
    id: 'kpi-caja',
    label: 'Efectivo en Caja',
    value: 'RD$ 32,840',
    subValue: 'Apertura: RD$ 5,000',
    icon: <Package size={20} />,
    iconBg: 'bg-success-bg',
    iconColor: 'text-success',
  },
];

function KpiCard({
  label, value, subValue, trend, icon, iconBg, iconColor,
  alert, warning, colSpan, progress, progressColor,
}: KpiCardProps) {
  const borderClass = alert
    ? 'border-danger/30 bg-danger-bg/30'
    : warning
    ? 'border-warning/30 bg-warning-bg/30' :'';

  return (
    <div
      className={`card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow duration-200 ${colSpan || ''} ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">
            {label}
          </p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold tabular-nums text-foreground leading-none">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          {trend.positive ? (
            <TrendingUp size={13} className="text-success" />
          ) : (
            <TrendingDown size={13} className="text-danger" />
          )}
          <span className={`text-xs font-semibold ${trend.positive ? 'text-success' : 'text-danger'}`}>
            {trend.value}
          </span>
          <span className="text-xs text-muted-foreground">vs ayer</span>
        </div>
      )}

      {progress !== undefined && progressColor && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso</span>
            <span className="tabular-nums font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {(alert || warning) && (
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={12} className={alert ? 'text-danger' : 'text-warning'} />
          <span className={`text-xs font-medium ${alert ? 'text-danger' : 'text-warning'}`}>
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