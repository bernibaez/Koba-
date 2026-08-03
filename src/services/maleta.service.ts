import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import type { MaletaCut } from '@/lib/posStore';
import { addMaletaCut as addLocal, getMaletaCuts as getLocal } from '@/lib/posStore';

type PayloadJson = Omit<MaletaCut, 'id' | 'cutNumber'> & { cutNumber: string };

function parseCut(row: Record<string, unknown>): MaletaCut {
  let payload: Partial<PayloadJson> = {};
  try {
    payload = row.notas ? (JSON.parse(String(row.notas)) as PayloadJson) : {};
  } catch {
    payload = {};
  }
  const creado = row.creado_en ? new Date(String(row.creado_en)) : new Date();
  return {
    id: String(row.id),
    cutNumber: String(row.codigo ?? payload.cutNumber ?? ''),
    date: payload.date ?? creado.toISOString().slice(0, 10),
    time:
      payload.time ??
      creado.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
    user: payload.user ?? 'Sistema',
    cashier: payload.cashier ?? '',
    branch: payload.branch ?? '',
    expectedCash: Number(payload.expectedCash ?? 0),
    bagAmount: Number(payload.bagAmount ?? row.precio_por_libra ?? 0),
    remainingCash: Number(payload.remainingCash ?? 0),
    salesTotal: Number(payload.salesTotal ?? 0),
    expensesTotal: Number(payload.expensesTotal ?? 0),
    refundsTotal: Number(payload.refundsTotal ?? 0),
    payments: payload.payments ?? { cash: 0, card: 0, transfer: 0, credit: 0 },
    productsSold: payload.productsSold ?? [],
    brandsSold: payload.brandsSold ?? [],
    status: payload.status ?? 'completed',
  };
}

export async function obtenerCortesMaleta(): Promise<MaletaCut[]> {
  const sb = tryGetSupabase();
  if (!sb) return getLocal();

  const { data, error } = await sb
    .from('cortes_maleta')
    .select('id, codigo, precio_por_libra, notas, creado_en')
    .order('creado_en', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => parseCut(r as Record<string, unknown>));
}

export async function crearCorteMaleta(cut: MaletaCut): Promise<MaletaCut> {
  if (!isSupabaseConfigured()) {
    addLocal(cut);
    return cut;
  }

  const sb = getSupabase();
  const payload: PayloadJson = {
    cutNumber: cut.cutNumber,
    date: cut.date,
    time: cut.time,
    user: cut.user,
    cashier: cut.cashier,
    branch: cut.branch,
    expectedCash: cut.expectedCash,
    bagAmount: cut.bagAmount,
    remainingCash: cut.remainingCash,
    salesTotal: cut.salesTotal,
    expensesTotal: cut.expensesTotal,
    refundsTotal: cut.refundsTotal,
    payments: cut.payments,
    productsSold: cut.productsSold,
    brandsSold: cut.brandsSold,
    status: cut.status,
  };

  const { data, error } = await sb
    .from('cortes_maleta')
    .insert({
      codigo: cut.cutNumber,
      nombre_producto: `Retiro maleta ${cut.cutNumber}`,
      peso_bruto: 0,
      peso_neto: 0,
      merma: 0,
      precio_por_libra: cut.bagAmount,
      notas: JSON.stringify(payload),
    })
    .select('id, codigo, precio_por_libra, notas, creado_en')
    .single();
  if (error) throw error;
  return parseCut(data as Record<string, unknown>);
}

/** Totales del día desde ventas reales (para armar el corte). */
export async function obtenerResumenCajaHoy(): Promise<{
  payments: { cash: number; card: number; transfer: number; credit: number };
  salesTotal: number;
  refundsTotal: number;
  productsSold: { sku: string; barcode: string; name: string; qty: number; total: number }[];
  brandsSold: { brand: string; qty: number; total: number }[];
}> {
  const empty = {
    payments: { cash: 0, card: 0, transfer: 0, credit: 0 },
    salesTotal: 0,
    refundsTotal: 0,
    productsSold: [] as { sku: string; barcode: string; name: string; qty: number; total: number }[],
    brandsSold: [] as { brand: string; qty: number; total: number }[],
  };

  const sb = tryGetSupabase();
  if (!sb) return empty;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data: ventas, error } = await sb
    .from('ventas')
    .select('id, monto_total, metodo_pago, estado')
    .gte('creado_en', start.toISOString())
    .neq('estado', 'anulada');
  if (error) throw error;

  const payments = { cash: 0, card: 0, transfer: 0, credit: 0 };
  let salesTotal = 0;
  const ventaIds: string[] = [];

  for (const v of ventas ?? []) {
    const total = Number((v as { monto_total: number }).monto_total ?? 0);
    salesTotal += total;
    ventaIds.push(String((v as { id: string }).id));
    const m = String((v as { metodo_pago: string }).metodo_pago ?? '');
    if (m === 'efectivo') payments.cash += total;
    else if (m === 'tarjeta') payments.card += total;
    else if (m === 'transferencia') payments.transfer += total;
    else if (m === 'credito') payments.credit += total;
    else payments.cash += total;
  }

  const productMap = new Map<string, { sku: string; barcode: string; name: string; qty: number; total: number }>();
  const brandMap = new Map<string, { brand: string; qty: number; total: number }>();

  if (ventaIds.length > 0) {
    const { data: det } = await sb
      .from('detalle_ventas')
      .select('nombre_item, cantidad, subtotal, producto_id, productos(sku, codigo_barras, marca)')
      .in('venta_id', ventaIds.slice(0, 500));

    for (const row of det ?? []) {
      const r = row as {
        nombre_item: string;
        cantidad: number;
        subtotal: number;
        productos?: { sku?: string; codigo_barras?: string; marca?: string } | null;
      };
      const sku = r.productos?.sku || r.nombre_item;
      const name = r.nombre_item;
      const barcode = r.productos?.codigo_barras || '';
      const brand = r.productos?.marca || 'Sin marca';
      const qty = Number(r.cantidad ?? 0);
      const total = Number(r.subtotal ?? 0);

      const prev = productMap.get(sku) ?? { sku, barcode, name, qty: 0, total: 0 };
      prev.qty += qty;
      prev.total += total;
      productMap.set(sku, prev);

      const bPrev = brandMap.get(brand) ?? { brand, qty: 0, total: 0 };
      bPrev.qty += qty;
      bPrev.total += total;
      brandMap.set(brand, bPrev);
    }
  }

  let refundsTotal = 0;
  const { data: devoluciones } = await sb
    .from('devoluciones')
    .select('monto_total, estado')
    .gte('creado_en', start.toISOString())
    .eq('estado', 'aprobada');
  for (const d of devoluciones ?? []) {
    refundsTotal += Number((d as { monto_total: number }).monto_total ?? 0);
  }

  return {
    payments,
    salesTotal,
    refundsTotal,
    productsSold: [...productMap.values()].sort((a, b) => b.total - a.total).slice(0, 20),
    brandsSold: [...brandMap.values()].sort((a, b) => b.total - a.total).slice(0, 20),
  };
}
