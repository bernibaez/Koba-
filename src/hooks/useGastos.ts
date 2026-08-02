import { useCallback, useEffect, useRef, useState } from 'react';
import {
  actualizarEstadoGasto,
  crearCategoriaGasto,
  crearGasto,
  eliminarCategoriaGasto,
  eliminarGasto,
  obtenerCategoriasGasto,
  obtenerGastos,
  type CategoriaGastoUi,
  type GastoUi,
  type NuevaCategoriaGastoInput,
  type NuevoGastoInput,
} from '@/services/gastos.service';
import type { EstadoGasto } from '@/types/database';

export function useGastos() {
  const [gastos, setGastos] = useState<GastoUi[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGastoUi[]>([]);
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
      const [g, c] = await Promise.all([
        obtenerGastos(ac.signal),
        obtenerCategoriasGasto(ac.signal),
      ]);
      if (!ac.signal.aborted) {
        setGastos(g);
        setCategorias(c);
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar gastos');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const crear = useCallback(
    async (input: NuevoGastoInput) => {
      await crearGasto(input);
      await refetch();
    },
    [refetch]
  );

  const crearCategoria = useCallback(
    async (input: NuevaCategoriaGastoInput) => {
      await crearCategoriaGasto(input);
      await refetch();
    },
    [refetch]
  );

  const cambiarEstado = useCallback(
    async (id: string, estado: EstadoGasto) => {
      await actualizarEstadoGasto(id, estado);
      await refetch();
    },
    [refetch]
  );

  const eliminar = useCallback(
    async (id: string) => {
      await eliminarGasto(id);
      await refetch();
    },
    [refetch]
  );

  const eliminarCategoria = useCallback(
    async (id: string) => {
      await eliminarCategoriaGasto(id);
      await refetch();
    },
    [refetch]
  );

  return {
    gastos,
    categorias,
    loading,
    error,
    refetch,
    crear,
    crearCategoria,
    cambiarEstado,
    eliminar,
    eliminarCategoria,
  };
}
