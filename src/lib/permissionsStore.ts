import type { UserRole } from '@/types/roles';
import {
  buildDefaultMatrix,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionsMatrix,
  type RolePermissionMap,
} from './permissionsCatalog';

const STORAGE_KEY = 'marketerp_permissions_matrix';

export function getPermissionsMatrix(): PermissionsMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = buildDefaultMatrix();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw) as PermissionsMatrix;
    return mergeWithDefaults(parsed);
  } catch {
    return buildDefaultMatrix();
  }
}

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

export function savePermissionsMatrix(matrix: PermissionsMatrix): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
}

export function resetPermissionsMatrix(): PermissionsMatrix {
  const defaults = buildDefaultMatrix();
  savePermissionsMatrix(defaults);
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

/** Rutas con acceso de lectura según la matriz guardada */
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
