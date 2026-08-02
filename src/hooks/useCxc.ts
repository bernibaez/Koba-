import { useCallback, useEffect, useRef, useState } from 'react';
import {
  crearCuentaPorCobrar,
  obtenerCuentasPorCobrar,
  registrarPagoCxc,
  type CuentaCobrarUi,
  type NuevaCxcInput,
  type NuevoPagoCxcInput,
} from '@/services/cxc.service';

export function useCxc() {
  const [cuentas, setCuentas] = useState<CuentaCobrarUi[]>([]);
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
      const data = await obtenerCuentasPorCobrar(ac.signal);
      if (!ac.signal.aborted) setCuentas(data);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar cuentas por cobrar');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const crear = useCallback(
    async (input: NuevaCxcInput) => {
      await crearCuentaPorCobrar(input);
      await refetch();
    },
    [refetch]
  );

  const registrarPago = useCallback(
    async (input: NuevoPagoCxcInput) => {
      await registrarPagoCxc(input);
      await refetch();
    },
    [refetch]
  );

  return { cuentas, loading, error, refetch, crear, registrarPago };
}
