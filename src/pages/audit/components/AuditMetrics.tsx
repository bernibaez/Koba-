import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { AuditLog } from '../types';

interface AuditMetricsProps {
  logs: AuditLog[];
}

export default function AuditMetrics({ logs }: AuditMetricsProps) {
  const ventasCobrosCount = logs.filter(
    (l) => l.action === 'Venta' || l.action === 'Pago'
  ).length;

  const modificacionesCount = logs.filter(
    (l) => l.action === 'Cambio de precio' || l.action === 'Edición de producto' || l.action === 'Eliminación'
  ).length;

  const devolucionesCajasCount = logs.filter(
    (l) => l.action === 'Devolución' || l.action === 'Cierre de caja' || l.action === 'Apertura de caja'
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Eventos auditados"
        value={String(logs.length)}
        secondaryText="Operaciones registradas"
      />

      <MetricStat
        label="Ventas y cobros"
        value={String(ventasCobrosCount)}
        secondaryText="Transacciones financieras"
        valueColor="text-emerald-600 dark:text-emerald-400"
      />

      <MetricStat
        label="Precios y catálogo"
        value={String(modificacionesCount)}
        secondaryText="Ediciones y eliminaciones"
        valueColor={modificacionesCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
      />

      <MetricStat
        label="Cajas y devoluciones"
        value={String(devolucionesCajasCount)}
        secondaryText="Turnos y reversiones"
      />
    </div>
  );
}
