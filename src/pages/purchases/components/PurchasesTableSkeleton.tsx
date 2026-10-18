import React from 'react';

export default function PurchasesTableSkeleton() {
  return (
    <div className="w-full select-none" role="status" aria-label="Cargando compras">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--line)]">
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Orden</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Proveedor</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden min-[820px]:table-cell">Fecha</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden min-[960px]:table-cell text-right">Ítems</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden min-[1100px]:table-cell text-right">ITBIS</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] text-right">Total</th>
            <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Estado</th>
            <th className="w-16 px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, idx) => (
            <tr key={`purchases-skeleton-${idx}`} className="border-b border-[var(--line)]">
              {/* Código */}
              <td className="px-4 py-3.5">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 rounded bg-[var(--chip)] animate-pulse" />
                  <div className="h-2.5 w-16 rounded bg-[var(--chip)] animate-pulse" />
                </div>
              </td>

              {/* Proveedor */}
              <td className="px-4 py-3.5">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-36 rounded bg-[var(--chip)] animate-pulse" />
                  <div className="h-2.5 w-20 rounded bg-[var(--chip)] animate-pulse" />
                </div>
              </td>

              {/* Fecha */}
              <td className="px-4 py-3.5 hidden min-[820px]:table-cell">
                <div className="h-3.5 w-24 rounded bg-[var(--chip)] animate-pulse" />
              </td>

              {/* Ítems */}
              <td className="px-4 py-3.5 hidden min-[960px]:table-cell text-right">
                <div className="h-3.5 w-12 ml-auto rounded bg-[var(--chip)] animate-pulse" />
              </td>

              {/* ITBIS */}
              <td className="px-4 py-3.5 hidden min-[1100px]:table-cell text-right">
                <div className="h-3.5 w-20 ml-auto rounded bg-[var(--chip)] animate-pulse" />
              </td>

              {/* Total */}
              <td className="px-4 py-3.5 text-right">
                <div className="h-3.5 w-24 ml-auto rounded bg-[var(--chip)] animate-pulse" />
              </td>

              {/* Estado */}
              <td className="px-4 py-3.5">
                <div className="h-5 w-20 rounded-full bg-[var(--chip)] animate-pulse" />
              </td>

              {/* Acciones */}
              <td className="px-3 py-3.5 text-right">
                <div className="h-6 w-6 ml-auto rounded-lg bg-[var(--chip)] animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
