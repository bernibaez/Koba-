import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { CAJA_COLUMNS, type Caja } from '@/types/database';

const LOCAL_CAJAS_KEY = 'marketerp_local_cajas';

export const CAJAS_DEFAULT: Caja[] = [
  {
    id: 'caja-1',
    codigo: '1',
    nombre: 'Caja #1 - Administrador',
    descripcion: 'Caja principal de administración',
    es_caja_principal: true,
    activa: true,
    activo: true,
    creado_en: new Date().toISOString(),
  },
  {
    id: 'caja-2',
    codigo: '2',
    nombre: 'Caja #2 - Mostrador Principal',
    descripcion: 'Caja de atención y ventas en mostrador',
    es_caja_principal: false,
    activa: true,
    activo: true,
    creado_en: new Date().toISOString(),
  },
  {
    id: 'caja-3',
    codigo: '3',
    nombre: 'Caja #3 - Servicio Rápido / Express',
    descripcion: 'Caja rápida para cobros expreso',
    es_caja_principal: false,
    activa: true,
    activo: true,
    creado_en: new Date().toISOString(),
  },
  {
    id: 'caja-4',
    codigo: '4',
    nombre: 'Caja #4 - Sucursal Remanente',
    descripcion: 'Caja secundaria para turnos remanentes',
    es_caja_principal: false,
    activa: true,
    activo: true,
    creado_en: new Date().toISOString(),
  },
];

function getLocalCajas(): Caja[] {
  try {
    const stored = localStorage.getItem(LOCAL_CAJAS_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_CAJAS_KEY, JSON.stringify(CAJAS_DEFAULT));
      return CAJAS_DEFAULT;
    }
    return JSON.parse(stored) as Caja[];
  } catch {
    return CAJAS_DEFAULT;
  }
}

function saveLocalCajas(list: Caja[]): void {
  try {
    localStorage.setItem(LOCAL_CAJAS_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

function isMissingCajasTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; status?: number; message?: string };
  return (
    e.code === '42P01' ||
    e.code === 'PGRST205' ||
    e.status === 404 ||
    (typeof e.message === 'string' && e.message.includes('cajas'))
  );
}

export async function obtenerCajas(opts?: {
  busqueda?: string;
  soloActivas?: boolean;
  signal?: AbortSignal;
}): Promise<Caja[]> {
  const sb = tryGetSupabase();
  if (!sb) {
    let list = getLocalCajas();
    if (opts?.soloActivas) list = list.filter((c) => c.activa);
    if (opts?.busqueda?.trim()) {
      const q = opts.busqueda.trim().toLowerCase();
      list = list.filter(
        (c) => c.nombre.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q)
      );
    }
    return list;
  }

  try {
    let query = sb.from('cajas').select(CAJA_COLUMNS).order('codigo', { ascending: true });
    if (opts?.soloActivas) query = query.eq('activa', true);
    if (opts?.busqueda?.trim()) {
      const q = opts.busqueda.trim();
      query = query.or(`nombre.ilike.%${q}%,codigo.ilike.%${q}%`);
    }
    if (opts?.signal) query = query.abortSignal(opts.signal);

    const { data, error } = await query;
    if (error) {
      if (isMissingCajasTableError(error)) {
        return getLocalCajas();
      }
      throw error;
    }
    return (data ?? []) as Caja[];
  } catch (err) {
    if (isMissingCajasTableError(err)) {
      return getLocalCajas();
    }
    throw err;
  }
}

export type CrearCajaPayload = {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  sucursal_id?: string | null;
  es_caja_principal?: boolean;
  activa?: boolean;
};

