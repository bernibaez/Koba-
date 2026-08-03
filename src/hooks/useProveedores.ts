import { useCallback, useEffect, useRef, useState } from 'react';
import {
  actualizarProveedor,
  crearProveedor,
  eliminarProveedor,
  obtenerProveedores,
  type NuevoProveedorInput,
  type Proveedor,
} from '@/services/proveedores.service';

export function useProveedores(busqueda = '') {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
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
      const data = await obtenerProveedores({ busqueda, signal: ac.signal });
      if (!ac.signal.aborted) setProveedores(data);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar proveedores');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [busqueda]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const crear = useCallback(
    async (datos: NuevoProveedorInput) => {
      const p = await crearProveedor(datos);
      await refetch();
      return p;
    },
    [refetch]
  );

  const actualizar = useCallback(
    async (id: string, datos: Parameters<typeof actualizarProveedor>[1]) => {
      await actualizarProveedor(id, datos);
      await refetch();
    },
    [refetch]
  );

  const eliminar = useCallback(
    async (id: string) => {
      await eliminarProveedor(id);
      await refetch();
    },
    [refetch]
  );

  return { proveedores, loading, error, refetch, crear, actualizar, eliminar };
}
