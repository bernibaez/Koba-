import { tryGetSupabase, isSupabaseConfigured, getSupabase } from './clienteSupabase';
import {
  PRODUCTO_COLUMNS,
  type EstadoProducto,
  type Producto,
} from '@/types/database';
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
    barcode: p.codigo_barras,
    sku: p.sku,
    name: p.nombre,
    category: p.categoria,
    brand: p.marca ?? '',
    unit: p.unidad,
    supplier: '',
    costPrice: Number(p.precio_costo),
    salePrice: Number(p.precio_venta),
    wholesalePrice: Number(p.precio_mayorista),
    tax: Number(p.porcentaje_impuesto),
    minStock: p.stock_minimo,
    currentStock: p.stock_actual,
    image: p.imagen_url ?? '',
    expiryDate: p.fecha_vencimiento,
    warranty: p.garantia ?? 'N/A',
    status: estadoMap[p.estado] ?? 'active',
    stockStatus,
  };
}

export function uiAProductoInsert(p: Omit<Product, 'id' | 'stockStatus'> & { id?: string }): Partial<Producto> {
  const estadoMap: Record<Product['status'], EstadoProducto> = {
    active: 'activo',
    inactive: 'inactivo',
    discontinued: 'descontinuado',
  };
  return {
    ...(p.id ? { id: p.id } : {}),
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
    .select(PRODUCTO_COLUMNS, { count: 'exact' })
    .order('nombre')
    .range(desde, hasta);

  if (params.busqueda?.trim()) {
    const q = params.busqueda.trim();
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
  if (error) throw error;
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
  const { data, error } = await sb
    .from('productos')
    .insert(datos)
    .select(PRODUCTO_COLUMNS)
    .single();
  if (error) throw error;
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

  const sb = getSupabase();
  const { data, error } = await sb
    .from('productos')
    .update({ ...datos, actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .select(PRODUCTO_COLUMNS)
    .single();
  if (error) throw error;
  return data as Producto;
}

export async function eliminarProducto(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    saveStoredProducts(getStoredProducts().filter((p) => p.id !== id));
    return;
  }
  const sb = getSupabase();
  const { error } = await sb.from('productos').delete().eq('id', id);
  if (error) throw error;
}

export async function obtenerProductoPorCodigoBarras(
  codigo: string,
  signal?: AbortSignal
): Promise<Producto | null> {
  const sb = tryGetSupabase();
  if (!sb) {
    return localAsProductos().find((p) => p.codigo_barras === codigo) ?? null;
  }
  let query = sb.from('productos').select(PRODUCTO_COLUMNS).eq('codigo_barras', codigo);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as Producto | null;
}
