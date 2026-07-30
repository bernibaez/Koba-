import { useCallback, useEffect, useRef, useState } from 'react';
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  obtenerProductos,
  productoAUi,
  uiAProductoInsert,
  type ProductosFiltro,
} from '@/services/productos.service';
import type { Product } from '@/pages/product-management/components/ProductManagementScreen';
import type { Producto } from '@/types/database';

export function useProductos(params: ProductosFiltro = {}) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosUi, setProductosUi] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busqueda = params.busqueda ?? '';
  const categoria = params.categoria;
  const estado = params.estado;

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await obtenerProductos({
        pagina,
        limite,
        busqueda,
        categoria,
        estado,
        signal: ac.signal,
      });
      if (ac.signal.aborted) return;
      setProductos(res.datos);
      setProductosUi(res.datos.map(productoAUi));
      setTotal(res.total);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error al cargar productos');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [pagina, limite, busqueda, categoria, estado]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const crear = useCallback(
    async (product: Omit<Product, 'id' | 'stockStatus'> & { id?: string }) => {
      const created = await crearProducto(uiAProductoInsert(product));
      await refetch();
      return productoAUi(created);
    },
    [refetch]
  );

  const actualizar = useCallback(
    async (id: string, product: Partial<Product>) => {
      const patch = uiAProductoInsert({
        barcode: product.barcode ?? '',
        sku: product.sku ?? '',
        name: product.name ?? '',
        category: product.category ?? '',
        brand: product.brand ?? '',
        unit: product.unit ?? 'Unidad',
        supplier: product.supplier ?? '',
        costPrice: product.costPrice ?? 0,
        salePrice: product.salePrice ?? 0,
        wholesalePrice: product.wholesalePrice ?? 0,
        tax: product.tax ?? 0,
        minStock: product.minStock ?? 0,
        currentStock: product.currentStock ?? 0,
        image: product.image ?? '',
        expiryDate: product.expiryDate ?? null,
        warranty: product.warranty ?? '',
        status: product.status ?? 'active',
        id,
      });
      await actualizarProducto(id, patch);
      await refetch();
    },
    [refetch]
  );

  const eliminar = useCallback(
    async (id: string) => {
      await eliminarProducto(id);
      await refetch();
    },
    [refetch]
  );

  return {
    productos,
    productosUi,
    total,
    loading,
    error,
    refetch,
    crear,
    actualizar,
    eliminar,
  };
}
