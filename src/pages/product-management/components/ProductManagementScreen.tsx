import React, { useState } from 'react';
import ProductsHeader from './ProductsHeader';
import ProductsToolbar from './ProductsToolbar';
import ProductsTable from './ProductsTable';
import ProductFormModal from './ProductFormModal';
import PriceLabelModal from './PriceLabelModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { useProductos } from '@/hooks/useProductos';

export interface Product {
  id: string;
  barcode: string;
  sku: string;
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
];

export default function ProductManagementScreen() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
    limite: 200,
    busqueda: search,
    categoria: filterCategory === 'all' ? undefined : filterCategory,
    estado: estadoDb,
  });

  const products = productosUi;

  const filtered = products
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

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const name = products.find((p) => p.id === deleteId)?.name;
      await eliminar(deleteId);
      setDeleteId(null);
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(deleteId);
        return n;
      });
      toast.success(`Producto "${name}" eliminado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeleteLoading(false);
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

  return (
    <div className="space-y-4">
      <ProductsHeader
        onAdd={() => { setEditProduct(null); setAddModalOpen(true); }}
        onExport={handleExportPdf}
        totalProducts={products.length}
        activeProducts={products.filter((p) => p.status === 'active').length}
        lowStockCount={products.filter((p) => p.stockStatus === 'low' || p.stockStatus === 'out').length}
      />

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
        onAdd={() => { setEditProduct(null); setAddModalOpen(true); }}
        totalFiltered={filtered.length}
      />

      <ProductsTable
        products={filtered}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        onEdit={(p) => { setEditProduct(p); setAddModalOpen(true); }}
        onDelete={(id) => setDeleteId(id)}
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

      <ProductFormModal
        open={addModalOpen}
        onClose={() => { setAddModalOpen(false); setEditProduct(null); }}
        product={editProduct}
        onSave={handleSaveProduct}
        onPrintLabel={(p) => setLabelModalProducts([p])}
      />

      {labelModalProducts && (
        <PriceLabelModal
          products={labelModalProducts}
          onClose={() => setLabelModalProducts(null)}
        />
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        description={`¿Estás seguro de que deseas eliminar "${products.find((p) => p.id === deleteId)?.name}"? Esta acción no se puede deshacer y eliminará todo el historial de inventario asociado.`}
        confirmLabel="Eliminar Producto"
        loading={deleteLoading}
      />
    </div>
  );
}