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
    monto_apertura: c.baseCash ?? 0,
    monto_esperado: c.expectedCash,
    monto_real: c.countedCash,
    monto_diferencia: c.difference,
    total_ventas: c.totalSales ?? 0,
    total_efectivo: c.totalCash ?? 0,
    total_tarjeta: c.totalCard ?? 0,
    total_transferencia: c.totalTransfer ?? 0,
    estado: c.status ?? (c.closedAt ? 'cerrada' : 'abierta'),
    abierta_en: c.openedAt,
    cerrada_en: c.closedAt || null,
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

export type NuevoInicioCajaInput = {
  codigo?: string;
  caja_id: string;
  caja_label?: string;
  cajero_id?: string | null;
  cajero_nombre?: string;
  cajero_username?: string;
  sucursal_id?: string | null;
  monto_apertura: number;
  notes?: string;
};

export async function iniciarCaja(datos: NuevoInicioCajaInput): Promise<CierreCaja> {
  const code = datos.codigo || `AP-${Date.now().toString().slice(-6)}`;
  return guardarCierreCaja({
    codigo: code,
    caja_id: datos.caja_id,
    cajero_id: datos.cajero_id,
    cajero_nombre: datos.cajero_nombre,
    cajero_username: datos.cajero_username,
    caja_label: datos.caja_label,
    sucursal_id: datos.sucursal_id,
    monto_apertura: datos.monto_apertura,
    monto_esperado: datos.monto_apertura,
    monto_real: datos.monto_apertura,
    monto_diferencia: 0,
    total_ventas: 0,
    total_efectivo: 0,
    total_tarjeta: 0,
    total_transferencia: 0,
    estado: 'abierta',
    notes: datos.notes,
  });
}

export async function obtenerCajaAbierta(cajaId?: string, cajeroId?: string): Promise<CierreCaja | null> {
  const sb = tryGetSupabase();
  if (!sb) {
    const list = getCashClosures().map(localToDb);
    const abierta = list.find(
      (c) =>
        c.estado === 'abierta' &&
        (!cajaId || c.caja_id === cajaId) &&
        (!cajeroId || c.cajero_id === cajeroId)
    );
    return abierta ?? null;
  }
  let query = sb
    .from('cierres_caja')
    .select(CIERRE_COLUMNS)
    .eq('estado', 'abierta')
    .order('abierta_en', { ascending: false });

  if (cajaId) query = query.eq('caja_id', cajaId);
  if (cajeroId) query = query.eq('cajero_id', cajeroId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return (data as CierreCaja) ?? null;
}

export interface ResumenCajaAbierta {
  cierre_id?: string;
  caja_id: string;
  caja_label: string;
  cajero_id?: string | null;
  cajero_nombre?: string;
  cajero_username?: string;
  abierta_en: string;
  monto_apertura: number;
  total_ventas: number;
  total_efectivo: number;
  total_tarjeta: number;
  total_transferencia: number;
  total_otros: number;
  total_entradas: number;
  total_retiros: number;
  total_devoluciones: number;
  monto_esperado: number;
  estado: string;
}

export async function calcularResumenCajaAbierta(cajaId: string): Promise<ResumenCajaAbierta> {
  const abierta = await obtenerCajaAbierta(cajaId);
  const apertura = abierta?.monto_apertura ?? 0;
  const desde = abierta?.abierta_en || new Date().toISOString().slice(0, 10);

  let totalVentas = 0;
  let totalEfectivo = 0;
  let totalTarjeta = 0;
  let totalTransferencia = 0;
  let totalOtros = 0;

  try {
    const { obtenerVentasTurno } = await import('./ventas.service');
    const ventas = await obtenerVentasTurno({
      cajaId,
      desde,
      limite: 500,
    });
    for (const v of ventas) {
      totalVentas += Number(v.monto_total) || 0;
      totalEfectivo += Number(v.monto_efectivo) || 0;
      totalTarjeta += Number(v.monto_tarjeta) || 0;
      totalTransferencia += Number(v.monto_transferencia) || 0;
      totalOtros += Number(v.monto_credito) || 0;
    }
  } catch {
    totalVentas = abierta?.total_ventas ?? 0;
    totalEfectivo = abierta?.total_efectivo ?? 0;
    totalTarjeta = abierta?.total_tarjeta ?? 0;
    totalTransferencia = abierta?.total_transferencia ?? 0;
  }

  const totalEntradas = 0;
  const totalRetiros = 0;
  const totalDevoluciones = 0;
  const montoEsperado = apertura + totalEfectivo + totalEntradas - totalRetiros - totalDevoluciones;

  return {
    cierre_id: abierta?.id,
    caja_id: cajaId,
    caja_label: `Caja #${cajaId}`,
    cajero_id: abierta?.cajero_id,
    cajero_nombre: (abierta as CierreCaja & { cajero_nombre?: string })?.cajero_nombre,
    cajero_username: (abierta as CierreCaja & { cajero_username?: string })?.cajero_username,
    abierta_en: abierta?.abierta_en || new Date().toISOString(),
    monto_apertura: apertura,
    total_ventas: totalVentas,
    total_efectivo: totalEfectivo,
    total_tarjeta: totalTarjeta,
    total_transferencia: totalTransferencia,
    total_otros: totalOtros,
    total_entradas: totalEntradas,
    total_retiros: totalRetiros,
    total_devoluciones: totalDevoluciones,
    monto_esperado: montoEsperado,
    estado: abierta ? 'abierta' : 'en_curso',
  };
}

export interface CerrarTurnoInput {
  cierre_id?: string;
  caja_id: string;
  caja_label?: string;
  cajero_id?: string | null;
  cajero_nombre?: string;
  cajero_username?: string;
  usuario_cierre_id?: string | null;
  usuario_cierre_nombre?: string;
  monto_apertura: number;
  monto_esperado: number;
  monto_real: number;
  monto_diferencia: number;
  total_ventas?: number;
  total_efectivo?: number;
  total_tarjeta?: number;
  total_transferencia?: number;
  total_otros?: number;
  total_entradas?: number;
  total_retiros?: number;
  total_devoluciones?: number;
  notes?: string;
}

export async function cerrarTurnoCaja(input: CerrarTurnoInput): Promise<CierreCaja> {
  const code = `CR-${Date.now().toString().slice(-6)}`;
  return guardarCierreCaja({
    codigo: code,
    caja_id: input.caja_id,
    caja_label: input.caja_label,
    cajero_id: input.cajero_id,
    cajero_nombre: input.cajero_nombre,
    cajero_username: input.cajero_username,
    monto_apertura: input.monto_apertura,
    monto_esperado: input.monto_esperado,
    monto_real: input.monto_real,
    monto_diferencia: input.monto_diferencia,
    total_ventas: input.total_ventas ?? 0,
    total_efectivo: input.total_efectivo ?? 0,
    total_tarjeta: input.total_tarjeta ?? 0,
    total_transferencia: input.total_transferencia ?? 0,
    estado: 'cerrada',
    notes: input.notes,
  });
}


