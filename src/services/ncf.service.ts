import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import type { FiscalInvoiceRecord, NCFRange, NCFType } from '@/lib/ncfStore';
import {
  generateNextNCF as generateNextNCFLocal,
  getFiscalInvoices as getFiscalInvoicesLocal,
  getNCFRanges as getNCFRangesLocal,
  saveFiscalInvoice as saveFiscalInvoiceLocal,
  saveNCFRanges as saveNCFRangesLocal,
} from '@/lib/ncfStore';

function mapRangoDb(row: Record<string, unknown>): NCFRange {
  return {
    id: String(row.id),
    type: String(row.tipo_ncf) as NCFType,
    prefix: String(row.prefijo ?? row.tipo_ncf),
    currentNumber: Number(row.secuencia_actual ?? 0),
    maxNumber: Number(row.secuencia_fin ?? 0),
    expirationDate: row.fecha_vencimiento
      ? String(row.fecha_vencimiento).slice(0, 10)
      : '2027-12-31',
    active: Boolean(row.activo),
  };
}

export async function obtenerRangosNcf(): Promise<NCFRange[]> {
  const sb = tryGetSupabase();
  if (!sb) return getNCFRangesLocal();

  const { data, error } = await sb
    .from('rangos_ncf')
    .select('id, tipo_ncf, prefijo, secuencia_actual, secuencia_fin, activo, fecha_vencimiento')
    .order('tipo_ncf');
  if (error) throw error;
  return (data ?? []).map((r) => mapRangoDb(r as Record<string, unknown>));
}

export async function guardarRangosNcf(ranges: NCFRange[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    saveNCFRangesLocal(ranges);
    return;
  }
  const sb = getSupabase();

  for (const r of ranges) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(r.id);
    const payload = {
      tipo_ncf: r.type,
      prefijo: r.prefix,
      secuencia_actual: r.currentNumber,
      secuencia_fin: r.maxNumber,
      activo: r.active,
      fecha_vencimiento: r.expirationDate || null,
    };

    if (isUuid) {
      const { error } = await sb.from('rangos_ncf').update(payload).eq('id', r.id);
      if (error) throw error;
    } else {
      const { data: existing } = await sb
        .from('rangos_ncf')
        .select('id')
        .eq('tipo_ncf', r.type)
        .maybeSingle();
      if (existing?.id) {
        const { error } = await sb.from('rangos_ncf').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('rangos_ncf').insert(payload);
        if (error) throw error;
      }
    }
  }
}

/** Reserva el siguiente NCF en BD (avanza secuencia_actual). */
export async function generarSiguienteNcf(
  type: NCFType
): Promise<{ ncf: string; expirationDate: string }> {
  if (!isSupabaseConfigured()) return generateNextNCFLocal(type);

  const sb = getSupabase();
  const { data: range, error } = await sb
    .from('rangos_ncf')
    .select('id, tipo_ncf, prefijo, secuencia_actual, secuencia_fin, fecha_vencimiento, activo')
    .eq('tipo_ncf', type)
    .eq('activo', true)
    .order('creado_en', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!range) {
    return { ncf: `${type}00000001`, expirationDate: '2027-12-31' };
  }

  const nextNum = Number(range.secuencia_actual) + 1;
  if (nextNum > Number(range.secuencia_fin)) {
    throw new Error(`Se agotó el rango NCF ${type}`);
  }

  const { error: upErr } = await sb
    .from('rangos_ncf')
    .update({ secuencia_actual: nextNum })
    .eq('id', range.id)
    .eq('secuencia_actual', range.secuencia_actual);
  if (upErr) throw upErr;

  const prefix = String(range.prefijo || type);
  return {
    ncf: `${prefix}${String(nextNum).padStart(8, '0')}`,
    expirationDate: range.fecha_vencimiento
      ? String(range.fecha_vencimiento).slice(0, 10)
      : '2027-12-31',
  };
}

export async function registrarFacturaFiscal(invoice: FiscalInvoiceRecord & { venta_id?: string | null }) {
  if (!isSupabaseConfigured()) {
    saveFiscalInvoiceLocal(invoice);
    return invoice;
  }

  const sb = getSupabase();
  const { error } = await sb.from('facturas_fiscales').insert({
    venta_id: invoice.venta_id || null,
    ncf: invoice.ncf,
    tipo_ncf: invoice.ncfType,
    rnc_cliente: invoice.rncClient || null,
    nombre_cliente: invoice.companyName || null,
    subtotal: invoice.subtotal,
    itbis: invoice.itbis,
    monto_total: invoice.total,
    metodo_pago: invoice.paymentMethod || null,
    items: invoice.items,
    emitida_en: new Date().toISOString(),
  });
  if (error) throw error;
  return invoice;
}

export async function obtenerFacturasFiscales(limite = 100): Promise<FiscalInvoiceRecord[]> {
  const sb = tryGetSupabase();
  if (!sb) return getFiscalInvoicesLocal();

  const { data, error } = await sb
    .from('facturas_fiscales')
    .select(
      'id, ncf, tipo_ncf, rnc_cliente, nombre_cliente, subtotal, itbis, monto_total, metodo_pago, items, emitida_en'
    )
    .order('emitida_en', { ascending: false })
    .limit(limite);
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const emitida = row.emitida_en ? new Date(String(row.emitida_en)) : new Date();
    return {
      id: String(row.id),
      ncf: String(row.ncf),
      ncfType: String(row.tipo_ncf) as NCFType,
      rncClient: row.rnc_cliente ? String(row.rnc_cliente) : undefined,
      companyName: row.nombre_cliente ? String(row.nombre_cliente) : undefined,
      issueDate: emitida.toISOString().slice(0, 10),
      issueTime: emitida.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      subtotal: Number(row.subtotal ?? 0),
      itbis: Number(row.itbis ?? 0),
      total: Number(row.monto_total ?? 0),
      paymentMethod: String(row.metodo_pago ?? ''),
      cashier: 'Cajero',
      expirationDate: '',
      items: Array.isArray(row.items) ? (row.items as FiscalInvoiceRecord['items']) : [],
    };
  });
}
