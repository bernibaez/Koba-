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
    if (
      e.code === '42P01' ||
      e.code === 'PGRST205' ||
      e.message?.includes('42P01') ||
      e.message?.includes('Could not find the table') ||
      (e.message?.includes('roles') && e.message?.includes('does not exist'))
    ) {
      return new Error(
        'La tabla "roles" no existe en Supabase. Ejecuta supabase/migrations/008_crear_tabla_roles.sql en el SQL Editor.'
      );
    }
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    return new Error(parts.join(' — ') || 'Error de Supabase');
  }
  return error instanceof Error ? error : new Error('Error de Supabase');
}

export function isMissingRolesTableError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    return error.message.includes('tabla "roles" no existe') || error.message.includes('relation "roles" does not exist') || error.message.includes('42P01');
  }
  if (typeof error === 'object') {
    const e = error as { code?: string; message?: string };
    return (
      e.code === '42P01' ||
      e.code === 'PGRST205' ||
      !!e.message?.includes('42P01') ||
      (!!e.message?.includes('roles') && (!!e.message?.includes('does not exist') || !!e.message?.includes('no existe')))
    );
  }
  return false;
}

const LOCAL_ROLES_KEY = 'mercato_local_roles';
const ROLE_CODES = ['admin', 'cajero', 'vendedor', 'almacen', 'contable'] as const;

function getInitialLocalRoles(): Rol[] {
  const matrix = buildDefaultMatrix();
  return ROLE_CODES.map((codigo, idx) => {
    const nombre = ROL_DB_A_UI[codigo];
    return {
      id: `local-role-${idx + 1}`,
      codigo,
      nombre,
      descripcion:
        codigo === 'admin'
          ? 'Acceso total al sistema y configuración'
          : codigo === 'cajero'
            ? 'Acceso exclusivo al Punto de Venta (POS) y Cierre de Caja'
            : codigo === 'vendedor'
              ? 'Ventas, clientes y cuentas por cobrar'
              : codigo === 'almacen'
                ? 'Inventario, compras y transferencias'
                : 'Finanzas, informes y auditoría',
      permisos: matrix[nombre] ?? {},
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
  });
}

export function getLocalRoles(busqueda = ''): Rol[] {
  try {
    const raw = localStorage.getItem(LOCAL_ROLES_KEY);
    let roles: Rol[] = raw ? JSON.parse(raw) : [];
    if (!roles || roles.length === 0) {
      roles = getInitialLocalRoles();
      localStorage.setItem(LOCAL_ROLES_KEY, JSON.stringify(roles));
    }
    if (!busqueda.trim()) return roles;
    const q = busqueda.trim().toLowerCase();
    return roles.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(q))
    );
  } catch {
    return getInitialLocalRoles();
  }
}

function saveLocalRoles(roles: Rol[]): void {
  localStorage.setItem(LOCAL_ROLES_KEY, JSON.stringify(roles));
}

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
    return getLocalRoles(params?.busqueda);
  }

  try {
    let query = sb.from('roles').select(ROL_COLUMNS).order('nombre');

    if (params?.busqueda?.trim()) {
      const q = params.busqueda.trim();
      query = query.or(`nombre.ilike.%${q}%,codigo.ilike.%${q}%,descripcion.ilike.%${q}%`);
    }
    if (params?.signal) query = query.abortSignal(params.signal);

    const { data, error } = await query;
    if (error) {
      if (isMissingRolesTableError(error)) {
        return getLocalRoles(params?.busqueda);
      }
      throw errorSupabase(error);
    }
    return (data ?? []) as Rol[];
  } catch (e) {
    if (isMissingRolesTableError(e)) {
      return getLocalRoles(params?.busqueda);
    }
    throw e;
  }
}

