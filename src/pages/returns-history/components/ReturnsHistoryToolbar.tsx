import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, FileText, FileSpreadsheet, X, Calendar } from 'lucide-react';
import SegmentedControl, { type SegmentOption } from '@/components/ui/SegmentedControl';
import type { ReturnStatusFilter } from '../types';

interface ReturnsHistoryToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: ReturnStatusFilter;
  onStatusFilterChange: (val: ReturnStatusFilter) => void;
  dateFilter: string;
  onDateFilterChange: (val: string) => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  filteredCount: number;
}

const STATUS_OPTIONS: SegmentOption<ReturnStatusFilter>[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'approved', label: 'Aprobadas' },
  { id: 'rejected', label: 'Rechazadas' },
];

export default function ReturnsHistoryToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  onExportPdf,
  onExportExcel,
  filteredCount,
}: ReturnsHistoryToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

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

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

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
            placeholder="Buscar por código, factura, cliente o cajero..."
            aria-label="Buscar devoluciones"
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

      {/* Middle & Right: Date + Status Segmented + Export */}
      <div className="flex flex-wrap items-center gap-2">
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

        <SegmentedControl
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          ariaLabel="Filtrar por estado de devolución"
        />

        {/* Export dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-haspopup="menu"
            aria-expanded={showExportMenu}
            className="apple-btn-secondary text-xs !h-8 !px-2.5 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Exportar</span>
            <ChevronDown size={12} className="text-[var(--ink2)]" />
          </button>

          {showExportMenu && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-44 rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-lg p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportPdf();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-[var(--ink)] hover:bg-[var(--surface2)] flex items-center gap-2 cursor-pointer"
              >
                <FileText size={14} className="text-[var(--ink2)]" />
                <span>Exportar PDF</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportExcel();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-[var(--ink)] hover:bg-[var(--surface2)] flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-[var(--ink2)]" />
                <span>Exportar Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
