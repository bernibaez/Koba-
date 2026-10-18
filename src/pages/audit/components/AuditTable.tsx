import React from 'react';
import { Eye, ShieldCheck } from 'lucide-react';
import type { AuditLog } from '../types';
import { ACTION_BADGE_MAP } from '../types';

interface AuditTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  onSelect: (log: AuditLog) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export default function AuditTable({
  logs,
  isLoading = false,
  onSelect,
  hasFilters = false,
  onClearFilters,
}: AuditTableProps) {
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

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink2)] mx-auto mb-3">
          <ShieldCheck size={22} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          No se encontraron registros de auditoría
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto mt-1">
          {hasFilters
            ? 'No hay eventos que coincidan con la búsqueda o filtros seleccionados.'
            : 'No hay eventos de auditoría registrados en la base de datos.'}
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
              <th className="py-2.5 px-3.5">Fecha / Hora</th>
              <th className="py-2.5 px-3">Usuario</th>
              <th className="py-2.5 px-3">Acción</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Módulo</th>
              <th className="py-2.5 px-3">Detalle de la Acción</th>
              <th className="py-2.5 px-3 hidden lg:table-cell">IP / Dispositivo</th>
              <th className="py-2.5 px-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] font-normal text-[var(--ink)]">
            {logs.map((log) => {
              const badgeClass = ACTION_BADGE_MAP[log.action] || 'apple-badge-neutral';

              return (
                <tr
                  key={log.id}
                  onClick={() => onSelect(log)}
                  className="hover:bg-[var(--surface2)]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3.5 font-mono text-[var(--ink2)] whitespace-nowrap">
                    <span>{log.date}</span>{' '}
                    <span className="font-semibold text-[var(--ink)]">{log.time}</span>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <p className="font-medium text-[var(--ink)]">{log.user}</p>
                    <span className="text-[10px] text-[var(--ink2)] block">{log.role}</span>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`apple-badge ${badgeClass} text-[10px]`}>
                      {log.action}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell text-[var(--ink2)] whitespace-nowrap">
                    {log.module}
                  </td>

                  <td className="py-2.5 px-3 max-w-[300px] truncate text-[var(--ink)]">
                    {log.details}
                  </td>

                  <td className="py-2.5 px-3 hidden lg:table-cell font-mono text-[10px] text-[var(--ink2)] whitespace-nowrap">
                    {log.ip || '—'}
                  </td>

                  <td
                    className="py-2.5 px-3 text-right whitespace-nowrap"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(log)}
                      aria-label="Ver cambios antes y después"
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
