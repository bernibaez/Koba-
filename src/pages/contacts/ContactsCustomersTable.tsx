import React from 'react';
import { Phone, MapPin, CreditCard, Eye, Edit2, Trash2, Users, FileText, ChevronRight } from 'lucide-react';
import type { Customer } from './types';

interface ContactsCustomersTableProps {
  customers: Customer[];
  onOpenExpediente: (customer: Customer) => void;
  onPreview: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export const ContactsCustomersTable: React.FC<ContactsCustomersTableProps> = ({
  customers,
  onOpenExpediente,
  onPreview,
  onEdit,
  onDelete,
}) => {
  const formatMoney = (amount: number) => {
    return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getGroupBadgeClass = (group: string) => {
    switch (group) {
      case 'fiscal':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'credito':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-[var(--surface2)] text-[var(--ink2)] border-[var(--border)]';
    }
  };

  const getGroupLabel = (group: string) => {
    switch (group) {
      case 'fiscal':
        return 'Crédito Fiscal';
      case 'credito':
        return 'Crédito';
      case 'final':
        return 'Consumidor Final';
      default:
        return group || 'General';
    }
  };

  if (customers.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center mx-auto mb-3 text-[var(--ink3)]">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-1">
          No se encontraron clientes
        </h3>
        <p className="text-xs text-[var(--ink2)] max-w-sm mx-auto">
          Prueba cambiando el término de búsqueda o registra un nuevo cliente en el sistema.
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
              <th className="py-2.5 px-3.5">Cliente</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Tipo / Régimen</th>
              <th className="py-2.5 px-3 hidden lg:table-cell text-right">Límite Crédito</th>
              <th className="py-2.5 px-3 hidden xl:table-cell text-right">Balance Pendiente</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
            {customers.map((c) => {
              const hasBalance = c.balance > 0;
              return (
                <tr
                  key={c.id}
                  className="hover:bg-[var(--surface2)]/40 transition-colors group cursor-pointer"
                  onClick={() => onOpenExpediente(c)}
                >
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                        {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors truncate max-w-[200px] sm:max-w-xs">
                          {c.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--ink2)] mt-0.5">
                          {c.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[var(--ink3)]" />
                              {c.phone}
                            </span>
                          ) : (
                            <span className="text-[var(--ink3)]">Sin teléfono</span>
                          )}
                          {c.address && (
                            <span className="hidden sm:flex items-center gap-1 text-[var(--ink3)] truncate max-w-[150px]">
                              • <MapPin className="w-3 h-3" />
                              {c.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 hidden md:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getGroupBadgeClass(c.group)}`}>
                      {getGroupLabel(c.group)}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 hidden lg:table-cell text-right font-mono text-[11px]">
                    {c.credit > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[var(--ink)]">
                        <CreditCard className="w-3 h-3 text-[var(--ink3)]" />
                        {formatMoney(c.credit)}
                      </span>
                    ) : (
                      <span className="text-[var(--ink3)]">—</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 hidden xl:table-cell text-right font-mono text-[11px]">
                    {hasBalance ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {formatMoney(c.balance)}
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
                        c.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                      }`}
                    >
                      {c.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td className="py-2.5 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenExpediente(c)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors cursor-pointer"
                        title="Ver Expediente CRM"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="hidden sm:inline">Expediente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onPreview(c)}
                        className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                        title="Ver ficha"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        className="p-1 rounded-md text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="py-2.5 px-3.5 border-t border-[var(--border)] bg-[var(--surface2)]/30 flex items-center justify-between text-[11px] text-[var(--ink2)]">
        <span>Mostrando {customers.length} cliente{customers.length === 1 ? '' : 's'}</span>
        <span className="text-[var(--ink3)]">Haz clic en una fila para ver el expediente completo</span>
      </div>
    </div>
  );
};
