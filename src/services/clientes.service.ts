import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { CLIENTE_COLUMNS, type Cliente } from '@/types/database';
import { getPosCustomers, addPosCustomer } from '@/lib/posCustomers';

export async function obtenerClientes(params: {
  busqueda?: string;
  pagina?: number;
  limite?: number;
  signal?: AbortSignal;
}): Promise<{ datos: Cliente[]; total: number }> {
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 20;
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  const sb = tryGetSupabase();
  if (!sb) {
    let list = getPosCustomers().map(
      (c, i): Cliente => ({
        id: String(c.id ?? `local-${i}`),
        codigo: `CLI-${String(i + 1).padStart(3, '0')}`,
        nombre: c.name,
        rnc_cedula: null,
        telefono: c.phone ?? null,
        correo: null,
        direccion: null,
        tipo_cliente: c.credit ? 'credito' : 'final',
        limite_credito: c.credit ?? 0,
        balance_actual: 0,
        activo: true,
      })
    );
    if (params.busqueda?.trim()) {
      const q = params.busqueda.trim().toLowerCase();
      list = list.filter(
        (c) => c.nombre.toLowerCase().includes(q) || (c.telefono ?? '').includes(q)
      );
    }
    return { datos: list.slice(desde, hasta + 1), total: list.length };
  }

  let query = sb
    .from('clientes')
    .select(CLIENTE_COLUMNS, { count: 'exact' })
    .eq('activo', true)
    .order('nombre')
    .range(desde, hasta);

  if (params.busqueda?.trim()) {
    const q = params.busqueda.trim();
    query = query.or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,codigo.ilike.%${q}%`);
  }
  if (params.signal) query = query.abortSignal(params.signal);

  const { data, error, count } = await query;
  if (error) throw error;
  return { datos: (data ?? []) as Cliente[], total: count ?? 0 };
}

export async function crearCliente(datos: {
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  rnc_cedula?: string;
  tipo_cliente?: Cliente['tipo_cliente'];
  limite_credito?: number;
}): Promise<Cliente> {
  if (!isSupabaseConfigured()) {
    const added = addPosCustomer({
      name: datos.nombre,
      phone: datos.telefono ?? '',
      credit: datos.limite_credito ?? 0,
    });
    return {
      id: String(added.id),
      codigo: `CLI-${added.id}`,
      nombre: added.name,
      rnc_cedula: datos.rnc_cedula ?? null,
      telefono: added.phone,
      correo: datos.correo ?? null,
      direccion: datos.direccion ?? null,
      tipo_cliente: datos.tipo_cliente ?? 'final',
      limite_credito: added.credit ?? 0,
      balance_actual: 0,
      activo: true,
    };
  }

  const sb = getSupabase();
  const codigo = `CLI-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await sb
    .from('clientes')
    .insert({
      codigo,
      nombre: datos.nombre,
      telefono: datos.telefono ?? null,
      correo: datos.correo ?? null,
      direccion: datos.direccion ?? null,
      rnc_cedula: datos.rnc_cedula ?? null,
      tipo_cliente: datos.tipo_cliente ?? 'final',
      limite_credito: datos.limite_credito ?? 0,
      balance_actual: 0,
      activo: true,
    })
    .select(CLIENTE_COLUMNS)
    .single();
  if (error) throw error;
  return data as Cliente;
}
