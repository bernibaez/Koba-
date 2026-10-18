import React, { useState, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import SegmentedControl, { type QuickView, type SegmentOption } from './SegmentedControl';

interface ProductsToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  filterCategory: string;
  onFilterCategory: (v: string) => void;
  filterStatus?: string;
  onFilterStatus?: (v: string) => void;
  quickView: QuickView;
  onChangeQuickView: (v: QuickView) => void;
  quickViewOptions: SegmentOption[];
  categories: string[];
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function ProductsToolbar({
  search,
  onSearch,
  filterCategory,
  onFilterCategory,
  filterStatus = 'all',
  onFilterStatus,
  quickView,
  onChangeQuickView,
  quickViewOptions,
  categories,
  searchInputRef,
}: ProductsToolbarProps) {
  // Local search state with 250ms debounce
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearch(localSearch);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearch]);

  const hasActiveFilters = Boolean(
    (filterCategory && filterCategory !== 'all') ||
      (search && search.trim().length > 0) ||
      (filterStatus && filterStatus !== 'all')
  );

  return (
    <div className="space-y-2 select-none">
      {/* Barra de filtros en una sola línea */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Izquierda: Control segmentado */}
        <div className="flex-shrink-0">
          <SegmentedControl
            value={quickView}
            onChange={onChangeQuickView}
            options={quickViewOptions}
          />
        </div>

        {/* Derecha: Búsqueda, Select de categoría y Select de estado */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-start lg:justify-end">
          {/* Búsqueda en vivo */}
          <div className="relative w-52 sm:w-64">
            <Search
              size={15}
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink2)] pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar nombre, SKU o código"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs text-[var(--ink)] bg-[var(--chip)] rounded-[10px] border-none outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--ink2)]"
              aria-label="Buscar producto por nombre, SKU o código"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onSearch('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink2)] hover:text-[var(--ink)] cursor-pointer p-0.5 rounded-full"
                aria-label="Borrar búsqueda"
              >
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Select de Categoría */}
          <div className="relative flex-shrink-0">
            <select
              value={filterCategory}
              onChange={(e) => onFilterCategory(e.target.value)}
              aria-label="Filtrar por categoría"
              className="h-9 pl-3 pr-8 text-xs text-[var(--ink)] bg-[var(--chip)] rounded-[10px] border-none outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all cursor-pointer appearance-none font-normal"
            >
              <option value="all">Categoría</option>
              {categories.map((cat) => (
                <option key={`cat-${cat}`} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              strokeWidth={1.8}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink2)] pointer-events-none"
            />
          </div>

          {/* Select de Estado */}
          {onFilterStatus && (
            <div className="relative flex-shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatus(e.target.value)}
                aria-label="Filtrar por estado"
                className="h-9 pl-3 pr-8 text-xs text-[var(--ink)] bg-[var(--chip)] rounded-[10px] border-none outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all cursor-pointer appearance-none font-normal"
              >
                <option value="all">Estado</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <ChevronDown
                size={13}
                strokeWidth={1.8}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink2)] pointer-events-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Chips de filtros activos removibles */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 pt-1 flex-wrap animate-in fade-in duration-150">
          {filterCategory && filterCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-[var(--chip)] text-[var(--ink)] border border-[var(--line)]">
              <span>Categoría: {filterCategory}</span>
              <button
                type="button"
                onClick={() => onFilterCategory('all')}
                className="text-[var(--ink2)] hover:text-[var(--ink)] cursor-pointer"
                aria-label={`Quitar filtro de categoría ${filterCategory}`}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          )}

          {search && search.trim().length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-[var(--chip)] text-[var(--ink)] border border-[var(--line)]">
              <span>Búsqueda: {search}</span>
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onSearch('');
                }}
                className="text-[var(--ink2)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Quitar filtro de búsqueda"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              onSearch('');
              onFilterCategory('all');
            }}
            className="text-xs text-[var(--ink2)] hover:text-[var(--accent)] hover:underline ml-1 cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}