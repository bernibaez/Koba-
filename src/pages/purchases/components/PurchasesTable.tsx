import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, AlertCircle, RotateCcw, Eye, Trash2, Ban } from 'lucide-react';
import type { Purchase, PurchaseStatus } from '../types';
import PurchasesTableSkeleton from './PurchasesTableSkeleton';
import PurchasesEmptyState from './PurchasesEmptyState';

interface PurchasesTableProps {
  purchases: Purchase[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (field: string, dir: 'asc' | 'desc') => void;
  onRowClick?: (purchase: Purchase) => void;
  onViewDetail?: (purchase: Purchase) => void;
  onVoidPurchase?: (purchase: Purchase) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onNewPurchase?: () => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function renderStatusBadge(status: PurchaseStatus) {
  const norm = status === 'anulada' ? 'voided' : status;
  switch (norm) {
    case 'received':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Recibida
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Pendiente
        </span>
      );
    case 'partial':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Parcial
        </span>
      );
    case 'voided':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Anulada
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--chip)] text-[var(--ink2)]">
          {status}
        </span>
      );
  }
}

export default function PurchasesTable({
  purchases,
  isLoading = false,
  error = null,
  onRetry,
  sortField,
  sortDir,
  onSortChange,
  onRowClick,
  onViewDetail,
  onVoidPurchase,
  hasFilters = false,
  onClearFilters,
  onNewPurchase,
}: PurchasesTableProps) {
  const sortedPurchases = useMemo(() => {
    const list = [...purchases];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'code') {
        comparison = (a.code || '').localeCompare(b.code || '');
      } else if (sortField === 'supplier') {
        comparison = (a.supplier || '').localeCompare(b.supplier || '');
      } else if (sortField === 'items') {
        comparison = (a.items || 0) - (b.items || 0);
      } else if (sortField === 'tax') {
        comparison = (a.tax || 0) - (b.tax || 0);
      } else if (sortField === 'total') {
        comparison = (a.total || 0) - (b.total || 0);
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      } else {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return sortDir === 'desc' ? -comparison : comparison;
    });
    return list;
  }, [purchases, sortField, sortDir]);

  const handleHeaderClick = (columnId: string) => {
    if (sortField === columnId) {
      onSortChange(columnId, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(columnId, 'desc');
    }
  };

  if (isLoading) {
    return <PurchasesTableSkeleton />;
  }

  return (
    <div className="w-full select-none">
      {/* Error discreto en una línea sobre la tabla */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between px-3.5 py-2.5 mb-3 rounded-xl border border-[var(--bad)]/20 bg-[var(--bad)]/5 text-xs text-[var(--bad)]"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>No se pudieron cargar las compras. Revisa tu conexión.</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 font-semibold hover:underline cursor-pointer ml-3 outline-none focus-visible:ring-1 focus-visible:ring-[var(--bad)]"
            >
              <RotateCcw size={12} />
              <span>Reintentar</span>
            </button>
          )}
        </div>
      )}

      {/* Tabla con líneas divisorias de 1px estilo Apple */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)]">
              {/* Código / Factura */}
              <th
                onClick={() => handleHeaderClick('code')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] cursor-pointer hover:text-[var(--ink)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Orden</span>
                  {sortField === 'code' && (
                    sortDir === 'desc' ? <ArrowDown size={12} strokeWidth={2} /> : <ArrowUp size={12} strokeWidth={2} />
                  )}
                </div>
              </th>

              {/* Proveedor */}
              <th
                onClick={() => handleHeaderClick('supplier')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] cursor-pointer hover:text-[var(--ink)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Proveedor</span>
                  {sortField === 'supplier' && (
                    sortDir === 'desc' ? <ArrowDown size={12} strokeWidth={2} /> : <ArrowUp size={12} strokeWidth={2} />
                  )}
                </div>
              </th>

              {/* Fecha (oculta < 820px) */}
              <th
                onClick={() => handleHeaderClick('date')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] cursor-pointer hover:text-[var(--ink)] transition-colors hidden min-[820px]:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>Fecha</span>
                  {sortField === 'date' && (
                    sortDir === 'desc' ? <ArrowDown size={12} strokeWidth={2} /> : <ArrowUp size={12} strokeWidth={2} />
                  )}
                </div>
              </th>

              {/* Ítems (oculto < 960px) */}
              <th
                onClick={() => handleHeaderClick('items')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right cursor-pointer hover:text-[var(--ink)] transition-colors hidden min-[960px]:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Ítems</span>
                  {sortField === 'items' && (
                    sortDir === 'desc' ? <ArrowDown size={12} strokeWidth={2} /> : <ArrowUp size={12} strokeWidth={2} />
                  )}
                </div>
              </th>

              {/* ITBIS (oculto < 1100px) */}
              <th
                onClick={() => handleHeaderClick('tax')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right cursor-pointer hover:text-[var(--ink)] transition-colors hidden min-[1100px]:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>ITBIS</span>
                  {sortField === 'tax' && (
                    sortDir === 'desc' ? <ArrowDown size={12} strokeWidth={2} /> : <ArrowUp size={12} strokeWidth={2} />
                  )}
                </div>
              </th>

              {/* Total */}
              <th
                onClick={() => handleHeaderClick('total')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right cursor-pointer hover:text-[var(--ink)] transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total</span>
                  {sortField === 'total' && (
                    sortDir === 'desc' ? <ArrowDown size={12} strokeWidth={2} /> : <ArrowUp size={12} strokeWidth={2} />
                  )}
                </div>
              </th>

              {/* Estado */}
              <th
                onClick={() => handleHeaderClick('status')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] cursor-pointer hover:text-[var(--ink)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Estado</span>
                  {sortField === 'status' && (
                    sortDir === 'desc' ? <ArrowDown size={12} strokeWidth={2} /> : <ArrowUp size={12} strokeWidth={2} />
                  )}
                </div>
              </th>

              {/* Acciones */}
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>

          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12">
                  <PurchasesEmptyState
                    tab="purchases"
                    hasFilters={hasFilters}
                    onClearFilters={onClearFilters}
                    onNewPurchase={onNewPurchase}
                  />
                </td>
              </tr>
            ) : (
              sortedPurchases.map((purchase) => {
                const isVoided = purchase.status === 'voided' || purchase.status === 'anulada';

                return (
                  <tr
                    key={purchase.id}
                    onClick={() => onRowClick?.(purchase)}
                    className={`border-b border-[var(--line)] transition-colors duration-100 hover:bg-[var(--hover)] group cursor-pointer ${
                      isVoided ? 'opacity-55' : ''
                    }`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onRowClick?.(purchase);
                      }
                    }}
                    aria-label={`Orden ${purchase.code}, total RD$ ${formatMoney(purchase.total)}`}
                  >
                    {/* Código / Orden */}
                    <td className="px-4 py-3.5 align-middle">
                      <div className="font-mono text-[13px] font-medium text-[var(--ink)] tracking-tight">
                        {purchase.code}
                      </div>
                      <div className="text-xs text-[var(--ink2)] mt-0.5">
                        {purchase.paymentMethod || purchase.payment || 'Transferencia'}
                      </div>
                    </td>

                    {/* Proveedor */}
                    <td className="px-4 py-3.5 align-middle">
                      <div className="text-xs font-medium text-[var(--ink)]">
                        {purchase.supplier}
                      </div>
                    </td>

                    {/* Fecha (oculta < 820px) */}
                    <td className="px-4 py-3.5 align-middle hidden min-[820px]:table-cell">
                      <div className="text-xs text-[var(--ink)] font-normal tabular-nums">
                        {formatDate(purchase.date)}
                      </div>
                    </td>

                    {/* Ítems (oculto < 960px) */}
                    <td className="px-4 py-3.5 align-middle text-right hidden min-[960px]:table-cell">
                      <span className="text-xs text-[var(--ink2)] tabular-nums">
                        {purchase.items} {purchase.items === 1 ? 'ítem' : 'ítems'}
                      </span>
                    </td>

                    {/* ITBIS (oculto < 1100px) */}
                    <td className="px-4 py-3.5 align-middle text-right hidden min-[1100px]:table-cell">
                      <span className="font-mono text-xs text-[var(--ink2)] tabular-nums">
                        RD$ {formatMoney(purchase.tax)}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5 align-middle text-right">
                      <span className="font-mono text-[13px] font-semibold text-[var(--ink)] tabular-nums">
                        RD$ {formatMoney(purchase.total)}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5 align-middle">
                      {renderStatusBadge(purchase.status)}
                    </td>

                    {/* Acciones */}
                    <td
                      className="px-3 py-3.5 align-middle text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {onViewDetail && (
                          <button
                            type="button"
                            onClick={() => onViewDetail(purchase)}
                            title="Ver detalle"
                            aria-label={`Ver detalle de orden ${purchase.code}`}
                            className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                        )}

                        {onVoidPurchase && (
                          <button
                            type="button"
                            onClick={() => onVoidPurchase(purchase)}
                            disabled={isVoided}
                            title={isVoided ? 'Compra ya anulada' : 'Anular compra'}
                            aria-label={`Anular orden ${purchase.code}`}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isVoided
                                ? 'text-[var(--ink3)] opacity-40 cursor-not-allowed'
                                : 'text-[var(--ink2)] hover:text-[var(--bad)] hover:bg-[var(--bad)]/10'
                            }`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla con conteo */}
      {purchases.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--ink2)]">
          <span>{purchases.length} {purchases.length === 1 ? 'orden de compra' : 'órdenes de compra'}</span>
        </div>
      )}
    </div>
  );
}
