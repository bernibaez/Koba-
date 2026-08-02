import { tryGetSupabase, isSupabaseConfigured, getSupabase } from './clienteSupabase';
import { type EstadoProducto, type Producto } from '@/types/database';
import { getStoredProducts, saveStoredProducts } from '@/lib/productStore';
import type { Product } from '@/pages/product-management/components/ProductManagementScreen';

export type ProductosFiltro = {
  pagina?: number;
  limite?: number;
  busqueda?: string;
  categoria?: string;
  estado?: EstadoProducto | 'todos';
  signal?: AbortSignal;
};

export type ProductosResultado = {
  datos: Producto[];
  total: number;
  pagina: number;
  limite: number;
};

/** Evita 400 de PostgREST por caracteres especiales en filtros `.or()`. */
function sanitizarBusquedaPostgrest(raw: string): string {
  return raw.replace(/[%_,.()"'\\*]/g, ' ').replace(/\s+/g, ' ').trim();
}

function errorSupabase(error: unknown): Error {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    return new Error(parts.join(' — ') || 'Error de Supabase');
  }
  return error instanceof Error ? error : new Error('Error de Supabase');
}

/** Mapeo DB → UI Product Management / POS */
export function productoAUi(p: Producto): Product {
  let stockStatus: Product['stockStatus'] = 'normal';
  if (p.stock_actual <= 0) stockStatus = 'out';
  else if (p.stock_actual <= p.stock_minimo) stockStatus = 'low';

  const estadoMap: Record<EstadoProducto, Product['status']> = {
    activo: 'active',
    inactivo: 'inactive',
    descontinuado: 'discontinued',
  };

  return {
    id: p.id,
    barcode: p.codigo_barras ?? '',
    sku: p.sku ?? '',
    name: p.nombre ?? '',
    category: p.categoria ?? 'General',
    brand: p.marca ?? '',
    unit: p.unidad ?? 'Unidad',
    supplier: '',
    costPrice: Number(p.precio_costo ?? 0),
    salePrice: Number(p.precio_venta ?? 0),
    wholesalePrice: Number(p.precio_mayorista ?? 0),
    tax: Number(p.porcentaje_impuesto ?? 0),
    minStock: p.stock_minimo ?? 10,
    currentStock: p.stock_actual ?? 0,
    image: p.imagen_url ?? '',
    expiryDate: p.fecha_vencimiento ?? null,
    warranty: p.garantia ?? 'N/A',
    status: estadoMap[p.estado] ?? 'active',
    stockStatus,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function esUuid(value: string | undefined | null): value is string {
  return !!value && UUID_RE.test(value);
}

export function uiAProductoInsert(p: Omit<Product, 'id' | 'stockStatus'> & { id?: string }): Partial<Producto> {
  const estadoMap: Record<Product['status'], EstadoProducto> = {
    active: 'activo',
    inactive: 'inactivo',
    discontinued: 'descontinuado',
  };
  // Supabase usa UUID; los ids locales tipo prod-001 provocan 400 si se envían.
  return {
    ...(esUuid(p.id) ? { id: p.id } : {}),
    codigo_barras: p.barcode,
    sku: p.sku,
    nombre: p.name,
    categoria: p.category,
    marca: p.brand || null,
    unidad: p.unit || 'Unidad',
    precio_costo: p.costPrice,
    precio_venta: p.salePrice,
    precio_mayorista: p.wholesalePrice,
    porcentaje_impuesto: p.tax,
    stock_minimo: p.minStock,
    stock_actual: p.currentStock,
    fecha_vencimiento: p.expiryDate,
    garantia: p.warranty,
    imagen_url: p.image || null,
    estado: estadoMap[p.status],
  };
}

function localAsProductos(): Producto[] {
  return getStoredProducts().map((p) => ({
    id: p.id,
    codigo_barras: p.barcode,
    sku: p.sku,
    nombre: p.name,
    categoria: p.category,
    marca: p.brand,
    unidad: p.unit,
    proveedor_id: null,
    precio_costo: p.costPrice,
    precio_venta: p.salePrice,
    precio_mayorista: p.wholesalePrice,
    porcentaje_impuesto: p.tax,
    stock_minimo: p.minStock,
    stock_actual: p.currentStock,
    es_pesado: false,
    fecha_vencimiento: p.expiryDate,
    garantia: p.warranty,
    imagen_url: p.image,
    estado: (p.status === 'active' ? 'activo' : p.status === 'inactive' ? 'inactivo' : 'descontinuado') as EstadoProducto,
  }));
}

export async function obtenerProductos(params: ProductosFiltro = {}): Promise<ProductosResultado> {
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 20;
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  const sb = tryGetSupabase();
  if (!sb) {
    let list = localAsProductos();
    if (params.busqueda?.trim()) {
      const q = params.busqueda.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.codigo_barras.toLowerCase().includes(q)
      );
    }
    if (params.categoria && params.categoria !== 'Todas') {
      list = list.filter((p) => p.categoria === params.categoria);
    }
    if (params.estado && params.estado !== 'todos') {
      list = list.filter((p) => p.estado === params.estado);
    }
    const total = list.length;
    return { datos: list.slice(desde, hasta + 1), total, pagina, limite };
  }

  let query = sb
    .from('productos')
    .select('*', { count: 'exact' })
    .order('nombre')
    .range(desde, hasta);

  const q = params.busqueda?.trim() ? sanitizarBusquedaPostgrest(params.busqueda) : '';
  if (q) {
    query = query.or(`nombre.ilike.%${q}%,sku.ilike.%${q}%,codigo_barras.ilike.%${q}%`);
  }
  if (params.categoria && params.categoria !== 'Todas') {
    query = query.eq('categoria', params.categoria);
  }
  if (params.estado && params.estado !== 'todos') {
    query = query.eq('estado', params.estado);
  }
  if (params.signal) query = query.abortSignal(params.signal);

  const { data, error, count } = await query;
  if (error) throw errorSupabase(error);
  return { datos: (data ?? []) as Producto[], total: count ?? 0, pagina, limite };
}

export async function crearProducto(datos: Partial<Producto>): Promise<Producto> {
  if (!isSupabaseConfigured()) {
    const products = getStoredProducts();
    const ui = productoAUi({
      id: `prod-${Date.now()}`,
      codigo_barras: datos.codigo_barras!,
      sku: datos.sku!,
      nombre: datos.nombre!,
      categoria: datos.categoria!,
      marca: datos.marca ?? null,
      unidad: datos.unidad ?? 'Unidad',
      proveedor_id: null,
      precio_costo: Number(datos.precio_costo ?? 0),
      precio_venta: Number(datos.precio_venta ?? 0),
      precio_mayorista: Number(datos.precio_mayorista ?? 0),
      porcentaje_impuesto: Number(datos.porcentaje_impuesto ?? 0),
      stock_minimo: datos.stock_minimo ?? 10,
      stock_actual: datos.stock_actual ?? 0,
      es_pesado: false,
      fecha_vencimiento: datos.fecha_vencimiento ?? null,
      garantia: datos.garantia ?? null,
      imagen_url: datos.imagen_url ?? null,
      estado: (datos.estado as EstadoProducto) ?? 'activo',
    });
    saveStoredProducts([ui, ...products]);
    return localAsProductos().find((p) => p.sku === datos.sku)!;
  }

  const sb = getSupabase();
  const { id, creado_en, actualizado_en, ...rest } = datos;
  const payload = {
    ...rest,
    ...(esUuid(id) ? { id } : {}),
    codigo_barras: rest.codigo_barras || `GEN-${Date.now()}`,
    sku: rest.sku || `SKU-${Date.now()}`,
    nombre: rest.nombre || 'Sin nombre',
    categoria: rest.categoria || 'General',
    unidad: rest.unidad || 'Unidad',
    precio_costo: Number(rest.precio_costo ?? 0),
    precio_venta: Number(rest.precio_venta ?? 0),
    precio_mayorista: Number(rest.precio_mayorista ?? 0),
    porcentaje_impuesto: Number(rest.porcentaje_impuesto ?? 0),
    stock_minimo: rest.stock_minimo ?? 10,
    stock_actual: rest.stock_actual ?? 0,
    es_pesado: rest.es_pesado ?? false,
    fecha_vencimiento: rest.fecha_vencimiento || null,
    estado: rest.estado ?? 'activo',
  };
  const { data, error } = await sb.from('productos').insert(payload).select('*').single();
  if (error) throw errorSupabase(error);
  return data as Producto;
}

export async function actualizarProducto(id: string, datos: Partial<Producto>): Promise<Producto> {
  if (!isSupabaseConfigured()) {
    const products = getStoredProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Producto no encontrado');
    const base = products[idx];
    const uiNext: Product = {
      ...base,
      barcode: datos.codigo_barras ?? base.barcode,
      sku: datos.sku ?? base.sku,
      name: datos.nombre ?? base.name,
      category: datos.categoria ?? base.category,
      brand: datos.marca ?? base.brand,
      unit: datos.unidad ?? base.unit,
      costPrice: datos.precio_costo != null ? Number(datos.precio_costo) : base.costPrice,
      salePrice: datos.precio_venta != null ? Number(datos.precio_venta) : base.salePrice,
      wholesalePrice: datos.precio_mayorista != null ? Number(datos.precio_mayorista) : base.wholesalePrice,
      tax: datos.porcentaje_impuesto != null ? Number(datos.porcentaje_impuesto) : base.tax,
      minStock: datos.stock_minimo ?? base.minStock,
      currentStock: datos.stock_actual ?? base.currentStock,
      image: datos.imagen_url ?? base.image,
      expiryDate: datos.fecha_vencimiento !== undefined ? datos.fecha_vencimiento : base.expiryDate,
      warranty: datos.garantia ?? base.warranty,
      status:
        datos.estado === 'activo'
          ? 'active'
          : datos.estado === 'inactivo'
            ? 'inactive'
            : datos.estado === 'descontinuado'
              ? 'discontinued'
              : base.status,
      stockStatus: 'normal',
    };
    if (uiNext.currentStock <= 0) uiNext.stockStatus = 'out';
    else if (uiNext.currentStock <= uiNext.minStock) uiNext.stockStatus = 'low';
    const nextList = [...products];
    nextList[idx] = uiNext;
    saveStoredProducts(nextList);
    return localAsProductos().find((p) => p.id === id)!;
  }

  if (!esUuid(id)) {
    throw new Error('Este producto aún no está en Supabase (id local). Créalo de nuevo para sincronizarlo.');
  }
  const sb = getSupabase();
  const { id: _omitId, creado_en: _c, ...rest } = datos;
  const { data, error } = await sb
    .from('productos')
    .update({
      ...rest,
      fecha_vencimiento: rest.fecha_vencimiento || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw errorSupabase(error);
  return data as Producto;
}

export async function eliminarProducto(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    saveStoredProducts(getStoredProducts().filter((p) => p.id !== id));
    return;
  }
  const sb = getSupabase();
  const { error } = await sb.from('productos').delete().eq('id', id);
  if (error) throw errorSupabase(error);
}

export async function obtenerProductoPorCodigoBarras(
  codigo: string,
  signal?: AbortSignal
): Promise<Producto | null> {
  const sb = tryGetSupabase();
  if (!sb) {
    return localAsProductos().find((p) => p.codigo_barras === codigo) ?? null;
  }
  let query = sb.from('productos').select('*').eq('codigo_barras', codigo);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw errorSupabase(error);
  return data as Producto | null;
}
