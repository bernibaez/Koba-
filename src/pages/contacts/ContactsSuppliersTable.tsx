import React from 'react';
import { Phone, Mail, MapPin, Eye, Edit2, Trash2, Truck } from 'lucide-react';
import type { Supplier } from './types';

interface ContactsSuppliersTableProps {
  suppliers: Supplier[];
  onPreview: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export const ContactsSuppliersTable: React.FC<ContactsSuppliersTableProps> = ({
  suppliers,
  onPreview,
  onEdit,
  onDelete,
}) => {
  const formatMoney = (amount: number) => {
    return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (suppliers.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center mx-auto mb-3 text-[var(--ink3)]">
          <Truck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-1">
          No se encontraron proveedores
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto">
          Prueba cambiando el término de búsqueda o registra un nuevo proveedor comercial.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface2)]/50 text-[var(--ink2)] font-medium">
              <th className="py-2.5 px-3.5">Proveedor</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Contacto</th>
              <th className="py-2.5 px-3 hidden lg:table-cell">Teléfono / Email</th>
              <th className="py-2.5 px-3 hidden xl:table-cell text-right">Balance Pendiente</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
            {suppliers.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-[var(--surface2)]/40 transition-colors group cursor-pointer"
                onClick={() => onPreview(s)}
              >
                <td className="py-2.5 px-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                      {s.name ? s.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors truncate max-w-[200px] sm:max-w-xs">
                        {s.name}
                      </p>
                      {s.address ? (
                        <div className="flex items-center gap-1 text-[11px] text-[var(--ink2)] mt-0.5 truncate max-w-[220px]">
                          <MapPin className="w-3 h-3 text-[var(--ink3)] shrink-0" />
                          <span className="truncate">{s.address}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--ink3)]">Sin dirección</span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-2.5 px-3 hidden md:table-cell text-[11px] text-[var(--ink2)]">
                  {s.contact || '—'}
                </td>

                <td className="py-2.5 px-3 hidden lg:table-cell">
                  <div className="text-[11px] space-y-0.5">
                    {s.phone && (
                      <div className="flex items-center gap-1.5 text-[var(--ink)]">
                        <Phone className="w-3 h-3 text-[var(--ink3)]" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-1.5 text-[var(--ink2)] truncate max-w-[160px]">
                        <Mail className="w-3 h-3 text-[var(--ink3)]" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                    {!s.phone && !s.email && (
                      <span className="text-[var(--ink3)]">—</span>
                    )}
                  </div>
                </td>

                <td className="py-2.5 px-3 hidden xl:table-cell text-right font-mono text-[11px]">
                  {s.balance > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {formatMoney(s.balance)}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Al día
                    </span>
                  )}
                </td>

                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      s.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                    }`}
                  >
                    {s.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                <td className="py-2.5 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onPreview(s)}
                      className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      title="Ver detalle"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(s)}
                      className="p-1 rounded-md text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="py-2.5 px-3.5 border-t border-[var(--border)] bg-[var(--surface2)]/30 flex items-center justify-between text-[11px] text-[var(--ink2)]">
        <span>Mostrando {suppliers.length} proveedor{suppliers.length === 1 ? '' : 'es'}</span>
      </div>
    </div>
  );
};
