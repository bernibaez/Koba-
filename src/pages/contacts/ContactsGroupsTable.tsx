import React from 'react';
import { Tag, Edit2, Trash2, Percent, Users } from 'lucide-react';
import type { CustomerGroup } from './types';

interface ContactsGroupsTableProps {
  groups: CustomerGroup[];
  onEdit: (group: CustomerGroup) => void;
  onDelete: (group: CustomerGroup) => void;
}

export const ContactsGroupsTable: React.FC<ContactsGroupsTableProps> = ({
  groups,
  onEdit,
  onDelete,
}) => {
  if (groups.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center mx-auto mb-3 text-[var(--ink3)]">
          <Tag className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-1">
          No hay grupos de clientes creados
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto">
          Crea categorías o grupos para aplicar listas de precios y descuentos automáticos a tus clientes.
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
              <th className="py-2.5 px-3.5">Grupo / Categoría</th>
              <th className="py-2.5 px-3">Descripción</th>
              <th className="py-2.5 px-3 text-center">Descuento</th>
              <th className="py-2.5 px-3 text-center">Clientes Asignados</th>
              <th className="py-2.5 px-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
            {groups.map((g) => (
              <tr
                key={g.id}
                className="hover:bg-[var(--surface2)]/40 transition-colors group"
              >
                <td className="py-2.5 px-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-[var(--ink)]">
                      {g.nombre}
                    </span>
                  </div>
                </td>

                <td className="py-2.5 px-3 text-[11px] text-[var(--ink2)] max-w-md truncate">
                  {g.descripcion || <span className="text-[var(--ink3)]">Sin descripción</span>}
                </td>

                <td className="py-2.5 px-3 text-center">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Percent className="w-3 h-3" />
                    {g.porcentaje_descuento}%
                  </span>
                </td>

                <td className="py-2.5 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ink2)]">
                    <Users className="w-3 h-3 text-[var(--ink3)]" />
                    {g.clientes_count ?? 0}
                  </span>
                </td>

                <td className="py-2.5 px-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(g)}
                      className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      title="Editar grupo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(g)}
                      className="p-1 rounded-md text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Eliminar grupo"
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
        <span>Mostrando {groups.length} grupo{groups.length === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
};
