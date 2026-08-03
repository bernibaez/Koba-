import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';

export type SucursalUi = {
  id: string;
  codigo: string;
  nombre: string;
};

export type TransferenciaUi = {
  id: string;
  codigo: string;
  origen: string;
  destino: string;
  origen_id: string | null;
  destino_id: string | null;
  fecha: string;
  items: number;
  estado: 'pendiente' | 'en_transito' | 'recibida' | 'anulada';
  motivo: string | null;
};

export type NuevaTransferenciaInput = {
  sucursal_origen_id: string;
  sucursal_destino_id: string;
  motivo?: string;
  lineas: { producto_id: string; cantidad: number }[];
};

const ESTADO_UI: Record<string, TransferenciaUi['estado']> = {
  pendiente: 'pendiente',
  en_transito: 'en_transito',
  recibida: 'recibida',
  anulada: 'anulada',
};

export async function obtenerSucursales(signal?: AbortSignal): Promise<SucursalUi[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];

  let query = sb
    .from('sucursales')
    .select('id, codigo, nombre')
    .eq('activo', true)
    .order('nombre');
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SucursalUi[];
}

export async function obtenerTransferencias(signal?: AbortSignal): Promise<TransferenciaUi[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];

  let query = sb
    .from('transferencias_stock')
    .select(
      `
      id, codigo, sucursal_origen_id, sucursal_destino_id, estado, motivo, creado_en,
      origen:sucursales!transferencias_stock_sucursal_origen_id_fkey ( nombre ),
      destino:sucursales!transferencias_stock_sucursal_destino_id_fkey ( nombre ),
      detalle_transferencias ( id, cantidad )
    `
    )
    .order('creado_en', { ascending: false })
    .limit(200);
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) {
    // Fallback sin alias de FK si PostgREST no resuelve el nombre
    let fallback = sb
      .from('transferencias_stock')
      .select('id, codigo, sucursal_origen_id, sucursal_destino_id, estado, motivo, creado_en, detalle_transferencias(id, cantidad)')
      .order('creado_en', { ascending: false })
      .limit(200);
    if (signal) fallback = fallback.abortSignal(signal);
    const res = await fallback;
    if (res.error) throw res.error;

    const sucursales = await obtenerSucursales(signal);
    const byId = new Map(sucursales.map((s) => [s.id, s.nombre]));

    return (res.data ?? []).map((row: Record<string, unknown>) => {
      const detalle = (row.detalle_transferencias as { cantidad?: number }[] | null) ?? [];
      return {
        id: String(row.id),
        codigo: String(row.codigo),
        origen: byId.get(String(row.sucursal_origen_id ?? '')) ?? '—',
        destino: byId.get(String(row.sucursal_destino_id ?? '')) ?? '—',
        origen_id: row.sucursal_origen_id ? String(row.sucursal_origen_id) : null,
        destino_id: row.sucursal_destino_id ? String(row.sucursal_destino_id) : null,
        fecha: String(row.creado_en).slice(0, 10),
        items: detalle.reduce((s, d) => s + Number(d.cantidad ?? 0), 0),
        estado: ESTADO_UI[String(row.estado)] ?? 'pendiente',
        motivo: row.motivo ? String(row.motivo) : null,
      };
    });
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const origen = row.origen as { nombre?: string } | null;
    const destino = row.destino as { nombre?: string } | null;
    const detalle = (row.detalle_transferencias as { cantidad?: number }[] | null) ?? [];
    return {
      id: String(row.id),
      codigo: String(row.codigo),
      origen: origen?.nombre ?? '—',
      destino: destino?.nombre ?? '—',
      origen_id: row.sucursal_origen_id ? String(row.sucursal_origen_id) : null,
      destino_id: row.sucursal_destino_id ? String(row.sucursal_destino_id) : null,
      fecha: String(row.creado_en).slice(0, 10),
      items: detalle.reduce((s, d) => s + Number(d.cantidad ?? 0), 0),
      estado: ESTADO_UI[String(row.estado)] ?? 'pendiente',
      motivo: row.motivo ? String(row.motivo) : null,
    };
  });
}

export async function crearTransferencia(input: NuevaTransferenciaInput): Promise<TransferenciaUi> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  if (!input.sucursal_origen_id || !input.sucursal_destino_id) {
    throw new Error('Selecciona sucursal origen y destino');
  }
  if (input.sucursal_origen_id === input.sucursal_destino_id) {
    throw new Error('Origen y destino deben ser diferentes');
  }
  if (!input.lineas.length) throw new Error('Agrega al menos un producto');

  const sb = getSupabase();
  const codigo = `TRF-${Date.now().toString(36).toUpperCase()}`;

  const { data: tr, error } = await sb
    .from('transferencias_stock')
    .insert({
      codigo,
      sucursal_origen_id: input.sucursal_origen_id,
      sucursal_destino_id: input.sucursal_destino_id,
      motivo: input.motivo?.trim() || null,
      estado: 'pendiente',
    })
    .select('id, codigo, sucursal_origen_id, sucursal_destino_id, estado, motivo, creado_en')
    .single();
  if (error) throw error;

  const { error: detErr } = await sb.from('detalle_transferencias').insert(
    input.lineas.map((l) => ({
      transferencia_id: tr.id,
      producto_id: l.producto_id,
      cantidad: l.cantidad,
      cantidad_recibida: 0,
    }))
  );
  if (detErr) throw detErr;

  const list = await obtenerTransferencias();
  const created = list.find((t) => t.id === tr.id);
  if (created) return created;

  return {
    id: tr.id,
    codigo: tr.codigo,
    origen: '—',
    destino: '—',
    origen_id: tr.sucursal_origen_id,
    destino_id: tr.sucursal_destino_id,
    fecha: String(tr.creado_en).slice(0, 10),
    items: input.lineas.reduce((s, l) => s + l.cantidad, 0),
    estado: 'pendiente',
    motivo: tr.motivo,
  };
}
