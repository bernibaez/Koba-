import { useCallback, useEffect, useRef, useState } from 'react';
import {
  crearCuentaPorPagar,
  listarProveedores,
  obtenerCuentasPorPagar,
  registrarPagoCxp,
  type CuentaPagarUi,
  type NuevaCxpInput,
  type NuevoPagoCxpInput,
  type ProveedorOpcion,
} from '@/services/cxp.service';
import { isAbortError } from '@/lib/isAbortError';

export function useCxp() {
  const [cuentas, setCuentas] = useState<CuentaPagarUi[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorOpcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [data, provs] = await Promise.all([obtenerCuentasPorPagar(), listarProveedores()]);
      if (!mountedRef.current || reqId !== reqIdRef.current) return;
      setCuentas(data);
      setProveedores(provs);
    } catch (e) {
      if (isAbortError(e) || !mountedRef.current || reqId !== reqIdRef.current) return;
      setError(e instanceof Error ? e.message : 'Error al cargar cuentas por pagar');
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
    async (input: NuevaCxpInput) => {
      await crearCuentaPorPagar(input);
      await refetch();
    },
    [refetch]
  );

  const registrarPago = useCallback(
    async (input: NuevoPagoCxpInput) => {
      await registrarPagoCxp(input);
      await refetch();
    },
    [refetch]
  );

  return { cuentas, proveedores, loading, error, refetch, crear, registrarPago };
}
