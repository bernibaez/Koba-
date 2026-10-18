import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Sliders, Check, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import type { ProductItem } from '../types';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';

interface StockAdjustmentSingleModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogProducts: ProductItem[];
  preselectedProduct?: ProductItem | null;
  onApplyAdjustment: (adjustment: {
    product: ProductItem;
    tipo: 'entrada' | 'salida' | 'perdida';
    newQty: number;
    reason: string;
  }) => Promise<void>;
}

type AdjustmentMode = 'conteo' | 'entrada' | 'salida' | 'perdida';

export default function StockAdjustmentSingleModal({
  isOpen,
  onClose,
  catalogProducts,
  preselectedProduct,
  onApplyAdjustment,
}: StockAdjustmentSingleModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [mode, setMode] = useState<AdjustmentMode>('conteo');
  const [inputQty, setInputQty] = useState<string>('');
  const [reason, setReason] = useState<string>('Conteo físico de inventario');
  const [saving, setSaving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedProduct) {
        setSelectedProduct(preselectedProduct);
        setInputQty(String(preselectedProduct.currentStock));
      } else {
        setSelectedProduct(null);
        setInputQty('');
      }
      setSearchQuery('');
      setMode('conteo');
      setReason('Conteo físico de inventario');
    }
  }, [isOpen, preselectedProduct]);

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

  // Filter products for autocomplete dropdown
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return catalogProducts.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return catalogProducts
      .filter((p) => {
        const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
        const skuMatch = p.sku ? p.sku.toLowerCase().includes(q) : false;
        const barMatch = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
        const catMatch = p.category ? p.category.toLowerCase().includes(q) : false;
        return nameMatch || skuMatch || barMatch || catMatch;
      })
      .slice(0, 20);
  }, [catalogProducts, searchQuery]);

  // Calculate new quantity based on mode
  const currentStock = selectedProduct ? selectedProduct.currentStock : 0;
  const numInput = parseFloat(inputQty) || 0;

  const { calculatedNewQty, delta, effectiveTipo } = useMemo(() => {
    if (!selectedProduct) return { calculatedNewQty: 0, delta: 0, effectiveTipo: 'entrada' as const };

    if (mode === 'conteo') {
      const newQ = Math.max(0, numInput);
      const diff = newQ - currentStock;
      const tipo = diff >= 0 ? ('entrada' as const) : ('salida' as const);
      return { calculatedNewQty: newQ, delta: diff, effectiveTipo: tipo };
    }
    if (mode === 'entrada') {
      const newQ = currentStock + Math.max(0, numInput);
      return { calculatedNewQty: newQ, delta: Math.max(0, numInput), effectiveTipo: 'entrada' as const };
    }
    if (mode === 'salida') {
      const newQ = Math.max(0, currentStock - Math.max(0, numInput));
      return { calculatedNewQty: newQ, delta: -Math.min(currentStock, Math.max(0, numInput)), effectiveTipo: 'salida' as const };
    }
    // perdida
    const newQ = Math.max(0, currentStock - Math.max(0, numInput));
    return { calculatedNewQty: newQ, delta: -Math.min(currentStock, Math.max(0, numInput)), effectiveTipo: 'perdida' as const };
  }, [selectedProduct, mode, numInput, currentStock]);

  const handleSelectProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setSearchQuery('');
    if (mode === 'conteo') {
      setInputQty(String(product.currentStock));
    } else {
      setInputQty('1');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (mode !== 'conteo' && numInput <= 0) {
      return;
    }

    setSaving(true);
    try {
      await onApplyAdjustment({
        product: selectedProduct,
        tipo: effectiveTipo,
        newQty: calculatedNewQty,
        reason: reason.trim() || 'Ajuste de inventario',
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const quickReasons = [
    'Conteo físico de inventario',
    'Merma / Producto dañado',
    'Vencimiento de fecha',
    'Error de digitación en venta',
    'Recepción no registrada',
    'Consumo interno / Demostración',
  ];

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface2)]/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--ink)]">
                Ajuste Individual de Stock
              </h2>
              <p className="text-[11px] text-[var(--ink2)]">
                Selecciona un producto específico para ingresar su conteo físico o variación
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Step 1: Select Product */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
              Producto a Ajustar <span className="text-red-500">*</span>
            </label>

            {selectedProduct ? (
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface2)]/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-[var(--ink)] truncate">
                      {selectedProduct.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--ink3)] font-mono mt-0.5">
                      <span>SKU: {selectedProduct.sku || 'N/A'}</span>
                      {selectedProduct.barcode && <span>• Barcode: {selectedProduct.barcode}</span>}
                      <span>• {selectedProduct.category || 'General'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--ink3)] block leading-none">Stock Actual</span>
                    <span className="font-mono font-bold text-xs text-[var(--ink)]">
                      {selectedProduct.currentStock} {selectedProduct.unit}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setInputQty('');
                    }}
                    className="p-1 rounded-md text-[var(--ink2)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Cambiar producto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink3)]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Escribe el nombre, código de barras o SKU del producto..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    autoFocus
                  />
                </div>

                {/* Product Search Results Dropdown */}
                <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] shadow-xs">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--ink3)]">
                      No se encontraron productos coincidentes
                    </div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="p-2.5 hover:bg-[var(--surface2)] transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-[var(--ink)] truncate">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-[var(--ink3)] font-mono">
                            {p.sku || p.barcode || 'Sin código'} • {p.category}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                            {p.currentStock} {p.unit}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedProduct && (
            <>
              {/* Step 2: Mode Selector */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Tipo de Ajuste
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                  {(
                    [
                      { id: 'conteo', label: 'Conteo Físico (=)' },
                      { id: 'entrada', label: 'Entrada (+)' },
                      { id: 'salida', label: 'Salida (-)' },
                      { id: 'perdida', label: 'Pérdida / Merma' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMode(m.id);
                        if (m.id === 'conteo') {
                          setInputQty(String(selectedProduct.currentStock));
                          setReason('Conteo físico de inventario');
                        } else if (m.id === 'perdida') {
                          setInputQty('1');
                          setReason('Merma / Producto dañado');
                        } else {
                          setInputQty('1');
                          setReason(m.id === 'entrada' ? 'Recepción de mercancía' : 'Salida de almacén');
                        }
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors text-center cursor-pointer whitespace-nowrap ${
                        mode === m.id
                          ? 'bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] font-semibold shadow-xs'
                          : 'text-[var(--ink2)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Quantity Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                    {mode === 'conteo'
                      ? `Nuevo Stock Físico Total (${selectedProduct.unit})`
                      : `Cantidad a ${mode === 'entrada' ? 'Sumar' : 'Restar'} (${selectedProduct.unit})`}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={inputQty}
                    onChange={(e) => setInputQty(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    autoFocus
                  />
                </div>

                {/* Calculation preview */}
                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]/40 flex flex-col justify-center">
                  <span className="text-[10px] text-[var(--ink3)] uppercase font-semibold">
                    Resultado tras el ajuste:
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-sm font-bold text-[var(--ink)]">
                      {calculatedNewQty} {selectedProduct.unit}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        delta > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : delta < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-[var(--ink3)]'
                      }`}
                    >
                      ({delta > 0 ? `+${delta}` : delta} {selectedProduct.unit})
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4: Reason */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Motivo de la Regularización <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explica el motivo del ajuste..."
                  className="w-full px-3 py-2 text-xs bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />

                {/* Quick reason pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickReasons.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`px-2 py-0.5 rounded-md text-[10px] border transition-colors cursor-pointer ${
                        reason === r
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30 font-medium'
                          : 'bg-[var(--surface2)] text-[var(--ink2)] border-[var(--border)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !selectedProduct}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {saving ? <ButtonSpinner /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Aplicando ajuste…' : 'Aplicar Ajuste de Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