export async function crearCaja(payload: CrearCajaPayload): Promise<Caja> {
  if (!isSupabaseConfigured()) {
    const list = getLocalCajas();
    const nueva: Caja = {
      id: `caja-${Date.now()}`,
      codigo: payload.codigo,
      nombre: payload.nombre,
      descripcion: payload.descripcion ?? null,
      sucursal_id: payload.sucursal_id ?? null,
      es_caja_principal: payload.es_caja_principal ?? false,
      activa: payload.activa ?? true,
      activo: payload.activa ?? true,
      creado_en: new Date().toISOString(),
    };
    saveLocalCajas([...list, nueva]);
    return nueva;
  }

  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from('cajas')
      .insert({
        codigo: payload.codigo,
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? null,
        sucursal_id: payload.sucursal_id ?? null,
        es_caja_principal: payload.es_caja_principal ?? false,
        activa: payload.activa ?? true,
      })
      .select(CAJA_COLUMNS)
      .single();

    if (error) {
      if (isMissingCajasTableError(error)) {
        const list = getLocalCajas();
        const nueva: Caja = {
          id: `caja-${Date.now()}`,
          codigo: payload.codigo,
          nombre: payload.nombre,
          descripcion: payload.descripcion ?? null,
          sucursal_id: payload.sucursal_id ?? null,
          es_caja_principal: payload.es_caja_principal ?? false,
          activa: payload.activa ?? true,
          activo: payload.activa ?? true,
          creado_en: new Date().toISOString(),
        };
        saveLocalCajas([...list, nueva]);
        return nueva;
      }
      throw error;
    }
    return data as Caja;
  } catch (err) {
    if (isMissingCajasTableError(err)) {
      const list = getLocalCajas();
      const nueva: Caja = {
        id: `caja-${Date.now()}`,
        codigo: payload.codigo,
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? null,
        sucursal_id: payload.sucursal_id ?? null,
        es_caja_principal: payload.es_caja_principal ?? false,
        activa: payload.activa ?? true,
        activo: payload.activa ?? true,
        creado_en: new Date().toISOString(),
      };
      saveLocalCajas([...list, nueva]);
      return nueva;
    }
    throw err;
  }
}

export async function actualizarCaja(
  id: string,
  datos: Partial<Pick<Caja, 'codigo' | 'nombre' | 'descripcion' | 'sucursal_id' | 'es_caja_principal' | 'activa'>>
): Promise<Caja> {
  if (!isSupabaseConfigured()) {
    const list = getLocalCajas();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Caja no encontrada');
    const actualizada = { ...list[idx], ...datos, actualizado_en: new Date().toISOString() };
    list[idx] = actualizada;
    saveLocalCajas(list);
    return actualizada;
  }

  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from('cajas')
      .update({ ...datos, actualizado_en: new Date().toISOString() })
      .eq('id', id)
      .select(CAJA_COLUMNS)
      .single();

    if (error) {
      if (isMissingCajasTableError(error)) {
        const list = getLocalCajas();
        const idx = list.findIndex((c) => c.id === id);
        if (idx !== -1) {
          const actualizada = { ...list[idx], ...datos, actualizado_en: new Date().toISOString() };
          list[idx] = actualizada;
          saveLocalCajas(list);
          return actualizada;
        }
      }
      throw error;
    }
    return data as Caja;
  } catch (err) {
    if (isMissingCajasTableError(err)) {
      const list = getLocalCajas();
      const idx = list.findIndex((c) => c.id === id);
      if (idx !== -1) {
        const actualizada = { ...list[idx], ...datos, actualizado_en: new Date().toISOString() };
        list[idx] = actualizada;
        saveLocalCajas(list);
        return actualizada;
      }
    }
    throw err;
  }
}

export async function alternarActivaCaja(id: string, activa: boolean): Promise<void> {
  await actualizarCaja(id, { activa });
}

export async function eliminarCaja(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const list = getLocalCajas().filter((c) => c.id !== id);
    saveLocalCajas(list);
    return;
  }

  const sb = getSupabase();
  try {
    const { error } = await sb.from('cajas').delete().eq('id', id);
    if (error) {
      if (isMissingCajasTableError(error)) {
        const list = getLocalCajas().filter((c) => c.id !== id);
        saveLocalCajas(list);
        return;
      }
      throw error;
    }
  } catch (err) {
    if (isMissingCajasTableError(err)) {
      const list = getLocalCajas().filter((c) => c.id !== id);
      saveLocalCajas(list);
      return;
    }
    throw err;
  }
}
