import type { UserRole } from '@/types/roles';
import {
  buildDefaultMatrix,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionsMatrix,
  type RolePermissionMap,
} from './permissionsCatalog';
import { isSupabaseConfigured } from '@/services/clienteSupabase';
import {
  emptyPermissionsMatrix,
  guardarMatrizPermisos,
  obtenerMatrizPermisos,
} from '@/services/roles.service';

/** Caché en memoria para lecturas síncronas (menú / rutas). */
let cachedMatrix: PermissionsMatrix | null = null;
let loadPromise: Promise<PermissionsMatrix> | null = null;
let lastError: string | null = null;

export function getPermissionsLoadError(): string | null {
  return lastError;
}

/** Lectura síncrona: solo caché en memoria (sin localStorage simulado). */
export function getPermissionsMatrix(): PermissionsMatrix {
  if (cachedMatrix) return cachedMatrix;
  // Sin caché aún: matriz vacía (admin total). Se hidrata con loadPermissionsMatrix.
  return emptyPermissionsMatrix();
}

/** Carga matriz desde Supabase. Obligatoria con env configurado. */
export async function loadPermissionsMatrix(force = false): Promise<PermissionsMatrix> {
  if (!force && cachedMatrix) return cachedMatrix;
  if (!force && loadPromise) return loadPromise;

  loadPromise = (async () => {
    lastError = null;
    if (!isSupabaseConfigured()) {
      lastError = 'Supabase no configurado';
      cachedMatrix = emptyPermissionsMatrix();
      return cachedMatrix;
    }
    try {
      const remote = await obtenerMatrizPermisos();
      cachedMatrix = remote;
      return remote;
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Error al cargar permisos';
      console.warn('[permisos]', lastError);
      // No relanzar: el login/app deben seguir; Permisos mostrará el error.
      cachedMatrix = emptyPermissionsMatrix();
      return cachedMatrix;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export async function savePermissionsMatrix(matrix: PermissionsMatrix): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado');
  }
  await guardarMatrizPermisos(matrix);
  cachedMatrix = matrix;
  lastError = null;
}

export async function resetPermissionsMatrix(): Promise<PermissionsMatrix> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado');
  }
  const defaults = buildDefaultMatrix();
  await guardarMatrizPermisos(defaults);
  cachedMatrix = defaults;
  return defaults;
}

export function countEnabled(map: RolePermissionMap): number {
  let n = 0;
  for (const mod of Object.values(map)) {
    for (const v of Object.values(mod)) {
      if (v) n += 1;
    }
  }
  return n;
}

export function countModuleEnabled(map: RolePermissionMap, moduleId: string): number {
  const mod = map[moduleId] ?? {};
  return Object.values(mod).filter(Boolean).length;
}

export function hasPermission(
  role: UserRole,
  moduleId: string,
  action: PermissionAction = 'ver'
): boolean {
  if (role === 'Administrador') return true;
  const matrix = getPermissionsMatrix();
  return !!matrix[role]?.[moduleId]?.[action];
}

export function routesFromPermissions(role: UserRole): string[] | '*' {
  if (role === 'Administrador') return '*';
  const matrix = getPermissionsMatrix();
  const routes: string[] = [];
  for (const mod of PERMISSION_MODULES) {
    if (mod.href && matrix[role]?.[mod.id]?.ver) {
      routes.push(mod.href);
    }
  }
  if (!routes.includes('/settings') && matrix[role]?.configuracion?.ver) {
    routes.push('/settings');
  }
  return routes;
}

export function clearPermissionsCache(): void {
  cachedMatrix = null;
  loadPromise = null;
  lastError = null;
}
