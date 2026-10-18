import React from 'react';
import { Eye, ArrowLeftRight } from 'lucide-react';
import type { TransferenciaUi } from '../types';
import { TRANSFER_STATUS_CONFIG } from '../types';

interface StockTransfersTableProps {
  transfers: TransferenciaUi[];
  isLoading?: boolean;
  onSelect: (item: TransferenciaUi) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export default function StockTransfersTable({
  transfers,
  isLoading = false,
  onSelect,
  hasFilters = false,
  onClearFilters,
}: StockTransfersTableProps) {
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

  if (transfers.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink2)] mx-auto mb-3">
          <ArrowLeftRight size={22} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          No se encontraron transferencias
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto mt-1">
          {hasFilters
            ? 'No hay traslados que coincidan con la búsqueda o filtros seleccionados.'
            : 'No hay transferencias de inventario registradas en el sistema.'}
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
              <th className="py-2.5 px-3">Sucursal Origen</th>
              <th className="py-2.5 px-3">Sucursal Destino</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Fecha</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Ítems</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] font-normal text-[var(--ink)]">
            {transfers.map((t) => {
              const statusCfg = TRANSFER_STATUS_CONFIG[t.estado] || {
                label: t.estado,
                badgeClass: 'apple-badge-neutral',
              };

              return (
                <tr
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className="hover:bg-[var(--surface2)]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3.5 font-mono font-medium text-[var(--accent)] whitespace-nowrap">
                    {t.codigo}
                  </td>

                  <td className="py-2.5 px-3 font-medium text-[var(--ink)] whitespace-nowrap">
                    {t.origen}
                  </td>

                  <td className="py-2.5 px-3 font-medium text-[var(--ink)] whitespace-nowrap">
                    {t.destino}
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell font-mono text-[var(--ink2)] whitespace-nowrap">
                    {t.fecha}
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell text-[var(--ink2)] whitespace-nowrap">
                    {t.items} producto(s)
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
                    <button
                      type="button"
                      onClick={() => onSelect(t)}
                      aria-label="Ver detalle de transferencia"
                      title="Ver detalle"
                      className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                    >
                      <Eye size={13} />
                    </button>
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
