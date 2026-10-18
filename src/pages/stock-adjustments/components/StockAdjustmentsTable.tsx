import React from 'react';
import { Eye, Sliders, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import type { StockAdjustmentItem } from '../types';
import { ADJUSTMENT_TYPE_CONFIG } from '../types';

interface StockAdjustmentsTableProps {
  adjustments: StockAdjustmentItem[];
  isLoading?: boolean;
  onSelect: (item: StockAdjustmentItem) => void;
  onAdjustProduct?: (productId: string) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export default function StockAdjustmentsTable({
  adjustments,
  isLoading = false,
  onSelect,
  onAdjustProduct,
  hasFilters = false,
  onClearFilters,
}: StockAdjustmentsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-[var(--surface2)] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (adjustments.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink2)] mx-auto mb-3">
          <Sliders size={22} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          No se encontraron ajustes de inventario
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto mt-1">
          {hasFilters
            ? 'No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados.'
            : 'No hay ajustes de stock registrados en el inventario actualmente.'}
        </p>
        {hasFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="apple-btn-secondary text-xs !h-8 !px-3 mt-4 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Restablecer filtros</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface2)] text-[var(--ink2)] font-medium select-none">
              <th className="py-2.5 px-3.5">Código</th>
              <th className="py-2.5 px-3">Producto / SKU</th>
              <th className="py-2.5 px-3">Categoría</th>
              <th className="py-2.5 px-3 text-center">Tipo</th>
              <th className="py-2.5 px-3 text-center">Previo</th>
              <th className="py-2.5 px-3 text-center">Nuevo</th>
              <th className="py-2.5 px-3 text-center">Variación</th>
              <th className="py-2.5 px-3 hidden lg:table-cell">Motivo</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Fecha / Hora</th>
              <th className="py-2.5 px-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] font-normal text-[var(--ink)]">
            {adjustments.map((a) => {
              const typeCfg = ADJUSTMENT_TYPE_CONFIG[a.type] || {
                label: a.type,
                badgeClass: 'apple-badge-neutral',
                icon: 'down',
              };
              const delta = a.newQty - a.previousQty;

              return (
                <tr
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className="hover:bg-[var(--surface2)]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3.5 font-mono font-medium text-[var(--accent)] whitespace-nowrap">
                    {a.code}
                  </td>

                  <td className="py-2.5 px-3 min-w-[170px]">
                    <div className="font-medium text-[var(--ink)] truncate">
                      {a.productName}
                    </div>
                    <span className="font-mono text-[10px] text-[var(--ink2)] block">
                      {a.sku || 'Sin SKU'}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="apple-badge apple-badge-neutral text-[10px]">
                      {a.category || 'General'}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`apple-badge ${typeCfg.badgeClass} text-[10px]`}>
                      {typeCfg.label}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center font-mono tabular-nums text-[var(--ink2)] whitespace-nowrap">
                    {a.previousQty}
                  </td>

                  <td className="py-2.5 px-3 text-center font-mono font-medium tabular-nums text-[var(--ink)] whitespace-nowrap">
                    {a.newQty}
                  </td>

                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`font-mono font-semibold tabular-nums text-[11px] ${
                        delta > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : delta < 0
                            ? a.type === 'perdida'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                            : 'text-[var(--ink2)]'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : `${delta}`}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 hidden lg:table-cell text-[var(--ink2)] max-w-[200px] truncate">
                    {a.reason}
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell text-[var(--ink2)] whitespace-nowrap">
                    <span>{a.date}</span>{' '}
                    <span className="font-mono text-[10px] text-[var(--ink2)]">{a.time}</span>
                  </td>

                  <td
                    className="py-2.5 px-3 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1 justify-end">
                      {onAdjustProduct && (
                        <button
                          type="button"
                          onClick={() => onAdjustProduct(a.productId)}
                          aria-label={`Ajustar stock de ${a.productName}`}
                          title="Ajustar stock de este producto"
                          className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--accent)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                        >
                          <Sliders size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelect(a)}
                        aria-label="Ver detalle del ajuste"
                        title="Ver detalle"
                        className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
