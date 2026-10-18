import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,
  AlertTriangle,
  Scale,
  EyeOff,
  Tag,
  Award,
  FileSpreadsheet,
  FileText,
  Package,
  CornerDownLeft,
  X,
} from 'lucide-react';
import type { Product } from './ProductManagementScreen';

const formatCurrencyDOP = (val: number) =>
  `RD$ ${val.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNewProduct: () => void;
  onFilterLowStock: () => void;
  onFilterScale: () => void;
  onFilterInactive: () => void;
  onOpenCategories: () => void;
  onOpenBrands: () => void;
  onImportScale: () => void;
  onExportPdf: () => void;
}

interface CommandAction {
  id: string;
  type: 'action';
  title: string;
  category: string;
  shortcut?: string;
  icon: React.ElementType;
  onSelect: () => void;
}

interface CommandProductItem {
  id: string;
  type: 'product';
  product: Product;
}

type PaletteItem = CommandAction | CommandProductItem;

export default function CommandPalette({
  open,
  onClose,
  products,
  onSelectProduct,
  onNewProduct,
  onFilterLowStock,
  onFilterScale,
  onFilterInactive,
  onOpenCategories,
  onOpenBrands,
  onImportScale,
  onExportPdf,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input and reset query on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Actions list
  const actions: CommandAction[] = useMemo(
    () => [
      {
        id: 'act-new',
        type: 'action',
        title: 'Nuevo producto',
        category: 'Acciones rápidas',
        shortcut: 'N',
        icon: Plus,
        onSelect: onNewProduct,
      },
      {
        id: 'act-low-stock',
        type: 'action',
        title: 'Ver productos con stock bajo',
        category: 'Filtros rápidos',
        icon: AlertTriangle,
        onSelect: onFilterLowStock,
      },
      {
        id: 'act-scale',
        type: 'action',
        title: 'Ver productos de balanza (pesables / PLU)',
        category: 'Filtros rápidos',
        icon: Scale,
        onSelect: onFilterScale,
      },
      {
        id: 'act-inactive',
        type: 'action',
        title: 'Ver productos inactivos o descontinuados',
        category: 'Filtros rápidos',
        icon: EyeOff,
        onSelect: onFilterInactive,
      },
      {
        id: 'act-categories',
        type: 'action',
        title: 'Gestionar categorías',
        category: 'Catálogo',
        icon: Tag,
        onSelect: onOpenCategories,
      },
      {
        id: 'act-brands',
        type: 'action',
        title: 'Gestionar marcas',
        category: 'Catálogo',
        icon: Award,
        onSelect: onOpenBrands,
      },
      {
        id: 'act-import-scale',
        type: 'action',
        title: 'Importar productos de balanza (CSV / TXT)',
        category: 'Herramientas',
        icon: FileSpreadsheet,
        onSelect: onImportScale,
      },
      {
        id: 'act-export-pdf',
        type: 'action',
        title: 'Exportar catálogo a PDF',
        category: 'Herramientas',
        icon: FileText,
        onSelect: onExportPdf,
      },
    ],
    [
      onNewProduct,
      onFilterLowStock,
      onFilterScale,
      onFilterInactive,
      onOpenCategories,
      onOpenBrands,
      onImportScale,
      onExportPdf,
    ]
  );

  // Filter actions and products based on query
  const filteredItems: PaletteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchingActions = actions.filter((act) =>
      act.title.toLowerCase().includes(q) || act.category.toLowerCase().includes(q)
    );

    const matchingProducts = !q
      ? products.slice(0, 6).map((p): CommandProductItem => ({ id: `p-${p.id}`, type: 'product', product: p }))
      : products
          .filter((p) => {
            return (
              p.name.toLowerCase().includes(q) ||
              (p.sku && p.sku.toLowerCase().includes(q)) ||
              (p.barcode && p.barcode.toLowerCase().includes(q)) ||
              (p.plu && p.plu.toLowerCase().includes(q)) ||
              (p.category && p.category.toLowerCase().includes(q))
            );
          })
          .slice(0, 8)
          .map((p): CommandProductItem => ({ id: `p-${p.id}`, type: 'product', product: p }));

    return [...matchingActions, ...matchingProducts];
  }, [actions, products, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length, query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle item execution
  const executeItem = useCallback(
    (item: PaletteItem) => {
      onClose();
      if (item.type === 'action') {
        item.onSelect();
      } else {
        onSelectProduct(item.product);
      }
    },
    [onClose, onSelectProduct]
  );

  // Global keydown within palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length ? (prev - 1 + filteredItems.length) % filteredItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
    >
      {/* Scrim / Backdrop con blur estilo Apple */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Ventana de paleta estilo Spotlight / Raycast */}
      <div
        className="relative w-full max-w-xl rounded-2xl border border-[var(--line)] shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150 select-none"
        style={{
          backgroundColor: 'var(--surface)',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.28), 0 4px 16px -2px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Barra superior de búsqueda */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--line)]">
          <Search size={18} strokeWidth={2} className="text-[var(--ink2)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos o acciones..."
            className="flex-1 bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink2)] outline-none border-none font-normal"
            aria-label="Escribe un comando o nombre de producto"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[var(--ink2)] hover:text-[var(--ink)] p-0.5 rounded-full"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="apple-kbd">Esc</kbd>
          )}
        </div>

        {/* Lista de resultados */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y-0"
          role="listbox"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--ink2)]">
              No se encontraron acciones ni productos que coincidan con &ldquo;<span className="text-[var(--ink)]">{query}</span>&rdquo;.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              if (item.type === 'action') {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? 'bg-[var(--chip)] text-[var(--ink)]'
                        : 'text-[var(--ink2)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs' : 'bg-[var(--hover)] text-[var(--ink2)]'
                        }`}
                      >
                        <IconComponent size={14} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-normal text-[var(--ink)] block truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-[var(--ink2)] block">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.shortcut && (
                        <kbd className="apple-kbd">{item.shortcut}</kbd>
                      )}
                      {isSelected && (
                        <CornerDownLeft size={13} className="text-[var(--ink2)]" />
                      )}
                    </div>
                  </div>
                );
              }

              // Product item
              const p = item.product;
              const isLow = p.currentStock <= p.minStock || p.currentStock === 0;

              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-[var(--chip)] text-[var(--ink)]'
                      : 'text-[var(--ink2)] hover:text-[var(--ink)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs' : 'bg-[var(--hover)] text-[var(--ink2)]'
                      }`}
                    >
                      <Package size={14} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-normal text-[var(--ink)] block truncate">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-[var(--ink2)] block truncate">
                        {p.sku || p.barcode || p.plu || p.category}
                        {p.plu && <span className="ml-1 text-[var(--accent)]">· PLU {p.plu}</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-right">
                    <div>
                      <span className="font-mono tabular-nums text-[var(--ink)] block font-medium">
                        {formatCurrencyDOP(p.salePrice)}
                      </span>
                      <div className="flex items-center justify-end gap-1.5 text-[11px]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${
                            p.currentStock === 0
                              ? 'bg-[var(--bad)]'
                              : isLow
                              ? 'bg-[var(--warn)]'
                              : 'bg-[var(--ok)]'
                          }`}
                        />
                        <span className="font-mono tabular-nums text-[var(--ink2)]">
                          {p.currentStock} {p.unit || 'uds'}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <CornerDownLeft size={13} className="text-[var(--ink2)]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Barra inferior de atajos */}
        <div className="px-4 py-2.5 bg-[var(--chip)]/60 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--ink2)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="apple-kbd">↑</kbd>
              <kbd className="apple-kbd">↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="apple-kbd">↵</kbd>
              <span>Seleccionar</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="apple-kbd">Esc</kbd>
            <span>Cerrar</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
