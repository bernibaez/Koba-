import { tryGetSupabase } from './clienteSupabase';
import {
  PERFIL_COLUMNS,
  type Perfil,
  type RolDb,
} from '@/types/database';
import type { AuthUser, UserRole } from '@/lib/auth';
import {
  authenticate as localAuthenticate,
  authenticateByCode as localAuthenticateByCode,
} from '@/lib/auth';

export const ROL_DB_A_UI: Record<RolDb, UserRole> = {
  admin: 'Administrador',
  super_admin: 'Administrador',
  cajero: 'Cajero',
  vendedor: 'Vendedor',
  almacen: 'Almacenista',
  contable: 'Contador',
};

export const ROL_UI_A_DB: Record<UserRole, RolDb> = {
  Administrador: 'admin',
  Cajero: 'cajero',
  Vendedor: 'vendedor',
  Almacenista: 'almacen',
  Contador: 'contable',
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function perfilToAuthUser(perfil: Perfil): AuthUser {
  return {
    id: perfil.id,
    username: perfil.correo.split('@')[0],
    name: perfil.nombre_completo,
    email: perfil.correo,
    role: ROL_DB_A_UI[perfil.rol] ?? 'Cajero',
    status: perfil.activo ? 'active' : 'inactive',
    phone: perfil.telefono ?? '',
    initials: initialsFromName(perfil.nombre_completo),
    sucursalId: perfil.sucursal_id,
    rolDb: perfil.rol,
    empresaId: perfil.empresa_id,
    empresaPlan: perfil.empresa?.plan ?? 'pro',
    isSuperAdmin: Boolean(perfil.es_superadmin || perfil.rol === 'super_admin'),
  };
}

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string };

async function cargarPerfil(userId: string): Promise<Perfil | null> {
  const sb = tryGetSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('perfiles')
      .select(`
        ${PERFIL_COLUMNS},
        empresa:empresas(*)
      `)
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as unknown as Perfil;
    }
  } catch {
    // Si la relación anidada falla, fallback a consulta simple
  }

  const { data, error } = await sb
    .from('perfiles')
    .select(PERFIL_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Perfil | null;
}

/** Login email/password vía Supabase Auth, o fallback local si no hay env. */
export async function iniciarSesion(
  usuarioOEmail: string,
  password: string
): Promise<AuthResult> {
  const sb = tryGetSupabase();
  if (!sb) {
    return localAuthenticate(usuarioOEmail, password);
  }

  const input = usuarioOEmail.trim();
  let email = input.toLowerCase();

  // Si el usuario escribió un username o nombre sin '@', buscar su correo en la tabla perfiles
  if (!email.includes('@')) {
    try {
      const { data: perfilMatch } = await sb
        .from('perfiles')
        .select('correo')
        .or(`correo.ilike.${email}@%,nombre_completo.ilike.%${email}%`)
        .limit(1)
        .maybeSingle();

      if (perfilMatch?.correo) {
        email = perfilMatch.correo.toLowerCase();
      } else {
        email = `${email}@kobcloud.com`;
      }
    } catch {
      email = `${email}@kobcloud.com`;
    }
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    console.error('[iniciarSesion] Error en Supabase Auth:', error);
    let msg = error?.message ?? 'Usuario o contraseña incorrectos';
    if (msg.toLowerCase().includes('invalid login credentials')) {
      msg = 'Credenciales inválidas. Verifica que el correo y la contraseña coincidan exactamente.';
    } else if (msg.toLowerCase().includes('email not confirmed')) {
      msg = 'El correo no está confirmado en Supabase. Puedes autoconfirmarlo en Supabase SQL Editor.';
    }
    return { ok: false, error: msg };
  }

  try {
    const perfil = await cargarPerfil(data.user.id);
    if (!perfil) {
      await sb.auth.signOut();
      return { ok: false, error: 'Perfil de usuario no encontrado' };
    }
    if (!perfil.activo) {
      await sb.auth.signOut();
      return { ok: false, error: 'Esta cuenta está desactivada' };
    }
    return { ok: true, user: perfilToAuthUser(perfil) };
  } catch (e) {
    await sb.auth.signOut();
    return { ok: false, error: e instanceof Error ? e.message : 'Error al cargar perfil' };
  }
}

/** Código de acceso: busca en perfiles.codigo_acceso; fallback local. */
export async function iniciarSesionConCodigo(code: string): Promise<AuthResult> {
  const sb = tryGetSupabase();
  if (!sb) {
    return localAuthenticateByCode(code);
  }

  const { data, error } = await sb
    .from('perfiles')
    .select(PERFIL_COLUMNS)
    .eq('codigo_acceso', code.trim())
    .eq('activo', true)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: 'Código de acceso inválido' };
  }

  // Sin password: no se puede signIn. Mantener sesión solo local si el admin
  // prefiere códigos — para Supabase requerimos email+password.
  // Intentamos sesión anónima no aplica; devolvemos perfil mapeado y
  // el contexto guardará usuario localmente (sin JWT). Mejor: rechazar.
  return {
    ok: false,
    error: 'Con Supabase activo usa email y contraseña. Los códigos se migrarán a perfiles.codigo_acceso.',
  };
}

export async function cerrarSesion(): Promise<void> {
  const sb = tryGetSupabase();
  if (sb) await sb.auth.signOut();
}

export async function obtenerSesionActual(): Promise<AuthUser | null> {
  const sb = tryGetSupabase();
  if (!sb) return null;

  const { data } = await sb.auth.getSession();
  if (!data.session?.user) return null;

  const perfil = await cargarPerfil(data.session.user.id);
  if (!perfil || !perfil.activo) return null;
  return perfilToAuthUser(perfil);
}

export async function obtenerPerfilPorId(id: string): Promise<Perfil | null> {
  return cargarPerfil(id);
}
