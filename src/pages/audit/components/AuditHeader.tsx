import React from 'react';
import { ShieldCheck, Download, FileSpreadsheet } from 'lucide-react';

interface AuditHeaderProps {
  totalCount: number;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export default function AuditHeader({
  totalCount,
  onExportPdf,
  onExportExcel,
}: AuditHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)] select-none">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)] tracking-tight">
              Auditoría del sistema
            </h1>
            {totalCount > 0 && (
              <span className="apple-badge apple-badge-neutral text-[10px] tracking-wide">
                {totalCount} evento{totalCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ink2)] mt-0.5">
            Registro cronológico inmutable de acciones, ventas, cambios de precios, aperturas y modificaciones
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportPdf}
          className="apple-btn-secondary text-xs !h-8 !px-3 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Download size={13} />
          <span>Exportar PDF</span>
        </button>
        <button
          type="button"
          onClick={onExportExcel}
          className="apple-btn-secondary text-xs !h-8 !px-3 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <FileSpreadsheet size={13} />
          <span>Exportar Excel</span>
        </button>
      </div>
    </header>
  );
}
