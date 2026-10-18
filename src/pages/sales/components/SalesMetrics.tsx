import React, { useMemo } from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { Sale } from '../types';

interface SalesMetricsProps {
  sales: Sale[];
  className?: string;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SalesMetrics({ sales, className = '' }: SalesMetricsProps) {
  // Solo cuentan las ventas con status 'completed'; las anuladas y borradores no suman
  const completedSales = useMemo(() => {
    return sales.filter((s) => s.status === 'completed');
  }, [sales]);

  const totalAmount = useMemo(() => {
    return completedSales.reduce((acc, s) => acc + (s.total || 0), 0);
  }, [completedSales]);

  const totalProfit = useMemo(() => {
    return completedSales.reduce((acc, s) => acc + (s.grossProfit || 0), 0);
  }, [completedSales]);

  const totalItbis = useMemo(() => {
    return completedSales.reduce((acc, s) => acc + (s.itbis || 0), 0);
  }, [completedSales]);

  const issuedCount = completedSales.length;

  const marginPercentage = useMemo(() => {
    if (totalAmount <= 0) return 0;
    return (totalProfit / totalAmount) * 100;
  }, [totalProfit, totalAmount]);

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-6 select-none ${className}`}
      role="region"
      aria-label="Resumen de métricas de ventas"
    >
      {/* Ventas totales (RD$) */}
      <MetricStat
        label="Ventas totales"
        prefix="RD$"
        value={formatCurrency(totalAmount)}
      />

      {/* Ganancia bruta (verde) con dato secundario "X.X % de margen" */}
      <MetricStat
        label="Ganancia bruta"
        prefix="RD$"
        value={formatCurrency(totalProfit)}
        valueColor="var(--ok)"
        secondaryText={`${marginPercentage.toFixed(1)} % de margen`}
      />

      {/* ITBIS 18 % con dato secundario "Transparentado" */}
      <MetricStat
        label="ITBIS 18 %"
        prefix="RD$"
        value={formatCurrency(totalItbis)}
        secondaryText="Transparentado"
      />

      {/* Facturas emitidas (número de completadas) */}
      <MetricStat
        label="Facturas emitidas"
        value={issuedCount}
      />
    </div>
  );
}
