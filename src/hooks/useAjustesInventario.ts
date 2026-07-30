import { useCallback, useEffect, useRef, useState } from 'react';
import {
  obtenerHistorialAjustes,
  procesarAjusteStockBloque,
  type AjusteItemPayload,
} from '@/services/inventario.service';
import type { AjusteStock, TipoAjuste } from '@/types/database';

export function useAjustesInventario(params: {
  pagina?: number;
  limite?: number;
  busqueda?: string;
  tipo?: TipoAjuste | 'todos';
} = {}) {
  const [ajustes, setAjustes] = useState<AjusteStock[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await obtenerHistorialAjustes({ ...params, signal: ac.signal });
      if (!ac.signal.aborted) {
        setAjustes(res.datos);
        setTotal(res.total);
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar ajustes');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [params.pagina, params.limite, params.busqueda, params.tipo]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const procesarBloque = useCallback(
    async (items: AjusteItemPayload[]) => {
      setSaving(true);
      try {
        const result = await procesarAjusteStockBloque(items);
        await refetch();
        return result;
      } finally {
        setSaving(false);
      }
    },
    [refetch]
  );

  return { ajustes, total, loading, error, saving, refetch, procesarBloque };
}
