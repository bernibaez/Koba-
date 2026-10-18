import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, FileText, FileSpreadsheet, X, Filter } from 'lucide-react';
import SegmentedControl, { type SegmentOption } from '@/components/ui/SegmentedControl';
import type { PurchasesTab, PurchasesPeriod, PurchaseStatus } from '../types';

export interface PurchasesToolbarProps {
  currentTab: PurchasesTab;
  onTabChange: (tab: PurchasesTab) => void;
  tabCounts: {
    purchases: number;
    returns: number;
  };
  currentPeriod: PurchasesPeriod;
  onPeriodChange: (period: PurchasesPeriod) => void;
  dateFrom: string;
  dateTo: string;
  onCustomDateChange: (from: string, to: string) => void;
  selectedStatus?: PurchaseStatus | 'all';
  onStatusChange?: (status: PurchaseStatus | 'all') => void;
  search: string;
  onSearchChange: (search: string) => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export default function PurchasesToolbar({
  currentTab,
  onTabChange,
  tabCounts,
  currentPeriod,
  onPeriodChange,
  dateFrom,
  dateTo,
  onCustomDateChange,
  selectedStatus = 'all',
  onStatusChange,
  search,
  onSearchChange,
  onExportPdf,
  onExportExcel,
}: PurchasesToolbarProps) {
  // Search input state with 250ms debounce
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

  // Export menu dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exportOpen]);

  // Date picker popover for "Rango…"
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLDivElement>(null);
  const [tempFrom, setTempFrom] = useState(dateFrom);
  const [tempTo, setTempTo] = useState(dateTo);

  useEffect(() => {
    setTempFrom(dateFrom);
    setTempTo(dateTo);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!rangeOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (rangeRef.current && !rangeRef.current.contains(e.target as Node)) {
        setRangeOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRangeOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [rangeOpen]);

  const handlePeriodSelect = (period: PurchasesPeriod) => {
    if (period === 'custom') {
      setRangeOpen(true);
      onPeriodChange('custom');
    } else {
      setRangeOpen(false);
      onPeriodChange(period);
    }
  };

  const handleApplyRange = (e: React.FormEvent) => {
    e.preventDefault();
    onCustomDateChange(tempFrom, tempTo);
    setRangeOpen(false);
  };

  const tabOptions: SegmentOption<PurchasesTab>[] = [
    { id: 'purchases', label: 'Órdenes de compra', count: tabCounts.purchases },
    { id: 'returns', label: 'Devoluciones', count: tabCounts.returns },
  ];

  const periodOptions: SegmentOption<PurchasesPeriod>[] = [
    { id: 'all', label: 'Todo' },
    { id: 'today', label: 'Hoy' },
    { id: '7d', label: '7 días' },
    { id: 'month', label: 'Este mes' },
    { id: 'custom', label: currentPeriod === 'custom' && dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : 'Rango…' },
  ];

  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pt-2 pb-1 select-none">
      {/* Vistas, Periodos y Filtro por Estado */}
      <div className="flex flex-wrap items-center gap-3">
        {/* SegmentedControl de Vistas: Órdenes de compra / Devoluciones */}
        <SegmentedControl<PurchasesTab>
          value={currentTab}
          onChange={onTabChange}
          options={tabOptions}
          ariaLabel="Vistas de compras y abastecimiento"
        />

        {/* Control segmentado de Periodos */}
        <div className="relative" ref={rangeRef}>
          <SegmentedControl<PurchasesPeriod>
            value={currentPeriod}
            onChange={handlePeriodSelect}
            options={periodOptions}
            ariaLabel="Atajos de periodo de tiempo"
          />

          {/* Popover selector de fechas personalizadas */}
          {rangeOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-72 p-4 rounded-2xl border border-[var(--line)] shadow-xl z-50 animate-in fade-in zoom-in-95"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--line)]">
                <span className="text-xs font-semibold text-[var(--ink)]">Seleccionar rango</span>
                <button
                  type="button"
                  onClick={() => setRangeOpen(false)}
                  className="text-[var(--ink2)] hover:text-[var(--ink)] p-1 rounded-md"
                  aria-label="Cerrar selector de fechas"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleApplyRange} className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--ink2)] block mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={tempFrom}
                    onChange={(e) => setTempFrom(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[var(--ink2)] block mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={tempTo}
                    onChange={(e) => setTempTo(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTempFrom('');
                      setTempTo('');
                      onCustomDateChange('', '');
                      setRangeOpen(false);
                      onPeriodChange('all');
                    }}
                    className="px-2.5 py-1 text-xs text-[var(--ink2)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    Limpiar
                  </button>
                  <button
                    type="submit"
                    className="apple-btn-primary !h-7 !px-3 !text-xs cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Filtro por estado (para la pestaña de compras) */}
        {currentTab === 'purchases' && onStatusChange && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[var(--line)] bg-[var(--surface)]">
            <Filter size={12} className="text-[var(--ink2)]" />
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as PurchaseStatus | 'all')}
              aria-label="Filtrar compras por estado"
              className="text-xs bg-transparent text-[var(--ink)] outline-none cursor-pointer pr-1"
            >
              <option value="all">Todos los estados</option>
              <option value="received">Recibida</option>
              <option value="pending">Pendiente</option>
              <option value="partial">Parcial</option>
              <option value="voided">Anulada</option>
            </select>
          </div>
        )}
      </div>

      {/* Búsqueda y Exportación */}
      <div className="flex items-center gap-2.5">
        {/* Input de búsqueda con debounce de 250ms */}
        <div className="relative flex-1 sm:w-64 md:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink2)] pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Orden, código o proveedor ( / )"
            aria-label="Buscar por orden, código o proveedor"
            className="w-full h-[34px] pl-8 pr-7 text-xs rounded-xl border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] placeholder-[var(--ink3)] outline-none transition-all duration-150 focus:bg-[var(--surface)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink3)] hover:text-[var(--ink)] p-0.5 rounded-full cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Menú Exportar ▾ */}
        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => setExportOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={exportOpen}
            aria-label="Opciones de exportación"
            className={`h-[34px] px-3 rounded-xl border border-[var(--line)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              exportOpen
                ? 'bg-[var(--hover)] text-[var(--ink)]'
                : 'bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--hover)]'
            }`}
          >
            <span>Exportar</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-150 text-[var(--ink2)] ${
                exportOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {exportOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 top-full mt-1.5 w-44 py-1 rounded-xl border border-[var(--line)] shadow-lg z-50 animate-in fade-in zoom-in-95"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportOpen(false);
                  onExportPdf();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-left transition-colors cursor-pointer text-[var(--ink)] hover:bg-[var(--hover)]"
              >
                <FileText size={14} className="text-[var(--ink2)]" />
                <span>Exportar a PDF</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportOpen(false);
                  onExportExcel();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-left transition-colors cursor-pointer text-[var(--ink)] hover:bg-[var(--hover)]"
              >
                <FileSpreadsheet size={14} className="text-[var(--ink2)]" />
                <span>Exportar a Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
