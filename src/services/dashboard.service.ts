import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import type { MetricasDashboard } from '@/types/database';

export async function obtenerMetricasDashboard(
  periodo: 'hoy' | 'semana' | 'mes' = 'hoy',
  signal?: AbortSignal
): Promise<MetricasDashboard> {
  const sb = tryGetSupabase();
  if (!sb) {
    return {
      periodo,
      desde: new Date().toISOString(),
      ventas_total: 125480,
      ventas_count: 87,
      ticket_promedio: 1442.3,
      costo_total: 89200,
      ganancia_bruta: 36280,
      productos_stock_bajo: 5,
      productos_activos: 12,
    };
  }

  let rpc = sb.rpc('obtener_metricas_dashboard', { p_periodo: periodo });
  if (signal) rpc = rpc.abortSignal(signal);
  const { data, error } = await rpc;
  if (error) throw error;
  return data as MetricasDashboard;
}

export async function obtenerAlertasStock(signal?: AbortSignal) {
  if (!isSupabaseConfigured()) {
    const { getStoredProducts } = await import('@/lib/productStore');
    return getStoredProducts()
      .filter((p) => p.currentStock <= p.minStock)
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        nombre: p.name,
        stock_actual: p.currentStock,
        stock_minimo: p.minStock,
        nivel_alerta: p.currentStock === 0 ? 'agotado' : 'bajo',
      }));
  }
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
