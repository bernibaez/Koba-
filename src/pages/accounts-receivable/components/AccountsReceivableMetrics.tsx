import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { CuentaCobrarUi } from '../types';

interface AccountsReceivableMetricsProps {
  cuentas: CuentaCobrarUi[];
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AccountsReceivableMetrics({
  cuentas,
}: AccountsReceivableMetricsProps) {
  const totalPending = cuentas
    .filter((r) => r.status !== 'paid')
    .reduce((s, r) => s + r.balance, 0);

  const totalOverdue = cuentas
    .filter((r) => r.status === 'overdue')
    .reduce((s, r) => s + r.balance, 0);

  const totalCollected = cuentas.reduce((s, r) => s + r.paid, 0);
  const overdueCount = cuentas.filter((r) => r.status === 'overdue').length;
  const totalCount = cuentas.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Total por cobrar"
        value={`RD$ ${formatMoney(totalPending)}`}
        secondaryText="Saldo neto pendiente"
        valueColor={totalPending > 0 ? 'text-[var(--ink)]' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Cartera en mora"
        value={`RD$ ${formatMoney(totalOverdue)}`}
        secondaryText={`${overdueCount} crédito(s) vencido(s)`}
        valueColor={overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Cobrado acumulado"
        value={`RD$ ${formatMoney(totalCollected)}`}
        secondaryText="Abonos y pagos liquidados"
        valueColor="text-emerald-600 dark:text-emerald-400"
      />

      <MetricStat
        label="Documentos totales"
        value={String(totalCount)}
        secondaryText="Créditos comerciales registrados"
      />
    </div>
  );
}
