import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductsHeader from './ProductsHeader';
import ProductsToolbar from './ProductsToolbar';
import ProductsTable from './ProductsTable';
import MetricStat from './MetricStat';
import type { QuickView, SegmentOption } from './SegmentedControl';
import ProductDrawer from './ProductDrawer';
import BulkActionBar from './BulkActionBar';
import CommandPalette from './CommandPalette';
import ProductFormModal from './ProductFormModal';
import PriceLabelModal from './PriceLabelModal';
import ProductImportModal from './ProductImportModal';
import ModalShell from '@/components/ui/ModalShell';
import { X, Package, Scale, ShoppingCart, Edit, Printer, Calendar, CheckCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { useProductos } from '@/hooks/useProductos';
import '@/styles/apple-tokens.css';
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
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const quickView = (searchParams.get('tab') as QuickView) || 'all';
  const search = searchParams.get('q') || '';
  const filterCategory = searchParams.get('cat') || 'all';
  const filterStatus = searchParams.get('status') || 'all';
  const sortField = (searchParams.get('sort') as keyof Product) || 'name';
  const sortDir = (searchParams.get('order') as 'asc' | 'desc') || 'asc';

  const updateUrlParam = (key: string, value: string | undefined, defaultValue = 'all') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === defaultValue || value.trim() === '') {
          next.delete(key);
        } else {
          next.set(key, value.trim());
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleSearchChange = (val: string) => {
    updateUrlParam('q', val, '');
  };

  const handleCategoryChange = (val: string) => {
    updateUrlParam('cat', val, 'all');
  };

  const handleStatusChange = (val: string) => {
    updateUrlParam('status', val, 'all');
  };

  const handleQuickViewChange = (val: QuickView) => {
    updateUrlParam('tab', val, 'all');
  };

  const handleClearFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('q');
        next.delete('cat');
        next.delete('status');
        next.delete('tab');
        return next;
      },
      { replace: true }
    );
  };

  const [isNewScaleProductMode, setIsNewScaleProductMode] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importIsScaleMode, setImportIsScaleMode] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [drawerProductId, setDrawerProductId] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [labelModalProducts, setLabelModalProducts] = useState<Product[] | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const { productosUi, crear, actualizar, eliminar, refetch, loading } = useProductos({
    pagina: 1,
    limite: 2000,
    busqueda: search,
    categoria: filterCategory === 'all' ? undefined : filterCategory,
    estado: 'todos',
  });

  const products = productosUi;

  const isVariableWeight = (p: Product) =>
    Boolean(p.isWeightProduct || p.saleType === 'weight' || p.saleType === 'both');

  const isLowStock = (p: Product) =>
    p.currentStock <= p.minStock || p.currentStock === 0 || p.stockStatus === 'low' || p.stockStatus === 'out';

  const isInactive = (p: Product) =>
    p.status === 'inactive' || p.status === 'discontinued';

  const quickViewOptions: SegmentOption[] = useMemo(
    () => [
      { id: 'all', label: 'Todos', count: products.length },
      { id: 'low_stock', label: 'Stock bajo', count: products.filter(isLowStock).length },
      { id: 'scale', label: 'Balanza', count: products.filter(isVariableWeight).length },
      { id: 'inactive', label: 'Inactivos', count: products.filter(isInactive).length },
    ],
    [products]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        if (quickView === 'low_stock') return isLowStock(p);
        if (quickView === 'scale') return isVariableWeight(p);
        if (quickView === 'inactive') return isInactive(p);
        return true;
      })
      .filter((p) => {
        if (filterCategory === 'all') return true;
        return p.category === filterCategory;
      })
      .filter((p) => {
        if (filterStatus === 'all') return true;
        return p.status === filterStatus;
      })
      .filter((p) => {
        if (!search || !search.trim()) return true;
        const term = search.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(term) ||
          (p.sku && p.sku.toLowerCase().includes(term)) ||
          (p.barcode && p.barcode.toLowerCase().includes(term)) ||
          (p.plu && p.plu.toLowerCase().includes(term))
        );
      })
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
  }, [products, quickView, filterCategory, filterStatus, search, sortField, sortDir]);

  const drawerIndex = filtered.findIndex((p) => p.id === drawerProductId);
  const drawerProduct = drawerIndex >= 0 ? filtered[drawerIndex] : null;
  const hasPrev = drawerIndex > 0;
  const hasNext = drawerIndex >= 0 && drawerIndex < filtered.length - 1;

  const handleNavigatePrev = () => {
    if (hasPrev) {
      setDrawerProductId(filtered[drawerIndex - 1].id);
    }
  };

  const handleNavigateNext = () => {
    if (hasNext) {
      setDrawerProductId(filtered[drawerIndex + 1].id);
    }
  };

  // Atajos de teclado globales y soporte de escáner de código de barras
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // 1. Atajo ⌘K / Ctrl+K para abrir/cerrar paleta de comandos
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Si la paleta de comandos o modales están abiertos, no capturar otras teclas
      if (commandPaletteOpen || addModalOpen || importModalOpen || labelModalProducts || drawerProductId) {
        return;
      }

      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      // 2. Atajo '/' para enfocar la barra de búsqueda rápida
      if (e.key === '/' && !isInputFocused && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // 3. Atajo 'N' o 'n' para crear nuevo producto
      if ((e.key === 'n' || e.key === 'N') && !isInputFocused && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setEditProduct(null);
        setIsNewScaleProductMode(quickView === 'scale');
        setAddModalOpen(true);
        return;
      }

      // 4. Soporte para lector de código de barras físico:
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Si el tiempo entre caracteres es mayor a 80ms, reiniciar el búfer
      if (timeDiff > 80) {
        barcodeBufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const scannedCode = barcodeBufferRef.current.trim();
        if (scannedCode.length >= 3) {
          const found = products.find(
            (p) =>
              p.barcode === scannedCode ||
              p.sku === scannedCode ||
              p.plu === scannedCode ||
              p.id === scannedCode
          );

          if (found) {
            e.preventDefault();
            barcodeBufferRef.current = '';
            setDrawerProductId(found.id);
            toast.success(`Producto escaneado: ${found.name}`);
            return;
          }
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeBufferRef.current += e.key;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    commandPaletteOpen,
    addModalOpen,
    importModalOpen,
    labelModalProducts,
    drawerProductId,
    products,
    quickView,
  ]);

  const handleSaveDrawerProduct = async (updated: Partial<Product> & { id: string }) => {
    const previous = products.find((p) => p.id === updated.id);
    if (!previous) return;
    const merged = { ...previous, ...updated };

    try {
      await actualizar(updated.id, merged);
      toast.success('Cambios guardados', {
        duration: 5000,
        action: {
          label: 'Deshacer',
          onClick: async () => {
            try {
              await actualizar(previous.id, previous);
              toast.success('Cambios deshechos');
            } catch (err) {
              await refetch();
              toast.error('Error al deshacer cambios');
            }
          },
        },
      });
    } catch (e) {
      await refetch();
      toast.error(e instanceof Error ? e.message : 'Error al guardar los cambios');
      throw e;
    }
  };

  const handleInlineUpdate = async (
    id: string,
    field: 'salePrice' | 'currentStock',
    value: number,
    previousProduct: Product
  ) => {
    const previousValue = previousProduct[field];
    const updated = { ...previousProduct, [field]: value };
    const fieldLabel = field === 'salePrice' ? 'Precio' : 'Stock';

    try {
      await actualizar(id, updated);
      toast.success(`${fieldLabel} actualizado`, {
        duration: 5000,
        action: {
          label: 'Deshacer',
          onClick: async () => {
            try {
              await actualizar(id, { ...updated, [field]: previousValue });
              toast.success(`${fieldLabel} restaurado`);
            } catch (err) {
              await refetch();
              toast.error('Error al deshacer cambio');
            }
          },
        },
      });
    } catch (err) {
      await refetch();
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleBulkStatusChange = async (newStatus: 'active' | 'inactive') => {
    const selectedList = products.filter((p) => selectedIds.has(p.id));
    if (selectedList.length === 0) return;

    const previousStatusMap = new Map<string, 'active' | 'inactive' | 'discontinued'>();
    for (const p of selectedList) {
      previousStatusMap.set(p.id, p.status);
    }

    try {
      await Promise.all(
        selectedList.map((p) => actualizar(p.id, { ...p, status: newStatus }))
      );
      const count = selectedList.length;
      setSelectedIds(new Set());

      toast.success(
        `${count} producto${count !== 1 ? 's' : ''} marcado${count !== 1 ? 's' : ''} como ${newStatus === 'active' ? 'activo' : 'inactivo'}`,
        {
          duration: 5000,
          action: {
            label: 'Deshacer',
            onClick: async () => {
              try {
                await Promise.all(
                  selectedList.map((p) => {
                    const prevStatus = previousStatusMap.get(p.id) || p.status;
                    return actualizar(p.id, { ...p, status: prevStatus });
                  })
                );
                toast.success('Estado masivo revertido');
              } catch (err) {
                await refetch();
                toast.error('Error al revertir cambios');
              }
            },
          },
        }
      );
    } catch (err) {
      await refetch();
      toast.error(err instanceof Error ? err.message : 'Error al actualizar productos');
    }
  };

  const handleBulkExport = () => {
    const selectedProds = products.filter((p) => selectedIds.has(p.id));
    if (selectedProds.length === 0) return;

    exportTableToPdf({
      title: 'Productos Seleccionados',
      filename: 'productos_seleccionados',
      headers: ['SKU', 'Nombre', 'Categoría', 'Marca', 'Stock', 'Costo', 'Precio', 'Estado'],
      rows: selectedProds.map((p) => [
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

  const handleBulkCancel = () => {
    setSelectedIds(new Set());
  };

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      const nextDir = sortDir === 'asc' ? 'desc' : 'asc';
      updateUrlParam('order', nextDir, 'asc');
    } else {
      updateUrlParam('sort', String(field), 'name');
      updateUrlParam('order', 'asc', 'asc');
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
          defaultIsScaleProduct={isNewScaleProductMode || quickView === 'scale'}
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

  const totalCount = products.length;
  const activeCount = products.filter((p) => p.status === 'active').length;
  const lowStockCount = products.filter((p) => p.stockStatus === 'low' || p.stockStatus === 'out').length;
  const totalInventoryValue = products.reduce((s, p) => s + p.costPrice * p.currentStock, 0);
  const formattedInventoryValue = totalInventoryValue.toLocaleString('es-DO', { maximumFractionDigits: 0 });

  return (
    <div className="apple-scope w-full min-h-full space-y-6">
      <ProductsHeader
        onAdd={() => {
          setEditProduct(null);
          setIsNewScaleProductMode(quickView === 'scale');
          setAddModalOpen(true);
        }}
        onExport={handleExportPdf}
        onImport={() => {
          setImportIsScaleMode(true);
          setImportModalOpen(true);
        }}
        onOpenCategories={() => toast.info('Gestión de categorías disponible próximamente')}
        onOpenBrands={() => toast.info('Gestión de marcas disponible próximamente')}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Métricas Minimalistas Estilo Apple (sin tarjetas ni bordes) */}
      <section
        aria-label="Resumen de métricas de inventario"
        className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-1 pb-3"
      >
        <MetricStat
          label="En catálogo"
          value={totalCount}
        />
        <MetricStat
          label="Activos"
          value={activeCount}
        />
        <MetricStat
          label="Stock bajo o agotado"
          value={lowStockCount}
          highlightWarn={true}
        />
        <MetricStat
          label="Valor del inventario"
          prefix="RD$"
          value={formattedInventoryValue}
        />
      </section>

      {/* Barra de filtros integrada con SegmentedControl y búsqueda */}
      <ProductsToolbar
        search={search}
        onSearch={handleSearchChange}
        filterCategory={filterCategory}
        onFilterCategory={handleCategoryChange}
        filterStatus={filterStatus}
        onFilterStatus={handleStatusChange}
        quickView={quickView}
        onChangeQuickView={handleQuickViewChange}
        quickViewOptions={quickViewOptions}
        categories={categories}
        searchInputRef={searchInputRef}
      />

      {/* Tabla Minimalista con TanStack Table */}
      <ProductsTable
        products={filtered}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        onView={(p) => {
          setTriggerElement(document.activeElement as HTMLElement | null);
          setDrawerProductId(p.id);
        }}
        onEdit={(p) => {
          setEditProduct(p);
          setAddModalOpen(true);
        }}
        onDelete={(id) => handleDelete(id)}
        onToggleStatus={handleToggleStatus}
        onPrintLabel={(prods) => setLabelModalProducts(prods)}
        onClearFilters={handleClearFilters}
        onExportPdf={handleExportPdf}
        isLoading={loading}
        onInlineUpdate={handleInlineUpdate}
      />

      {/* Panel de Detalle (Drawer lateral estilo Apple) */}
      <ProductDrawer
        open={Boolean(drawerProduct)}
        onClose={() => setDrawerProductId(null)}
        product={drawerProduct}
        onSave={handleSaveDrawerProduct}
        onNavigateNext={handleNavigateNext}
        onNavigatePrev={handleNavigatePrev}
        hasNext={hasNext}
        hasPrev={hasPrev}
        triggerElement={triggerElement}
      />

      {/* Barra Flotante de Acciones Masivas (Pill oscura estilo Apple) */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onChangeStatus={handleBulkStatusChange}
        onExport={handleBulkExport}
        onCancel={handleBulkCancel}
      />

      {/* Paleta de Comandos Accesible (⌘K / Ctrl+K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        products={products}
        onSelectProduct={(p) => {
          setTriggerElement(document.activeElement as HTMLElement | null);
          setDrawerProductId(p.id);
        }}
        onNewProduct={() => {
          setEditProduct(null);
          setIsNewScaleProductMode(quickView === 'scale');
          setAddModalOpen(true);
        }}
        onFilterLowStock={() => handleQuickViewChange('low_stock')}
        onFilterScale={() => handleQuickViewChange('scale')}
        onFilterInactive={() => handleQuickViewChange('inactive')}
        onOpenCategories={() => toast.info('Gestión de categorías disponible próximamente')}
        onOpenBrands={() => toast.info('Gestión de marcas disponible próximamente')}
        onImportScale={() => {
          setImportIsScaleMode(true);
          setImportModalOpen(true);
        }}
        onExportPdf={handleExportPdf}
      />
    </div>
  );
}