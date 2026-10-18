import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, AlertCircle, RotateCcw } from 'lucide-react';
import type { Sale, PaymentMethod } from '../types';
import type { SaleActionType, SalePermissions } from '../utils/saleActions';
import SaleRowActions from './SaleRowActions';
import SalesTableSkeleton from './SalesTableSkeleton';
import SalesEmptyState from './SalesEmptyState';

interface SalesTableProps {
  sales: Sale[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (field: string, dir: 'asc' | 'desc') => void;
  onRowClick?: (sale: Sale) => void;
  renderRowActions?: (sale: Sale) => React.ReactNode;
  permissions?: SalePermissions;
  onAction?: (actionType: SaleActionType, sale: Sale) => void;
  openActionsId?: string | null;
  onToggleActionsId?: (id: string | null) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onNewSale?: () => void;
  footerAction?: React.ReactNode;
}

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  pending: 'Pendiente',
};

function formatDate(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: '' };
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`,
    };
  } catch {
    return { date: dateStr, time: '' };
  }
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SalesTable({
  sales,
  isLoading = false,
  error = null,
  onRetry,
  sortField,
  sortDir,
  onSortChange,
  onRowClick,
  renderRowActions,
  permissions,
  onAction,
  openActionsId,
  onToggleActionsId,
  hasFilters = false,
  onClearFilters,
  onNewSale,
  footerAction,
}: SalesTableProps) {
  const [internalOpenActionsId, setInternalOpenActionsId] = useState<string | null>(null);
  const activeActionsId = openActionsId !== undefined ? openActionsId : internalOpenActionsId;

  const handleToggleActions = (id: string | null) => {
    if (onToggleActionsId) {
      onToggleActionsId(id);
    } else {
      setInternalOpenActionsId(id);
    }
  };

  const columns = useMemo<ColumnDef<Sale, unknown>[]>(
    () => [
      {
        id: 'ncf',
        accessorKey: 'ncf',
        header: 'Factura',
      },
      {
        id: 'date',
        accessorKey: 'date',
        header: 'Fecha',
      },
      {
        id: 'client',
        accessorKey: 'client',
        header: 'Cliente',
      },
      {
        id: 'paymentMethod',
        accessorKey: 'paymentMethod',
        header: 'Pago',
      },
      {
        id: 'total',
        accessorKey: 'total',
        header: 'Total',
      },
      {
        id: 'grossProfit',
        accessorKey: 'grossProfit',
        header: 'Ganancia',
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Estado',
      },
      {
        id: 'actions',
        header: '',
      },
    ],
    [],
  );

  const sortedSales = useMemo(() => {
    const list = [...sales];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'ncf') {
        comparison = a.ncf.localeCompare(b.ncf);
      } else if (sortField === 'client') {
        comparison = a.client.localeCompare(b.client);
      } else if (sortField === 'paymentMethod') {
        comparison = (paymentLabels[a.paymentMethod] || '').localeCompare(paymentLabels[b.paymentMethod] || '');
      } else if (sortField === 'total') {
        comparison = a.total - b.total;
      } else if (sortField === 'grossProfit') {
        comparison = a.grossProfit - b.grossProfit;
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return sortDir === 'desc' ? -comparison : comparison;
    });
    return list;
  }, [sales, sortField, sortDir]);

  const table = useReactTable({
    data: sortedSales,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const handleHeaderClick = (columnId: string) => {
    if (columnId === 'actions') return;
    if (sortField === columnId) {
      onSortChange(columnId, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(columnId, 'desc');
    }
  };

  if (isLoading) {
    return <SalesTableSkeleton />;
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
            <span>No se pudieron cargar las ventas. Revisa tu conexión.</span>
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

      {/* Tabla con líneas divisorias de 1px */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)]">
              {/* Factura */}
              <th
                onClick={() => handleHeaderClick('ncf')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] cursor-pointer hover:text-[var(--ink)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Factura</span>
                  {sortField === 'ncf' && (
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

              {/* Cliente (oculto < 820px) */}
              <th
                onClick={() => handleHeaderClick('client')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] cursor-pointer hover:text-[var(--ink)] transition-colors hidden min-[820px]:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>Cliente</span>
                  {sortField === 'client' && (
                    sortDir === 'desc' ? <ArrowDown size={12} strokeWidth={2} /> : <ArrowUp size={12} strokeWidth={2} />
                  )}
                </div>
              </th>

              {/* Pago (oculto < 820px) */}
              <th
                onClick={() => handleHeaderClick('paymentMethod')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] cursor-pointer hover:text-[var(--ink)] transition-colors hidden min-[820px]:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>Pago</span>
                  {sortField === 'paymentMethod' && (
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

              {/* Ganancia (oculta < 820px) */}
              <th
                onClick={() => handleHeaderClick('grossProfit')}
                className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right cursor-pointer hover:text-[var(--ink)] transition-colors hidden min-[820px]:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Ganancia</span>
                  {sortField === 'grossProfit' && (
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
            {sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12">
                  <SalesEmptyState
                    tab="sales"
                    hasFilters={hasFilters}
                    onClearFilters={onClearFilters}
                    onNewSale={onNewSale}
                  />
                </td>
              </tr>
            ) : (
              sortedSales.map((sale) => {
                const isVoided = sale.status === 'voided';
                const { date, time } = formatDate(sale.date);
                const marginPct =
                  sale.total > 0
                    ? ((sale.grossProfit / sale.total) * 100).toFixed(1)
                    : '0.0';

                return (
                  <tr
                    key={sale.id}
                    onClick={() => onRowClick?.(sale)}
                    className={`border-b border-[var(--line)] transition-colors duration-100 hover:bg-[var(--hover)] group cursor-pointer ${
                      isVoided ? 'opacity-55' : ''
                    }`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onRowClick?.(sale);
                      }
                    }}
                    aria-label={`Factura ${sale.ncf}, total RD$ ${formatMoney(sale.total)}`}
                  >
                    {/* Factura */}
                    <td className="px-4 py-3.5 align-middle">
                      <div className="font-mono text-[13px] font-medium text-[var(--ink)] tracking-tight">
                        {sale.ncf}
                      </div>
                      <div className="text-xs text-[var(--ink2)] mt-0.5">
                        {sale.kind}
                      </div>
                    </td>

                    {/* Fecha (oculta < 820px) */}
                    <td className="px-4 py-3.5 align-middle hidden min-[820px]:table-cell">
                      <div className="text-xs text-[var(--ink)] font-normal tabular-nums">
                        {date}
                      </div>
                      {time && (
                        <div className="text-xs text-[var(--ink2)] tabular-nums mt-0.5">
                          {time}
                        </div>
                      )}
                    </td>

                    {/* Cliente (oculto < 820px) */}
                    <td className="px-4 py-3.5 align-middle hidden min-[820px]:table-cell">
                      <div className="text-xs font-medium text-[var(--ink)] truncate max-w-[190px]">
                        {sale.client}
                      </div>
                      <div className="text-xs text-[var(--ink2)] mt-0.5 truncate max-w-[190px]">
                        {sale.cashier}
                      </div>
                    </td>

                    {/* Pago (oculto < 820px) */}
                    <td className="px-4 py-3.5 align-middle hidden min-[820px]:table-cell">
                      <span className="text-xs text-[var(--ink2)]">
                        {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                      </span>
                    </td>

                    {/* Total (derecha) */}
                    <td className="px-4 py-3.5 align-middle text-right">
                      <div
                        className={`text-xs sm:text-[13px] font-semibold tabular-nums ${
                          isVoided ? 'text-[var(--ink2)]' : 'text-[var(--ink)]'
                        }`}
                      >
                        RD$ {formatMoney(sale.total)}
                      </div>
                      {sale.itbis > 0 && (
                        <div className="text-xs text-[var(--ink2)] tabular-nums mt-0.5">
                          ITBIS {formatMoney(sale.itbis)}
                        </div>
                      )}
                    </td>

                    {/* Ganancia (derecha, oculta < 820px) */}
                    <td className="px-4 py-3.5 align-middle text-right hidden min-[820px]:table-cell">
                      <div
                        className={`text-xs sm:text-[13px] font-medium tabular-nums ${
                          isVoided ? 'text-[var(--ink2)]' : 'text-[var(--ok)]'
                        }`}
                      >
                        RD$ {formatMoney(sale.grossProfit)}
                      </div>
                      <div className="text-xs text-[var(--ink2)] tabular-nums mt-0.5">
                        {marginPct} %
                      </div>
                    </td>

                    {/* Estado (punto de 7px + texto) */}
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              sale.status === 'completed'
                                ? 'var(--ok)'
                                : sale.status === 'draft'
                                  ? 'var(--warn)'
                                  : 'var(--ink3)',
                          }}
                        />
                        <span
                          className={`text-xs ${
                            isVoided ? 'text-[var(--ink2)]' : 'text-[var(--ink)]'
                          }`}
                        >
                          {sale.status === 'completed'
                            ? 'Completada'
                            : sale.status === 'draft'
                              ? 'Borrador'
                              : 'Anulada'}
                        </span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td
                      className="w-20 px-3 py-3.5 align-middle text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderRowActions ? (
                        renderRowActions(sale)
                      ) : onAction ? (
                        <SaleRowActions
                          sale={sale}
                          permissions={permissions}
                          isOpen={activeActionsId === sale.id}
                          onToggleOpen={() => handleToggleActions(activeActionsId === sale.id ? null : sale.id)}
                          onClose={() => handleToggleActions(null)}
                          onAction={onAction}
                        />
                      ) : (
                        <div className="w-6 h-6" />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla */}
      <div className="flex items-center justify-between py-4 text-xs text-[var(--ink2)] select-none">
        <span>{sales.length} registros</span>
        {footerAction && <div>{footerAction}</div>}
      </div>
    </div>
  );
}
