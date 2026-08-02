import { useCallback, useEffect, useState } from 'react';
import {
  obtenerCajas,
  crearCaja,
  actualizarCaja,
  eliminarCaja,
  alternarActivaCaja,
  type CrearCajaPayload,
} from '@/services/cajas.service';
import type { Caja } from '@/types/database';

export function useCajas(opts?: { busqueda?: string; soloActivas?: boolean }) {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCajas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerCajas(opts);
      setCajas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener cajas');
    } finally {
      setLoading(false);
    }
  }, [opts?.busqueda, opts?.soloActivas]);

  useEffect(() => {
    fetchCajas();
  }, [fetchCajas]);

  const handleCrear = async (payload: CrearCajaPayload) => {
    const res = await crearCaja(payload);
    await fetchCajas();
    return res;
  };

  const handleActualizar = async (
    id: string,
    datos: Partial<Pick<Caja, 'codigo' | 'nombre' | 'descripcion' | 'sucursal_id' | 'es_caja_principal' | 'activa'>>
  ) => {
    const res = await actualizarCaja(id, datos);
    await fetchCajas();
    return res;
  };

  const handleEliminar = async (id: string) => {
    await eliminarCaja(id);
    await fetchCajas();
  };

  const handleAlternarActiva = async (id: string, activa: boolean) => {
    await alternarActivaCaja(id, activa);
    await fetchCajas();
  };

  return {
    cajas,
    loading,
    error,
    refetch: fetchCajas,
    crearCaja: handleCrear,
    actualizarCaja: handleActualizar,
    eliminarCaja: handleEliminar,
    alternarActivaCaja: handleAlternarActiva,
  };
}
