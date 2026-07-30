import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Sliders,
  CheckCircle2,
  Package,
  Layers,
  X,
  Check,
  RotateCcw,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { exportTableToPdf } from '@/lib/exportPdf';
import { getStoredProducts, ProductItem } from '@/lib/productStore';
import {
  getStoredAdjustments,
  createBlockStockAdjustment,
  StockAdjustmentItem,
} from '@/lib/stockAdjustmentStore';
import { toast } from 'sonner';

const typeMap = {
  entrada: { label: 'Entrada (+)', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  salida: { label: 'Salida (-)', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  perdida: { label: 'Pérdida / Daño', cls: 'bg-danger-bg text-danger border-danger/20' },
};

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustmentItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State for Block Adjustment
  const [showModal, setShowModal] = useState(false);
  const [blockSearch, setBlockSearch] = useState('arroz'); // Default search prefilled with "arroz" for demonstration!
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [blockReason, setBlockReason] = useState('Conteo físico de inventario');
  const [detailItem, setDetailItem] = useState<StockAdjustmentItem | null>(null);

  // Products from Store
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);

  // State for physical stock inputs in the block modal: map of productId -> number
  const [physicalCounts, setPhysicalCounts] = useState<{ [productId: string]: number }>({});
  const [itemReasons, setItemReasons] = useState<{ [productId: string]: string }>({});

  const refreshData = () => {
    const storedProds = getStoredProducts();
    setCatalogProducts(storedProds);
    const storedAdjs = getStoredAdjustments();
    setAdjustments(storedAdjs);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // When opening modal or searching, initialize physical counts
  useEffect(() => {
    if (showModal && catalogProducts.length > 0) {
      const counts: { [productId: string]: number } = {};
      catalogProducts.forEach((p) => {
        counts[p.id] = p.currentStock;
      });
      setPhysicalCounts(counts);
    }
  }, [showModal, catalogProducts]);

  // Extract unique categories
  const categoriesList = Array.from(new Set(catalogProducts.map((p) => p.category))).filter(Boolean);

  // Filtered Products in Block Modal
  const matchingBlockProducts = catalogProducts.filter((p) => {
    const matchSearch =
      !blockSearch.trim() ||
      p.name.toLowerCase().includes(blockSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(blockSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(blockSearch.toLowerCase()) ||
      p.barcode.includes(blockSearch);

    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;

    return matchSearch && matchCat;
  });

  // Count modified items in current block modal
  const modifiedCount = matchingBlockProducts.filter((p) => {
    const currentVal = physicalCounts[p.id];
    return currentVal !== undefined && currentVal !== p.currentStock;
  }).length;

  // Filtered History Adjustments Table
  const filteredAdjustments = adjustments.filter((a) => {
    const matchSearch =
      !search.trim() ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.productName.toLowerCase().includes(search.toLowerCase()) ||
      a.sku.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase()) ||
      a.responsible.toLowerCase().includes(search.toLowerCase());

    const matchType = typeFilter === 'all' || a.type === typeFilter;
    const matchCat = categoryFilter === 'all' || a.category === categoryFilter;

    return matchSearch && matchType && matchCat;
  });

  const totalEntradas = adjustments.filter((a) => a.type === 'entrada').reduce((sum, a) => sum + a.qty, 0);
  const totalSalidas = adjustments.filter((a) => a.type === 'salida').reduce((sum, a) => sum + a.qty, 0);
  const totalPerdidas = adjustments.filter((a) => a.type === 'perdida').reduce((sum, a) => sum + a.qty, 0);

  const handleSaveBlockAdjustment = () => {
    const adjustmentsToApply: { product: ProductItem; newQty: number; reason: string }[] = [];

    matchingBlockProducts.forEach((p) => {
      const newStock = physicalCounts[p.id];
      if (newStock !== undefined && newStock !== p.currentStock) {
        adjustmentsToApply.push({
          product: p,
          newQty: Math.max(0, newStock),
          reason: itemReasons[p.id] || blockReason || 'Ajuste de inventario por bloque',
        });
      }
    });

    if (adjustmentsToApply.length === 0) {
      toast.error('No has modificado existencias para ningún producto en este bloque');
      return;
    }

    const updated = createBlockStockAdjustment(adjustmentsToApply, 'Admin General');
    setAdjustments(updated);
    refreshData();
    setShowModal(false);
    toast.success(`✓ Se aplicaron ajustes a ${adjustmentsToApply.length} producto(s) exitosamente`);
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Ajustes de Stock de Inventario',
      filename: 'reporte-ajustes-stock',
      headers: ['Código', 'Producto', 'SKU', 'Tipo', 'Cant. Ajustada', 'Stock Previo', 'Nuevo Stock', 'Motivo', 'Fecha', 'Responsable'],
      rows: filteredAdjustments.map((a) => [
        a.code,
        a.productName,
        a.sku,
        typeMap[a.type]?.label ?? a.type,
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

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ajustes de Stock de Inventario</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Realiza ajustes masivos por categoría o por bloque de productos (ej. Arroz, Aceite, Lácteos)
            </p>
          </div>
          <button
            onClick={() => {
              setBlockSearch('arroz');
              setSelectedCategory('all');
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2 w-fit shadow-md py-2.5 px-4"
          >
            <Sliders size={18} />
            Ajustar por Bloque / Categoría
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4 flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Entradas Ajustadas</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{totalEntradas} unidades</p>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-3 border border-amber-500/20 bg-amber-500/5">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ArrowDownRight size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Salidas / Ajustes (-)</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{totalSalidas} unidades</p>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-3 border border-danger/20 bg-danger-bg/20">
            <div className="p-3 rounded-2xl bg-danger/15 text-danger">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pérdidas / Vencidos</p>
              <p className="text-2xl font-black text-danger mt-0.5">{totalPerdidas} unidades</p>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-field pl-10 h-10 text-sm"
              placeholder="Buscar historial por código, producto, SKU, motivo o responsable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filtrar por tipo de ajuste"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field h-10 text-xs font-bold w-auto"
            >
              <option value="all">Todos los Tipos</option>
              <option value="entrada">Entradas (+)</option>
              <option value="salida">Salidas (-)</option>
              <option value="perdida">Pérdidas / Dañados</option>
            </select>

            <select
              aria-label="Filtrar por categoría"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field h-10 text-xs font-bold w-auto"
            >
              <option value="all">Todas las Categorías</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-2 h-10 text-xs font-bold">
              <Download size={16} />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="text-left px-4 py-3.5">Código</th>
                  <th className="text-left px-4 py-3.5">Producto / SKU</th>
                  <th className="text-left px-4 py-3.5">Categoría</th>
                  <th className="text-left px-4 py-3.5">Tipo Ajuste</th>
                  <th className="text-center px-4 py-3.5">Stock Previo</th>
                  <th className="text-center px-4 py-3.5">Nuevo Stock</th>
                  <th className="text-center px-4 py-3.5">Variación</th>
                  <th className="text-left px-4 py-3.5 hidden lg:table-cell">Motivo</th>
                  <th className="text-left px-4 py-3.5 hidden md:table-cell">Fecha / Hora</th>
                  <th className="text-right px-4 py-3.5">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-muted-foreground text-sm">
                      No se encontraron registros de ajustes que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredAdjustments.map((a, i) => {
                    const typeConfig = typeMap[a.type] || typeMap.salida;
                    const delta = a.newQty - a.previousQty;

                    return (
                      <tr key={a.id} className={`hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                        <td className="px-4 py-3.5 font-mono text-primary font-bold">{a.code}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-foreground">{a.productName}</p>
                          <p className="text-xs font-mono text-muted-foreground">{a.sku}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-secondary text-foreground">
                            {a.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${typeConfig.cls}`}>
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-muted-foreground tabular-nums">
                          {a.previousQty} unds
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-foreground tabular-nums">
                          {a.newQty} unds
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`font-black text-xs px-2 py-0.5 rounded-md tabular-nums ${
                            delta > 0
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : delta < 0
                              ? 'bg-danger-bg text-danger'
                              : 'bg-secondary text-muted-foreground'
                          }`}>
                            {delta > 0 ? `+${delta}` : `${delta}`} unds
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs hidden lg:table-cell max-w-[200px] truncate">
                          {a.reason}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                          {a.date} <span className="font-mono text-[11px]">{a.time}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => setDetailItem(a)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PRINCIPAL: AJUSTE POR BLOQUE / CATEGORÍA */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <Sliders size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-lg">Ajuste de Stock por Bloque / Categoría</h3>
                  <p className="text-xs text-muted-foreground">
                    Escribe un término (ej. "arroz", "aceite") o selecciona una categoría para ajustar existencias en grupo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {modifiedCount > 0 && (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black rounded-xl animate-bounce">
                    {modifiedCount} producto(s) modificado(s)
                  </span>
                )}
                <button type="button" onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Controls Bar: Search & Category Picker */}
            <div className="p-5 border-b border-border bg-secondary/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search Bar */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-foreground mb-1">
                    Buscar Término o Grupo de Productos (ej. "Arroz")
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="text"
                      placeholder="Escribe arroz, carne, aceite o nombre de producto..."
                      value={blockSearch}
                      onChange={(e) => setBlockSearch(e.target.value)}
                      className="input-field pl-10 h-11 text-sm font-bold shadow-2xs"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1">Filtrar por Categoría</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field h-11 text-sm font-bold"
                  >
                    <option value="all">Todas las Categorías</option>
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Global Reason for Block Adjustment */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Motivo General del Ajuste de Inventario
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ej. Conteo físico de inventario mensual..."
                  className="input-field h-10 text-xs font-medium"
                />
              </div>
            </div>

            {/* Block Products Table */}
            <div className="p-5 overflow-y-auto flex-1 scrollbar-thin space-y-2">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-muted-foreground uppercase tracking-wider">
                  Productos encontrados en este Bloque ({matchingBlockProducts.length})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Ingresa la cantidad física real en el campo "Nuevo Stock"
                </span>
              </div>

              {matchingBlockProducts.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-border rounded-2xl text-center space-y-2">
                  <Package size={32} className="mx-auto text-muted-foreground opacity-50" />
                  <p className="font-bold text-foreground text-sm">No se encontraron productos en este bloque</p>
                  <p className="text-xs text-muted-foreground">
                    Prueba buscando otro término como "arroz", "aceite" o selecciona "Todas las Categorías".
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 text-muted-foreground font-black uppercase">
                      <tr>
                        <th className="p-3">Producto / SKU</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3 text-center">Stock Actual</th>
                        <th className="p-3 text-center">Nuevo Stock Físico</th>
                        <th className="p-3 text-center">Diferencia</th>
                        <th className="p-3">Motivo Renglón (Opcional)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {matchingBlockProducts.map((p) => {
                        const currentVal = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : p.currentStock;
                        const delta = currentVal - p.currentStock;
                        const isChanged = delta !== 0;

                        return (
                          <tr key={p.id} className={`transition-colors ${isChanged ? 'bg-primary/5' : 'hover:bg-secondary/20'}`}>
                            <td className="p-3">
                              <p className="font-extrabold text-foreground text-sm">{p.name}</p>
                              <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                            </td>
                            <td className="p-3 font-semibold text-muted-foreground">
                              <span className="px-2 py-0.5 bg-secondary rounded-md text-[11px] font-bold text-foreground">
                                {p.category}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-muted-foreground text-sm tabular-nums">
                              {p.currentStock} {p.unit}
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min={0}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setPhysicalCounts((prev) => ({
                                    ...prev,
                                    [p.id]: isNaN(val) ? 0 : Math.max(0, val),
                                  }));
                                }}
                                className={`input-field w-24 text-center font-black text-sm h-10 tabular-nums ${
                                  isChanged ? 'border-primary ring-2 ring-primary/20 text-primary' : ''
                                }`}
                              />
                            </td>
                            <td className="p-3 text-center">
                              {delta === 0 ? (
                                <span className="text-muted-foreground font-semibold">Sin cambio</span>
                              ) : (
                                <span
                                  className={`px-2.5 py-1 rounded-xl text-xs font-black tabular-nums ${
                                    delta > 0
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                      : 'bg-danger-bg text-danger border border-danger/30'
                                  }`}
                                >
                                  {delta > 0 ? `+${delta}` : `${delta}`} {p.unit}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder={blockReason}
                                value={itemReasons[p.id] || ''}
                                onChange={(e) =>
                                  setItemReasons((prev) => ({
                                    ...prev,
                                    [p.id]: e.target.value,
                                  }))
                                }
                                className="input-field text-xs h-9"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-secondary/20">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary text-xs px-4 py-2.5 font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveBlockAdjustment}
                disabled={modifiedCount === 0}
                className="btn-primary text-xs px-6 py-2.5 font-black flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <Check size={16} />
                Aplicar Ajustes del Bloque ({modifiedCount} modificado{modifiedCount === 1 ? '' : 's'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/15 text-primary rounded-xl">
                  <Sliders size={20} />
                </div>
                <h3 className="font-extrabold text-foreground text-base">Detalle de Ajuste</h3>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground font-bold">Código</span>
                <span className="font-mono font-bold text-primary">{detailItem.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground font-bold">Producto</span>
                <span className="font-extrabold text-foreground">{detailItem.productName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground font-bold">SKU</span>
                <span className="font-mono text-muted-foreground">{detailItem.sku}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground font-bold">Categoría</span>
                <span className="font-bold text-foreground">{detailItem.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground font-bold">Stock Previo</span>
                <span className="font-bold text-foreground">{detailItem.previousQty} unds</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground font-bold">Nuevo Stock</span>
                <span className="font-bold text-foreground">{detailItem.newQty} unds</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground font-bold">Motivo</span>
                <span className="font-medium text-foreground">{detailItem.reason}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground font-bold">Fecha / Responsable</span>
                <span className="font-medium text-foreground">{detailItem.date} {detailItem.time} — {detailItem.responsible}</span>
              </div>
            </div>

            <button onClick={() => setDetailItem(null)} className="btn-secondary w-full py-2.5 text-xs font-bold">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
