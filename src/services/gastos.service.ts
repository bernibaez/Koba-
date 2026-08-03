import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { GASTO_COLUMNS, type EstadoGasto } from '@/types/database';

export type GastoStatusUi = 'approved' | 'pending' | 'rejected';

export type GastoUi = {
  id: string;
  code: string;
  category: string;
  categoryId: string | null;
  description: string;
  amount: number;
  responsible: string;
  date: string;
  receipt: boolean;
  status: GastoStatusUi;
};

export type CategoriaGastoUi = {
  id: string;
  code: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  activo: boolean;
};

export type NuevoGastoInput = {
  categoria_id: string;
  descripcion: string;
  monto: number;
  tiene_recibo?: boolean;
  estado?: EstadoGasto;
};

export type NuevaCategoriaGastoInput = {
  nombre: string;
  descripcion?: string;
  presupuesto_mensual?: number;
};

const STATUS_UI: Record<EstadoGasto, GastoStatusUi> = {
  aprobado: 'approved',
  pendiente: 'pending',
  rechazado: 'rejected',
};

function errorSupabase(error: unknown): Error {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; code?: string; details?: string };
    if (e.code === 'PGRST205' || e.message?.includes('schema cache')) {
      return new Error(
        'Las tablas de gastos no existen. Ejecuta supabase/migrations/006_tablas_faltantes.sql en el SQL Editor.'
      );
    }
    return new Error([e.message, e.details].filter(Boolean).join(' — ') || 'Error de Supabase');
  }
  return error instanceof Error ? error : new Error('Error de Supabase');
}

async function nextCodigo(tabla: 'gastos' | 'categorias_gasto', prefix: string): Promise<string> {
  const sb = getSupabase();
  const { count } = await sb.from(tabla).select('id', { count: 'exact', head: true });
  const n = (count ?? 0) + 1;
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

export async function obtenerCategoriasGasto(signal?: AbortSignal): Promise<CategoriaGastoUi[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];

  let catQuery = sb
    .from('categorias_gasto')
    .select('id, codigo, nombre, descripcion, presupuesto_mensual, activo')
    .eq('activo', true)
    .order('nombre');
  if (signal) catQuery = catQuery.abortSignal(signal);

  const { data: cats, error } = await catQuery;
  if (error) throw errorSupabase(error);

  const start = new Date();
  start.setDate(1);
  const desde = start.toISOString().slice(0, 10);

  let gasQuery = sb
    .from('gastos')
    .select('categoria_id, monto, estado')
    .eq('estado', 'aprobado')
    .gte('creado_en', `${desde}T00:00:00`);
  if (signal) gasQuery = gasQuery.abortSignal(signal);

  const { data: gastos, error: gErr } = await gasQuery;
  if (gErr) throw errorSupabase(gErr);

  const spentByCat = new Map<string, number>();
  for (const g of gastos ?? []) {
    if (!g.categoria_id) continue;
    spentByCat.set(String(g.categoria_id), (spentByCat.get(String(g.categoria_id)) ?? 0) + Number(g.monto ?? 0));
  }

  return (cats ?? []).map((c) => ({
    id: String(c.id),
    code: String(c.codigo),
    name: String(c.nombre),
    description: String(c.descripcion ?? ''),
    budget: Number(c.presupuesto_mensual ?? 0),
    spent: spentByCat.get(String(c.id)) ?? 0,
    activo: Boolean(c.activo),
  }));
}

export async function obtenerGastos(signal?: AbortSignal): Promise<GastoUi[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];

  let query = sb
    .from('gastos')
    .select(
      `
      ${GASTO_COLUMNS},
      categorias_gasto ( nombre ),
      perfiles ( nombre_completo )
    `
    )
    .order('creado_en', { ascending: false })
    .limit(300);

  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw errorSupabase(error);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const cat = row.categorias_gasto as { nombre?: string } | null;
    const perfil = row.perfiles as { nombre_completo?: string } | null;
    const estado = (row.estado as EstadoGasto) ?? 'pendiente';
    return {
      id: String(row.id),
      code: String(row.codigo),
      category: cat?.nombre ?? 'Sin categoría',
      categoryId: row.categoria_id ? String(row.categoria_id) : null,
      description: String(row.descripcion ?? ''),
      amount: Number(row.monto ?? 0),
      responsible: perfil?.nombre_completo ?? '—',
      date: String(row.creado_en).slice(0, 10),
      receipt: Boolean(row.tiene_recibo),
      status: STATUS_UI[estado] ?? 'pending',
    };
  });
}

export async function crearGasto(input: NuevoGastoInput): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  if (!input.categoria_id) throw new Error('Selecciona una categoría');
  if (!input.descripcion.trim()) throw new Error('La descripción es obligatoria');
  if (!(input.monto > 0)) throw new Error('El monto debe ser mayor a 0');

  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const codigo = await nextCodigo('gastos', 'GAS');

  const { error } = await sb.from('gastos').insert({
    codigo,
    categoria_id: input.categoria_id,
    descripcion: input.descripcion.trim(),
    monto: input.monto,
    responsable_id: user?.id ?? null,
    tiene_recibo: input.tiene_recibo ?? false,
    estado: input.estado ?? 'pendiente',
  });
  if (error) throw errorSupabase(error);
}

export async function actualizarEstadoGasto(id: string, estado: EstadoGasto): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  const sb = getSupabase();
  const { error } = await sb.from('gastos').update({ estado }).eq('id', id);
  if (error) throw errorSupabase(error);
}

export async function actualizarGasto(
  id: string,
  datos: Partial<NuevoGastoInput>
): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  const sb = getSupabase();
  const patch: Record<string, unknown> = {};
  if (datos.categoria_id !== undefined) patch.categoria_id = datos.categoria_id;
  if (datos.descripcion !== undefined) patch.descripcion = datos.descripcion.trim();
  if (datos.monto !== undefined) patch.monto = datos.monto;
  if (datos.tiene_recibo !== undefined) patch.tiene_recibo = datos.tiene_recibo;
  if (datos.estado !== undefined) patch.estado = datos.estado;
  const { error } = await sb.from('gastos').update(patch).eq('id', id);
  if (error) throw errorSupabase(error);
}

export async function eliminarGasto(id: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  const sb = getSupabase();
  const { error } = await sb.from('gastos').delete().eq('id', id);
  if (error) throw errorSupabase(error);
}

export async function crearCategoriaGasto(input: NuevaCategoriaGastoInput): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  if (!input.nombre.trim()) throw new Error('El nombre es obligatorio');

  const sb = getSupabase();
  const codigo = await nextCodigo('categorias_gasto', 'CAT');

  const { error } = await sb.from('categorias_gasto').insert({
    codigo,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    presupuesto_mensual: Number(input.presupuesto_mensual ?? 0),
    activo: true,
  });
  if (error) throw errorSupabase(error);
}

export async function eliminarCategoriaGasto(id: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  const sb = getSupabase();
  const { error } = await sb.from('categorias_gasto').update({ activo: false }).eq('id', id);
  if (error) throw errorSupabase(error);
}
