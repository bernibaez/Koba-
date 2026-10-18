import React from 'react';
import { Edit2, Trash2, Power, Star, Monitor, AlertCircle } from 'lucide-react';
import type { Caja } from '../types';
import { isCajaActiva, isCajaPrincipal } from '../types';

interface CajasTableProps {
  cajas: Caja[];
  isLoading?: boolean;
  onEdit: (caja: Caja) => void;
  onToggleActive: (caja: Caja) => void;
  onDelete: (caja: Caja) => void;
  onNewCaja?: () => void;
  hasSearch?: boolean;
}

export default function CajasTable({
  cajas,
  isLoading = false,
  onEdit,
  onToggleActive,
  onDelete,
  onNewCaja,
  hasSearch = false,
}: CajasTableProps) {
  if (isLoading) {
    return (
      <div className="w-full select-none" role="status" aria-label="Cargando cajas registradoras">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Código</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Nombre</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden sm:table-cell">Descripción</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Tipo</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Estado</th>
              <th className="w-24 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, idx) => (
              <tr key={`cajas-skel-${idx}`} className="border-b border-[var(--line)]">
                <td className="px-4 py-3.5">
                  <div className="h-3.5 w-12 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-3.5 w-36 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  <div className="h-3 w-48 rounded bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-5 w-20 rounded-full bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-5 w-16 rounded-full bg-[var(--chip)] animate-pulse" />
                </td>
                <td className="px-3 py-3.5 text-right">
                  <div className="h-6 w-16 ml-auto rounded bg-[var(--chip)] animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (cajas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--ink2)] mb-3">
          <Monitor size={22} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-[var(--ink)]">
          {hasSearch ? 'No se encontraron cajas registradoras.' : 'Aún no hay cajas registradoras configuradas.'}
        </p>
        <p className="text-xs text-[var(--ink2)] mt-1 max-w-sm">
          {hasSearch
            ? 'Intenta con otro término de búsqueda o código.'
            : 'Agrega tu primera terminal de caja para habilitar el Punto de Venta (POS).'}
        </p>
        {!hasSearch && onNewCaja && (
          <button
            type="button"
            onClick={onNewCaja}
            className="apple-btn-primary !h-8 !px-4 !text-xs mt-4 cursor-pointer"
          >
            Nueva caja
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
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Nombre</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)] hidden sm:table-cell">Descripción</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Jerarquía</th>
              <th className="px-4 py-3 text-xs font-medium text-[var(--ink2)]">Estado</th>
              <th className="w-24 px-3 py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {cajas.map((caja) => {
              const active = isCajaActiva(caja);
              const principal = isCajaPrincipal(caja);

              return (
                <tr
                  key={caja.id}
                  className={`border-b border-[var(--line)] transition-colors duration-100 hover:bg-[var(--hover)] group ${
                    !active ? 'opacity-55' : ''
                  }`}
                >
                  {/* Código */}
                  <td className="px-4 py-3.5 align-middle">
                    <span className="font-mono text-xs font-semibold text-[var(--ink)] tracking-tight">
                      #{caja.codigo}
                    </span>
                  </td>

                  {/* Nombre */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--ink)]">
                        {caja.nombre}
                      </span>
                    </div>
                  </td>

                  {/* Descripción */}
                  <td className="px-4 py-3.5 align-middle hidden sm:table-cell">
                    <span className="text-xs text-[var(--ink2)] line-clamp-1">
                      {caja.descripcion || '—'}
                    </span>
                  </td>

                  {/* Jerarquía */}
                  <td className="px-4 py-3.5 align-middle">
                    {principal ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Star size={11} className="fill-amber-500 text-amber-500" />
                        Principal
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--ink3)]">
                        Estándar
                      </span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3.5 align-middle">
                    {active ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--chip)] text-[var(--ink2)] border border-[var(--line)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink3)]" />
                        Inactiva
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-3 py-3.5 align-middle text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Alternar Activa */}
                      <button
                        type="button"
                        onClick={() => onToggleActive(caja)}
                        title={active ? 'Desactivar caja' : 'Activar caja'}
                        aria-label={`${active ? 'Desactivar' : 'Activar'} caja ${caja.nombre}`}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          active
                            ? 'text-emerald-600 hover:bg-emerald-500/10'
                            : 'text-[var(--ink3)] hover:text-[var(--ink)] hover:bg-[var(--chip)]'
                        }`}
                      >
                        <Power size={14} />
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => onEdit(caja)}
                        title="Editar caja"
                        aria-label={`Editar caja ${caja.nombre}`}
                        className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => onDelete(caja)}
                        title="Eliminar caja"
                        aria-label={`Eliminar caja ${caja.nombre}`}
                        className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--bad)] hover:bg-[var(--bad)]/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
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
        <span>{cajas.length} {cajas.length === 1 ? 'caja registradora' : 'cajas registradoras'}</span>
      </div>
    </div>
  );
}
