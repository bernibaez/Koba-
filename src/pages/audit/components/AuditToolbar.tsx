import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { ACTION_TYPES, type AuditActionType } from '../types';

interface AuditToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  actionFilter: string;
  onActionFilterChange: (val: string) => void;
  dateFilter: string;
  onDateFilterChange: (val: string) => void;
  filteredCount: number;
}

export default function AuditToolbar({
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  dateFilter,
  onDateFilterChange,
  filteredCount,
}: AuditToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  // Shortcut key "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
      {/* Left: Search input */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink2)] pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar usuario, detalle o módulo..."
            aria-label="Buscar en auditoría"
            className="apple-input w-full pl-8 pr-12 text-xs !h-8"
          />
          {localSearch ? (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink2)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="apple-kbd absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Right: Action Type select + Date filter */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={actionFilter}
          onChange={(e) => onActionFilterChange(e.target.value)}
          aria-label="Filtrar por acción realizada"
          className="apple-select text-xs !h-8 !py-1 !pl-2.5 !pr-7 max-w-[170px]"
        >
          <option value="all">Todas las acciones</option>
          {ACTION_TYPES.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>

        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            aria-label="Filtrar por fecha específica"
            className="apple-input text-xs !h-8 !py-1 !pl-2.5 !pr-2 font-mono text-[var(--ink)]"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => onDateFilterChange('')}
              aria-label="Limpiar fecha"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[var(--ink2)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
