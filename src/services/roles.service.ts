import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { ROL_COLUMNS, type Rol } from '@/types/database';
import type { UserRole } from '@/types/roles';
import { buildDefaultMatrix, type PermissionsMatrix, type RolePermissionMap } from '@/lib/permissionsCatalog';
import { ROL_DB_A_UI, ROL_UI_A_DB } from './auth.service';

function errorSupabase(error: unknown): Error {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; details?: string; hint?: string };
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    return new Error(parts.join(' — ') || 'Error de Supabase');
  }
  return error instanceof Error ? error : new Error('Error de Supabase');
}

const LOCAL_ROLES_KEY = 'market_erp_local_roles';

const ROLE_CODES = ['admin', 'cajero', 'vendedor', 'almacen', 'contable'] as const;

function defaultRolesFromMatrix(): Rol[] {
  const matrix = buildDefaultMatrix();
  return ROLE_CODES.map((codigo, i) => {
    const ui = ROL_DB_A_UI[codigo];
    return {
      id: `local-${i + 1}`,
      codigo,
      nombre: ui,
      descripcion: null,
      permisos: (matrix[ui] ?? {}) as RolePermissionMap,
    };
  });
}

const MOCK_DEFAULT_ROLES: Rol[] = defaultRolesFromMatrix();

function getLocalRoles(): Rol[] {
  const data = localStorage.getItem(LOCAL_ROLES_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_ROLES_KEY, JSON.stringify(MOCK_DEFAULT_ROLES));
    return MOCK_DEFAULT_ROLES;
  }
  return JSON.parse(data) as Rol[];
}

function saveLocalRoles(roles: Rol[]) {
  localStorage.setItem(LOCAL_ROLES_KEY, JSON.stringify(roles));
}

export async function obtenerRoles(params?: {
  busqueda?: string;
  signal?: AbortSignal;
}): Promise<Rol[]> {
  const sb = tryGetSupabase();
  if (!sb) {
    let list = getLocalRoles();
    const q = params?.busqueda?.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.nombre.toLowerCase().includes(q) ||
          r.codigo.toLowerCase().includes(q) ||
          (r.descripcion && r.descripcion.toLowerCase().includes(q))
      );
    }
    return list;
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
  if (!isSupabaseConfigured()) {
    const list = getLocalRoles();
    const nuevo: Rol = {
      ...datos,
      id: `local-${Date.now()}`,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
    saveLocalRoles([...list, nuevo]);
    return nuevo;
  }

  const sb = getSupabase();
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
  if (!isSupabaseConfigured()) {
    const list = getLocalRoles();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Rol no encontrado');
    const actualizado = {
      ...list[idx],
      ...datos,
      actualizado_en: new Date().toISOString(),
    };
    list[idx] = actualizado;
    saveLocalRoles(list);
    return actualizado;
  }

  const sb = getSupabase();
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
  if (!isSupabaseConfigured()) {
    const list = getLocalRoles();
    saveLocalRoles(list.filter((r) => r.id !== id));
    return;
  }

  const sb = getSupabase();
  const { error } = await sb.from('roles').delete().eq('id', id);
  if (error) throw errorSupabase(error);
}

/** Si la tabla está vacía, inserta roles con matriz por defecto. */
export async function sincronizarRolesPorDefecto(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabase();
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

/** Convierte filas de `roles` a la matriz UI. */
export async function obtenerMatrizPermisos(): Promise<PermissionsMatrix> {
  const roles = await obtenerRoles();
  const defaults = buildDefaultMatrix();
  const matrix: PermissionsMatrix = { ...defaults };

  for (const rol of roles) {
    const ui = ROL_DB_A_UI[rol.codigo as keyof typeof ROL_DB_A_UI];
    if (!ui) continue;
    matrix[ui] = {
      ...defaults[ui],
      ...(rol.permisos as RolePermissionMap),
    };
  }
  return matrix;
}

/** Persiste cada rol de la matriz en Supabase (upsert por codigo). */
export async function guardarMatrizPermisos(matrix: PermissionsMatrix): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabase();
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
        .update({ permisos, actualizado_en: new Date().toISOString() })
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
