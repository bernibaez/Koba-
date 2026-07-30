import { useCallback, useEffect, useRef, useState } from 'react';
import {
  obtenerHistorialVentas,
  procesarVenta,
  type PayloadVenta,
} from '@/services/ventas.service';
import type { Venta } from '@/types/database';

export function useVentas(params: {
  pagina?: number;
  limite?: number;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
} = {}) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await obtenerHistorialVentas({ ...params, signal: ac.signal });
      if (!ac.signal.aborted) {
        setVentas(res.datos);
        setTotal(res.total);
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar ventas');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [params.pagina, params.limite, params.fechaInicio, params.fechaFin, params.busqueda]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const cobrar = useCallback(
    async (payload: PayloadVenta) => {
      setProcesando(true);
      try {
        const result = await procesarVenta(payload);
        await refetch();
        return result;
      } finally {
        setProcesando(false);
      }
    },
    [refetch]
  );

  return { ventas, total, loading, error, procesando, refetch, cobrar };
}
