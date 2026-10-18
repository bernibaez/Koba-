import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { TransferenciaUi } from '../types';

interface StockTransfersMetricsProps {
  transfers: TransferenciaUi[];
}

export default function StockTransfersMetrics({
  transfers,
}: StockTransfersMetricsProps) {
  const mesActual = new Date().toISOString().slice(0, 7);
  const delMes = transfers.filter((t) => t.fecha.startsWith(mesActual));
  const pendientes = transfers.filter(
    (t) => t.estado === 'pendiente' || t.estado === 'en_transito'
  ).length;
  const completadas = transfers.filter((t) => t.estado === 'recibida').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Despachos del mes"
        value={String(delMes.length)}
        secondaryText="Movimientos de este ciclo"
      />

      <MetricStat
        label="En tránsito / Pendientes"
        value={String(pendientes)}
        secondaryText="Por recibir en sucursal"
        valueColor={pendientes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Completadas con éxito"
        value={String(completadas)}
        secondaryText="Mercancía entregada"
        valueColor="text-emerald-600 dark:text-emerald-400"
      />

      <MetricStat
        label="Total histórico"
        value={String(transfers.length)}
        secondaryText="Operaciones registradas"
      />
    </div>
  );
}
