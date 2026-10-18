import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, X } from 'lucide-react';
import SegmentedControl, { type SegmentOption } from '@/components/ui/SegmentedControl';
import type { TransferStatusFilter } from '../types';

interface StockTransfersToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: TransferStatusFilter;
  onStatusFilterChange: (val: TransferStatusFilter) => void;
  onExportPdf: () => void;
  filteredCount: number;
}

const STATUS_OPTIONS: SegmentOption<TransferStatusFilter>[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'en_transito', label: 'En tránsito' },
  { id: 'recibida', label: 'Recibidas' },
  { id: 'anulada', label: 'Anuladas' },
];

export default function StockTransfersToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onExportPdf,
  filteredCount,
}: StockTransfersToolbarProps) {
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
            placeholder="Buscar por código, sucursal origen o destino..."
            aria-label="Buscar transferencias de stock"
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

      {/* Right: Segmented Status Filter + Export */}
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          ariaLabel="Filtrar por estado de transferencia"
        />

        <button
          type="button"
          onClick={onExportPdf}
          className="apple-btn-secondary text-xs !h-8 !px-2.5 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Download size={13} />
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
}
