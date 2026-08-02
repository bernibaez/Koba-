import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { AGENTE_COLUMNS, type AgenteComercial } from '@/types/database';

export type NuevoAgenteInput = {
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
  porcentaje_comision?: number;
  perfil_id?: string | null;
  activo?: boolean;
};

function errorSupabase(error: unknown): Error {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; details?: string; hint?: string };
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    return new Error(parts.join(' — ') || 'Error de Supabase');
  }
  return error instanceof Error ? error : new Error('Error de Supabase');
}

export async function obtenerAgentes(params?: {
  busqueda?: string;
  signal?: AbortSignal;
}): Promise<AgenteComercial[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];

  let query = sb
    .from('agentes_comerciales')
    .select(AGENTE_COLUMNS)
    .order('nombre');

  if (params?.busqueda?.trim()) {
    const q = params.busqueda.trim();
    query = query.or(`nombre.ilike.%${q}%,correo.ilike.%${q}%,telefono.ilike.%${q}%`);
  }
  if (params?.signal) query = query.abortSignal(params.signal);

  const { data, error } = await query;
  if (error) throw errorSupabase(error);
  return (data ?? []) as AgenteComercial[];
}

export async function crearAgente(datos: NuevoAgenteInput): Promise<AgenteComercial> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado');
  }
  if (!datos.nombre.trim()) {
    throw new Error('El nombre del agente es obligatorio');
  }

  const sb = getSupabase();
  const { data, error } = await sb
    .from('agentes_comerciales')
    .insert({
      nombre: datos.nombre.trim(),
      correo: datos.correo?.trim() || null,
      telefono: datos.telefono?.trim() || null,
      porcentaje_comision: Number(datos.porcentaje_comision ?? 0),
      perfil_id: datos.perfil_id ?? null,
      activo: datos.activo ?? true,
    })
    .select(AGENTE_COLUMNS)
    .single();

  if (error) throw errorSupabase(error);
  return data as AgenteComercial;
}

export async function actualizarAgente(
  id: string,
  datos: Partial<NuevoAgenteInput>
): Promise<AgenteComercial> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado');
  }

  const sb = getSupabase();
  const patch: Record<string, unknown> = {};
  if (datos.nombre !== undefined) patch.nombre = datos.nombre.trim();
  if (datos.correo !== undefined) patch.correo = datos.correo?.trim() || null;
  if (datos.telefono !== undefined) patch.telefono = datos.telefono?.trim() || null;
  if (datos.porcentaje_comision !== undefined) {
    patch.porcentaje_comision = Number(datos.porcentaje_comision);
  }
  if (datos.perfil_id !== undefined) patch.perfil_id = datos.perfil_id;
  if (datos.activo !== undefined) patch.activo = datos.activo;

  const { data, error } = await sb
    .from('agentes_comerciales')
    .update(patch)
    .eq('id', id)
    .select(AGENTE_COLUMNS)
    .single();

  if (error) throw errorSupabase(error);
  return data as AgenteComercial;
}

export async function alternarActivoAgente(id: string, activo: boolean): Promise<void> {
  await actualizarAgente(id, { activo });
}

export async function eliminarAgente(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado');
  }
  const sb = getSupabase();
  const { error } = await sb.from('agentes_comerciales').delete().eq('id', id);
  if (error) throw errorSupabase(error);
}
