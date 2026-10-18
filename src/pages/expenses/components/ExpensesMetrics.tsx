import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { GastoUi, CategoriaGastoUi } from '../types';

interface ExpensesMetricsProps {
  gastos: GastoUi[];
  categorias: CategoriaGastoUi[];
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ExpensesMetrics({
  gastos,
  categorias,
}: ExpensesMetricsProps) {
  const totalApproved = gastos
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const pendingCount = gastos.filter((e) => e.status === 'pending').length;
  const totalPendingAmount = gastos
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Gastos aprobados"
        value={`RD$ ${formatMoney(totalApproved)}`}
        secondaryText="Total liquidado este periodo"
        valueColor={totalApproved > 0 ? 'text-[var(--ink)]' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Por aprobar"
        value={`${pendingCount} gasto(s)`}
        secondaryText={`RD$ ${formatMoney(totalPendingAmount)} en revisión`}
        valueColor={pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Categorías activas"
        value={String(categorias.length)}
        secondaryText="Centros de costo configurados"
      />

      <MetricStat
        label="Registros auditados"
        value={String(gastos.length)}
        secondaryText="Egresos en historial"
      />
    </div>
  );
}
