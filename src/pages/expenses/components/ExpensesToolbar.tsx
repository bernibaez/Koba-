import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, X } from 'lucide-react';
import SegmentedControl, { type SegmentOption } from '@/components/ui/SegmentedControl';
import type { ExpensesTab, ExpenseStatusFilter } from '../types';

interface ExpensesToolbarProps {
  currentTab: ExpensesTab;
  onTabChange: (tab: ExpensesTab) => void;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: ExpenseStatusFilter;
  onStatusFilterChange: (val: ExpenseStatusFilter) => void;
  onExportPdf: () => void;
  filteredCount: number;
}

const TAB_OPTIONS: SegmentOption<ExpensesTab>[] = [
  { id: 'list', label: 'Lista de Gastos' },
  { id: 'categories', label: 'Categorías y Presupuesto' },
];

const STATUS_OPTIONS: SegmentOption<ExpenseStatusFilter>[] = [
  { id: 'all', label: 'Todos' },
  { id: 'approved', label: 'Aprobados' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'rejected', label: 'Rechazados' },
];

export default function ExpensesToolbar({
  currentTab,
  onTabChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onExportPdf,
  filteredCount,
}: ExpensesToolbarProps) {
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
      {/* Left: Tab selection & Search */}
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={currentTab}
          onChange={onTabChange}
          ariaLabel="Cambiar vista de gastos"
        />

        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink2)] pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={
              currentTab === 'list'
                ? 'Buscar por código, descripción o categoría...'
                : 'Buscar categoría...'
            }
            aria-label="Buscar gastos"
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

      {/* Right: Status filter (only for list) + Export */}
      <div className="flex items-center gap-2">
        {currentTab === 'list' && (
          <SegmentedControl
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={onStatusFilterChange}
            ariaLabel="Filtrar por estado de gasto"
          />
        )}

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
