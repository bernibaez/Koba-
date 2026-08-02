import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { CXP_COLUMNS, type EstadoCx } from '@/types/database';

export type CxStatusUi = 'pending' | 'partial' | 'overdue' | 'paid';

export type PagoCxpUi = {
  id: string;
  date: string;
  amount: number;
  method: string;
  note: string;
};

export type CuentaPagarUi = {
  id: string;
  code: string;
  purchase: string;
  supplier: string;
  supplierId: string | null;
  issueDate: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  status: CxStatusUi;
  daysOverdue: number;
  payments: PagoCxpUi[];
};

export type ProveedorOpcion = { id: string; nombre: string };

export type NuevaCxpInput = {
  proveedor_id: string;
  compra_id?: string | null;
  compra_ref?: string | null;
  monto_total: number;
  fecha_emision?: string;
  fecha_vencimiento: string;
};

export type NuevoPagoCxpInput = {
  cuenta_id: string;
  monto: number;
  metodo_pago: string;
  nota?: string;
};

const METHOD_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  mixto: 'Mixto',
};

function mapMetodoPago(raw: string): 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque' | 'mixto' {
  const p = raw.toLowerCase();
  if (p.includes('efectivo')) return 'efectivo';
  if (p.includes('tarjeta')) return 'tarjeta';
  if (p.includes('transfer')) return 'transferencia';
  if (p.includes('cheque')) return 'cheque';
  return 'mixto';
}

function daysOverdue(dueDate: string, balance: number): number {
  if (balance <= 0) return 0;
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

function toUiStatus(estado: EstadoCx, dueDate: string, balance: number): CxStatusUi {
  if (estado === 'pagada' || balance <= 0) return 'paid';
  if (estado === 'parcial') {
    return daysOverdue(dueDate, balance) > 0 ? 'overdue' : 'partial';
  }
  if (estado === 'vencida' || daysOverdue(dueDate, balance) > 0) return 'overdue';
  return 'pending';
}

function errorSupabase(error: unknown): Error {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; code?: string; details?: string };
    if (e.code === 'PGRST205' || e.message?.includes('schema cache')) {
      return new Error(
        'La tabla "cuentas_por_pagar" no existe. Ejecuta supabase/migrations/006_tablas_faltantes.sql en el SQL Editor.'
      );
    }
    return new Error([e.message, e.details].filter(Boolean).join(' — ') || 'Error de Supabase');
  }
  return error instanceof Error ? error : new Error('Error de Supabase');
}

async function nextCodigo(): Promise<string> {
  const sb = getSupabase();
  const { count } = await sb.from('cuentas_por_pagar').select('id', { count: 'exact', head: true });
  const n = (count ?? 0) + 1;
  return `CXP-${String(n).padStart(3, '0')}`;
}

export async function listarProveedores(): Promise<ProveedorOpcion[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('proveedores')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')
    .limit(300);
  if (error) throw errorSupabase(error);
  return (data ?? []).map((p) => ({ id: String(p.id), nombre: String(p.nombre) }));
}

export async function obtenerCuentasPorPagar(signal?: AbortSignal): Promise<CuentaPagarUi[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];

  let query = sb
    .from('cuentas_por_pagar')
    .select(
      `
      ${CXP_COLUMNS},
      proveedores ( nombre ),
      compras ( codigo ),
      pagos_cxp ( id, monto, metodo_pago, nota, creado_en )
    `
    )
    .neq('estado', 'anulada')
    .order('fecha_emision', { ascending: false })
    .limit(300);

  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw errorSupabase(error);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const proveedor = row.proveedores as { nombre?: string } | null;
    const compra = row.compras as { codigo?: string } | null;
    const pagosRaw = (row.pagos_cxp as Record<string, unknown>[] | null) ?? [];
    const payments = pagosRaw
      .map((p) => ({
        id: String(p.id),
        date: String(p.creado_en).slice(0, 10),
        amount: Number(p.monto ?? 0),
        method: METHOD_LABEL[String(p.metodo_pago)] ?? String(p.metodo_pago),
        note: String(p.nota ?? ''),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const balance = Number(row.saldo ?? 0);
    const dueDate = String(row.fecha_vencimiento);
    const estado = row.estado as EstadoCx;

    return {
      id: String(row.id),
      code: String(row.codigo),
      purchase: compra?.codigo ?? '—',
      supplier: proveedor?.nombre ?? 'Sin proveedor',
      supplierId: row.proveedor_id ? String(row.proveedor_id) : null,
      issueDate: String(row.fecha_emision),
      dueDate,
      total: Number(row.monto_total ?? 0),
      paid: Number(row.monto_pagado ?? 0),
      balance,
      status: toUiStatus(estado, dueDate, balance),
      daysOverdue: daysOverdue(dueDate, balance),
      payments,
    };
  });
}

