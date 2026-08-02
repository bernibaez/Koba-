import { useCallback, useEffect, useRef, useState } from 'react';
import {
  crearCuentaPorCobrar,
  obtenerCuentasPorCobrar,
  registrarPagoCxc,
  type CuentaCobrarUi,
  type NuevaCxcInput,
  type NuevoPagoCxcInput,
} from '@/services/cxc.service';
import { isAbortError } from '@/lib/isAbortError';

export function useCxc() {
  const [cuentas, setCuentas] = useState<CuentaCobrarUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerCuentasPorCobrar();
      if (!mountedRef.current || reqId !== reqIdRef.current) return;
      setCuentas(data);
    } catch (e) {
      if (isAbortError(e) || !mountedRef.current || reqId !== reqIdRef.current) return;
      setError(e instanceof Error ? e.message : 'Error al cargar cuentas por cobrar');
    } finally {
      if (mountedRef.current && reqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refetch();
    return () => {
      mountedRef.current = false;
      reqIdRef.current += 1;
    };
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
