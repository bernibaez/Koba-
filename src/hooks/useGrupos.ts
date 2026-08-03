import { useCallback, useEffect, useRef, useState } from 'react';
import {
  actualizarGrupo,
  crearGrupo,
  eliminarGrupo,
  obtenerGrupos,
  type GrupoCliente,
  type NuevoGrupoInput,
} from '@/services/grupos.service';

export function useGrupos() {
  const [grupos, setGrupos] = useState<GrupoCliente[]>([]);
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
      const data = await obtenerGrupos(ac.signal);
      if (!ac.signal.aborted) setGrupos(data);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar grupos');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const crear = useCallback(
    async (datos: NuevoGrupoInput) => {
      const g = await crearGrupo(datos);
      await refetch();
      return g;
    },
    [refetch]
  );

  const actualizar = useCallback(
    async (id: string, datos: Parameters<typeof actualizarGrupo>[1]) => {
      await actualizarGrupo(id, datos);
      await refetch();
    },
    [refetch]
  );

  const eliminar = useCallback(
    async (id: string) => {
      await eliminarGrupo(id);
      await refetch();
    },
    [refetch]
  );

  return { grupos, loading, error, refetch, crear, actualizar, eliminar };
}
