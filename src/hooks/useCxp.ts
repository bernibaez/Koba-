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

export function useCxp() {
  const [cuentas, setCuentas] = useState<CuentaPagarUi[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorOpcion[]>([]);
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
      const [data, provs] = await Promise.all([
        obtenerCuentasPorPagar(ac.signal),
        listarProveedores(),
      ]);
      if (!ac.signal.aborted) {
        setCuentas(data);
        setProveedores(provs);
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar cuentas por pagar');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
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