export async function crearRol(datos: Omit<Rol, 'id' | 'creado_en' | 'actualizado_en'>): Promise<Rol> {
  const sb = tryGetSupabase();
  if (!sb) {
    const roles = getLocalRoles();
    const nuevo: Rol = {
      id: `local-role-${Date.now()}`,
      codigo: datos.codigo.trim().toLowerCase(),
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      permisos: datos.permisos || {},
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
    saveLocalRoles([...roles, nuevo]);
    return nuevo;
  }

  try {
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

    if (error) {
      if (isMissingRolesTableError(error)) {
        const roles = getLocalRoles();
        const nuevo: Rol = {
          id: `local-role-${Date.now()}`,
          codigo: datos.codigo.trim().toLowerCase(),
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion?.trim() || null,
          permisos: datos.permisos || {},
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString(),
        };
        saveLocalRoles([...roles, nuevo]);
        return nuevo;
      }
      throw errorSupabase(error);
    }
    return data as Rol;
  } catch (e) {
    if (isMissingRolesTableError(e)) {
      const roles = getLocalRoles();
      const nuevo: Rol = {
        id: `local-role-${Date.now()}`,
        codigo: datos.codigo.trim().toLowerCase(),
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion?.trim() || null,
        permisos: datos.permisos || {},
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      };
      saveLocalRoles([...roles, nuevo]);
      return nuevo;
    }
    throw e;
  }
}

export async function actualizarRol(
  id: string,
  datos: Partial<Omit<Rol, 'id' | 'creado_en' | 'actualizado_en'>>
): Promise<Rol> {
  const sb = tryGetSupabase();
  if (!sb) {
    const roles = getLocalRoles();
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Rol no encontrado');
    const act: Rol = {
      ...roles[idx],
      ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
      ...(datos.codigo !== undefined && { codigo: datos.codigo.trim().toLowerCase() }),
      ...(datos.descripcion !== undefined && { descripcion: datos.descripcion?.trim() || null }),
      ...(datos.permisos !== undefined && { permisos: datos.permisos }),
      actualizado_en: new Date().toISOString(),
    };
    roles[idx] = act;
    saveLocalRoles(roles);
    return act;
  }

  try {
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

    if (error) {
      if (isMissingRolesTableError(error)) {
        const roles = getLocalRoles();
        const idx = roles.findIndex((r) => r.id === id);
        if (idx !== -1) {
          const act: Rol = {
            ...roles[idx],
            ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
            ...(datos.codigo !== undefined && { codigo: datos.codigo.trim().toLowerCase() }),
            ...(datos.descripcion !== undefined && { descripcion: datos.descripcion?.trim() || null }),
            ...(datos.permisos !== undefined && { permisos: datos.permisos }),
            actualizado_en: new Date().toISOString(),
          };
          roles[idx] = act;
          saveLocalRoles(roles);
          return act;
        }
      }
      throw errorSupabase(error);
    }
    return data as Rol;
  } catch (e) {
    if (isMissingRolesTableError(e)) {
      const roles = getLocalRoles();
      const idx = roles.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const act: Rol = {
          ...roles[idx],
          ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
          ...(datos.codigo !== undefined && { codigo: datos.codigo.trim().toLowerCase() }),
          ...(datos.descripcion !== undefined && { descripcion: datos.descripcion?.trim() || null }),
          ...(datos.permisos !== undefined && { permisos: datos.permisos }),
          actualizado_en: new Date().toISOString(),
        };
        roles[idx] = act;
        saveLocalRoles(roles);
        return act;
      }
    }
    throw e;
  }
}

export async function eliminarRol(id: string): Promise<void> {
  const sb = tryGetSupabase();
  if (!sb) {
    const roles = getLocalRoles().filter((r) => r.id !== id);
    saveLocalRoles(roles);
    return;
  }

  try {
    const { error } = await sb.from('roles').delete().eq('id', id);
    if (error) {
      if (isMissingRolesTableError(error)) {
        const roles = getLocalRoles().filter((r) => r.id !== id);
        saveLocalRoles(roles);
        return;
      }
      throw errorSupabase(error);
    }
  } catch (e) {
    if (isMissingRolesTableError(e)) {
      const roles = getLocalRoles().filter((r) => r.id !== id);
      saveLocalRoles(roles);
      return;
    }
    throw e;
  }
}

/** Si la tabla existe y está vacía, inserta roles iniciales (solo en DB, no en local). */
export async function sincronizarRolesPorDefecto(): Promise<void> {
  const sb = tryGetSupabase();
  if (!sb) return;

  try {
    const { data, error } = await sb.from('roles').select('id').limit(1);
    if (error) {
      if (isMissingRolesTableError(error)) return;
      throw errorSupabase(error);
    }
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
              ? 'Acceso exclusivo al Punto de Venta (POS) y Cierre de Caja'
              : codigo === 'vendedor'
                ? 'Ventas, clientes y cuentas por cobrar'
                : codigo === 'almacen'
                  ? 'Inventario, compras y transferencias'
                  : 'Finanzas, informes y auditoría',
        permisos: matrix[ui] ?? {},
      };
    });

    const { error: insErr } = await sb.from('roles').insert(rows);
    if (insErr && !isMissingRolesTableError(insErr)) throw errorSupabase(insErr);
  } catch (e) {
    if (isMissingRolesTableError(e)) return;
    throw e;
  }
}

/** Matriz desde filas reales de Supabase o fallback local. */
export async function obtenerMatrizPermisos(): Promise<PermissionsMatrix> {
  try {
    await sincronizarRolesPorDefecto();
    const roles = await obtenerRoles();
    const matrix = emptyPermissionsMatrix();

    for (const rol of roles) {
      const ui = ROL_DB_A_UI[rol.codigo as keyof typeof ROL_DB_A_UI] || rol.nombre;
      if (!ui) continue;
      if (ui === 'Administrador') {
        continue;
      }
      matrix[ui as UserRole] = mergeRolePermisos(matrix[ui as UserRole] ?? {}, rol.permisos as RolePermissionMap);
    }
    return matrix;
  } catch (e) {
    if (isMissingRolesTableError(e)) {
      return buildDefaultMatrix();
    }
    throw e;
  }
}

/** Persiste cada rol de la matriz en Supabase o fallback local. */
export async function guardarMatrizPermisos(matrix: PermissionsMatrix): Promise<void> {
  const sb = tryGetSupabase();
  if (!sb) {
    return;
  }

  try {
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
        if (error && !isMissingRolesTableError(error)) throw errorSupabase(error);
      } else {
        const { error } = await sb.from('roles').insert({
          codigo,
          nombre: uiRole,
          descripcion: null,
          permisos,
        });
        if (error && !isMissingRolesTableError(error)) throw errorSupabase(error);
      }
    }
  } catch (e) {
    if (isMissingRolesTableError(e)) return;
    throw e;
  }
}
