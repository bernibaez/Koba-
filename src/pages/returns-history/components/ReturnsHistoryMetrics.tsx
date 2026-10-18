import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { PosReturn } from '../types';

interface ReturnsHistoryMetricsProps {
  returns: PosReturn[];
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ReturnsHistoryMetrics({ returns }: ReturnsHistoryMetricsProps) {
  const approvedReturns = returns.filter((r) => r.status === 'approved');
  const totalAmount = approvedReturns.reduce((s, r) => s + r.total, 0);
  const pendingCount = returns.filter((r) => r.status === 'pending').length;
  const approvedCount = approvedReturns.length;
  const rejectedCount = returns.filter((r) => r.status === 'rejected').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Monto reembolsado"
        value={`RD$ ${formatMoney(totalAmount)}`}
        secondaryText="Devoluciones aprobadas"
        valueColor={totalAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ink)]'}
      />

      <MetricStat
        label="Pendientes por autorizar"
        value={`${pendingCount} solicitud(es)`}
        secondaryText="Esperando revisión de admin"
        valueColor={pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Aprobadas"
        value={String(approvedCount)}
        secondaryText="Reembolsos liquidados"
        valueColor="text-emerald-600 dark:text-emerald-400"
      />

      <MetricStat
        label="Rechazadas"
        value={String(rejectedCount)}
        secondaryText="Denegadas por política"
        valueColor={rejectedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ink2)]'}
      />
    </div>
  );
}
