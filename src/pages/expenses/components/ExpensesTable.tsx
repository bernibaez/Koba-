import React from 'react';
import { Eye, Edit2, Check, X, Trash2, DollarSign } from 'lucide-react';
import type { GastoUi } from '../types';
import { EXPENSE_STATUS_CONFIG } from '../types';

interface ExpensesTableProps {
  gastos: GastoUi[];
  isLoading?: boolean;
  onView: (gasto: GastoUi) => void;
  onEdit: (gasto: GastoUi) => void;
  onApprove: (gasto: GastoUi) => void;
  onReject: (gasto: GastoUi) => void;
  onDelete: (gasto: GastoUi) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ExpensesTable({
  gastos,
  isLoading = false,
  onView,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  hasFilters = false,
  onClearFilters,
}: ExpensesTableProps) {
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

  if (gastos.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink2)] mx-auto mb-3">
          <DollarSign size={22} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          No se encontraron gastos registrados
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto mt-1">
          {hasFilters
            ? 'No hay registros que coincidan con la búsqueda o filtros seleccionados.'
            : 'No hay gastos registrados en el periodo actual.'}
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
              <th className="py-2.5 px-3">Descripción</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Categoría</th>
              <th className="py-2.5 px-3 hidden lg:table-cell">Responsable</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Fecha</th>
              <th className="py-2.5 px-3 text-right">Monto</th>
              <th className="py-2.5 px-3 text-center hidden sm:table-cell">Comprobante</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] font-normal text-[var(--ink)]">
            {gastos.map((e) => {
              const statusCfg = EXPENSE_STATUS_CONFIG[e.status] || {
                label: e.status,
                badgeClass: 'apple-badge-neutral',
              };

              return (
                <tr
                  key={e.id}
                  onClick={() => onView(e)}
                  className="hover:bg-[var(--surface2)]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3.5 font-mono font-medium text-[var(--accent)] whitespace-nowrap">
                    {e.code}
                  </td>

                  <td className="py-2.5 px-3 font-medium text-[var(--ink)] min-w-[160px]">
                    <div className="truncate">{e.description}</div>
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap">
                    <span className="apple-badge apple-badge-neutral text-[10px]">
                      {e.category || 'General'}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 hidden lg:table-cell text-[var(--ink2)] whitespace-nowrap">
                    {e.responsible}
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell font-mono text-[var(--ink2)] whitespace-nowrap">
                    {e.date}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                    RD$ {formatMoney(e.amount)}
                  </td>

                  <td className="py-2.5 px-3 text-center hidden sm:table-cell whitespace-nowrap">
                    {e.receipt ? (
                      <span className="apple-badge apple-badge-success text-[10px]">
                        Con recibo
                      </span>
                    ) : (
                      <span className="apple-badge apple-badge-neutral text-[10px] text-[var(--ink2)]">
                        Sin recibo
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`apple-badge ${statusCfg.badgeClass} text-[10px]`}>
                      {statusCfg.label}
                    </span>
                  </td>

                  <td
                    className="py-2.5 px-3 text-right whitespace-nowrap"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onView(e)}
                        aria-label="Ver detalle de gasto"
                        title="Ver detalle"
                        className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(e)}
                        aria-label="Editar gasto"
                        title="Editar"
                        className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>

                      {e.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(e)}
                            aria-label="Aprobar gasto"
                            title="Aprobar"
                            className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(e)}
                            aria-label="Rechazar gasto"
                            title="Rechazar"
                            className="p-1 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => onDelete(e)}
                        aria-label="Eliminar gasto"
                        title="Eliminar"
                        className="p-1 rounded-md text-[var(--ink2)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
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
