import React from 'react';
import { AlertTriangle, Clock, Package, TrendingDown } from 'lucide-react';

const alerts = [
  {
    id: 'alert-001',
    type: 'expiring',
    icon: <Clock size={15} />,
    color: 'text-danger',
    bg: 'bg-danger-bg',
    title: 'Yogur Griego 500g',
    detail: 'Vence en 2 días — 48 unidades',
  },
  {
    id: 'alert-002',
    type: 'expiring',
    icon: <Clock size={15} />,
    color: 'text-danger',
    bg: 'bg-danger-bg',
    title: 'Queso Blanco/lb',
    detail: 'Vence en 3 días — 12 unidades',
  },
  {
    id: 'alert-003',
    type: 'low',
    icon: <TrendingDown size={15} />,
    color: 'text-warning',
    bg: 'bg-warning-bg',
    title: 'Aceite Vegetal 1L',
    detail: 'Stock: 8 unidades (mín: 24)',
  },
  {
    id: 'alert-004',
    type: 'low',
    icon: <TrendingDown size={15} />,
    color: 'text-warning',
    bg: 'bg-warning-bg',
    title: 'Papel Higiénico x4',
    detail: 'Stock: 3 unidades (mín: 12)',
  },
  {
    id: 'alert-005',
    type: 'out',
    icon: <Package size={15} />,
    color: 'text-danger',
    bg: 'bg-danger-bg',
    title: 'Leche Pasteurizada 1L',
    detail: 'Sin stock — pedido pendiente',
  },
  {
    id: 'alert-006',
    type: 'low',
    icon: <TrendingDown size={15} />,
    color: 'text-warning',
    bg: 'bg-warning-bg',
    title: 'Detergente Líq. 1.5L',
    detail: 'Stock: 6 unidades (mín: 20)',
  },
  {
    id: 'alert-007',
    type: 'expiring',
    icon: <Clock size={15} />,
    color: 'text-warning',
    bg: 'bg-warning-bg',
    title: 'Pan Integral x2',
    detail: 'Vence en 5 días — 24 unidades',
  },
];

export default function InventoryAlerts() {
  const critical = alerts?.filter((a) => a?.type === 'out' || (a?.type === 'expiring' && a?.detail?.includes('2 días') || a?.detail?.includes('3 días')));
  const warnings = alerts?.filter((a) => !critical?.find((c) => c?.id === a?.id));

  return (
    <div className="card overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <div>
          <h3 className="text-base font-semibold text-foreground">Alertas de Inventario</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{alerts?.length} alertas activas</p>
        </div>
        <AlertTriangle size={16} className="text-warning" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {critical?.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-danger mb-2">Crítico</p>
            <div className="space-y-2">
              {critical?.map((a) => (
                <div
                  key={a?.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${a?.bg} border border-danger/20`}
                >
                  <span className={`mt-0.5 flex-shrink-0 ${a?.color}`}>{a?.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{a?.title}</p>
                    <p className={`text-xs mt-0.5 ${a?.color}`}>{a?.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings?.length > 0 && (
          <div className="px-4 pt-3 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-warning mb-2">Advertencia</p>
            <div className="space-y-2">
              {warnings?.map((a) => (
                <div
                  key={a?.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${a?.bg} border border-warning/20`}
                >
                  <span className={`mt-0.5 flex-shrink-0 ${a?.color}`}>{a?.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{a?.title}</p>
                    <p className={`text-xs mt-0.5 ${a?.color}`}>{a?.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="px-5 py-3 border-t border-border flex-shrink-0">
        <button className="w-full text-xs text-primary font-medium hover:underline">
          Gestionar inventario →
        </button>
      </div>
    </div>
  );
}