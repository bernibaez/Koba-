import React, { useMemo } from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { Purchase } from '../types';

interface PurchasesMetricsProps {
  purchases: Purchase[];
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PurchasesMetrics({ purchases }: PurchasesMetricsProps) {
  const metrics = useMemo(() => {
    const validPurchases = purchases.filter((p) => p.status !== 'voided');
    const totalInversion = validPurchases.reduce((sum, p) => sum + p.total, 0);
    const totalOrdenes = validPurchases.length;
    const receivedCount = validPurchases.filter((p) => p.status === 'received').length;
    const pendingPurchases = validPurchases.filter((p) => p.status === 'pending' || p.status === 'partial');
    const pendingCount = pendingPurchases.length;
    const averageOrder = totalOrdenes > 0 ? totalInversion / totalOrdenes : 0;

    return {
      totalInversion,
      totalOrdenes,
      receivedCount,
      pendingCount,
      averageOrder,
    };
  }, [purchases]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-2 select-none">
      <MetricStat
        label="Inversión total"
        value={`RD$ ${formatMoney(metrics.totalInversion)}`}
        secondaryText={`${metrics.totalOrdenes} órdenes registradas`}
      />

      <MetricStat
        label="Órdenes completadas"
        value={metrics.receivedCount}
        secondaryText={metrics.receivedCount === 1 ? '1 orden recibida' : `${metrics.receivedCount} órdenes recibidas`}
      />

      <MetricStat
        label="Pendientes de recepción"
        value={metrics.pendingCount}
        valueColor={metrics.pendingCount > 0 ? 'var(--warn)' : undefined}
        secondaryText="En espera o recepción parcial"
      />

      <MetricStat
        label="Promedio por orden"
        value={`RD$ ${formatMoney(metrics.averageOrder)}`}
        secondaryText="Costo medio de adquisición"
      />
    </div>
  );
}
