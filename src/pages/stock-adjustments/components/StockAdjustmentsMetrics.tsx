import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { StockAdjustmentItem } from '../types';

interface StockAdjustmentsMetricsProps {
  adjustments: StockAdjustmentItem[];
}

export default function StockAdjustmentsMetrics({
  adjustments,
}: StockAdjustmentsMetricsProps) {
  const totalEntradas = adjustments
    .filter((a) => a.type === 'entrada')
    .reduce((sum, a) => sum + (a.qty || 0), 0);

  const totalSalidas = adjustments
    .filter((a) => a.type === 'salida')
    .reduce((sum, a) => sum + (a.qty || 0), 0);

  const totalPerdidas = adjustments
    .filter((a) => a.type === 'perdida')
    .reduce((sum, a) => sum + (a.qty || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Entradas ajustadas"
        value={`${totalEntradas} unds`}
        secondaryText="Incrementos de stock físico"
        valueColor="text-emerald-600 dark:text-emerald-400"
      />

      <MetricStat
        label="Salidas por ajuste"
        value={`${totalSalidas} unds`}
        secondaryText="Reducciones regulares de conteo"
        valueColor="text-amber-600 dark:text-amber-400"
      />

      <MetricStat
        label="Pérdidas y daño"
        value={`${totalPerdidas} unds`}
        secondaryText="Mermas, roturas y vencimientos"
        valueColor={totalPerdidas > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Operaciones auditadas"
        value={String(adjustments.length)}
        secondaryText="Historial de movimientos"
      />
    </div>
  );
}
