import { useCallback, useEffect, useRef, useState } from 'react';
import { crearCliente, obtenerClientes } from '@/services/clientes.service';
import type { Cliente } from '@/types/database';

export function useClientes(busqueda = '', limite = 200) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
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
      const res = await obtenerClientes({ busqueda, limite, signal: ac.signal });
      if (!ac.signal.aborted) setClientes(res.datos);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar clientes');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [busqueda, limite]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const crear = useCallback(
    async (datos: Parameters<typeof crearCliente>[0]) => {
      const c = await crearCliente(datos);
      await refetch();
      return c;
    },
    [refetch]
  );

  return { clientes, loading, error, refetch, crear };
}
