import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { CuentaPagarUi } from '../types';

interface AccountsPayableMetricsProps {
  cuentas: CuentaPagarUi[];
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AccountsPayableMetrics({
  cuentas,
}: AccountsPayableMetricsProps) {
  const totalPending = cuentas
    .filter((p) => p.status !== 'paid')
    .reduce((s, p) => s + p.balance, 0);

  const totalOverdue = cuentas
    .filter((p) => p.status === 'overdue')
    .reduce((s, p) => s + p.balance, 0);

  const totalPaid = cuentas.reduce((s, p) => s + p.paid, 0);
  const overdueCount = cuentas.filter((p) => p.status === 'overdue').length;
  const totalCount = cuentas.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Total por pagar"
        value={`RD$ ${formatMoney(totalPending)}`}
        secondaryText="Deuda comercial pendiente"
        valueColor={totalPending > 0 ? 'text-[var(--ink)]' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Facturas vencidas"
        value={`RD$ ${formatMoney(totalOverdue)}`}
        secondaryText={`${overdueCount} compromiso(s) en mora`}
        valueColor={overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Total liquidado"
        value={`RD$ ${formatMoney(totalPaid)}`}
        secondaryText="Pagos abonados a proveedores"
        valueColor="text-emerald-600 dark:text-emerald-400"
      />

      <MetricStat
        label="Documentos totales"
        value={String(totalCount)}
        secondaryText="Facturas de compras registradas"
      />
    </div>
  );
}
