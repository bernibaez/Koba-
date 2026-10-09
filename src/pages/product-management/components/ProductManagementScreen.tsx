import React, { useState } from 'react';
import ProductsHeader from './ProductsHeader';
import ProductsToolbar from './ProductsToolbar';
import ProductsTable from './ProductsTable';
import ProductFormModal from './ProductFormModal';
import PriceLabelModal from './PriceLabelModal';
import ProductImportModal from './ProductImportModal';
import ModalShell from '@/components/ui/ModalShell';
import { X, Package, Scale, ShoppingCart, Plus, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/lib/toast';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { useProductos } from '@/hooks/useProductos';
import {
  actualizarProducto,
  crearProducto,
  obtenerProductos,
  productoAUi,
  uiAProductoInsert,
  upsertProductoImportacion,
} from '@/services/productos.service';
import { normalizePlu } from '@/lib/scaleBarcode';
import { findExistingImportProduct, isGenericScaleItemCode } from '@/lib/scaleImport';

import type { SaleType, WeightUnit } from '@/types/database';

export interface Product {
  id: string;
  barcode: string;
  sku: string;
  plu?: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  supplier: string;
  costPrice: number;
  salePrice: number;
  wholesalePrice: number;
  tax: number;
  minStock: number;
  currentStock: number;
  image: string;
  expiryDate: string | null;
  warranty: string;
  status: 'active' | 'inactive' | 'discontinued';
  stockStatus: 'normal' | 'low' | 'out';
  saleType?: SaleType;
  weightUnit?: WeightUnit;
  pricePerWeight?: number;
  allowDecimal?: boolean;
  minWeight?: number;
  maxWeight?: number;
  generateScaleBarcode?: boolean;
  isWeightProduct?: boolean;
}

export const initialProducts: Product[] = [
  { id: 'prod-001', barcode: '7891000100103', sku: 'ARR-SEL-5LB', name: 'Arroz Selecto 5lb', category: 'Granos', brand: 'Molinos Modernos', unit: 'Unidad', supplier: 'Distribuidora El Caribe', costPrice: 210, salePrice: 285, wholesalePrice: 255, tax: 0, minStock: 24, currentStock: 124, image: '', expiryDate: '2027-03-15', warranty: 'N/A', status: 'active', stockStatus: 'normal' },
  { id: 'prod-002', barcode: '7891000200104', sku: 'ACE-VEG-1L', name: 'Aceite Vegetal 1L', category: 'Granos', brand: 'Mazola', unit: 'Unidad', supplier: 'Importadora Pérez', costPrice: 140, salePrice: 195, wholesalePrice: 172, tax: 18, minStock: 24, currentStock: 8, image: '', expiryDate: '2026-09-30', warranty: 'N/A', status: 'active', stockStatus: 'low' },
  { id: 'prod-003', barcode: '7891000300105', sku: 'POL-ENT-LB', name: 'Pollo Entero /lb', category: 'Carnes', brand: 'Pollo Rey', unit: 'Libra', supplier: 'Pollo Rey SRL', costPrice: 72, salePrice: 98, wholesalePrice: 88, tax: 0, minStock: 20, currentStock: 45, image: '', expiryDate: '2026-07-25', warranty: 'N/A', status: 'active', stockStatus: 'normal' },
  { id: 'prod-004', barcode: '7891000400106', sku: 'LEC-EVA-410', name: 'Leche Evaporada 410g', category: 'Lácteos', brand: 'Carnation', unit: 'Unidad', supplier: 'Nestlé Dominicana', costPrice: 108, salePrice: 145, wholesalePrice: 130, tax: 0, minStock: 36, currentStock: 62, image: '', expiryDate: '2027-06-01', warranty: 'N/A', status: 'active', stockStatus: 'normal' },
  { id: 'prod-005', barcode: '7891000500107', sku: 'AZU-BLA-5LB', name: 'Azúcar Blanca 5lb', category: 'Granos', brand: 'Central Romana', unit: 'Unidad', supplier: 'Central Romana Corp.', costPrice: 128, salePrice: 175, wholesalePrice: 158, tax: 0, minStock: 30, currentStock: 89, image: '', expiryDate: '2027-12-31', warranty: 'N/A', status: 'active', stockStatus: 'normal' },
  { id: 'prod-006', barcode: '7891000600108', sku: 'HUE-X12', name: 'Huevos x12', category: 'Lácteos', brand: 'Avícola Rondón', unit: 'Cartón', supplier: 'Avícola Rondón SRL', costPrice: 120, salePrice: 165, wholesalePrice: 148, tax: 0, minStock: 20, currentStock: 34, image: '', expiryDate: '2026-08-05', warranty: 'N/A', status: 'active', stockStatus: 'normal' },
  { id: 'prod-007', barcode: '7891000700109', sku: 'PAN-AGU-UN', name: 'Pan de Agua', category: 'Panadería', brand: 'Panadería La Fe', unit: 'Unidad', supplier: 'Panadería La Fe', costPrice: 7, salePrice: 12, wholesalePrice: 10, tax: 0, minStock: 50, currentStock: 210, image: '', expiryDate: '2026-07-23', warranty: 'N/A', status: 'active', stockStatus: 'normal' },
  { id: 'prod-008', barcode: '7891000800110', sku: 'HAB-NEG-1LB', name: 'Habichuelas Negras 1lb', category: 'Granos', brand: 'Goya', unit: 'Unidad', supplier: 'Distribuidora El Caribe', costPrice: 62, salePrice: 85, wholesalePrice: 76, tax: 0, minStock: 30, currentStock: 156, image: '', expiryDate: '2027-04-20', warranty: 'N/A', status: 'active', stockStatus: 'normal' },
  { id: 'prod-009', barcode: '7891000900111', sku: 'LEC-PAS-1L', name: 'Leche Pasteurizada 1L', category: 'Lácteos', brand: 'Lechería Macoris', unit: 'Unidad', supplier: 'Lechería Macoris SA', costPrice: 84, salePrice: 115, wholesalePrice: 102, tax: 0, minStock: 30, currentStock: 0, image: '', expiryDate: '2026-07-28', warranty: 'N/A', status: 'active', stockStatus: 'out' },
  { id: 'prod-010', barcode: '7891001000112', sku: 'JUG-NAR-1L', name: 'Jugo Naranja 1L', category: 'Bebidas', brand: 'Del Valle', unit: 'Unidad', supplier: 'Nestlé Dominicana', costPrice: 105, salePrice: 145, wholesalePrice: 130, tax: 18, minStock: 18, currentStock: 28, image: '', expiryDate: '2026-10-15', warranty: 'N/A', status: 'active', stockStatus: 'normal' },
  { id: 'prod-011', barcode: '7891001100113', sku: 'DET-LIQ-1.5', name: 'Detergente Líq. 1.5L', category: 'Limpieza', brand: 'Fabuloso', unit: 'Unidad', supplier: 'Colgate-Palmolive DO', costPrice: 195, salePrice: 285, wholesalePrice: 255, tax: 18, minStock: 20, currentStock: 6, image: '', expiryDate: null, warranty: 'N/A', status: 'active', stockStatus: 'low' },
  { id: 'prod-012', barcode: '7891001200114', sku: 'YOG-GRI-500', name: 'Yogur Griego 500g', category: 'Lácteos', brand: 'Chobani', unit: 'Unidad', supplier: 'Importadora Pérez', costPrice: 140, salePrice: 195, wholesalePrice: 175, tax: 18, minStock: 15, currentStock: 48, image: '', expiryDate: '2026-07-23', warranty: 'N/A', status: 'active', stockStatus: 'normal' },
  { id: 'prod-00132', barcode: '00132', sku: 'QUE-CHE-LB', plu: '00132', name: 'Queso Cheddar Balanza /lb', category: 'Lácteos', brand: 'Dos Pinos', unit: 'Libra', supplier: 'Distribuidora El Caribe', costPrice: 28, salePrice: 40, wholesalePrice: 35, tax: 0, minStock: 20, currentStock: 100, image: '', expiryDate: '2027-01-01', warranty: 'N/A', status: 'active', stockStatus: 'normal', isWeightProduct: true, saleType: 'weight', pricePerWeight: 40 },
];

export default function ProductManagementScreen() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [productTypeTab, setProductTypeTab] = useState<'all' | 'normal' | 'balanza'>('all');
  const [isNewScaleProductMode, setIsNewScaleProductMode] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importIsScaleMode, setImportIsScaleMode] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [labelModalProducts, setLabelModalProducts] = useState<Product[] | null>(null);

  const estadoDb =
    filterStatus === 'active'
      ? ('activo' as const)
      : filterStatus === 'inactive'
        ? ('inactivo' as const)
        : filterStatus === 'discontinued'
          ? ('descontinuado' as const)
          : ('todos' as const);

  const { productosUi, crear, actualizar, eliminar, refetch } = useProductos({
    pagina: 1,
    limite: 2000,
    busqueda: search,
    categoria: filterCategory === 'all' ? undefined : filterCategory,
    estado: estadoDb,
  });

  const products = productosUi;

  const isVariableWeight = (p: Product) =>
    Boolean(p.isWeightProduct || p.saleType === 'weight' || p.saleType === 'both');

  const normalCount = products.filter((p) => !isVariableWeight(p)).length;

  const scaleCount = products.filter((p) => isVariableWeight(p)).length;

  const filtered = products
    .filter((p) => {
      const isScale = isVariableWeight(p);
      if (productTypeTab === 'normal') return !isScale;
      if (productTypeTab === 'balanza') return isScale;
      return true;
    })
    .filter((p) => filterStock === 'all' || p.stockStatus === filterStock)
    .sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      const existsRemote = products.some((p) => p.id === product.id);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        product.id
      );
      if (existsRemote && isUuid) {
        await actualizar(product.id, product);
        toast.success(`Producto "${product.name}" actualizado correctamente`);
      } else {
        const { id: _localId, ...rest } = product;
        await crear(rest);
        toast.success(`Producto "${product.name}" creado correctamente`);
      }
      setAddModalOpen(false);
      setEditProduct(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar producto');
    }
  };

  const handleBatchImport = async (productsToImport: Product[]) => {
    const catalogRes = await obtenerProductos({ pagina: 1, limite: 5000, estado: 'todos' });
    const catalog = catalogRes.datos.map(productoAUi);
    let created = 0;
    let updated = 0;

    for (const item of productsToImport) {
      const plu = normalizePlu(item.plu || '');
      const existing = findExistingImportProduct(catalog, {
        id: item.id,
        plu,
        barcode: item.barcode,
        sku: item.sku,
      });

      const payload = existing
        ? uiAProductoInsert({
            ...existing,
            name: item.name,
            salePrice: item.salePrice,
            wholesalePrice: item.wholesalePrice || item.salePrice,
            costPrice: item.costPrice > 0 ? item.costPrice : existing.costPrice,
            pricePerWeight: item.salePrice,
            plu: plu || existing.plu,
            barcode: isGenericScaleItemCode(existing.barcode)
              ? item.barcode || existing.barcode
              : existing.barcode || item.barcode,
            sku: isGenericScaleItemCode(existing.sku)
              ? item.sku || existing.sku
              : existing.sku || item.sku,
            isWeightProduct: true,
            saleType: existing.saleType === 'both' ? 'both' : 'weight',
            generateScaleBarcode: true,
            unit: existing.unit && existing.unit !== 'Unidad' ? existing.unit : 'Libra',
            weightUnit: existing.weightUnit || 'lb',
            currentStock: existing.currentStock,
            minStock: existing.minStock,
            status: existing.status,
            category: existing.category || item.category,
            brand: existing.brand || item.brand,
          })
        : (() => {
            const { id: _localId, ...rest } = item;
            return uiAProductoInsert(rest);
          })();

      const result = existing
        ? { data: await actualizarProducto(existing.id, payload), created: false }
        : await upsertProductoImportacion(payload);

      if (result.created) {
        created += 1;
        catalog.push(productoAUi(result.data));
      } else {
        updated += 1;
        const idx = catalog.findIndex((p) => p.id === result.data.id);
        if (idx >= 0) catalog[idx] = productoAUi(result.data);
        else catalog.push(productoAUi(result.data));
      }
    }

    await refetch();
    toast.success(
      `Balanza sincronizada: ${created} producto(s) nuevo(s) y ${updated} actualizado(s). El stock no se modificó.`
    );
  };

  const handleDelete = async (id: string) => {
    if (deleteBusyId) return;
    setDeleteBusyId(id);
    try {
      const name = products.find((p) => p.id === id)?.name;
      await eliminar(id);
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      toast.success(`Producto "${name}" eliminado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeleteBusyId(null);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    try {
      await Promise.all([...selectedIds].map((id) => eliminar(id)));
      setSelectedIds(new Set());
      toast.success(`${count} productos eliminados`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
      await refetch();
    }
  };

  const handleToggleStatus = async (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    try {
      await actualizar(id, { ...p, status: newStatus });
      toast.success(`Producto marcado como ${newStatus === 'active' ? 'activo' : 'inactivo'}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar estado');
    }
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Catálogo de Productos',
      filename: 'productos',
      headers: ['SKU', 'Nombre', 'Categoría', 'Marca', 'Stock', 'Costo', 'Precio', 'Estado'],
      rows: filtered.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.brand,
        p.currentStock,
        formatMoneyPdf(p.costPrice),
        formatMoneyPdf(p.salePrice),
        p.status === 'active' ? 'Activo' : p.status === 'inactive' ? 'Inactivo' : 'Descontinuado',
      ]),
      landscape: true,
    });
  };

  if (addModalOpen) {
    return (
      <>
        <ProductFormModal
          open={addModalOpen}
          onClose={() => {
            setAddModalOpen(false);
            setEditProduct(null);
            setIsNewScaleProductMode(false);
          }}
          product={editProduct}
          allProducts={products}
          defaultIsScaleProduct={isNewScaleProductMode || productTypeTab === 'balanza'}
          onSave={handleSaveProduct}
          onPrintLabel={(p) => setLabelModalProducts([p])}
        />
        {labelModalProducts && (
          <PriceLabelModal
            products={labelModalProducts}
            onClose={() => setLabelModalProducts(null)}
          />
        )}
      </>
    );
  }

  if (importModalOpen) {
    return (
      <ProductImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        existingProducts={products}
        onImport={handleBatchImport}
        defaultIsScaleMode={importIsScaleMode}
      />
    );
  }

  if (labelModalProducts) {
    return (
      <PriceLabelModal
        products={labelModalProducts}
        onClose={() => setLabelModalProducts(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {!viewingProduct && (
      <>
      <ProductsHeader
        onAdd={() => {
          setEditProduct(null);
          setIsNewScaleProductMode(false);
          setAddModalOpen(true);
        }}
        onExport={handleExportPdf}
        onImport={() => {
          setImportIsScaleMode(false);
          setImportModalOpen(true);
        }}
        totalProducts={products.length}
        activeProducts={products.filter((p) => p.status === 'active').length}
        lowStockCount={products.filter((p) => p.stockStatus === 'low' || p.stockStatus === 'out').length}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 hover:border-primary/40 transition-all">
          <p className="text-xs text-muted-foreground font-medium">Productos en Catálogo</p>
          <p className="text-2xl font-bold text-foreground mt-1">{products.length} productos</p>
        </div>
        <div className="card p-4 hover:border-emerald-500/40 transition-all">
          <p className="text-xs text-muted-foreground font-medium">Productos Activos</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {products.filter((p) => p.status === 'active').length}
          </p>
        </div>
        <div className="card p-4 hover:border-amber-500/40 transition-all">
          <p className="text-xs text-muted-foreground font-medium">Con Stock Bajo / Agotado</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {products.filter((p) => p.stockStatus === 'low' || p.stockStatus === 'out').length}
          </p>
        </div>
        <div className="card p-4 hover:border-blue-500/40 transition-all">
          <p className="text-xs text-muted-foreground font-medium">Valor en Inventario</p>
          <p className="text-2xl font-bold text-info mt-1">
            RD$ {products.reduce((s, p) => s + p.costPrice * p.currentStock, 0).toLocaleString('es-DO', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Sección de pestañas de productos: Normales vs Balanza */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setProductTypeTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs transition-all border-b-2 ${
            productTypeTab === 'all'
              ? 'border-primary text-primary bg-primary/10'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <Package size={16} />
          <span>Todos los Productos</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
            {products.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setProductTypeTab('normal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs transition-all border-b-2 ${
            productTypeTab === 'normal'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <ShoppingCart size={16} />
          <span>Productos Estándar (Unidades)</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold">
            {normalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setProductTypeTab('balanza')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs transition-all border-b-2 ${
            productTypeTab === 'balanza'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <Scale size={16} />
          <span>Productos de Balanza (mscale / PLU)</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold">
            {scaleCount}
          </span>
        </button>
      </div>

      {/* Banner Minimalista Ajustado para Sección Balanza */}
      {productTypeTab === 'balanza' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 font-semibold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Catálogo Balanza: Productos con PLU de 5 dígitos en sincronización con <strong>mscale</strong></span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setImportIsScaleMode(true);
                setImportModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-bold text-sm border border-emerald-500/30 transition-all shrink-0"
            >
              <FileSpreadsheet size={16} /> Importar / actualizar balanza
            </button>
            <button
              type="button"
              onClick={() => {
                setEditProduct(null);
                setIsNewScaleProductMode(true);
                setAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all shrink-0 hover:scale-[1.01]"
            >
              <Plus size={16} /> Nuevo Producto Balanza
            </button>
          </div>
        </div>
      )}

      <ProductsToolbar
        search={search}
        onSearch={setSearch}
        filterCategory={filterCategory}
        onFilterCategory={setFilterCategory}
        filterStatus={filterStatus}
        onFilterStatus={setFilterStatus}
        filterStock={filterStock}
        onFilterStock={setFilterStock}
        selectedCount={selectedIds.size}
        onBulkDelete={handleBulkDelete}
        onPrintSelectedLabels={() => {
          const selected = products.filter((p) => selectedIds.has(p.id));
          if (selected.length > 0) setLabelModalProducts(selected);
        }}
        onAdd={() => {
          setEditProduct(null);
          setIsNewScaleProductMode(productTypeTab === 'balanza');
          setAddModalOpen(true);
        }}
        totalFiltered={filtered.length}
        onExportPdf={handleExportPdf}
      />

      <ProductsTable
        products={filtered}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        onView={(p) => setViewingProduct(p)}
        onEdit={(p) => { setEditProduct(p); setAddModalOpen(true); }}
        onDelete={(id) => handleDelete(id)}
        onToggleStatus={handleToggleStatus}
        onPrintLabel={(prods) => setLabelModalProducts(prods)}
        onUpdateProduct={async (p) => {
          try {
            await actualizar(p.id, p);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al actualizar');
            await refetch();
          }
        }}
      />

      </>
      )}

      <ModalShell
        open={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        size="md"
        className="p-6"
      >
        {viewingProduct && (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                  <Package size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detalle del Producto</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-0.5">Nombre del Producto</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{viewingProduct.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">SKU</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{viewingProduct.sku}</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">Código de Barras</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 inline-block">
                    {viewingProduct.barcode || 'Sin Código'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">PLU de Balanza</span>
                  <span className="font-mono text-indigo-700 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200/60 inline-block">
                    {viewingProduct.plu || '—'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">Categoría</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingProduct.category}</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">Marca</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingProduct.brand || '—'}</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">Precio Costo</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                    RD$ {viewingProduct.costPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">Precio Venta</span>
                  <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                    RD$ {viewingProduct.salePrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">Stock Actual</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingProduct.currentStock} unidades</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">Estado</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${
                    viewingProduct.status === 'active' ? 'text-emerald-600' : 'text-slate-500'
                  }`}>
                    {viewingProduct.status === 'active' ? 'Activo' : viewingProduct.status === 'inactive' ? 'Inactivo' : 'Descontinuado'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => setViewingProduct(null)}
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </ModalShell>
    </div>
  );
}