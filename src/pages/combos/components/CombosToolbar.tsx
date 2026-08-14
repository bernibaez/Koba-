import React from 'react';
import { Search, Download, FileSpreadsheet } from 'lucide-react';

interface CombosToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  validityFilter: string;
  onValidityFilterChange: (value: string) => void;
  resultCount: number;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export default function CombosToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  validityFilter,
  onValidityFilterChange,
  resultCount,
  onExportPdf,
  onExportExcel,
}: CombosToolbarProps) {
  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buscar combo</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-field !pl-9"
              placeholder="Buscar por nombre, código o código de barras..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Estado</label>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Vigencia</label>
          <select
            className="input-field"
            value={validityFilter}
            onChange={(e) => onValidityFilterChange(e.target.value)}
          >
            <option value="all">Todas las fechas</option>
            <option value="valid">Vigentes actualmente</option>
            <option value="expired">Vencidos</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground font-medium">
          Mostrando {resultCount} registro(s)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExportPdf}
            className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          >
            <Download size={14} /> PDF
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
        </div>
      </div>
    </div>
  );
}
