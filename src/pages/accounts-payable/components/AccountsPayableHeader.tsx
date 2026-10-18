import React from 'react';
import { Plus, Wallet } from 'lucide-react';

interface AccountsPayableHeaderProps {
  onNew: () => void;
  pendingCount: number;
}

export default function AccountsPayableHeader({
  onNew,
  pendingCount,
}: AccountsPayableHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)] select-none">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
          <Wallet size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)] tracking-tight">
              Cuentas por pagar
            </h1>
            {pendingCount > 0 && (
              <span className="apple-badge apple-badge-neutral text-[10px] tracking-wide">
                {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ink2)] mt-0.5">
            Control de pasivos comerciales, facturas de compras a crédito y registro de pagos a proveedores
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNew}
          aria-label="Registrar nueva cuenta por pagar"
          className="apple-btn-primary text-xs !h-8 !px-3.5 inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-transform"
        >
          <Plus size={14} />
          <span>Nueva cuenta</span>
          <kbd className="apple-kbd ml-1">N</kbd>
        </button>
      </div>
    </header>
  );
}
