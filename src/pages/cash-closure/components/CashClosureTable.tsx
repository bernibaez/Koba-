import React from 'react';
import { Eye, Printer, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { CashClosure } from '../types';
import { getDifferenceType } from '../types';

interface CashClosureTableProps {
  closures: CashClosure[];
  isLoading?: boolean;
  onViewDetail: (closure: CashClosure) => void;
  onPrint: (closure: CashClosure) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function renderDifferenceBadge(diff: number) {
  const type = getDifferenceType(diff);

  if (type === 'exact') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 size={11} />
        <span>Exacto</span>
      </span>
    );
  }

  if (type === 'surplus') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <AlertTriangle size={11} />
        <span className="font-mono">+{formatMoney(diff)}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
      <AlertTriangle size={11} />
      <span className="font-mono">-{formatMoney(Math.abs(diff))}</span>
    </span>
  );
}

export default function CashClosureTable({
  closures,
  isLoading = false,
  onViewDetail,
  onPrint,
  hasFilters = false,
  onClearFilters,
}: CashClosureTableProps) {
  if (isLoading) {
    return (
      <div className="w-full select-none" role="status" aria-label="Cargando cierres de caja">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Código</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Fecha / Turno</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden sm:table-cell">Caja</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden md:table-cell">Cajero</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right">Vendido</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right hidden lg:table-cell">Efectivo Contado</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-center">Cuadre</th>
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`closure-skel-${idx}`} className="border-b border-[var(--line)]">
                <td className="px-4 py-3.5">
                  <div className="h-3.5 w-20 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-3.5 w-24 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  <div className="h-3.5 w-24 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <div className="h-3.5 w-28 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="h-3.5 w-20 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                  <div className="h-3.5 w-20 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className="h-5 w-16 mx-auto rounded-full bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-3 py-3.5 text-right">
                  <div className="h-6 w-14 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (closures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--ink2)] mb-3">
          <ShieldCheck size={22} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-[var(--ink)]">
          {hasFilters ? 'No se encontraron cierres de caja.' : 'Aún no hay cierres de caja registrados.'}
        </p>
        <p className="text-xs text-[var(--ink2)] mt-1 max-w-sm">
          {hasFilters
            ? 'Intenta cambiar el rango de fechas o el filtro de usuario.'
            : 'Los arqueos y cierres de turno realizados aparecerán listados aquí.'}
        </p>
        {hasFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="apple-btn-ghost text-xs !h-8 !px-3.5 mt-4 cursor-pointer"
          >
            Restablecer filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Código</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Fecha / Turno</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden sm:table-cell">Caja</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden md:table-cell">Cajero</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right">Total ventas</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right hidden lg:table-cell">Efectivo contado</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-center">Cuadre</th>
              <th className="w-20 px-3 py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {closures.map((closure) => {
              const timeOpened = closure.openedAt.split(' ')[1] || closure.openedAt;
              const timeClosed = closure.closedAt.split(' ')[1] || closure.closedAt;

              return (
                <tr
                  key={closure.id}
                  onClick={() => onViewDetail(closure)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onViewDetail(closure);
                  }}
                  className="border-b border-[var(--line)] transition-colors duration-100 hover:bg-[var(--hover)] group cursor-pointer"
                  aria-label={`Cierre ${closure.code}, cajero ${closure.userName}`}
                >
                  {/* Código */}
                  <td className="px-4 py-3.5 align-middle">
                    <span className="font-mono text-xs font-semibold text-[var(--ink)] tracking-tight">
                      {closure.code}
                    </span>
                  </td>

                  {/* Fecha / Turno */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="text-xs font-medium text-[var(--ink)]">
                      {closure.date}
                    </div>
                    <div className="text-[11px] text-[var(--ink2)] font-mono mt-0.5">
                      {timeOpened} → {timeClosed}
                    </div>
                  </td>

                  {/* Caja */}
                  <td className="px-4 py-3.5 align-middle hidden sm:table-cell">
                    <span className="text-xs text-[var(--ink)]">
                      {closure.cashRegisterLabel || `Caja #${closure.cashRegisterId}`}
                    </span>
                  </td>

                  {/* Cajero */}
                  <td className="px-4 py-3.5 align-middle hidden md:table-cell">
                    <div className="text-xs font-medium text-[var(--ink)]">
                      {closure.userName}
                    </div>
                    <div className="text-[11px] text-[var(--ink2)]">
                      @{closure.username || 'usuario'}
                    </div>
                  </td>

                  {/* Total Ventas */}
                  <td className="px-4 py-3.5 align-middle text-right">
                    <span className="font-mono text-xs font-semibold text-[var(--ink)] tabular-nums">
                      RD$ {formatMoney(closure.totalSales)}
                    </span>
                  </td>

                  {/* Efectivo Contado */}
                  <td className="px-4 py-3.5 align-middle text-right hidden lg:table-cell">
                    <span className="font-mono text-xs text-[var(--ink)] tabular-nums">
                      RD$ {formatMoney(closure.countedCash)}
                    </span>
                  </td>

                  {/* Cuadre */}
                  <td className="px-4 py-3.5 align-middle text-center">
                    {renderDifferenceBadge(closure.difference)}
                  </td>

                  {/* Acciones */}
                  <td
                    className="px-3 py-3.5 align-middle text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(closure)}
                        title="Ver detalle de arqueo"
                        aria-label={`Ver detalle de cierre ${closure.code}`}
                        className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrint(closure)}
                        title="Imprimir comprobante"
                        aria-label={`Imprimir comprobante de cierre ${closure.code}`}
                        className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--ink2)]">
        <span>{closures.length} {closures.length === 1 ? 'cierre de caja registrado' : 'cierres de caja registrados'}</span>
      </div>
    </div>
  );
}