export async function crearCuentaPorPagar(input: NuevaCxpInput): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  if (!input.proveedor_id) throw new Error('Selecciona un proveedor');
  if (!(input.monto_total > 0)) throw new Error('El monto debe ser mayor a 0');
  if (!input.fecha_vencimiento) throw new Error('Indica la fecha de vencimiento');

  const sb = getSupabase();
  const emision = input.fecha_emision ?? new Date().toISOString().slice(0, 10);
  const codigo = await nextCodigo();

  const { error } = await sb.from('cuentas_por_pagar').insert({
    codigo,
    compra_id: input.compra_id ?? null,
    proveedor_id: input.proveedor_id,
    monto_total: input.monto_total,
    monto_pagado: 0,
    saldo: input.monto_total,
    fecha_emision: emision,
    fecha_vencimiento: input.fecha_vencimiento,
    estado: 'pendiente',
  });
  if (error) throw errorSupabase(error);
}

/** Crea CxP desde una compra a crédito. */
export async function crearCxpDesdeCompra(params: {
  compra_id: string;
  proveedor_id: string | null | undefined;
  monto_total: number;
  dias_credito?: number;
}): Promise<void> {
  if (!params.proveedor_id || !(params.monto_total > 0)) return;
  const sb = tryGetSupabase();
  if (!sb) return;

  const { data: existing } = await sb
    .from('cuentas_por_pagar')
    .select('id')
    .eq('compra_id', params.compra_id)
    .maybeSingle();
  if (existing?.id) return;

  const dias = params.dias_credito ?? 15;
  const venc = new Date();
  venc.setDate(venc.getDate() + dias);

  await crearCuentaPorPagar({
    proveedor_id: params.proveedor_id,
    compra_id: params.compra_id,
    monto_total: params.monto_total,
    fecha_vencimiento: venc.toISOString().slice(0, 10),
  });
}

export async function registrarPagoCxp(input: NuevoPagoCxpInput): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');
  if (!(input.monto > 0)) throw new Error('Ingresa un monto válido');

  const sb = getSupabase();
  const { data: cuenta, error: cErr } = await sb
    .from('cuentas_por_pagar')
    .select(CXP_COLUMNS)
    .eq('id', input.cuenta_id)
    .single();
  if (cErr) throw errorSupabase(cErr);

  const saldo = Number(cuenta.saldo);
  if (input.monto > saldo) {
    throw new Error(`El monto supera el saldo pendiente de RD$ ${saldo}`);
  }

  const {
    data: { user },
  } = await sb.auth.getUser();

  const { error: pErr } = await sb.from('pagos_cxp').insert({
    cuenta_id: input.cuenta_id,
    monto: input.monto,
    metodo_pago: mapMetodoPago(input.metodo_pago),
    nota: input.nota?.trim() || null,
    registrado_por: user?.id ?? null,
  });
  if (pErr) throw errorSupabase(pErr);

  const newPaid = Number(cuenta.monto_pagado) + input.monto;
  const newBalance = saldo - input.monto;
  let estado: EstadoCx = newBalance <= 0 ? 'pagada' : 'parcial';
  if (estado !== 'pagada' && daysOverdue(String(cuenta.fecha_vencimiento), newBalance) > 0) {
    estado = 'vencida';
  }

  const { error: uErr } = await sb
    .from('cuentas_por_pagar')
    .update({ monto_pagado: newPaid, saldo: newBalance, estado })
    .eq('id', input.cuenta_id);
  if (uErr) throw errorSupabase(uErr);
}
