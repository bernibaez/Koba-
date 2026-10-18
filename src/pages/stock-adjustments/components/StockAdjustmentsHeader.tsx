import React from 'react';
import { Sliders, Plus } from 'lucide-react';

interface StockAdjustmentsHeaderProps {
  onOpenSingleModal: () => void;
  onOpenBlockModal: () => void;
  totalAdjustmentsCount: number;
}

export default function StockAdjustmentsHeader({
  onOpenSingleModal,
  onOpenBlockModal,
  totalAdjustmentsCount,
}: StockAdjustmentsHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)] select-none">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
          <Sliders size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)] tracking-tight">
              Ajustes de inventario
            </h1>
            {totalAdjustmentsCount > 0 && (
              <span className="apple-badge apple-badge-neutral text-[10px] tracking-wide">
                {totalAdjustmentsCount} registro{totalAdjustmentsCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ink2)] mt-0.5">
            Selección individual de producto o regularización masiva por bloque y categoría
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSingleModal}
          aria-label="Ajustar stock de un producto específico"
          className="apple-btn-primary text-xs !h-8 !px-3.5 inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-transform"
        >
          <Plus size={14} />
          <span>Ajustar Producto</span>
          <kbd className="apple-kbd ml-1">N</kbd>
        </button>

        <button
          type="button"
          onClick={onOpenBlockModal}
          aria-label="Ajustar stock por bloque o categoría"
          className="apple-btn-secondary text-xs !h-8 !px-3.5 inline-flex items-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
        >
          <Sliders size={14} />
          <span>Por bloque</span>
          <kbd className="apple-kbd ml-1">A</kbd>
        </button>
      </div>
    </header>
  );
}
