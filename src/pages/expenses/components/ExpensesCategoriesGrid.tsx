import React from 'react';
import { Tag, Trash2 } from 'lucide-react';
import type { CategoriaGastoUi } from '../types';

interface ExpensesCategoriesGridProps {
  categorias: CategoriaGastoUi[];
  isLoading?: boolean;
  onDeleteCategory: (cat: CategoriaGastoUi) => void;
  onNewCategory: () => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ExpensesCategoriesGrid({
  categorias,
  isLoading = false,
  onDeleteCategory,
  onNewCategory,
}: ExpensesCategoriesGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-3 animate-pulse"
          >
            <div className="h-4 bg-[var(--surface2)] rounded w-1/2" />
            <div className="h-3 bg-[var(--surface2)] rounded w-3/4" />
            <div className="h-2 bg-[var(--surface2)] rounded-full w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (categorias.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink2)] mx-auto mb-3">
          <Tag size={22} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          No hay categorías configuradas
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto mt-1">
          Crea tu primera categoría de gastos para establecer presupuestos mensuales y controlar costos.
        </p>
        <button
          type="button"
          onClick={onNewCategory}
          className="apple-btn-primary text-xs !h-8 !px-3 mt-4 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Tag size={13} />
          <span>Nueva categoría</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 select-none">
      {categorias.map((cat) => {
        const pct =
          cat.budget > 0 ? Math.min(100, Math.round((cat.spent / cat.budget) * 100)) : 0;
        const isOverBudget = cat.budget > 0 && cat.spent > cat.budget;
        const available = Math.max(0, cat.budget - cat.spent);

        return (
          <div
            key={cat.id}
            className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-3 shadow-xs hover:border-[var(--ink2)]/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[var(--ink)] truncate">
                  {cat.name}
                </h4>
                {cat.description && (
                  <p className="text-xs text-[var(--ink2)] line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDeleteCategory(cat)}
                aria-label={`Eliminar categoría ${cat.name}`}
                title="Eliminar categoría"
                className="p-1 rounded-md text-[var(--ink2)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Financial metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[var(--line)]">
              <div>
                <span className="text-[10px] text-[var(--ink2)] uppercase font-semibold block">
                  Gastado
                </span>
                <span className="font-mono font-medium text-[var(--ink)]">
                  RD$ {formatMoney(cat.spent)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink2)] uppercase font-semibold block">
                  Presupuesto
                </span>
                <span className="font-mono font-medium text-[var(--ink2)]">
                  {cat.budget > 0 ? `RD$ ${formatMoney(cat.budget)}` : 'Sin límite'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            {cat.budget > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[var(--ink2)]">Ejecución presupuestaria</span>
                  <span
                    className={`font-mono font-semibold ${
                      isOverBudget
                        ? 'text-rose-600 dark:text-rose-400'
                        : pct >= 80
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-[var(--ink)]'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[var(--surface2)] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isOverBudget || pct >= 90
                        ? 'bg-rose-500'
                        : pct >= 75
                          ? 'bg-amber-500'
                          : 'bg-[var(--accent)]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {isOverBudget ? (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">
                    Excedido por RD$ {formatMoney(cat.spent - cat.budget)}
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--ink2)] block">
                    Disponible: RD$ {formatMoney(available)}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
