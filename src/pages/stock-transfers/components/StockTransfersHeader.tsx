import React from 'react';
import { Plus, ArrowLeftRight } from 'lucide-react';

interface StockTransfersHeaderProps {
  onNewTransfer: () => void;
  transfersCount: number;
}

export default function StockTransfersHeader({
  onNewTransfer,
  transfersCount,
}: StockTransfersHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)] select-none">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
          <ArrowLeftRight size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)] tracking-tight">
              Transferencias de inventario
            </h1>
            {transfersCount > 0 && (
              <span className="apple-badge apple-badge-neutral text-[10px] tracking-wide">
                {transfersCount} movimiento{transfersCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ink2)] mt-0.5">
            Movimientos logísticos entre almacenes, despachos en tránsito y control de recepción
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewTransfer}
          aria-label="Registrar nueva transferencia"
          className="apple-btn-primary text-xs !h-8 !px-3.5 inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-transform"
        >
          <Plus size={14} />
          <span>Nueva transferencia</span>
          <kbd className="apple-kbd ml-1">T</kbd>
        </button>
      </div>
    </header>
  );
}
