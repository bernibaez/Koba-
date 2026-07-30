import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { VENTA_COLUMNS, type MetodoPago, type Venta } from '@/types/database';

export type ItemVentaPayload = {
  producto_id?: string | null;
  combo_id?: string | null;
  tipo_item: 'producto' | 'combo';
  nombre_item: string;
  precio_unitario: number;
  costo_unitario: number;
  cantidad: number;
  porcentaje_impuesto?: number;
  subtotal: number;
};

export type PayloadVenta = {
  numero_factura?: string;
  ncf?: string | null;
  tipo_ncf?: string | null;
  sucursal_id?: string | null;
  cajero_id?: string | null;
  cliente_id?: string | null;
  caja_id?: string | null;
  subtotal: number;
  monto_impuesto: number;
  monto_descuento: number;
  monto_total: number;
  costo_total: number;
  metodo_pago: MetodoPago;
  monto_pagado: number;
  monto_efectivo?: number;
  monto_tarjeta?: number;
  monto_transferencia?: number;
  monto_credito?: number;
  devuelta_entregada?: number;
  items: ItemVentaPayload[];
};

export type ResultadoVenta = {
  venta_id: string;
  numero_factura: string;
  ncf: string | null;
};

const LOCAL_VENTAS_KEY = 'marketerp_ventas_local';

function getLocalVentas(): Venta[] {
  try {
    const raw = localStorage.getItem(LOCAL_VENTAS_KEY);
    return raw ? (JSON.parse(raw) as Venta[]) : [];
  } catch {
    return [];
  }
}

function saveLocalVentas(ventas: Venta[]) {
  localStorage.setItem(LOCAL_VENTAS_KEY, JSON.stringify(ventas));
}

export async function procesarVenta(payload: PayloadVenta): Promise<ResultadoVenta> {
  if (!isSupabaseConfigured()) {
    const id = crypto.randomUUID();
    const numero =
      payload.numero_factura ??
      `FAC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${id.slice(0, 8)}`;
    const venta: Venta = {
      id,
      numero_factura: numero,
      ncf: payload.ncf ?? null,
      tipo_ncf: payload.tipo_ncf ?? null,
      sucursal_id: payload.sucursal_id ?? null,
      cajero_id: payload.cajero_id ?? null,
      cliente_id: payload.cliente_id ?? null,
      caja_id: payload.caja_id ?? null,
      subtotal: payload.subtotal,
      monto_impuesto: payload.monto_impuesto,
      monto_descuento: payload.monto_descuento,
      monto_total: payload.monto_total,
      costo_total: payload.costo_total,
      metodo_pago: payload.metodo_pago,
      monto_pagado: payload.monto_pagado,
      monto_efectivo: payload.monto_efectivo ?? 0,
      monto_tarjeta: payload.monto_tarjeta ?? 0,
      monto_transferencia: payload.monto_transferencia ?? 0,
      monto_credito: payload.monto_credito ?? 0,
      devuelta_entregada: payload.devuelta_entregada ?? 0,
      estado: 'completada',
      creado_en: new Date().toISOString(),
    };
    saveLocalVentas([venta, ...getLocalVentas()]);

    // Descontar stock local
    const { updateProductStockInStore } = await import('@/lib/productStore');
    for (const item of payload.items) {
      if (item.tipo_item === 'producto' && item.producto_id) {
        updateProductStockInStore(item.producto_id, -Math.ceil(item.cantidad));
      }
    }

    return { venta_id: id, numero_factura: numero, ncf: payload.ncf ?? null };
  }

  const sb = getSupabase();
  const { data, error } = await sb.rpc('procesar_venta_pos', { p_payload: payload });
  if (error) throw error;
  return data as ResultadoVenta;
}

export async function obtenerHistorialVentas(params: {
  pagina?: number;
  limite?: number;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
  signal?: AbortSignal;
}): Promise<{ datos: Venta[]; total: number }> {
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 20;
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  const sb = tryGetSupabase();
  if (!sb) {
    let list = getLocalVentas();
    if (params.busqueda?.trim()) {
      const q = params.busqueda.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.numero_factura.toLowerCase().includes(q) ||
          (v.ncf ?? '').toLowerCase().includes(q)
      );
    }
    if (params.fechaInicio) {
      list = list.filter((v) => v.creado_en >= params.fechaInicio!);
    }
    if (params.fechaFin) {
      list = list.filter((v) => v.creado_en <= params.fechaFin! + 'T23:59:59');
    }
    return { datos: list.slice(desde, hasta + 1), total: list.length };
  }

  let query = sb
    .from('ventas')
    .select(VENTA_COLUMNS, { count: 'exact' })
    .order('creado_en', { ascending: false })
    .range(desde, hasta);

  if (params.busqueda?.trim()) {
    const q = params.busqueda.trim();
    query = query.or(`numero_factura.ilike.%${q}%,ncf.ilike.%${q}%`);
  }
  if (params.fechaInicio) query = query.gte('creado_en', params.fechaInicio);
  if (params.fechaFin) query = query.lte('creado_en', params.fechaFin + 'T23:59:59');
  if (params.signal) query = query.abortSignal(params.signal);

  const { data, error, count } = await query;
  if (error) throw error;
  return { datos: (data ?? []) as Venta[], total: count ?? 0 };
}
