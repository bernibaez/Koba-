import React, { useMemo } from 'react';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  DollarSign,
  Receipt,
  Layers,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';

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

function fmt(n: number) {
  return `RD$ ${n.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function KpiCard({ label, value, subValue, trend, icon, iconBg, iconColor, alert, warning, colSpan, progress, progressColor }: KpiCardProps) {
  return (
    <div className={`card p-5 ${colSpan ?? ''} ${alert ? 'ring-1 ring-danger/40' : warning ? 'ring-1 ring-warning/40' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
          {trend && (
            <p className={`text-xs font-semibold mt-2 ${trend.positive ? 'text-success' : 'text-danger'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      {progress != null && (
        <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className={`h-full rounded-full ${progressColor ?? 'bg-primary'}`} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </div>
  );
}

export default function DashboardBentoGrid() {
  const { metricas, alertas, loading } = useDashboard('hoy');

  const kpiData: KpiCardProps[] = useMemo(() => {
    const m = metricas;
    return [
      {
        id: 'kpi-ventas-dia',
        label: 'Ventas del Día',
        value: loading || !m ? '…' : fmt(m.ventas_total),
        subValue: m ? `${m.ventas_count} transacciones` : 'Cargando…',
        icon: <ShoppingCart size={24} />,
        iconBg: 'bg-primary/15 border border-primary/20',
        iconColor: 'text-primary',
        colSpan: 'col-span-1 md:col-span-2',
      },
      {
        id: 'kpi-ticket',
        label: 'Ticket Promedio',
        value: loading || !m ? '…' : fmt(m.ticket_promedio),
        subValue: 'Periodo actual',
        icon: <Receipt size={24} />,
        iconBg: 'bg-info-bg border border-info/30',
        iconColor: 'text-info',
      },
      {
        id: 'kpi-ganancias',
        label: 'Ganancias Brutas',
        value: loading || !m ? '…' : fmt(m.ganancia_bruta),
        subValue: m && m.ventas_total > 0
          ? `Margen: ${((m.ganancia_bruta / m.ventas_total) * 100).toFixed(1)}%`
          : undefined,
        icon: <DollarSign size={24} />,
        iconBg: 'bg-success-bg border border-success/30',
        iconColor: 'text-success',
      },
      {
        id: 'kpi-stock-bajo',
        label: 'Productos Stock Bajo',
        value: loading || !m ? '…' : String(m.productos_stock_bajo),
        subValue: `${alertas.filter((a) => a.nivel_alerta === 'agotado').length} agotados`,
        icon: <AlertTriangle size={24} />,
        iconBg: 'bg-warning-bg border border-warning/30',
        iconColor: 'text-warning',
        warning: (m?.productos_stock_bajo ?? 0) > 0,
      },
      {
        id: 'kpi-productos',
        label: 'Productos Activos',
        value: loading || !m ? '…' : String(m.productos_activos),
        subValue: 'Catálogo',
        icon: <Package size={24} />,
        iconBg: 'bg-primary/15 border border-primary/20',
        iconColor: 'text-primary',
      },
      {
        id: 'kpi-costo',
        label: 'Costo de Ventas',
        value: loading || !m ? '…' : fmt(m.costo_total),
        subValue: 'COGS del periodo',
        icon: <Layers size={24} />,
        iconBg: 'bg-secondary border border-border',
        iconColor: 'text-foreground/80',
      },
    ];
  }, [metricas, alertas, loading]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpiData.map((kpi) => (
        <KpiCard key={kpi.id} {...kpi} />
      ))}
    </div>
  );
}
