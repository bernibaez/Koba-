import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import type { MetricasDashboard } from '@/types/database';

const emptyMetricas = (periodo: MetricasDashboard['periodo']): MetricasDashboard => ({
  periodo,
  desde: new Date().toISOString(),
  ventas_total: 0,
  ventas_count: 0,
  ticket_promedio: 0,
  costo_total: 0,
  ganancia_bruta: 0,
  productos_stock_bajo: 0,
  productos_activos: 0,
});

export async function obtenerMetricasDashboard(
  periodo: 'hoy' | 'semana' | 'mes' = 'hoy',
  signal?: AbortSignal
): Promise<MetricasDashboard> {
  const sb = tryGetSupabase();
  if (!sb) return emptyMetricas(periodo);

  let rpc = sb.rpc('obtener_metricas_dashboard', { p_periodo: periodo });
  if (signal) rpc = rpc.abortSignal(signal);
  const { data, error } = await rpc;
  if (error) throw error;
  return data as MetricasDashboard;
}

export async function obtenerAlertasStock(signal?: AbortSignal) {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabase();
  let query = sb
    .from('alertas_stock')
    .select('id, sku, nombre, stock_actual, stock_minimo, nivel_alerta')
    .limit(20);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export type PuntoTendenciaVenta = { day: string; ventas: number };
export type ProductoTopVenta = { name: string; ventas: number };
export type PuntoComprasVsVentas = { mes: string; compras: number; ventas: number; ganancia: number };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function labelDia(d: Date) {
  return d.toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric' });
}

function labelMes(d: Date) {
  return d.toLocaleDateString('es-DO', { month: 'short' });
}

/** Ventas diarias de los últimos N días (solo BD). */
export async function obtenerTendenciaVentas(
  dias: 7 | 30 = 7,
  signal?: AbortSignal
): Promise<PuntoTendenciaVenta[]> {
  const sb = tryGetSupabase();
  const points: PuntoTendenciaVenta[] = [];
  const today = startOfDay(new Date());
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    points.push({ day: labelDia(d), ventas: 0 });
  }
  if (!sb) return points;

  const desde = new Date(today);
  desde.setDate(today.getDate() - (dias - 1));

  let query = sb
    .from('ventas')
    .select('monto_total, creado_en, estado')
    .gte('creado_en', desde.toISOString())
    .neq('estado', 'anulada');
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;

  const byKey = new Map<string, number>();
  for (const row of data ?? []) {
    const d = startOfDay(new Date(String((row as { creado_en: string }).creado_en)));
    const key = d.toISOString().slice(0, 10);
    byKey.set(key, (byKey.get(key) ?? 0) + Number((row as { monto_total: number }).monto_total ?? 0));
  }

  return points.map((p, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (dias - 1 - idx));
    const key = d.toISOString().slice(0, 10);
    return { day: p.day, ventas: byKey.get(key) ?? 0 };
  });
}

/** Top productos por ingresos (detalle_ventas). */
export async function obtenerTopProductosVendidos(
  limite = 8,
  signal?: AbortSignal
): Promise<ProductoTopVenta[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];

  let query = sb
    .from('detalle_ventas')
    .select('nombre_item, subtotal, ventas!inner(estado)')
    .neq('ventas.estado', 'anulada')
    .limit(2000);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) {
    // Fallback sin join embebido
    let q2 = sb.from('detalle_ventas').select('nombre_item, subtotal').limit(2000);
    if (signal) q2 = q2.abortSignal(signal);
    const res = await q2;
    if (res.error) throw res.error;
    const tally = new Map<string, number>();
    for (const row of res.data ?? []) {
      const name = String((row as { nombre_item: string }).nombre_item || 'Producto');
      tally.set(name, (tally.get(name) ?? 0) + Number((row as { subtotal: number }).subtotal ?? 0));
    }
    return [...tally.entries()]
      .map(([name, ventas]) => ({ name, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, limite);
  }

  const tally = new Map<string, number>();
  for (const row of data ?? []) {
    const name = String((row as { nombre_item: string }).nombre_item || 'Producto');
    tally.set(name, (tally.get(name) ?? 0) + Number((row as { subtotal: number }).subtotal ?? 0));
  }
  return [...tally.entries()]
    .map(([name, ventas]) => ({ name, ventas }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, limite);
}

/** Comparativo mensual compras vs ventas (últimos N meses). */
export async function obtenerComprasVsVentasMensual(
  meses = 7,
  signal?: AbortSignal
): Promise<PuntoComprasVsVentas[]> {
  const sb = tryGetSupabase();
  const today = new Date();
  const buckets: PuntoComprasVsVentas[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    buckets.push({ mes: labelMes(d), compras: 0, ventas: 0, ganancia: 0 });
  }
  if (!sb) return buckets;

  const desde = new Date(today.getFullYear(), today.getMonth() - (meses - 1), 1);

  let vQuery = sb
    .from('ventas')
    .select('monto_total, costo_total, creado_en, estado')
    .gte('creado_en', desde.toISOString())
    .neq('estado', 'anulada');
  if (signal) vQuery = vQuery.abortSignal(signal);
  const { data: ventas, error: vErr } = await vQuery;
  if (vErr) throw vErr;

  let cQuery = sb
    .from('compras')
    .select('monto_total, creado_en, estado')
    .gte('creado_en', desde.toISOString())
    .neq('estado', 'anulada');
  if (signal) cQuery = cQuery.abortSignal(signal);
  const { data: compras, error: cErr } = await cQuery;
  if (cErr) throw cErr;

  const idxFor = (iso: string) => {
    const d = new Date(iso);
    const months =
      (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth());
    const idx = meses - 1 - months;
    return idx >= 0 && idx < meses ? idx : -1;
  };

  for (const row of ventas ?? []) {
    const idx = idxFor(String((row as { creado_en: string }).creado_en));
    if (idx < 0) continue;
    const total = Number((row as { monto_total: number }).monto_total ?? 0);
    const costo = Number((row as { costo_total: number }).costo_total ?? 0);
    buckets[idx].ventas += total;
    buckets[idx].ganancia += total - costo;
  }
  for (const row of compras ?? []) {
    const idx = idxFor(String((row as { creado_en: string }).creado_en));
    if (idx < 0) continue;
    buckets[idx].compras += Number((row as { monto_total: number }).monto_total ?? 0);
  }

  return buckets;
}
