'use client';
import React, { useState } from 'react';
import { Search, Filter, Trash2, Tag, X, ChevronDown } from 'lucide-react';

interface ProductsToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  filterCategory: string;
  onFilterCategory: (v: string) => void;
  filterStatus: string;
  onFilterStatus: (v: string) => void;
  filterStock: string;
  onFilterStock: (v: string) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onAdd: () => void;
  totalFiltered: number;
}

const categories = ['all', 'Granos', 'Lácteos', 'Carnes', 'Bebidas', 'Limpieza', 'Panadería', 'Frutas', 'Snacks'];
const statuses = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'discontinued', label: 'Descontinuado' },
];
const stockStatuses = [
  { value: 'all', label: 'Todo el stock' },
  { value: 'normal', label: 'Stock normal' },
  { value: 'low', label: 'Stock bajo' },
  { value: 'out', label: 'Sin stock' },
];

export default function ProductsToolbar({
  search, onSearch, filterCategory, onFilterCategory,
  filterStatus, onFilterStatus, filterStock, onFilterStock,
  selectedCount, onBulkDelete, totalFiltered,
}: ProductsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [
    filterCategory !== 'all' && filterCategory,
    filterStatus !== 'all' && statuses.find((s) => s.value === filterStatus)?.label,
    filterStock !== 'all' && stockStatuses.find((s) => s.value === filterStock)?.label,
  ].filter(Boolean) as string[];

  return (
    <div className="card p-3 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU, código de barras..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="input-field pl-9 h-9 text-sm"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category quick filter */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => onFilterCategory(e.target.value)}
            className="input-field h-9 pr-8 text-sm appearance-none min-w-36"
          >
            {categories.map((cat) => (
              <option key={`cat-filter-${cat}`} value={cat}>
                {cat === 'all' ? 'Todas las categorías' : cat}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {/* More filters toggle */}
        <button
          onClick={() => setFiltersOpen((p) => !p)}
          className={`flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
            filtersOpen || activeFilters.length > 0
              ? 'bg-primary/10 border-primary/30 text-primary' :'border-border text-muted-foreground hover:bg-secondary'
          }`}
        >
          <Filter size={14} />
          Filtros
          {activeFilters.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
              {activeFilters.length}
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0" />

        {/* Results count */}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {totalFiltered} resultado{totalFiltered !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Expanded filters */}
      {filtersOpen && (
        <div className="flex items-center gap-3 pt-2 border-t border-border flex-wrap">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatus(e.target.value)}
              className="input-field h-8 pr-8 text-xs appearance-none min-w-36"
            >
              {statuses.map((s) => (
                <option key={`status-filter-${s.value}`} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterStock}
              onChange={(e) => onFilterStock(e.target.value)}
              className="input-field h-8 pr-8 text-xs appearance-none min-w-36"
            >
              {stockStatuses.map((s) => (
                <option key={`stock-filter-${s.value}`} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {activeFilters.length > 0 && (
            <button
              onClick={() => { onFilterCategory('all'); onFilterStatus('all'); onFilterStock('all'); }}
              className="text-xs text-danger hover:underline flex items-center gap-1"
            >
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.map((f) => (
            <span key={`chip-${f}`} className="badge-info flex items-center gap-1">
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg slide-up">
          <span className="text-xs font-semibold text-primary">{selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2 ml-2">
            <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary">
              <Tag size={13} />
              Imprimir etiquetas
            </button>
            <button
              onClick={onBulkDelete}
              className="flex items-center gap-1.5 text-xs font-medium text-danger hover:bg-danger-bg transition-colors px-2 py-1 rounded-lg"
            >
              <Trash2 size={13} />
              Eliminar seleccionados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}