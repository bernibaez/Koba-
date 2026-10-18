import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  DollarSign,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  FileCheck,
  Edit2,
  Check,
  Trash2,
} from 'lucide-react';
import type { GastoUi } from '../types';
import { EXPENSE_STATUS_CONFIG } from '../types';

interface ExpenseDetailDrawerProps {
  gasto: GastoUi | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (gasto: GastoUi) => void;
  onApprove: (gasto: GastoUi) => void;
  onReject: (gasto: GastoUi) => void;
  onDelete: (gasto: GastoUi) => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ExpenseDetailDrawer({
  gasto,
  isOpen,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: ExpenseDetailDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !gasto) return null;

  const statusCfg = EXPENSE_STATUS_CONFIG[gasto.status] || {
    label: gasto.status,
    badgeClass: 'apple-badge-neutral',
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-[var(--surface)] text-[var(--ink)] shadow-2xl flex flex-col border-l border-[var(--line)] animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <DollarSign size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="expense-drawer-title" className="text-base font-semibold text-[var(--ink)] truncate">
                  Gasto {gasto.code}
                </h2>
                <span className={`apple-badge ${statusCfg.badgeClass} text-[10px]`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-[var(--ink2)] truncate">
                {gasto.category || 'General'} · {gasto.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(gasto);
              }}
              className="apple-btn-secondary !h-8 !px-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Editar gasto"
            >
              <Edit2 size={13} />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel"
              className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 select-none">
          {/* Monto Card */}
          <div className="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-center">
            <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
              Monto Registrado
            </span>
            <p className="text-2xl font-bold font-mono text-[var(--ink)] mt-1">
              RD$ {formatMoney(gasto.amount)}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              {gasto.receipt ? (
                <span className="apple-badge apple-badge-success text-[10px]">
                  Comprobante digital verificado
                </span>
              ) : (
                <span className="apple-badge apple-badge-neutral text-[10px] text-[var(--ink2)]">
                  Sin comprobante
                </span>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
              Descripción del Egreso
            </span>
            <p className="text-xs text-[var(--ink)] leading-relaxed">{gasto.description}</p>
          </div>

          {/* Información y Responsable */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Tag size={13} className="text-[var(--accent)]" /> Categoría
              </span>
              <p className="font-semibold text-[var(--ink)]">{gasto.category || 'General'}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Calendar size={13} className="text-[var(--accent)]" /> Fecha
              </span>
              <p className="font-semibold text-[var(--ink)] font-mono">{gasto.date}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1 sm:col-span-2">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <User size={13} className="text-[var(--accent)]" /> Usuario Responsable
              </span>
              <p className="font-semibold text-[var(--ink)]">{gasto.responsible || 'Usuario'}</p>
            </div>
          </div>

          {/* Acciones de aprobación si está pendiente */}
          {gasto.status === 'pending' && (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2.5">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">
                Este gasto se encuentra pendiente de aprobación
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onApprove(gasto);
                    onClose();
                  }}
                  className="apple-btn-primary text-xs !h-8 !px-3 inline-flex items-center justify-center gap-1.5 cursor-pointer !bg-emerald-600 hover:!bg-emerald-700 !text-white"
                >
                  <Check size={14} />
                  <span>Aprobar gasto</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReject(gasto);
                    onClose();
                  }}
                  className="apple-btn-secondary text-xs !h-8 !px-3 inline-flex items-center justify-center gap-1.5 cursor-pointer text-rose-600 hover:text-rose-700"
                >
                  <X size={14} />
                  <span>Rechazar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between text-xs text-[var(--ink2)] shrink-0">
          <button
            type="button"
            onClick={() => {
              onDelete(gasto);
              onClose();
            }}
            className="text-xs text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Eliminar gasto</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="apple-btn-secondary !h-8 !px-4 text-xs font-medium cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
