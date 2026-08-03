import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';

export type GrupoCliente = {
  id: string;
  codigo: string;
  nombre: string;
  porcentaje_descuento: number;
  descripcion: string | null;
  activo: boolean;
  clientes_count?: number;
};

export type NuevoGrupoInput = {
  nombre: string;
  porcentaje_descuento?: number;
  descripcion?: string | null;
};

const COLUMNS = 'id, codigo, nombre, porcentaje_descuento, descripcion, activo' as const;

export async function obtenerGrupos(signal?: AbortSignal): Promise<GrupoCliente[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];

  let query = sb
    .from('grupos_clientes')
    .select(COLUMNS)
    .eq('activo', true)
    .order('nombre');
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw error;

  const grupos = (data ?? []) as GrupoCliente[];
  if (grupos.length === 0) return [];

  const { data: counts, error: countErr } = await sb
    .from('clientes')
    .select('grupo_id')
    .eq('activo', true)
    .not('grupo_id', 'is', null);
  if (countErr) throw countErr;

  const tally = new Map<string, number>();
  for (const row of counts ?? []) {
    const gid = (row as { grupo_id: string }).grupo_id;
    if (gid) tally.set(gid, (tally.get(gid) ?? 0) + 1);
  }

  return grupos.map((g) => ({
    ...g,
    porcentaje_descuento: Number(g.porcentaje_descuento ?? 0),
    clientes_count: tally.get(g.id) ?? 0,
  }));
}

export async function crearGrupo(datos: NuevoGrupoInput): Promise<GrupoCliente> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  if (!datos.nombre.trim()) throw new Error('El nombre del grupo es obligatorio');

  const sb = getSupabase();
  const codigo = `GRP-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await sb
    .from('grupos_clientes')
    .insert({
      codigo,
      nombre: datos.nombre.trim(),
      porcentaje_descuento: Number(datos.porcentaje_descuento ?? 0),
      descripcion: datos.descripcion?.trim() || null,
      activo: true,
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return {
    ...(data as GrupoCliente),
    porcentaje_descuento: Number((data as GrupoCliente).porcentaje_descuento ?? 0),
    clientes_count: 0,
  };
}

export async function actualizarGrupo(
  id: string,
  datos: Partial<NuevoGrupoInput> & { activo?: boolean }
): Promise<GrupoCliente> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  const sb = getSupabase();
  const patch: Record<string, unknown> = {};
  if (datos.nombre !== undefined) patch.nombre = datos.nombre.trim();
  if (datos.porcentaje_descuento !== undefined) {
    patch.porcentaje_descuento = Number(datos.porcentaje_descuento);
  }
  if (datos.descripcion !== undefined) patch.descripcion = datos.descripcion?.trim() || null;
  if (datos.activo !== undefined) patch.activo = datos.activo;

  const { data, error } = await sb
    .from('grupos_clientes')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return {
    ...(data as GrupoCliente),
    porcentaje_descuento: Number((data as GrupoCliente).porcentaje_descuento ?? 0),
  };
}

export async function eliminarGrupo(id: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  const sb = getSupabase();
  const { error } = await sb.from('grupos_clientes').update({ activo: false }).eq('id', id);
  if (error) throw error;
}
