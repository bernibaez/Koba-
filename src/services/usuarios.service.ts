import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { PERFIL_COLUMNS, type Perfil, type RolDb } from '@/types/database';
import { AUTH_ACCOUNTS } from '@/lib/auth';
import { ROL_DB_A_UI } from './auth.service';

export type CrearUsuarioPayload = {
  correo: string;
  password: string;
  nombre_completo: string;
  rol: RolDb;
  sucursal_id?: string | null;
  telefono?: string | null;
  codigo_acceso?: string | null;
};

function mockPerfiles(): Perfil[] {
  return AUTH_ACCOUNTS.map((a) => ({
    id: String(a.id),
    nombre_completo: a.name,
    correo: a.email,
    telefono: a.phone,
    rol: (Object.entries(ROL_DB_A_UI).find(([, v]) => v === a.role)?.[0] as RolDb) ?? 'cajero',
    sucursal_id: null,
    codigo_acceso: null,
    activo: a.status === 'active',
  }));
}

export async function obtenerUsuarios(opts?: {
  busqueda?: string;
  signal?: AbortSignal;
}): Promise<Perfil[]> {
  const sb = tryGetSupabase();
  if (!sb) {
    let list = mockPerfiles();
    const q = opts?.busqueda?.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.nombre_completo.toLowerCase().includes(q) || p.correo.toLowerCase().includes(q)
      );
    }
    return list;
  }

  let query = sb.from('perfiles').select(PERFIL_COLUMNS).order('nombre_completo');
  if (opts?.busqueda?.trim()) {
    const q = opts.busqueda.trim();
    query = query.or(`nombre_completo.ilike.%${q}%,correo.ilike.%${q}%`);
  }
  if (opts?.signal) {
    query = query.abortSignal(opts.signal);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Perfil[];
}

/** Alta de usuario vía RPC (inserta auth.users + perfiles). Sin auth.signUp. */
export async function crearUsuario(payload: CrearUsuarioPayload): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Configura Supabase para crear usuarios reales');
  }
  const sb = getSupabase();
  const { data, error } = await sb.rpc('crear_usuario_sistema', {
    p_correo: payload.correo,
    p_password: payload.password,
    p_nombre_completo: payload.nombre_completo,
    p_rol: payload.rol,
    p_sucursal_id: payload.sucursal_id ?? null,
    p_telefono: payload.telefono ?? null,
    p_codigo_acceso: payload.codigo_acceso ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function actualizarPerfil(
  id: string,
  datos: Partial<Pick<Perfil, 'nombre_completo' | 'telefono' | 'rol' | 'sucursal_id' | 'activo' | 'codigo_acceso'>>
): Promise<Perfil> {
  if (!isSupabaseConfigured()) {
    throw new Error('Configura Supabase para actualizar usuarios');
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from('perfiles')
    .update({ ...datos, actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .select(PERFIL_COLUMNS)
    .single();
  if (error) throw error;
  return data as Perfil;
}

export async function alternarActivoUsuario(id: string, activo: boolean): Promise<void> {
  await actualizarPerfil(id, { activo });
}
