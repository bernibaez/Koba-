import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerAlertasStock, obtenerMetricasDashboard } from '@/services/dashboard.service';
import type { MetricasDashboard } from '@/types/database';

export function useDashboard(periodo: 'hoy' | 'semana' | 'mes' = 'hoy') {
  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null);
  const [alertas, setAlertas] = useState<
    { id: string; sku: string; nombre: string; stock_actual: number; stock_minimo: number; nivel_alerta: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const [m, a] = await Promise.all([
        obtenerMetricasDashboard(periodo, ac.signal),
        obtenerAlertasStock(ac.signal),
      ]);
      if (!ac.signal.aborted) {
        setMetricas(m);
        setAlertas(a as typeof alertas);
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar dashboard');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  return { metricas, alertas, loading, error, refetch };
}
