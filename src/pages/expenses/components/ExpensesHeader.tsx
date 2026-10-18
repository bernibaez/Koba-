import React from 'react';
import { Plus, DollarSign, Tag } from 'lucide-react';
import type { ExpensesTab } from '../types';

interface ExpensesHeaderProps {
  currentTab: ExpensesTab;
  onNewExpense: () => void;
  onNewCategory: () => void;
  expensesCount: number;
}

export default function ExpensesHeader({
  currentTab,
  onNewExpense,
  onNewCategory,
  expensesCount,
}: ExpensesHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)] select-none">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
          <DollarSign size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)] tracking-tight">
              Gastos operativos
            </h1>
            {expensesCount > 0 && (
              <span className="apple-badge apple-badge-neutral text-[10px] tracking-wide">
                {expensesCount} registro{expensesCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ink2)] mt-0.5">
            Control de egresos corrientes, centros de costo y control de presupuestos departamentales
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewCategory}
          aria-label="Crear nueva categoría"
          className="apple-btn-secondary text-xs !h-8 !px-3 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Tag size={13} />
          <span>Nueva categoría</span>
          <kbd className="apple-kbd ml-1">C</kbd>
        </button>

        <button
          type="button"
          onClick={onNewExpense}
          aria-label="Registrar nuevo gasto"
          className="apple-btn-primary text-xs !h-8 !px-3.5 inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-transform"
        >
          <Plus size={14} />
          <span>Nuevo gasto</span>
          <kbd className="apple-kbd ml-1">G</kbd>
        </button>
      </div>
    </header>
  );
}
