import React from 'react';

export default function SalesTableSkeleton() {
  return (
    <div className="w-full select-none" role="status" aria-label="Cargando ventas">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--line)]">
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Factura</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden min-[820px]:table-cell">Fecha</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden min-[820px]:table-cell">Cliente</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden min-[820px]:table-cell">Pago</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right">Total</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right hidden min-[820px]:table-cell">Ganancia</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Estado</th>
            <th className="w-12 px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, idx) => (
            <tr key={`sales-skeleton-${idx}`} className="border-b border-[var(--line)]">
              {/* Factura */}
              <td className="px-4 py-3.5">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-[var(--chip)] animate-pulse" />
                  <div className="h-2.5 w-20 rounded bg-[var(--chip)] animate-pulse" />
                </div>
              </td>

              {/* Fecha */}
              <td className="px-4 py-3.5 hidden min-[820px]:table-cell">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-[var(--chip)] animate-pulse" />
                  <div className="h-2.5 w-14 rounded bg-[var(--chip)] animate-pulse" />
                </div>
              </td>

              {/* Cliente */}
              <td className="px-4 py-3.5 hidden min-[820px]:table-cell">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-36 rounded bg-[var(--chip)] animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-[var(--chip)] animate-pulse" />
                </div>
              </td>

              {/* Pago */}
              <td className="px-4 py-3.5 hidden min-[820px]:table-cell">
                <div className="h-3.5 w-16 rounded bg-[var(--chip)] animate-pulse" />
              </td>

              {/* Total */}
              <td className="px-4 py-3.5 text-right">
                <div className="space-y-1.5 ml-auto w-24">
                  <div className="h-3.5 w-24 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                  <div className="h-2.5 w-16 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                </div>
              </td>

              {/* Ganancia */}
              <td className="px-4 py-3.5 text-right hidden min-[820px]:table-cell">
                <div className="space-y-1.5 ml-auto w-20">
                  <div className="h-3.5 w-20 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                  <div className="h-2.5 w-12 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                </div>
              </td>

              {/* Estado */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-[7px] h-[7px] rounded-full bg-[var(--chip)] animate-pulse" />
                  <div className="h-3.5 w-16 rounded bg-[var(--chip)] animate-pulse" />
                </div>
              </td>

              {/* Acciones */}
              <td className="w-12 px-3 py-3.5" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
