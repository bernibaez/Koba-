import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { ROL_COLUMNS, type Rol } from '@/types/database';
import type { UserRole } from '@/types/roles';
import {
  buildDefaultMatrix,
  PERMISSION_MODULES,
  type PermissionsMatrix,
  type RolePermissionMap,
} from '@/lib/permissionsCatalog';
import { ROL_DB_A_UI, ROL_UI_A_DB } from './auth.service';

function errorSupabase(error: unknown): Error {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; code?: string; details?: string; hint?: string };
    if (e.code === 'PGRST205' || e.message?.includes('Could not find the table')) {
      return new Error(
        'La tabla "roles" no existe en Supabase. Ejecuta supabase/migrations/008_crear_tabla_roles.sql en el SQL Editor.'
      );
    }
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    return new Error(parts.join(' — ') || 'Error de Supabase');
  }
  return error instanceof Error ? error : new Error('Error de Supabase');
}

const ROLE_CODES = ['admin', 'cajero', 'vendedor', 'almacen', 'contable'] as const;

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }
  return getSupabase();
}

/** Matriz vacía (todo false). Admin queda con acceso total. */
export function emptyPermissionsMatrix(): PermissionsMatrix {
  const emptyRole = (): RolePermissionMap =>
    Object.fromEntries(
      PERMISSION_MODULES.map((m) => [m.id, Object.fromEntries(m.actions.map((a) => [a, false]))])
    );

  const admin = emptyRole();
  for (const m of PERMISSION_MODULES) {
    admin[m.id] = Object.fromEntries(m.actions.map((a) => [a, true]));
  }

  return {
    Administrador: admin,
    Cajero: emptyRole(),
    Vendedor: emptyRole(),
    Almacenista: emptyRole(),
    Contador: emptyRole(),
  };
}

function mergeRolePermisos(base: RolePermissionMap, stored: RolePermissionMap | null | undefined): RolePermissionMap {
  const next: RolePermissionMap = { ...base };
  for (const mod of PERMISSION_MODULES) {
    next[mod.id] = {
      ...base[mod.id],
      ...(stored?.[mod.id] ?? {}),
    };
  }
  return next;
}

export async function obtenerRoles(params?: {
  busqueda?: string;
  signal?: AbortSignal;
}): Promise<Rol[]> {
  const sb = tryGetSupabase();
  if (!sb) {
    throw new Error('Supabase no está configurado.');
  }

  let query = sb.from('roles').select(ROL_COLUMNS).order('nombre');

  if (params?.busqueda?.trim()) {
    const q = params.busqueda.trim();
    query = query.or(`nombre.ilike.%${q}%,codigo.ilike.%${q}%,descripcion.ilike.%${q}%`);
  }
  if (params?.signal) query = query.abortSignal(params.signal);

  const { data, error } = await query;
  if (error) throw errorSupabase(error);
  return (data ?? []) as Rol[];
}

export async function crearRol(datos: Omit<Rol, 'id' | 'creado_en' | 'actualizado_en'>): Promise<Rol> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('roles')
    .insert({
      codigo: datos.codigo.trim().toLowerCase(),
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      permisos: datos.permisos || {},
    })
    .select(ROL_COLUMNS)
    .single();

  if (error) throw errorSupabase(error);
  return data as Rol;
}

export async function actualizarRol(
  id: string,
  datos: Partial<Omit<Rol, 'id' | 'creado_en' | 'actualizado_en'>>
): Promise<Rol> {
  const sb = requireSupabase();
  const patch: Record<string, unknown> = {
    actualizado_en: new Date().toISOString(),
  };
  if (datos.codigo !== undefined) patch.codigo = datos.codigo.trim().toLowerCase();
  if (datos.nombre !== undefined) patch.nombre = datos.nombre.trim();
  if (datos.descripcion !== undefined) patch.descripcion = datos.descripcion?.trim() || null;
  if (datos.permisos !== undefined) patch.permisos = datos.permisos;

  const { data, error } = await sb
    .from('roles')
    .update(patch)
    .eq('id', id)
    .select(ROL_COLUMNS)
    .single();

  if (error) throw errorSupabase(error);
  return data as Rol;
}

export async function eliminarRol(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from('roles').delete().eq('id', id);
  if (error) throw errorSupabase(error);
}

/** Si la tabla existe y está vacía, inserta roles iniciales (solo en DB, no en local). */
export async function sincronizarRolesPorDefecto(): Promise<void> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('roles').select('id').limit(1);
  if (error) throw errorSupabase(error);
  if ((data ?? []).length > 0) return;

  const matrix = buildDefaultMatrix();
  const rows = ROLE_CODES.map((codigo) => {
    const ui = ROL_DB_A_UI[codigo];
    return {
      codigo,
      nombre: ui,
      descripcion:
        codigo === 'admin'
          ? 'Acceso total al sistema y configuración'
          : codigo === 'cajero'
            ? 'POS, ventas rápidas y cierre de caja'
            : codigo === 'vendedor'
              ? 'Ventas, clientes y cuentas por cobrar'
              : codigo === 'almacen'
                ? 'Inventario, compras y transferencias'
                : 'Finanzas, informes y auditoría',
      permisos: matrix[ui] ?? {},
    };
  });

  const { error: insErr } = await sb.from('roles').insert(rows);
  if (insErr) throw errorSupabase(insErr);
}

/** Matriz solo desde filas reales de Supabase (sin datos simulados locales). */
export async function obtenerMatrizPermisos(): Promise<PermissionsMatrix> {
  await sincronizarRolesPorDefecto();
  const roles = await obtenerRoles();
  const matrix = emptyPermissionsMatrix();

  for (const rol of roles) {
    const ui = ROL_DB_A_UI[rol.codigo as keyof typeof ROL_DB_A_UI];
    if (!ui) continue;
    if (ui === 'Administrador') {
      // Admin siempre total
      continue;
    }
    matrix[ui] = mergeRolePermisos(matrix[ui], rol.permisos as RolePermissionMap);
  }
  return matrix;
}

/** Persiste cada rol de la matriz en Supabase. */
export async function guardarMatrizPermisos(matrix: PermissionsMatrix): Promise<void> {
  const sb = requireSupabase();
  const existentes = await obtenerRoles();
  const byCodigo = new Map(existentes.map((r) => [r.codigo, r]));

  const rolesUi = Object.keys(matrix) as UserRole[];
  for (const uiRole of rolesUi) {
    const codigo = ROL_UI_A_DB[uiRole];
    if (!codigo || codigo === 'super_admin') continue;
    const permisos = matrix[uiRole] ?? {};
    const existing = byCodigo.get(codigo);

    if (existing) {
      const { error } = await sb
        .from('roles')
        .update({ permisos, actualizado_en: new Date().toISOString(), nombre: uiRole })
        .eq('id', existing.id);
      if (error) throw errorSupabase(error);
    } else {
      const { error } = await sb.from('roles').insert({
        codigo,
        nombre: uiRole,
        descripcion: null,
        permisos,
      });
      if (error) throw errorSupabase(error);
    }
  }
}
