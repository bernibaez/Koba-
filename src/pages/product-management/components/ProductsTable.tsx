import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, Eye, Edit2, Printer, ToggleLeft, ToggleRight, Trash2, Download } from 'lucide-react';
import type { Product } from './ProductManagementScreen';
import ProductRow from './ProductRow';

interface ProductsTableProps {
  products: Product[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  sortField: keyof Product;
  sortDir: 'asc' | 'desc';
  onSort: (field: keyof Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onView?: (p: Product) => void;
  onPrintLabel?: (products: Product[]) => void;
  onClearFilters?: () => void;
  onExportPdf?: () => void;
  isLoading?: boolean;
  onInlineUpdate?: (id: string, field: 'salePrice' | 'currentStock', value: number, previous: Product) => Promise<void>;
}

export default function ProductsTable({
  products,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  sortField,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  onPrintLabel,
  onClearFilters,
  onExportPdf,
  isLoading = false,
  onInlineUpdate,
}: ProductsTableProps) {
  // Actions Menu Popover State
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // TanStack Table Sorting State
  const sorting = useMemo<SortingState>(
    () => [{ id: String(sortField), desc: sortDir === 'desc' }],
    [sortField, sortDir]
  );

  // TanStack Table Selection State
  const rowSelection = useMemo<RowSelectionState>(() => {
    const sel: RowSelectionState = {};
    for (const id of selectedIds) {
      sel[id] = true;
    }
    return sel;
  }, [selectedIds]);

  const allFilteredSelected = products.length > 0 && selectedIds.size === products.length;
  const someFilteredSelected = selectedIds.size > 0 && selectedIds.size < products.length;

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={allFilteredSelected}
            ref={(el) => {
              if (el) el.indeterminate = someFilteredSelected;
            }}
            onChange={onSelectAll}
            className="w-4 h-4 rounded border-[var(--line)] accent-[var(--accent)] cursor-pointer"
            aria-label="Seleccionar todos los productos mostrados"
          />
        ),
      },
      {
        accessorKey: 'name',
        header: 'Producto',
      },
      {
        accessorKey: 'category',
        header: 'Categoría',
      },
      {
        accessorKey: 'salePrice',
        header: 'Precio',
      },
      {
        accessorKey: 'currentStock',
        header: 'Stock',
      },
      {
        accessorKey: 'status',
        header: 'Estado',
      },
      {
        id: 'actions',
        header: '',
      },
    ],
    [allFilteredSelected, someFilteredSelected, onSelectAll]
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    getRowId: (row: Product) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  const handleToggleActionsMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openActionsId === id) {
      setOpenActionsId(null);
      setMenuPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const left = Math.max(10, rect.right - 192);
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 220;
    let top = rect.bottom + 6;

    if (spaceBelow < menuHeight && rect.top > menuHeight) {
      top = rect.top - menuHeight - 6;
    }

    setMenuPos({ top, left });
    setOpenActionsId(id);
  };

  // Skeleton Loading State (discreto mientras carga)
  if (isLoading) {
    return (
      <div className="w-full select-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="w-10 px-3.5 py-3" />
              <th className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)]">Producto</th>
              <th className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)] hidden md:table-cell">Categoría</th>
              <th className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)] text-right">Precio</th>
              <th className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)] text-right">Stock</th>
              <th className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)] hidden md:table-cell">Estado</th>
              <th className="w-28 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} className="border-b border-[var(--line)]">
                <td className="px-3.5 py-3.5">
                  <div className="w-4 h-4 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-3.5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[var(--chip)] animate-pulse flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-44 rounded bg-[var(--chip)] animate-pulse" />
                      <div className="h-3 w-28 rounded bg-[var(--chip)] animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-3.5 hidden md:table-cell">
                  <div className="h-3.5 w-20 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-3.5 py-3.5 text-right">
                  <div className="h-4 w-16 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-3.5 py-3.5 text-right">
                  <div className="h-4 w-14 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-3.5 py-3.5 hidden md:table-cell">
                  <div className="h-3.5 w-16 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-3 py-3.5 text-right" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Estado Vacío: "Ningún producto coincide."
  if (products.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center select-none border-b border-[var(--line)]">
        <p className="text-base font-normal text-[var(--ink)]">
          Ningún producto coincide.
        </p>
        <p className="text-xs text-[var(--ink2)] mt-1 max-w-sm">
          Prueba cambiando la vista, ajustando la búsqueda o limpiando los filtros seleccionados.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="apple-btn-ghost text-xs text-[var(--accent)] hover:text-[var(--accent)] mt-3"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <colgroup>
            <col className="w-12" />
            <col className="w-auto" />
            <col className="w-36 md:w-44 hidden md:table-column" />
            <col className="w-32 md:w-36" />
            <col className="w-28 md:w-32" />
            <col className="w-28 md:w-32 hidden md:table-column" />
            <col className="w-24" />
          </colgroup>
          {/* Encabezados en 12px, peso 500, gris, sentence case */}
          <thead>
            <tr className="border-b border-[var(--line)]">
              {/* Checkbox select all */}
              <th className="w-12 px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someFilteredSelected;
                  }}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-[var(--line)] accent-[var(--accent)] cursor-pointer"
                  aria-label="Seleccionar todos los productos"
                />
              </th>

              {/* Columna Producto (ordenable) */}
              <th
                onClick={() => onSort('name')}
                className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)] cursor-pointer hover:text-[var(--ink)] transition-colors select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Producto</span>
                  {sortField === 'name' && (
                    sortDir === 'asc' ? (
                      <ArrowUp size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    ) : (
                      <ArrowDown size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    )
                  )}
                </div>
              </th>

              {/* Columna Categoría (ordenable, oculta en < 760px) */}
              <th
                onClick={() => onSort('category')}
                className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)] cursor-pointer hover:text-[var(--ink)] transition-colors select-none hidden md:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>Categoría</span>
                  {sortField === 'category' && (
                    sortDir === 'asc' ? (
                      <ArrowUp size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    ) : (
                      <ArrowDown size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    )
                  )}
                </div>
              </th>

              {/* Columna Precio (ordenable, derecha) */}
              <th
                onClick={() => onSort('salePrice')}
                className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)] text-right cursor-pointer hover:text-[var(--ink)] transition-colors select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Precio</span>
                  {sortField === 'salePrice' && (
                    sortDir === 'asc' ? (
                      <ArrowUp size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    ) : (
                      <ArrowDown size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    )
                  )}
                </div>
              </th>

              {/* Columna Stock (ordenable, izquierda alineada con el dot) */}
              <th
                onClick={() => onSort('currentStock')}
                className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)] text-left cursor-pointer hover:text-[var(--ink)] transition-colors select-none"
              >
                <div className="flex items-center justify-start gap-1">
                  <span>Stock</span>
                  {sortField === 'currentStock' && (
                    sortDir === 'asc' ? (
                      <ArrowUp size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    ) : (
                      <ArrowDown size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    )
                  )}
                </div>
              </th>

              {/* Columna Estado (ordenable, oculta en < 760px) */}
              <th
                onClick={() => onSort('status')}
                className="px-3.5 py-3 text-xs font-medium text-[var(--ink2)] text-left cursor-pointer hover:text-[var(--ink)] transition-colors select-none hidden md:table-cell"
              >
                <div className="flex items-center justify-start gap-1">
                  <span>Estado</span>
                  {sortField === 'status' && (
                    sortDir === 'asc' ? (
                      <ArrowUp size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    ) : (
                      <ArrowDown size={12} strokeWidth={2} className="text-[var(--ink)]" />
                    )
                  )}
                </div>
              </th>

              {/* Columna Acciones */}
              <th className="w-24 px-3 py-3" />
            </tr>
          </thead>

          {/* Filas */}
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const product = row.original;
              const isSelected = selectedIds.has(product.id);

              return (
                <ProductRow
                  key={product.id}
                  product={product}
                  isSelected={isSelected}
                  onToggleSelect={onToggleSelect}
                  onView={onView}
                  onEdit={onEdit}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDelete}
                  onPrintLabel={onPrintLabel ? (p) => onPrintLabel([p]) : undefined}
                  onToggleActionsMenu={handleToggleActionsMenu}
                  onInlineUpdate={onInlineUpdate}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla: "N productos" / "N seleccionados" + Exportar PDF */}
      <footer className="flex items-center justify-between py-3.5 px-2 text-xs text-[var(--ink2)] border-t border-[var(--line)]">
        <div>
          {selectedIds.size > 0 ? (
            <span className="font-medium text-[var(--ink)]">
              {selectedIds.size} de {products.length} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>
              {products.length} producto{products.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            className="apple-btn-ghost text-xs text-[var(--ink2)] hover:text-[var(--ink)] font-normal"
          >
            Exportar PDF
          </button>
        )}
      </footer>

      {/* Menú flotante de acciones ("..." portal) */}
      {openActionsId && menuPos && (() => {
        const product = products.find((p) => p.id === openActionsId);
        if (!product) return null;

        return createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => {
                setOpenActionsId(null);
                setMenuPos(null);
              }}
            />
            <div
              style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
              role="menu"
              className="fixed w-48 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-xl z-[9999] py-1 text-xs animate-in fade-in zoom-in-95"
            >
              <div className="py-1">
                {onView && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenActionsId(null);
                      setMenuPos(null);
                      onView(product);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--hover)] flex items-center gap-2.5 font-normal transition-colors cursor-pointer"
                  >
                    <Eye size={14} strokeWidth={1.8} className="text-[var(--ink2)]" />
                    <span>Ver detalle</span>
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenActionsId(null);
                    setMenuPos(null);
                    onEdit(product);
                  }}
                  className="w-full text-left px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--hover)] flex items-center gap-2.5 font-normal transition-colors cursor-pointer"
                >
                  <Edit2 size={14} strokeWidth={1.8} className="text-[var(--ink2)]" />
                  <span>Editar producto</span>
                </button>
                {onPrintLabel && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenActionsId(null);
                      setMenuPos(null);
                      onPrintLabel([product]);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--hover)] flex items-center gap-2.5 font-normal transition-colors cursor-pointer"
                  >
                    <Printer size={14} strokeWidth={1.8} className="text-[var(--ink2)]" />
                    <span>Imprimir etiqueta</span>
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenActionsId(null);
                    setMenuPos(null);
                    onToggleStatus(product.id);
                  }}
                  className="w-full text-left px-3.5 py-2 text-[var(--ink)] hover:bg-[var(--hover)] flex items-center gap-2.5 font-normal transition-colors cursor-pointer"
                >
                  {product.status === 'active' ? (
                    <>
                      <ToggleRight size={14} strokeWidth={1.8} className="text-[var(--warn)]" />
                      <span>Desactivar</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={14} strokeWidth={1.8} className="text-[var(--ok)]" />
                      <span>Activar</span>
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-[var(--line)] my-1" />
              <div className="py-0.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenActionsId(null);
                    setMenuPos(null);
                    onDelete(product.id);
                  }}
                  className="w-full text-left px-3.5 py-2 text-[var(--bad)] hover:bg-[var(--hover)] flex items-center gap-2.5 font-normal transition-colors cursor-pointer"
                >
                  <Trash2 size={14} strokeWidth={1.8} className="text-[var(--bad)]" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </>,
          document.body
        );
      })()}
    </div>
  );
}