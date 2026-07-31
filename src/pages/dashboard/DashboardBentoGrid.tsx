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
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  alert?: boolean;
  warning?: boolean;
}

function fmt(n: number) {
  return `RD$ ${n.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function KpiCard({ label, value, subValue, icon, iconBg, iconColor, alert, warning }: KpiCardProps) {
  return (
    <div
      className={`
        card p-4 flex items-center gap-4
        ${alert ? 'ring-1 ring-danger/30' : warning ? 'ring-1 ring-warning/30' : ''}
        hover:shadow-md transition-shadow duration-200
      `}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-extrabold text-foreground mt-0.5 tabular-nums truncate">{value}</p>
        {subValue && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subValue}</p>}
      </div>
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
        icon: <ShoppingCart size={22} />,
        iconBg: 'bg-primary/15 border border-primary/20',
        iconColor: 'text-primary',
      },
      {
        id: 'kpi-ticket',
        label: 'Ticket Promedio',
        value: loading || !m ? '…' : fmt(m.ticket_promedio),
        subValue: 'Hoy',
        icon: <Receipt size={22} />,
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
        icon: <DollarSign size={22} />,
        iconBg: 'bg-success-bg border border-success/30',
        iconColor: 'text-success',
      },
      {
        id: 'kpi-costo',
        label: 'Costo de Ventas',
        value: loading || !m ? '…' : fmt(m.costo_total),
        subValue: 'COGS hoy',
        icon: <Layers size={22} />,
        iconBg: 'bg-secondary border border-border',
        iconColor: 'text-foreground/70',
      },
      {
        id: 'kpi-stock-bajo',
        label: 'Stock Bajo',
        value: loading || !m ? '…' : String(m.productos_stock_bajo),
        subValue: `${alertas.filter((a) => a.nivel_alerta === 'agotado').length} agotados`,
        icon: <AlertTriangle size={22} />,
        iconBg: 'bg-warning-bg border border-warning/30',
        iconColor: 'text-warning',
        warning: (m?.productos_stock_bajo ?? 0) > 0,
      },
      {
        id: 'kpi-productos',
        label: 'Productos Activos',
        value: loading || !m ? '…' : String(m.productos_activos),
        subValue: 'Catálogo total',
        icon: <Package size={22} />,
        iconBg: 'bg-primary/15 border border-primary/20',
        iconColor: 'text-primary',
      },
    ];
  }, [metricas, alertas, loading]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {kpiData.map((kpi) => (
        <KpiCard key={kpi.id} {...kpi} />
      ))}
    </div>
  );
}
