import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Sliders, Check, Package, AlertTriangle } from 'lucide-react';
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

  // Filter products by search & category
  const matchingProducts = useMemo(() => {
    const q = blockSearch.toLowerCase().trim();
    return catalogProducts.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.barcode.includes(q);

      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [catalogProducts, blockSearch, selectedCategory]);

  // Count modified items
  const modifiedCount = useMemo(() => {
    return matchingProducts.filter((p) => {
      const currentVal = physicalCounts[p.id];
      return currentVal !== undefined && currentVal !== p.currentStock;
    }).length;
  }, [matchingProducts, physicalCounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toApply: { product: ProductItem; newQty: number; reason: string }[] = [];

    matchingProducts.forEach((p) => {
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
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[var(--surface)] text-[var(--ink)] shadow-2xl border border-[var(--line)] overflow-hidden animate-in zoom-in-95 duration-150"
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
                  Ajuste de Stock por Bloque
                </h2>
                {modifiedCount > 0 && (
                  <span className="apple-badge apple-badge-success text-[10px]">
                    {modifiedCount} modificado{modifiedCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--ink2)]">
                Filtra por grupo o categoría para ingresar el conteo físico real de inventario
              </p>
            </div>
          </div>

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

        {/* Filters & Reason controls */}
        <div className="p-4 sm:px-6 bg-[var(--surface2)]/40 border-b border-[var(--line)] space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink2)] pointer-events-none"
              />
              <input
                type="text"
                value={blockSearch}
                onChange={(e) => setBlockSearch(e.target.value)}
                placeholder="Escribe término o producto (ej. arroz, leche, aceite, SKU)..."
                className="apple-input w-full pl-8 text-xs !h-8"
                autoFocus
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="apple-select w-full text-xs !h-8"
              >
                <option value="all">Todas las categorías</option>
                {categoriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

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

        {/* Products Table (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 select-none">
          {matchingProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--ink2)] space-y-2">
              <Package size={28} className="mx-auto opacity-40 text-[var(--ink2)]" />
              <p className="font-semibold text-[var(--ink)]">No se encontraron productos</p>
              <p className="text-[11px]">Prueba escribiendo otro término o cambiando la categoría</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--line)] overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface2)] text-[var(--ink2)] font-medium">
                    <th className="py-2 px-3">Producto / SKU</th>
                    <th className="py-2 px-2.5">Categoría</th>
                    <th className="py-2 px-2.5 text-center">Stock Actual</th>
                    <th className="py-2 px-2.5 text-center">Nuevo Stock Físico</th>
                    <th className="py-2 px-2.5 text-center">Variación</th>
                    <th className="py-2 px-3">Motivo Renglón</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {matchingProducts.map((p) => {
                    const currentVal =
                      physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : p.currentStock;
                    const delta = currentVal - p.currentStock;
                    const isChanged = delta !== 0;

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isChanged ? 'bg-[var(--accent)]/5' : 'hover:bg-[var(--surface2)]/40'
                        }`}
                      >
                        <td className="py-2 px-3 min-w-[150px]">
                          <p className="font-medium text-[var(--ink)] truncate">{p.name}</p>
                          <p className="font-mono text-[10px] text-[var(--ink2)]">{p.sku}</p>
                        </td>

                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="apple-badge apple-badge-neutral text-[10px]">
                            {p.category || 'General'}
                          </span>
                        </td>

                        <td className="py-2 px-2.5 text-center font-mono tabular-nums text-[var(--ink2)] whitespace-nowrap">
                          {p.currentStock} {p.unit}
                        </td>

                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
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
                              isChanged ? '!border-[var(--accent)]' : ''
                            }`}
                          />
                        </td>

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
          <div className="text-xs text-[var(--ink2)]">
            <span>{matchingProducts.length} productos en lista</span>
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
              disabled={saving || modifiedCount === 0}
              className="apple-btn-primary text-xs !h-8 !px-4 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <ButtonSpinner /> : <Check size={14} />}
              <span>
                {saving
                  ? 'Aplicando…'
                  : `Aplicar ajustes (${modifiedCount} cambiado${modifiedCount === 1 ? '' : 's'})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
