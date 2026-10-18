import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { Caja } from '../types';
import { isCajaActiva, isCajaPrincipal } from '../types';

interface CajasMetricsProps {
  cajas: Caja[];
}

export default function CajasMetrics({ cajas }: CajasMetricsProps) {
  const total = cajas.length;
  const activas = cajas.filter(isCajaActiva).length;
  const inactivas = total - activas;
  const principal = cajas.find(isCajaPrincipal);

  const pctActivas = total > 0 ? Math.round((activas / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Cajas registradas"
        value={String(total)}
        secondaryText={`${activas} habilitadas para operar`}
      />

      <MetricStat
        label="Cajas activas"
        value={String(activas)}
        secondaryText={`${pctActivas}% de disponibilidad`}
        valueColor="text-emerald-600 dark:text-emerald-400"
      />

      <MetricStat
        label="Fuera de servicio"
        value={String(inactivas)}
        secondaryText={inactivas === 0 ? 'Todas operativas' : `${inactivas} deshabilitada(s)`}
        valueColor={inactivas > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
      />

      <MetricStat
        label="Caja principal"
        value={principal ? `#${principal.codigo}` : '—'}
        secondaryText={principal ? principal.nombre : 'Sin asignar'}
      />
    </div>
  );
}
