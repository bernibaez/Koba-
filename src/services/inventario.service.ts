import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import { AJUSTE_COLUMNS, type AjusteStock, type TipoAjuste } from '@/types/database';
import {
  createBlockStockAdjustment,
  getStoredAdjustments,
} from '@/lib/stockAdjustmentStore';

export type AjusteItemPayload = {
  producto_id: string;
  tipo_ajuste: TipoAjuste;
  cantidad_nueva?: number;
  cantidad_variacion?: number;
  motivo: string;
  responsable_id?: string | null;
  codigo?: string;
};

export async function procesarAjusteStockBloque(
  items: AjusteItemPayload[]
): Promise<{ ajustes: number; ids: string[] }> {
  if (!isSupabaseConfigured()) {
    const { getStoredProducts } = await import('@/lib/productStore');
    const products = getStoredProducts();
    const mapped = items
      .map((it) => {
        const product = products.find((p) => p.id === it.producto_id);
        if (!product) return null;
        const newQty =
          it.cantidad_nueva != null
            ? it.cantidad_nueva
            : it.tipo_ajuste === 'entrada'
              ? product.currentStock + (it.cantidad_variacion ?? 0)
              : Math.max(0, product.currentStock - Math.abs(it.cantidad_variacion ?? 0));
        return { product, newQty, reason: it.motivo };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    const result = createBlockStockAdjustment(mapped, 'Sistema');
    return { ajustes: result.length, ids: result.map((r) => r.id) };
  }

  const sb = getSupabase();
  const { data, error } = await sb.rpc('procesar_ajuste_stock_bloque', {
    p_items: items,
  });
  if (error) throw error;
  return data as { ajustes: number; ids: string[] };
}

export async function obtenerHistorialAjustes(params: {
  pagina?: number;
  limite?: number;
  busqueda?: string;
  tipo?: TipoAjuste | 'todos';
  signal?: AbortSignal;
}): Promise<{ datos: AjusteStock[]; total: number }> {
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 20;
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  const sb = tryGetSupabase();
  if (!sb) {
    let list = getStoredAdjustments().map(
      (a): AjusteStock => ({
        id: a.id,
        codigo: a.code,
        producto_id: a.productId,
        tipo_ajuste: a.type,
        cantidad_anterior: a.previousQty,
        cantidad_nueva: a.newQty,
        cantidad_variacion: a.qty,
        motivo: a.reason,
        responsable_id: null,
        creado_en: a.date,
      })
    );
    if (params.busqueda?.trim()) {
      const q = params.busqueda.trim().toLowerCase();
      list = list.filter((a) => a.codigo.toLowerCase().includes(q) || a.motivo.toLowerCase().includes(q));
    }
    if (params.tipo && params.tipo !== 'todos') {
      list = list.filter((a) => a.tipo_ajuste === params.tipo);
    }
    return { datos: list.slice(desde, hasta + 1), total: list.length };
  }

  let query = sb
    .from('ajustes_stock')
    .select(AJUSTE_COLUMNS, { count: 'exact' })
    .order('creado_en', { ascending: false })
    .range(desde, hasta);

  if (params.busqueda?.trim()) {
    const q = params.busqueda.trim();
    query = query.or(`codigo.ilike.%${q}%,motivo.ilike.%${q}%`);
  }
  if (params.tipo && params.tipo !== 'todos') {
    query = query.eq('tipo_ajuste', params.tipo);
  }
  if (params.signal) query = query.abortSignal(params.signal);

  const { data, error, count } = await query;
  if (error) throw error;
  return { datos: (data ?? []) as AjusteStock[], total: count ?? 0 };
}
