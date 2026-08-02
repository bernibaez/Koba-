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
  guardarMatrizPermisos,
  obtenerMatrizPermisos,
  sincronizarRolesPorDefecto,
} from '@/services/roles.service';

const STORAGE_KEY = 'marketerp_permissions_matrix';

/** Caché en memoria para lecturas síncronas (menú / rutas). */
let cachedMatrix: PermissionsMatrix | null = null;
let loadPromise: Promise<PermissionsMatrix> | null = null;

function mergeWithDefaults(stored: PermissionsMatrix): PermissionsMatrix {
  const defaults = buildDefaultMatrix();
  const roles = Object.keys(defaults) as UserRole[];
  const merged = { ...defaults };
  for (const role of roles) {
    merged[role] = { ...defaults[role], ...(stored[role] ?? {}) };
    for (const mod of PERMISSION_MODULES) {
      merged[role][mod.id] = {
        ...defaults[role][mod.id],
        ...(stored[role]?.[mod.id] ?? {}),
      };
    }
  }
  return merged;
}

function readLocalMatrix(): PermissionsMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = buildDefaultMatrix();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return mergeWithDefaults(JSON.parse(raw) as PermissionsMatrix);
  } catch {
    return buildDefaultMatrix();
  }
}

function writeLocalMatrix(matrix: PermissionsMatrix): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
  } catch {
    /* ignore quota */
  }
}

/** Lectura síncrona: usa caché (Supabase) o localStorage. */
export function getPermissionsMatrix(): PermissionsMatrix {
  if (cachedMatrix) return cachedMatrix;
  const local = readLocalMatrix();
  cachedMatrix = local;
  return local;
}

/** Carga matriz desde Supabase (o local si no hay env). Llama al iniciar sesión. */
export async function loadPermissionsMatrix(force = false): Promise<PermissionsMatrix> {
  if (!force && cachedMatrix && isSupabaseConfigured()) {
    return cachedMatrix;
  }
  if (!force && loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!isSupabaseConfigured()) {
      const local = readLocalMatrix();
      cachedMatrix = local;
      return local;
    }
    try {
      await sincronizarRolesPorDefecto();
      const remote = await obtenerMatrizPermisos();
      const merged = mergeWithDefaults(remote);
      cachedMatrix = merged;
      writeLocalMatrix(merged);
      return merged;
    } catch (e) {
      console.warn('[permisos] No se pudo cargar desde Supabase, usando caché local:', e);
      const local = readLocalMatrix();
      cachedMatrix = local;
      return local;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export async function savePermissionsMatrix(matrix: PermissionsMatrix): Promise<void> {
  cachedMatrix = matrix;
  writeLocalMatrix(matrix);

  if (!isSupabaseConfigured()) return;

  await guardarMatrizPermisos(matrix);
}

export async function resetPermissionsMatrix(): Promise<PermissionsMatrix> {
  const defaults = buildDefaultMatrix();
  await savePermissionsMatrix(defaults);
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

/** Rutas con acceso de lectura según la matriz (caché Supabase / local). */
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

/** Invalida caché (tras logout). */
export function clearPermissionsCache(): void {
  cachedMatrix = null;
  loadPromise = null;
}
