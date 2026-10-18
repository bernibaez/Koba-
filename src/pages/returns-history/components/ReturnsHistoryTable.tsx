import React from 'react';
import { Eye, Check, XCircle, RotateCcw } from 'lucide-react';
import type { PosReturn } from '../types';
import { RETURN_STATUS_CONFIG } from '../types';

interface ReturnsHistoryTableProps {
  returns: PosReturn[];
  isLoading?: boolean;
  onSelect: (item: PosReturn) => void;
  onApprove: (item: PosReturn) => void;
  onReject: (item: PosReturn) => void;
  isProcessing?: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ReturnsHistoryTable({
  returns,
  isLoading = false,
  onSelect,
  onApprove,
  onReject,
  isProcessing = false,
  hasFilters = false,
  onClearFilters,
}: ReturnsHistoryTableProps) {
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

  if (returns.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink2)] mx-auto mb-3">
          <RotateCcw size={22} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          No se encontraron devoluciones
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto mt-1">
          {hasFilters
            ? 'No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados.'
            : 'No hay devoluciones registradas en el sistema actualmente.'}
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
              <th className="py-2.5 px-3">Factura Ref.</th>
              <th className="py-2.5 px-3">Cliente</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Fecha/Hora</th>
              <th className="py-2.5 px-3 hidden lg:table-cell">Cajero</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Motivo</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] font-normal text-[var(--ink)]">
            {returns.map((r) => {
              const statusCfg = RETURN_STATUS_CONFIG[r.status] || {
                label: r.status,
                badgeClass: 'apple-badge-neutral',
              };

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className={`hover:bg-[var(--surface2)]/60 transition-colors cursor-pointer group ${
                    r.status === 'pending' ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="py-2.5 px-3.5 font-mono font-medium text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {r.code}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[var(--accent)] whitespace-nowrap">
                    {r.saleCode}
                  </td>

                  <td className="py-2.5 px-3 min-w-[140px]">
                    <div className="font-medium text-[var(--ink)] truncate">{r.customer}</div>
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell font-mono text-[var(--ink2)] whitespace-nowrap">
                    {r.date} <span className="text-[10px] opacity-80">{r.time}</span>
                  </td>

                  <td className="py-2.5 px-3 hidden lg:table-cell text-[var(--ink2)] whitespace-nowrap">
                    {r.user}
                  </td>

                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`apple-badge ${statusCfg.badgeClass} text-[10px]`}>
                      {statusCfg.label}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    RD$ {formatMoney(r.total)}
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell text-[var(--ink2)] max-w-[180px] truncate">
                    {r.reason}
                  </td>

                  <td
                    className="py-2.5 px-3 text-right whitespace-nowrap"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {r.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(r)}
                            disabled={isProcessing}
                            aria-label={`Aprobar devolución ${r.code}`}
                            title="Aprobar Devolución"
                            className="apple-btn-primary text-[11px] !h-6.5 !px-2 inline-flex items-center gap-1 cursor-pointer !bg-emerald-600 hover:!bg-emerald-700 !text-white"
                          >
                            <Check size={12} />
                            <span>Aprobar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(r)}
                            disabled={isProcessing}
                            aria-label={`Rechazar devolución ${r.code}`}
                            title="Rechazar Devolución"
                            className="apple-btn-secondary text-[11px] !h-6.5 !px-2 inline-flex items-center gap-1 cursor-pointer text-rose-600 hover:text-rose-700"
                          >
                            <XCircle size={12} />
                            <span>Rechazar</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelect(r)}
                          aria-label="Ver detalles y comprobante"
                          title="Ver detalle"
                          className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                        </button>
                      )}
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
