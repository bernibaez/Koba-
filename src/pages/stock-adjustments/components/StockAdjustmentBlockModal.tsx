import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Sliders,
  Check,
  Package,
  Plus,
  Minus,
  RotateCcw,
  CheckSquare,
  Square,
  MinusSquare,
  Sparkles,
  Filter,
} from 'lucide-react';
import type { ProductItem } from '../types';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';

interface StockAdjustmentBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogProducts: ProductItem[];
  categoriesList: string[];
  onApplyAdjustments: (
    adjustments: { product: ProductItem; newQty: number; reason: string }[]
  ) => Promise<void>;
}

export default function StockAdjustmentBlockModal({
  isOpen,
  onClose,
  catalogProducts,
  categoriesList,
  onApplyAdjustments,
}: StockAdjustmentBlockModalProps) {
  const [blockSearch, setBlockSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [blockReason, setBlockReason] = useState('Conteo físico de inventario');
  const [physicalCounts, setPhysicalCounts] = useState<{ [productId: string]: number }>({});
  const [itemReasons, setItemReasons] = useState<{ [productId: string]: string }>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showOnlyModified, setShowOnlyModified] = useState(false);

  // Bulk actions state
  const [bulkActionType, setBulkActionType] = useState<'add' | 'subtract' | 'set'>('add');
  const [bulkAmount, setBulkAmount] = useState<string>('');
  const [bulkReasonInput, setBulkReasonInput] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Initialize physical counts when opening
  useEffect(() => {
    if (isOpen && catalogProducts.length > 0) {
      const counts: { [productId: string]: number } = {};
      catalogProducts.forEach((p) => {
        counts[p.id] = p.currentStock;
      });
      setPhysicalCounts(counts);
      setBlockSearch('');
      setSelectedCategory('all');
      setItemReasons({});
      setSelectedIds(new Set());
      setShowOnlyModified(false);
      setBulkAmount('');
      setBulkReasonInput('');
    }
  }, [isOpen, catalogProducts]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, saving]);

  // All modified products in the whole catalog (independent of current filters)
  const allModifiedProducts = useMemo(() => {
    return catalogProducts.filter((p) => {
      const currentVal = physicalCounts[p.id];
      return currentVal !== undefined && currentVal !== p.currentStock;
    });
  }, [catalogProducts, physicalCounts]);

  const totalModifiedCount = allModifiedProducts.length;

  // Filter products by search, category & "only modified" toggle
  const matchingProducts = useMemo(() => {
    const q = blockSearch.toLowerCase().trim();
    return catalogProducts.filter((p) => {
      if (showOnlyModified) {
        const currentVal = physicalCounts[p.id];
        if (currentVal === undefined || currentVal === p.currentStock) {
          return false;
        }
      }

      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      if (!matchCat) return false;

      if (!q) return true;

      const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
      const skuMatch = p.sku ? p.sku.toLowerCase().includes(q) : false;
      const catMatch = p.category ? p.category.toLowerCase().includes(q) : false;
      const barMatch = p.barcode ? p.barcode.toLowerCase().includes(q) : false;

      return nameMatch || skuMatch || catMatch || barMatch;
    });
  }, [catalogProducts, blockSearch, selectedCategory, showOnlyModified, physicalCounts]);

  // Selection helpers
  const allMatchingSelected = useMemo(() => {
    if (matchingProducts.length === 0) return false;
    return matchingProducts.every((p) => selectedIds.has(p.id));
  }, [matchingProducts, selectedIds]);

  const someMatchingSelected = useMemo(() => {
    if (allMatchingSelected || matchingProducts.length === 0) return false;
    return matchingProducts.some((p) => selectedIds.has(p.id));
  }, [matchingProducts, selectedIds, allMatchingSelected]);

  const handleToggleSelectAll = () => {
    if (allMatchingSelected) {
      // Deselect visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        matchingProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        matchingProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Bulk operation on selected items
  const handleApplyBulkOperation = () => {
    const amount = parseFloat(bulkAmount);
    if (isNaN(amount) && !bulkReasonInput.trim()) return;

    setPhysicalCounts((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        const prod = catalogProducts.find((p) => p.id === id);
        if (!prod) return;

        const currentVal = next[id] !== undefined ? next[id] : prod.currentStock;

        if (!isNaN(amount)) {
          if (bulkActionType === 'add') {
            next[id] = Math.max(0, currentVal + amount);
          } else if (bulkActionType === 'subtract') {
            next[id] = Math.max(0, currentVal - amount);
          } else if (bulkActionType === 'set') {
            next[id] = Math.max(0, amount);
          }
        }
      });
      return next;
    });

    if (bulkReasonInput.trim()) {
      setItemReasons((prev) => {
        const next = { ...prev };
        selectedIds.forEach((id) => {
          next[id] = bulkReasonInput.trim();
        });
        return next;
      });
    }

    setBulkAmount('');
  };

  // Revert a single product back to current stock
  const handleRevertItem = (p: ProductItem) => {
    setPhysicalCounts((prev) => ({
      ...prev,
      [p.id]: p.currentStock,
    }));
    setItemReasons((prev) => {
      const next = { ...prev };
      delete next[p.id];
      return next;
    });
  };

  // Revert all modified items
  const handleRevertAll = () => {
    if (totalModifiedCount === 0) return;
    const counts: { [productId: string]: number } = {};
    catalogProducts.forEach((p) => {
      counts[p.id] = p.currentStock;
    });
    setPhysicalCounts(counts);
    setItemReasons({});
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Collect ALL modified products across the catalog
    const toApply: { product: ProductItem; newQty: number; reason: string }[] = [];

    catalogProducts.forEach((p) => {
      const newStock = physicalCounts[p.id];
      if (newStock !== undefined && newStock !== p.currentStock) {
        toApply.push({
          product: p,
          newQty: Math.max(0, newStock),
          reason: itemReasons[p.id] || blockReason || 'Ajuste de inventario por bloque',
        });
      }
    });

    if (toApply.length === 0) return;

    setSaving(true);
    try {
      await onApplyAdjustments(toApply);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-adj-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[var(--surface)] text-[var(--ink)] shadow-2xl border border-[var(--line)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <Sliders size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="block-adj-modal-title" className="text-base font-semibold text-[var(--ink)]">
                  Ajuste de Stock por Bloque y Selección
                </h2>
                {totalModifiedCount > 0 && (
                  <span className="apple-badge apple-badge-success text-[10px]">
                    {totalModifiedCount} modificado{totalModifiedCount === 1 ? '' : 's'}
                  </span>
                )}
                {selectedIds.size > 0 && (
                  <span className="apple-badge apple-badge-accent text-[10px]">
                    {selectedIds.size} seleccionado{selectedIds.size === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--ink2)]">
                Selecciona productos con casillas, aplica operaciones en lote (+ / - / =) o edita el conteo físico de cada renglón
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {totalModifiedCount > 0 && (
              <button
                type="button"
                onClick={handleRevertAll}
                title="Revertir todos los cambios"
                className="apple-btn-secondary text-xs !h-8 !px-2.5 inline-flex items-center gap-1 cursor-pointer text-rose-600 dark:text-rose-400"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Restablecer todo</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Cerrar modal"
              className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filters & Reason controls */}
        <div className="p-4 sm:px-6 bg-[var(--surface2)]/40 border-b border-[var(--line)] space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            {/* Search */}
            <div className="sm:col-span-5 relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink2)] pointer-events-none"
              />
              <input
                type="text"
                value={blockSearch}
                onChange={(e) => setBlockSearch(e.target.value)}
                placeholder="Buscar por nombre, código de barra, SKU..."
                className="apple-input w-full pl-8 text-xs !h-8"
                autoFocus
              />
              {blockSearch && (
                <button
                  type="button"
                  onClick={() => setBlockSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink2)] hover:text-[var(--ink)] p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category */}
            <div className="sm:col-span-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="apple-select w-full text-xs !h-8"
              >
                <option value="all">Todas las categorías ({catalogProducts.length})</option>
                {categoriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle show only modified */}
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOnlyModified((prev) => !prev)}
                className={`text-xs !h-8 px-3 rounded-lg border transition-colors inline-flex items-center gap-1.5 cursor-pointer w-full justify-center ${
                  showOnlyModified
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-medium shadow-xs'
                    : 'bg-[var(--surface)] text-[var(--ink2)] hover:text-[var(--ink)] border-[var(--line)] hover:bg-[var(--surface2)]'
                }`}
              >
                <Filter size={12} />
                <span>Ver modificados</span>
                {totalModifiedCount > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      showOnlyModified ? 'bg-white/20 text-white' : 'bg-[var(--surface2)] text-[var(--ink)]'
                    }`}
                  >
                    {totalModifiedCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* General Reason */}
          <div>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Motivo general del ajuste (ej. Conteo físico de inventario de fin de mes)..."
              className="apple-input w-full text-xs !h-8"
            />
          </div>
        </div>

        {/* Bulk Action Toolbar (Appears when items are checked) */}
        {selectedIds.size > 0 && (
          <div className="px-4 sm:px-6 py-2.5 bg-[var(--accent)]/8 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[var(--accent)]" />
                <span>{selectedIds.size} seleccionados:</span>
              </span>

              {/* Action type buttons */}
              <div className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5">
                <button
                  type="button"
                  onClick={() => setBulkActionType('add')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    bulkActionType === 'add'
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'text-[var(--ink2)] hover:text-[var(--ink)]'
                  }`}
                >
                  + Sumar
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActionType('subtract')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    bulkActionType === 'subtract'
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'text-[var(--ink2)] hover:text-[var(--ink)]'
                  }`}
                >
                  - Restar
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActionType('set')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    bulkActionType === 'set'
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'text-[var(--ink2)] hover:text-[var(--ink)]'
                  }`}
                >
                  = Fijar en
                </button>
              </div>

              {/* Bulk quantity input */}
              <input
                type="number"
                min={0}
                placeholder="Cantidad"
                value={bulkAmount}
                onChange={(e) => setBulkAmount(e.target.value)}
                className="apple-input w-24 text-center font-mono font-semibold text-xs !h-7.5 tabular-nums"
              />

              {/* Bulk reason optional input */}
              <input
                type="text"
                placeholder="Motivo común (opcional)"
                value={bulkReasonInput}
                onChange={(e) => setBulkReasonInput(e.target.value)}
                className="apple-input w-44 text-xs !h-7.5 hidden md:inline-block"
              />

              <button
                type="button"
                onClick={handleApplyBulkOperation}
                disabled={!bulkAmount && !bulkReasonInput}
                className="apple-btn-primary text-xs !h-7.5 !px-3 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Check size={12} />
                <span>Aplicar a selección</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-xs text-[var(--ink2)] hover:text-[var(--ink)] underline cursor-pointer"
            >
              Deseleccionar todos
            </button>
          </div>
        )}

        {/* Products Table (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 select-none">
          {matchingProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--ink2)] space-y-2">
              <Package size={28} className="mx-auto opacity-40 text-[var(--ink2)]" />
              <p className="font-semibold text-[var(--ink)]">No se encontraron productos</p>
              <p className="text-[11px]">
                {showOnlyModified
                  ? 'No hay productos con conteos modificados actualmente.'
                  : 'Prueba escribiendo otro término o cambiando la categoría'}
              </p>
              {showOnlyModified && (
                <button
                  type="button"
                  onClick={() => setShowOnlyModified(false)}
                  className="apple-btn-secondary text-xs !h-7.5 !px-3 mt-2"
                >
                  Mostrar todos los productos
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--line)] overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface2)] text-[var(--ink2)] font-medium">
                    {/* Select All Checkbox */}
                    <th className="py-2.5 px-3 w-9 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        title={allMatchingSelected ? 'Deseleccionar todos' : 'Seleccionar todos los visibles'}
                        className="text-[var(--ink2)] hover:text-[var(--accent)] transition-colors p-0.5 cursor-pointer inline-flex items-center justify-center"
                      >
                        {allMatchingSelected ? (
                          <CheckSquare size={15} className="text-[var(--accent)]" />
                        ) : someMatchingSelected ? (
                          <MinusSquare size={15} className="text-[var(--accent)]" />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-3">Producto / SKU</th>
                    <th className="py-2.5 px-2.5">Categoría</th>
                    <th className="py-2.5 px-2.5 text-center">Stock Actual</th>
                    <th className="py-2.5 px-2.5 text-center">Nuevo Conteo Físico</th>
                    <th className="py-2.5 px-2.5 text-center">Variación</th>
                    <th className="py-2.5 px-3">Motivo Renglón</th>
                    <th className="py-2.5 px-2.5 text-center w-12">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {matchingProducts.map((p) => {
                    const currentVal =
                      physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : p.currentStock;
                    const delta = currentVal - p.currentStock;
                    const isChanged = delta !== 0;
                    const isSelected = selectedIds.has(p.id);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent)]/10'
                            : isChanged
                              ? 'bg-[var(--accent)]/5'
                              : 'hover:bg-[var(--surface2)]/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectRow(p.id)}
                            className="p-0.5 text-[var(--ink2)] hover:text-[var(--accent)] transition-colors cursor-pointer inline-flex items-center justify-center"
                          >
                            {isSelected ? (
                              <CheckSquare size={15} className="text-[var(--accent)]" />
                            ) : (
                              <Square size={15} />
                            )}
                          </button>
                        </td>

                        {/* Product info */}
                        <td className="py-2 px-3 min-w-[160px]">
                          <p className="font-medium text-[var(--ink)] truncate">{p.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink2)] font-mono">
                            {p.sku && <span>SKU: {p.sku}</span>}
                            {p.barcode && <span>• Barcode: {p.barcode}</span>}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="apple-badge apple-badge-neutral text-[10px]">
                            {p.category || 'General'}
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td className="py-2 px-2.5 text-center font-mono tabular-nums text-[var(--ink2)] whitespace-nowrap">
                          {p.currentStock} {p.unit}
                        </td>

                        {/* Physical Count with quick steppers */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setPhysicalCounts((prev) => ({
                                  ...prev,
                                  [p.id]: Math.max(0, currentVal - 1),
                                }));
                              }}
                              className="w-6 h-6 rounded-md bg-[var(--surface2)] border border-[var(--line)] text-[var(--ink2)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                              title="Restar 1"
                            >
                              <Minus size={11} />
                            </button>

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
                              className={`apple-input w-20 text-center font-mono font-semibold text-xs !h-7.5 tabular-nums ${
                                isChanged ? '!border-[var(--accent)] !text-[var(--accent)]' : ''
                              }`}
                            />

                            <button
                              type="button"
                              onClick={() => {
                                setPhysicalCounts((prev) => ({
                                  ...prev,
                                  [p.id]: currentVal + 1,
                                }));
                              }}
                              className="w-6 h-6 rounded-md bg-[var(--surface2)] border border-[var(--line)] text-[var(--ink2)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                              title="Sumar 1"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </td>

                        {/* Delta */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          {delta === 0 ? (
                            <span className="text-[11px] text-[var(--ink2)]">Sin cambio</span>
                          ) : (
                            <span
                              className={`font-mono font-semibold text-[11px] tabular-nums ${
                                delta > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {delta > 0 ? `+${delta}` : `${delta}`} {p.unit}
                            </span>
                          )}
                        </td>

                        {/* Item reason */}
                        <td className="py-2 px-3">
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
                            className="apple-input w-full text-xs !h-7.5"
                          />
                        </td>

                        {/* Revert Row Button */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          {isChanged ? (
                            <button
                              type="button"
                              onClick={() => handleRevertItem(p)}
                              title="Revertir este producto al stock actual"
                              className="p-1 rounded-md text-[var(--ink2)] hover:text-rose-600 hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                            >
                              <RotateCcw size={13} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-[var(--ink2)] opacity-40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[var(--line)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3 text-xs text-[var(--ink2)]">
            <span>
              Mostrando <strong className="text-[var(--ink)]">{matchingProducts.length}</strong> de {catalogProducts.length} productos
            </span>
            {selectedIds.size > 0 && (
              <span className="text-[var(--accent)] font-medium">
                • {selectedIds.size} seleccionados
              </span>
            )}
            {totalModifiedCount > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                • {totalModifiedCount} modificado(s) listos para aplicar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="apple-btn-secondary text-xs !h-8 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || totalModifiedCount === 0}
              className="apple-btn-primary text-xs !h-8 !px-4 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {saving ? <ButtonSpinner /> : <Check size={14} />}
              <span>
                {saving
                  ? 'Aplicando…'
                  : `Aplicar ajustes (${totalModifiedCount} cambiado${totalModifiedCount === 1 ? '' : 's'})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
