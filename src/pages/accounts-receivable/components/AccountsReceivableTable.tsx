import React from 'react';
import { Eye, Printer, HandCoins, AlertCircle, Calendar } from 'lucide-react';
import type { CuentaCobrarUi } from '../types';
import { CXC_STATUS_CONFIG } from '../types';

interface AccountsReceivableTableProps {
  cuentas: CuentaCobrarUi[];
  isLoading?: boolean;
  onSelect: (cuenta: CuentaCobrarUi) => void;
  onQuickPay: (cuenta: CuentaCobrarUi) => void;
  onPrint: (cuenta: CuentaCobrarUi) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AccountsReceivableTable({
  cuentas,
  isLoading = false,
  onSelect,
  onQuickPay,
  onPrint,
  hasFilters = false,
  onClearFilters,
}: AccountsReceivableTableProps) {
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

  if (cuentas.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink2)] mx-auto mb-3">
          <HandCoins size={22} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          No se encontraron cuentas por cobrar
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto mt-1">
          {hasFilters
            ? 'No hay cuentas que coincidan con los criterios de búsqueda o filtros seleccionados.'
            : 'No hay cuentas por cobrar registradas en el sistema actualmente.'}
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
              <th className="py-2.5 px-3">Factura</th>
              <th className="py-2.5 px-3">Cliente</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Vencimiento</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-right">Cobrado</th>
              <th className="py-2.5 px-3 text-right">Saldo</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] font-normal text-[var(--ink)]">
            {cuentas.map((r) => {
              const statusCfg = CXC_STATUS_CONFIG[r.status] || {
                label: r.status,
                badgeClass: 'apple-badge-neutral',
              };

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className="hover:bg-[var(--surface2)]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3.5 font-mono font-medium text-[var(--accent)] whitespace-nowrap">
                    {r.code}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-xs text-[var(--ink)] whitespace-nowrap">
                    {r.invoice || '—'}
                  </td>

                  <td className="py-2.5 px-3 min-w-[160px]">
                    <div className="font-medium text-[var(--ink)] truncate">
                      {r.customer}
                    </div>
                    {r.creditLimit > 0 && (
                      <span className="text-[10px] text-[var(--ink2)] block">
                        Límite: RD$ {formatMoney(r.creditLimit)}
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap">
                    <span className="text-[var(--ink)]">{r.dueDate}</span>
                    {r.daysOverdue > 0 ? (
                      <span className="inline-block ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        +{r.daysOverdue}d mora
                      </span>
                    ) : null}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    RD$ {formatMoney(r.total)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    RD$ {formatMoney(r.paid)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-medium tabular-nums whitespace-nowrap">
                    <span
                      className={
                        r.balance > 0
                          ? r.status === 'overdue'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-[var(--ink)]'
                          : 'text-[var(--ink2)]'
                      }
                    >
                      RD$ {formatMoney(r.balance)}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`apple-badge ${statusCfg.badgeClass} text-[10px]`}>
                      {statusCfg.label}
                    </span>
                  </td>

                  <td
                    className="py-2.5 px-3 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {r.balance > 0 && (
                        <button
                          type="button"
                          onClick={() => onQuickPay(r)}
                          aria-label={`Registrar cobro para ${r.customer}`}
                          className="apple-btn-primary text-[11px] !h-6.5 !px-2 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <HandCoins size={12} />
                          <span>Cobrar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelect(r)}
                        aria-label="Ver estado de cuenta e historial"
                        title="Ver detalle"
                        className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrint(r)}
                        aria-label="Imprimir estado de cuenta"
                        title="Imprimir estado de cuenta"
                        className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      >
                        <Printer size={13} />
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
