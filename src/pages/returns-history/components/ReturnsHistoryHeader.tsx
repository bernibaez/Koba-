import React from 'react';
import { RotateCcw, Clock } from 'lucide-react';

interface ReturnsHistoryHeaderProps {
  pendingCount: number;
  onFilterPending: () => void;
}

export default function ReturnsHistoryHeader({
  pendingCount,
  onFilterPending,
}: ReturnsHistoryHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)] select-none">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
          <RotateCcw size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)] tracking-tight">
              Devoluciones de mercancía
            </h1>
            {pendingCount > 0 && (
              <span className="apple-badge apple-badge-warning text-[10px] tracking-wide animate-pulse">
                {pendingCount} por autorizar
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ink2)] mt-0.5">
            Aprobación administrativa, gestión de notas de crédito y reversión de existencias al inventario
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <button
          type="button"
          onClick={onFilterPending}
          className="apple-btn-secondary text-xs !h-8 !px-3 inline-flex items-center gap-1.5 cursor-pointer border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 shadow-xs"
        >
          <Clock size={13} />
          <span>Ver {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}</span>
        </button>
      )}
    </header>
  );
}
