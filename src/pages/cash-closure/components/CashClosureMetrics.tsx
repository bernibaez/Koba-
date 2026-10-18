import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { CashClosure } from '../types';

interface CashClosureMetricsProps {
  closures: CashClosure[];
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CashClosureMetrics({ closures }: CashClosureMetricsProps) {
  const totalClosures = closures.length;
  const totalSales = closures.reduce((s, c) => s + (c.totalSales || 0), 0);
  const totalCash = closures.reduce((s, c) => s + (c.countedCash ?? c.totalCash ?? 0), 0);
  const totalDiff = closures.reduce((s, c) => s + (c.difference || 0), 0);

  const diffColor =
    Math.abs(totalDiff) < 0.01
      ? 'text-emerald-600 dark:text-emerald-400'
      : totalDiff > 0
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

  const diffLabel =
    Math.abs(totalDiff) < 0.01
      ? 'Cuadre exacto consolidado'
      : totalDiff > 0
        ? 'Sobrante en caja acumulado'
        : 'Faltante en caja acumulado';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Cierres registrados"
        value={String(totalClosures)}
        secondaryText={`${totalClosures} jornada(s) auditadas`}
      />

      <MetricStat
        label="Ventas procesadas"
        value={`RD$ ${formatMoney(totalSales)}`}
        secondaryText="Facturación total en turnos"
        valueColor="text-emerald-600 dark:text-emerald-400"
      />

      <MetricStat
        label="Efectivo en caja"
        value={`RD$ ${formatMoney(totalCash)}`}
        secondaryText="Monto físico auditado"
      />

      <MetricStat
        label="Diferencia neta"
        value={`${totalDiff >= 0 ? '+' : '-'}RD$ ${formatMoney(Math.abs(totalDiff))}`}
        secondaryText={diffLabel}
        valueColor={diffColor}
      />
    </div>
  );
}
