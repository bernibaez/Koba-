import React from 'react';
import { Eye, Printer, Wallet, AlertCircle, Calendar } from 'lucide-react';
import type { CuentaPagarUi } from '../types';
import { CXP_STATUS_CONFIG } from '../types';

interface AccountsPayableTableProps {
  cuentas: CuentaPagarUi[];
  isLoading?: boolean;
  onSelect: (cuenta: CuentaPagarUi) => void;
  onQuickPay: (cuenta: CuentaPagarUi) => void;
  onPrint: (cuenta: CuentaPagarUi) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AccountsPayableTable({
  cuentas,
  isLoading = false,
  onSelect,
  onQuickPay,
  onPrint,
  hasFilters = false,
  onClearFilters,
}: AccountsPayableTableProps) {
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
          <Wallet size={22} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          No se encontraron cuentas por pagar
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto mt-1">
          {hasFilters
            ? 'No hay cuentas que coincidan con los criterios de búsqueda o filtros seleccionados.'
            : 'No hay cuentas por pagar registradas en el sistema actualmente.'}
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
              <th className="py-2.5 px-3">Compra Ref</th>
              <th className="py-2.5 px-3">Proveedor</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Vencimiento</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-right">Pagado</th>
              <th className="py-2.5 px-3 text-right">Saldo</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] font-normal text-[var(--ink)]">
            {cuentas.map((p) => {
              const statusCfg = CXP_STATUS_CONFIG[p.status] || {
                label: p.status,
                badgeClass: 'apple-badge-neutral',
              };

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="hover:bg-[var(--surface2)]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3.5 font-mono font-medium text-[var(--accent)] whitespace-nowrap">
                    {p.code}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-xs text-[var(--ink)] whitespace-nowrap">
                    {p.purchase || '—'}
                  </td>

                  <td className="py-2.5 px-3 min-w-[160px]">
                    <div className="font-medium text-[var(--ink)] truncate">
                      {p.supplier}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap">
                    <span className="text-[var(--ink)]">{p.dueDate}</span>
                    {p.daysOverdue > 0 ? (
                      <span className="inline-block ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        +{p.daysOverdue}d mora
                      </span>
                    ) : null}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    RD$ {formatMoney(p.total)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    RD$ {formatMoney(p.paid)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-medium tabular-nums whitespace-nowrap">
                    <span
                      className={
                        p.balance > 0
                          ? p.status === 'overdue'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-[var(--ink)]'
                          : 'text-[var(--ink2)]'
                      }
                    >
                      RD$ {formatMoney(p.balance)}
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
                      {p.balance > 0 && (
                        <button
                          type="button"
                          onClick={() => onQuickPay(p)}
                          aria-label={`Registrar pago a ${p.supplier}`}
                          className="apple-btn-primary text-[11px] !h-6.5 !px-2 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Wallet size={12} />
                          <span>Pagar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelect(p)}
                        aria-label="Ver estado de cuenta de proveedor"
                        title="Ver detalle"
                        className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrint(p)}
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
