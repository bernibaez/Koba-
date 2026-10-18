import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { PERFIL_COLUMNS, type Perfil, type RolDb } from '@/types/database';
import { AUTH_ACCOUNTS, type UserRole } from '@/lib/auth';
import { ROL_DB_A_UI } from './auth.service';
import { verificarLimiteUsuarios } from './subscriptionModules.service';

export type CrearUsuarioPayload = {
  correo: string;
  password: string;
  nombre_completo: string;
  rol: RolDb;
  sucursal_id?: string | null;
  telefono?: string | null;
  codigo_acceso?: string | null;
  empresa_id?: string | null;
  es_superadmin?: boolean;
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
    empresa_id: a.empresaId ?? 'a0000000-0000-0000-0000-000000000001',
    es_superadmin: Boolean(a.isSuperAdmin),
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

/** Alta de usuario vía RPC (inserta auth.users + perfiles con su empresa). */
export async function crearUsuario(payload: CrearUsuarioPayload): Promise<string> {
  // Validar cuota de usuarios activos permitidos por la suscripción
  if (!payload.es_superadmin) {
    const checkLimites = await verificarLimiteUsuarios(payload.empresa_id);
    if (!checkLimites.permitido) {
      throw new Error(
        checkLimites.mensaje || 'Has alcanzado el límite de usuarios permitidos para este negocio.'
      );
    }
  }

  const sb = tryGetSupabase();
  if (sb) {
    let res = await sb.rpc('crear_usuario_sistema', {
      p_correo: payload.correo.trim().toLowerCase(),
      p_password: payload.password,
      p_nombre_completo: payload.nombre_completo.trim(),
      p_rol: payload.rol,
      p_sucursal_id: payload.sucursal_id ?? null,
      p_telefono: payload.telefono ?? null,
      p_codigo_acceso: payload.codigo_acceso ?? null,
      p_empresa_id: payload.empresa_id ?? null,
    });

    // Si falló por falta de soporte de p_empresa_id en la versión actual del RPC en la BD
    if (res.error && (res.error.message?.includes('p_empresa_id') || res.error.code === 'PGRST202')) {
      res = await sb.rpc('crear_usuario_sistema', {
        p_correo: payload.correo.trim().toLowerCase(),
        p_password: payload.password,
        p_nombre_completo: payload.nombre_completo.trim(),
        p_rol: payload.rol,
        p_sucursal_id: payload.sucursal_id ?? null,
        p_telefono: payload.telefono ?? null,
        p_codigo_acceso: payload.codigo_acceso ?? null,
      });

      if (!res.error && res.data && payload.empresa_id) {
        await sb.from('perfiles').update({ empresa_id: payload.empresa_id }).eq('id', res.data as string);
      }
    }

    if (res.error) {
      console.error('[crearUsuario] Error en Supabase RPC:', res.error);
      throw new Error(res.error.message || 'Error al crear usuario en la base de datos');
    }

    const newId = res.data as string;
    if (payload.es_superadmin && newId) {
      await sb.from('perfiles').update({ es_superadmin: true }).eq('id', newId);
    }
    return newId;
  }

  // Fallback para modo local / demo
  const mockId = `usr-${Date.now()}`;
  AUTH_ACCOUNTS.push({
    id: mockId,
    username: payload.correo.split('@')[0],
    name: payload.nombre_completo,
    email: payload.correo,
    password: payload.password,
    role: (ROL_DB_A_UI[payload.rol] as UserRole) || 'Cajero',
    status: 'active',
    phone: payload.telefono ?? '',
    initials: payload.nombre_completo.slice(0, 2).toUpperCase(),
    sucursalId: payload.sucursal_id ?? null,
    rolDb: payload.rol,
    empresaId: payload.empresa_id ?? 'a0000000-0000-0000-0000-000000000001',
    isSuperAdmin: Boolean(payload.es_superadmin),
  });
  return mockId;
}

export async function actualizarPerfil(
  id: string,
  datos: Partial<Pick<Perfil, 'nombre_completo' | 'telefono' | 'rol' | 'sucursal_id' | 'activo' | 'codigo_acceso' | 'empresa_id' | 'es_superadmin'>>
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

/** Soft-delete: desactiva el usuario (no borra auth.users). */
export async function eliminarUsuario(id: string): Promise<void> {
  await actualizarPerfil(id, { activo: false });
}

/** Cambiar o restablecer la contraseña de un usuario */
export async function cambiarPasswordUsuario(
  correo: string,
  nuevaPassword: string,
  nombreCompleto?: string,
  rol?: RolDb
): Promise<void> {
  const sb = tryGetSupabase();
  if (sb) {
    let res = await sb.rpc('cambiar_password_usuario', {
      p_correo: correo.trim().toLowerCase(),
      p_password: nuevaPassword,
    });

    if (res.error) {
      res = await sb.rpc('crear_usuario_sistema', {
        p_correo: correo.trim().toLowerCase(),
        p_password: nuevaPassword,
        p_nombre_completo: nombreCompleto || correo.split('@')[0],
        p_rol: rol || 'admin',
      });
    }

    if (res.error) {
      console.error('[cambiarPasswordUsuario] Error:', res.error);
      throw new Error(res.error.message || 'No se pudo actualizar la contraseña');
    }
    return;
  }

  const acc = AUTH_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === correo.trim().toLowerCase()
  );
  if (acc) {
    acc.password = nuevaPassword;
  }
}
