import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { exportTableToPdf } from '@/lib/exportPdf';
import type { ProductItem, StockAdjustmentItem, StockAdjustmentTypeFilter } from './stock-adjustments/types';
import { ADJUSTMENT_TYPE_CONFIG } from './stock-adjustments/types';
import { obtenerHistorialAjustes, procesarAjusteStockBloque } from '@/services/inventario.service';
import { useProductos } from '@/hooks/useProductos';
import { toast } from '@/lib/toast';
import { useAuth } from '@/context/AuthContext';

import StockAdjustmentsHeader from './stock-adjustments/components/StockAdjustmentsHeader';
import StockAdjustmentsMetrics from './stock-adjustments/components/StockAdjustmentsMetrics';
import StockAdjustmentsToolbar from './stock-adjustments/components/StockAdjustmentsToolbar';
import StockAdjustmentsTable from './stock-adjustments/components/StockAdjustmentsTable';
import StockAdjustmentSingleModal from './stock-adjustments/components/StockAdjustmentSingleModal';
import StockAdjustmentBlockModal from './stock-adjustments/components/StockAdjustmentBlockModal';
import StockAdjustmentDetailDrawer from './stock-adjustments/components/StockAdjustmentDetailDrawer';

export default function StockAdjustmentsPage() {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState<StockAdjustmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<StockAdjustmentTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals & Drawers
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleModalProduct, setSingleModalProduct] = useState<ProductItem | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [detailItem, setDetailItem] = useState<StockAdjustmentItem | null>(null);

  const { productosUi, refetch: refetchProductos } = useProductos({
    pagina: 1,
    limite: 500,
    estado: 'todos',
  });

  const catalogProducts = useMemo(() => {
    return (productosUi || []) as ProductItem[];
  }, [productosUi]);

  const refreshData = async () => {
    setLoading(true);
    await refetchProductos();
    try {
      const hist = await obtenerHistorialAjustes({ pagina: 1, limite: 200 });
      const byId = new Map(catalogProducts.map((p) => [p.id, p]));
      setAdjustments(
        hist.datos.map((a) => {
          const prod = byId.get(a.producto_id);
          const created = new Date(a.creado_en);
          return {
            id: a.id,
            code: a.codigo,
            productId: a.producto_id,
            productName: prod?.name ?? 'Producto',
            sku: prod?.sku ?? '',
            category: prod?.category ?? '',
            type: a.tipo_ajuste,
            qty: Math.abs(a.cantidad_variacion),
            previousQty: a.cantidad_anterior,
            newQty: a.cantidad_nueva,
            reason: a.motivo,
            date: created.toISOString().slice(0, 10),
            time: created.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
            responsible: user?.name ?? 'Sistema',
          } as StockAdjustmentItem;
        })
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar historial de ajustes');
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productosUi.length]);

  // Global hotkeys: "N" for single product adjustment, "A" for block adjustment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (!isInput && !showBlockModal && !showSingleModal && !detailItem) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setSingleModalProduct(null);
          setShowSingleModal(true);
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setShowBlockModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBlockModal, showSingleModal, detailItem]);

  // Extract unique categories
  const categoriesList = useMemo(() => {
    return Array.from(new Set(catalogProducts.map((p) => p.category))).filter(Boolean);
  }, [catalogProducts]);

  // Filtered History Adjustments
  const filteredAdjustments = useMemo(() => {
    const q = search.toLowerCase().trim();
    return adjustments.filter((a) => {
      const matchSearch =
        !q ||
        a.code.toLowerCase().includes(q) ||
        a.productName.toLowerCase().includes(q) ||
        a.sku.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.responsible.toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || a.type === typeFilter;
      const matchCat = categoryFilter === 'all' || a.category === categoryFilter;

      return matchSearch && matchType && matchCat;
    });
  }, [adjustments, search, typeFilter, categoryFilter]);

  const handleApplySingleAdjustment = async (adj: {
    product: ProductItem;
    tipo: 'entrada' | 'salida' | 'perdida';
    newQty: number;
    reason: string;
  }) => {
    try {
      await procesarAjusteStockBloque([
        {
          producto_id: adj.product.id,
          tipo_ajuste: adj.tipo,
          cantidad_nueva: adj.newQty,
          motivo: adj.reason,
          responsable_id: user?.id ?? null,
        },
      ]);
      await refreshData();
      toast.success(`Ajuste de stock aplicado a "${adj.product.name}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al aplicar el ajuste de stock');
      throw e;
    }
  };

  const handleAdjustProductById = (productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    if (prod) {
      setSingleModalProduct(prod);
      setShowSingleModal(true);
    }
  };

  const handleApplyBlockAdjustments = async (
    adjustmentsToApply: { product: ProductItem; newQty: number; reason: string }[]
  ) => {
    try {
      await procesarAjusteStockBloque(
        adjustmentsToApply.map((a) => ({
          producto_id: a.product.id,
          tipo_ajuste:
            a.newQty > a.product.currentStock
              ? 'entrada'
              : a.reason.toLowerCase().includes('perd')
                ? 'perdida'
                : 'salida',
          cantidad_nueva: a.newQty,
          motivo: a.reason,
          responsable_id: user?.id ?? null,
        }))
      );
      await refreshData();
      toast.success(
        `Se aplicaron ajustes a ${adjustmentsToApply.length} producto(s) exitosamente`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al aplicar ajustes');
      throw e;
    }
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Ajustes de Stock de Inventario',
      filename: 'reporte-ajustes-stock',
      headers: [
        'Código',
        'Producto',
        'SKU',
        'Tipo',
        'Cant. Ajustada',
        'Stock Previo',
        'Nuevo Stock',
        'Motivo',
        'Fecha',
        'Responsable',
      ],
      rows: filteredAdjustments.map((a) => [
        a.code,
        a.productName,
        a.sku,
        ADJUSTMENT_TYPE_CONFIG[a.type]?.label ?? a.type,
        a.type === 'entrada' ? `+${a.qty}` : `-${a.qty}`,
        a.previousQty,
        a.newQty,
        a.reason,
        `${a.date} ${a.time}`,
        a.responsible,
      ]),
      landscape: true,
    });
  };

  const hasFilters = Boolean(search) || typeFilter !== 'all' || categoryFilter !== 'all';

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {/* Header */}
        <StockAdjustmentsHeader
          onOpenSingleModal={() => {
            setSingleModalProduct(null);
            setShowSingleModal(true);
          }}
          onOpenBlockModal={() => setShowBlockModal(true)}
          totalAdjustmentsCount={adjustments.length}
        />

        {/* Metrics */}
        <StockAdjustmentsMetrics adjustments={adjustments} />

        {/* Toolbar */}
        <StockAdjustmentsToolbar
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categoriesList={categoriesList}
          onExportPdf={handleExportPdf}
          filteredCount={filteredAdjustments.length}
        />

        {/* Table */}
        <StockAdjustmentsTable
          adjustments={filteredAdjustments}
          isLoading={loading && adjustments.length === 0}
          onSelect={(item) => setDetailItem(item)}
          onAdjustProduct={handleAdjustProductById}
          hasFilters={hasFilters}
          onClearFilters={() => {
            setSearch('');
            setTypeFilter('all');
            setCategoryFilter('all');
          }}
        />
      </div>

      {/* Single Product Adjustment Modal */}
      <StockAdjustmentSingleModal
        isOpen={showSingleModal}
        onClose={() => {
          setShowSingleModal(false);
          setSingleModalProduct(null);
        }}
        catalogProducts={catalogProducts}
        preselectedProduct={singleModalProduct}
        onApplyAdjustment={handleApplySingleAdjustment}
      />

      {/* Block Adjustment Modal */}
      <StockAdjustmentBlockModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        catalogProducts={catalogProducts}
        categoriesList={categoriesList}
        onApplyAdjustments={handleApplyBlockAdjustments}
      />

      {/* Detail Drawer */}
      <StockAdjustmentDetailDrawer
        item={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
      />
    </AppLayout>
  );
}
