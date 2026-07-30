import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { CIERRE_COLUMNS, type CierreCaja } from '@/types/database';
import { getCashClosures, saveCashClosure, type CashClosure } from '@/lib/cashClosureStore';

function localToDb(c: CashClosure): CierreCaja {
  return {
    id: String(c.id),
    codigo: c.code,
    caja_id: String(c.cashRegisterId),
    cajero_id: String(c.userId),
    sucursal_id: null,
    monto_apertura: 0,
    monto_esperado: c.expectedCash,
    monto_real: c.countedCash,
    monto_diferencia: c.difference,
    total_ventas: c.totalSales ?? 0,
    total_efectivo: c.totalCash ?? 0,
    total_tarjeta: c.totalCard ?? 0,
    total_transferencia: c.totalTransfer ?? 0,
    estado: 'cerrada',
    abierta_en: c.openedAt,
    cerrada_en: c.closedAt,
  };
}

export async function obtenerCierresCaja(params?: {
  signal?: AbortSignal;
}): Promise<CierreCaja[]> {
  const sb = tryGetSupabase();
  if (!sb) {
    return getCashClosures().map(localToDb);
  }
  let query = sb
    .from('cierres_caja')
    .select(CIERRE_COLUMNS)
    .order('abierta_en', { ascending: false })
    .limit(100);
  if (params?.signal) query = query.abortSignal(params.signal);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CierreCaja[];
}

export type NuevoCierreInput = {
  codigo: string;
  caja_id: string;
  cajero_id?: string | null;
  cajero_nombre?: string;
  cajero_username?: string;
  caja_label?: string;
  sucursal_id?: string | null;
  monto_apertura: number;
  monto_esperado: number;
  monto_real: number;
  monto_diferencia: number;
  total_ventas?: number;
  total_efectivo?: number;
  total_tarjeta?: number;
  total_transferencia?: number;
  estado: 'abierta' | 'cerrada';
  notes?: string;
};

export async function guardarCierreCaja(datos: NuevoCierreInput): Promise<CierreCaja> {
  if (!isSupabaseConfigured()) {
    const now = new Date();
    const closure: CashClosure = {
      id: `cc-${Date.now()}`,
      code: datos.codigo,
      cashRegisterId: datos.caja_id,
      cashRegisterLabel: datos.caja_label ?? `Caja ${datos.caja_id}`,
      userId: String(datos.cajero_id ?? '0'),
      username: datos.cajero_username ?? '',
      userName: datos.cajero_nombre ?? '',
      expectedCash: datos.monto_esperado,
      countedCash: datos.monto_real,
      difference: datos.monto_diferencia,
      totalSales: datos.total_ventas ?? 0,
      totalCash: datos.total_efectivo ?? 0,
      totalCard: datos.total_tarjeta ?? 0,
      totalTransfer: datos.total_transferencia ?? 0,
      cardCount: 0,
      transferCount: 0,
      totalCheque: 0,
      chequeCount: 0,
      totalCredit: 0,
      creditCount: 0,
      openedAt: now.toISOString(),
      closedAt: datos.estado === 'cerrada' ? now.toISOString() : '',
      date: now.toISOString().slice(0, 10),
      notes: datos.notes,
    };
    saveCashClosure(closure);
    return localToDb(closure);
  }

  const sb = getSupabase();
  const { data, error } = await sb
    .from('cierres_caja')
    .insert({
      codigo: datos.codigo,
      caja_id: datos.caja_id,
      cajero_id: datos.cajero_id ?? null,
      sucursal_id: datos.sucursal_id ?? null,
      monto_apertura: datos.monto_apertura,
      monto_esperado: datos.monto_esperado,
      monto_real: datos.monto_real,
      monto_diferencia: datos.monto_diferencia,
      total_ventas: datos.total_ventas ?? 0,
      total_efectivo: datos.total_efectivo ?? 0,
      total_tarjeta: datos.total_tarjeta ?? 0,
      total_transferencia: datos.total_transferencia ?? 0,
      estado: datos.estado,
      cerrada_en: datos.estado === 'cerrada' ? new Date().toISOString() : null,
    })
    .select(CIERRE_COLUMNS)
    .single();
  if (error) throw error;
  return data as CierreCaja;
}
