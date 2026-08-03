import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { VENTA_COLUMNS, type MetodoPago, type Venta, type DetalleVenta } from '@/types/database';

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

export interface VentaConDetalle extends Venta {
  cliente_nombre?: string;
  cajero_nombre?: string;
  detalle_ventas?: DetalleVenta[];
}

const LOCAL_VENTAS_KEY = 'marketerp_ventas_local';
const LOCAL_DETALLE_KEY = 'marketerp_detalle_ventas_local';

function getLocalVentas(): VentaConDetalle[] {
  try {
    const raw = localStorage.getItem(LOCAL_VENTAS_KEY);
    return raw ? (JSON.parse(raw) as VentaConDetalle[]) : [];
  } catch {
    return [];
  }
}

function saveLocalVentas(ventas: VentaConDetalle[]) {
  localStorage.setItem(LOCAL_VENTAS_KEY, JSON.stringify(ventas));
}

export async function procesarVenta(payload: PayloadVenta): Promise<ResultadoVenta> {
  if (!isSupabaseConfigured()) {
    const id = crypto.randomUUID();
    const numero =
      payload.numero_factura ??
      `FAC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${id.slice(0, 8)}`;
    
    const items: DetalleVenta[] = payload.items.map((it) => ({
      id: crypto.randomUUID(),
      venta_id: id,
      producto_id: it.producto_id ?? null,
      combo_id: it.combo_id ?? null,
      tipo_item: it.tipo_item,
      nombre_item: it.nombre_item,
      precio_unitario: it.precio_unitario,
      costo_unitario: it.costo_unitario,
      cantidad: it.cantidad,
      porcentaje_impuesto: it.porcentaje_impuesto ?? 18,
      subtotal: it.subtotal,
    }));

    const venta: VentaConDetalle = {
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
      cliente_nombre: 'Cliente General',
      cajero_nombre: 'Cajero',
      detalle_ventas: items,
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
  const resultado = data as ResultadoVenta;

  const credito = Number(payload.monto_credito ?? 0);
  if (credito > 0 || payload.metodo_pago === 'credito') {
    try {
      const { crearCxcDesdeVenta } = await import('./cxc.service');
      await crearCxcDesdeVenta({
        venta_id: resultado.venta_id,
        numero_factura: resultado.numero_factura,
        cliente_id: payload.cliente_id,
        monto_credito: credito > 0 ? credito : payload.monto_total,
      });
    } catch {
      // No bloquear si CxC falla
    }
  }

  return resultado;
}

export async function obtenerHistorialVentas(params: {
  pagina?: number;
  limite?: number;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
  signal?: AbortSignal;
}): Promise<{ datos: VentaConDetalle[]; total: number }> {
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
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
          (v.ncf ?? '').toLowerCase().includes(q) ||
          (v.cliente_nombre ?? '').toLowerCase().includes(q)
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
    .select('*, clientes(nombre), perfiles!cajero_id(nombre_completo)', { count: 'exact' })
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

  const datos: VentaConDetalle[] = (data ?? []).map((row: any) => ({
    id: row.id,
    numero_factura: row.numero_factura,
    ncf: row.ncf,
    tipo_ncf: row.tipo_ncf,
    sucursal_id: row.sucursal_id,
    cajero_id: row.cajero_id,
    cliente_id: row.cliente_id,
    caja_id: row.caja_id,
    subtotal: Number(row.subtotal),
    monto_impuesto: Number(row.monto_impuesto),
    monto_descuento: Number(row.monto_descuento),
    monto_total: Number(row.monto_total),
    costo_total: Number(row.costo_total),
    metodo_pago: row.metodo_pago,
    monto_pagado: Number(row.monto_pagado),
    monto_efectivo: Number(row.monto_efectivo || 0),
    monto_tarjeta: Number(row.monto_tarjeta || 0),
    monto_transferencia: Number(row.monto_transferencia || 0),
    monto_credito: Number(row.monto_credito || 0),
    devuelta_entregada: Number(row.devuelta_entregada || 0),
    estado: row.estado,
    creado_en: row.creado_en,
    cliente_nombre: row.clientes?.nombre ?? 'Cliente general',
    cajero_nombre: row.perfiles?.nombre_completo ?? 'Cajero',
  }));

  return { datos, total: count ?? 0 };
}

export async function obtenerVentaPorNumeroFactura(
  numeroFactura: string
): Promise<VentaConDetalle | null> {
  const codigo = numeroFactura.trim();
  if (!codigo) return null;

  const sb = tryGetSupabase();
  if (!sb) {
    const list = getLocalVentas();
    return list.find((v) => v.numero_factura.toUpperCase() === codigo.toUpperCase()) ?? null;
  }

  const { data: venta, error } = await sb
    .from('ventas')
    .select('id')
    .ilike('numero_factura', codigo)
    .order('creado_en', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!venta?.id) return null;
  return obtenerVentaPorId(String(venta.id));
}

export async function obtenerVentaPorId(ventaId: string): Promise<VentaConDetalle | null> {
  const sb = tryGetSupabase();
  if (!sb) {
    const list = getLocalVentas();
    return list.find((v) => v.id === ventaId) ?? null;
  }

  const { data: venta, error: vErr } = await sb
    .from('ventas')
    .select('*, clientes(nombre, rnc_cedula), perfiles!cajero_id(nombre_completo)')
    .eq('id', ventaId)
    .single();

  if (vErr || !venta) return null;

  const { data: detalle } = await sb
    .from('detalle_ventas')
    .select('*')
    .eq('venta_id', ventaId);

  return {
    id: venta.id,
    numero_factura: venta.numero_factura,
    ncf: venta.ncf,
    tipo_ncf: venta.tipo_ncf,
    sucursal_id: venta.sucursal_id,
    cajero_id: venta.cajero_id,
    cliente_id: venta.cliente_id,
    caja_id: venta.caja_id,
    subtotal: Number(venta.subtotal),
    monto_impuesto: Number(venta.monto_impuesto),
    monto_descuento: Number(venta.monto_descuento),
    monto_total: Number(venta.monto_total),
    costo_total: Number(venta.costo_total),
    metodo_pago: venta.metodo_pago,
    monto_pagado: Number(venta.monto_pagado),
    monto_efectivo: Number(venta.monto_efectivo || 0),
    monto_tarjeta: Number(venta.monto_tarjeta || 0),
    monto_transferencia: Number(venta.monto_transferencia || 0),
    monto_credito: Number(venta.monto_credito || 0),
    devuelta_entregada: Number(venta.devuelta_entregada || 0),
    estado: venta.estado,
    creado_en: venta.creado_en,
    cliente_nombre: venta.clientes?.nombre ?? 'Cliente general',
    cajero_nombre: venta.perfiles?.nombre_completo ?? 'Cajero',
    detalle_ventas: (detalle ?? []).map((d: any) => ({
      id: d.id,
      venta_id: d.venta_id,
      producto_id: d.producto_id,
      combo_id: d.combo_id,
      tipo_item: d.tipo_item,
      nombre_item: d.nombre_item,
      precio_unitario: Number(d.precio_unitario),
      costo_unitario: Number(d.costo_unitario),
      cantidad: Number(d.cantidad),
      porcentaje_impuesto: Number(d.porcentaje_impuesto || 0),
      subtotal: Number(d.subtotal),
    })),
  };
}

export async function anularVenta(ventaId: string, motivo: string = 'Anulación'): Promise<void> {
  const sb = tryGetSupabase();
  if (!sb) {
    const list = getLocalVentas().map((v) =>
      v.id === ventaId ? { ...v, estado: 'anulada' as const } : v
    );
    saveLocalVentas(list);
    return;
  }

  try {
    const { error } = await sb.rpc('anular_venta_pos', {
      p_venta_id: ventaId,
      p_motivo: motivo,
    });
    if (!error) return;
  } catch {
    // Fallback a actualización directa
  }

  const { error } = await sb
    .from('ventas')
    .update({ estado: 'anulada' })
    .eq('id', ventaId);

  if (error) throw error;
}
