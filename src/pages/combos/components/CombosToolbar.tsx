import React from 'react';
import { Search, X, Calendar, Store, CheckCircle, RotateCcw } from 'lucide-react';

interface CombosToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  branchFilter: string;
  onBranchFilterChange: (value: string) => void;
  validityFilter: string;
  onValidityFilterChange: (value: string) => void;
  showFilters: boolean;
  onResetFilters: () => void;
}

export default function CombosToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  branchFilter,
  onBranchFilterChange,
  validityFilter,
  onValidityFilterChange,
  showFilters,
  onResetFilters,
}: CombosToolbarProps) {
  const hasActiveFilters =
    search !== '' || statusFilter !== 'all' || branchFilter !== 'all' || validityFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Search and Quick Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar combo por nombre, código interno o código de barras (Ctrl+F)..."
            className="input-field pl-10 pr-10 text-sm font-medium w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="btn-secondary text-xs font-bold flex items-center justify-center gap-1.5 text-danger hover:bg-danger/10 border-danger/20"
          >
            <RotateCcw size={14} />
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Advanced Filter Collapsible Drawer */}
      {showFilters && (
        <div className="p-4 bg-card border border-border/80 rounded-xl space-y-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FilterIcon /> Filtros Avanzados
            </h3>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Mostrando resultados filtrados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <CheckCircle size={14} /> Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="input-field text-sm font-semibold"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Store size={14} /> Sucursal
              </label>
              <select
                value={branchFilter}
                onChange={(e) => onBranchFilterChange(e.target.value)}
                className="input-field text-sm font-semibold"
              >
                <option value="all">Todas las sucursales</option>
                <option value="Sucursal Principal">Sucursal Principal</option>
                <option value="Sucursal Norte">Sucursal Norte</option>
                <option value="Sucursal Este">Sucursal Este</option>
                <option value="Sucursal Sur">Sucursal Sur</option>
              </select>
            </div>

            {/* Validity Filter */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} /> Vigencia
              </label>
              <select
                value={validityFilter}
                onChange={(e) => onValidityFilterChange(e.target.value)}
                className="input-field text-sm font-semibold"
              >
                <option value="all">Todas las fechas</option>
                <option value="valid">Vigentes actualmente</option>
                <option value="expired">Vencidos o futuros</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
    </svg>
  );
}
