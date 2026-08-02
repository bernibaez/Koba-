import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { ROL_COLUMNS, type Rol } from '@/types/database';

function errorSupabase(error: unknown): Error {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; details?: string; hint?: string };
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    return new Error(parts.join(' — ') || 'Error de Supabase');
  }
  return error instanceof Error ? error : new Error('Error de Supabase');
}

const LOCAL_ROLES_KEY = 'market_erp_local_roles';

const MOCK_DEFAULT_ROLES: Rol[] = [
  {
    id: '1',
    codigo: 'admin',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema y configuración',
    permisos: {},
  },
  {
    id: '2',
    codigo: 'cajero',
    nombre: 'Cajero',
    descripcion: 'POS, ventas rápidas y cierre de caja',
    permisos: {},
  },
  {
    id: '3',
    codigo: 'vendedor',
    nombre: 'Vendedor',
    descripcion: 'Ventas, clientes y cuentas por cobrar',
    permisos: {},
  },
  {
    id: '4',
    codigo: 'almacen',
    nombre: 'Almacenista',
    descripcion: 'Inventario, compras y transferencias',
    permisos: {},
  },
  {
    id: '5',
    codigo: 'contable',
    nombre: 'Contador / Finanzas',
    descripcion: 'Finanzas, informes y auditoría',
    permisos: {},
  },
];

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
