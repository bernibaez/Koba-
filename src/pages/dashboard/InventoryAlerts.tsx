import React from 'react';
import { AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';

export default function InventoryAlerts() {
  const { alertas, loading } = useDashboard('hoy');

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" />
          Alertas de Inventario
        </h3>
        <span className="text-xs text-muted-foreground">{alertas.length} alertas</span>
      </div>
      {loading && (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={`alerta-skel-${i}`} className="skeleton-shimmer h-14 rounded-xl" />
          ))}
        </div>
      )}
      {!loading && alertas.length === 0 && (
        <p className="text-sm text-muted-foreground">Sin alertas de stock.</p>
      )}
      <ul className="space-y-2 max-h-80 overflow-y-auto">
        {!loading && alertas.map((a) => {
          const isOut = a.nivel_alerta === 'agotado';
          return (
            <li
              key={a.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                isOut ? 'bg-danger-bg/40 border-danger/20' : 'bg-warning-bg/40 border-warning/20'
              }`}
            >
              <div className={`mt-0.5 ${isOut ? 'text-danger' : 'text-warning'}`}>
                {isOut ? <Package size={15} /> : <TrendingDown size={15} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{a.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  SKU {a.sku} — Stock: {a.stock_actual} (mín: {a.stock_minimo})
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
