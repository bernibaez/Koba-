import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Receipt,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import type { PosReturn } from '../types';
import {
  RETURN_METHOD_LABEL,
  RETURN_TYPE_LABEL,
  RETURN_STATUS_CONFIG,
} from '../types';

interface ReturnDetailDrawerProps {
  item: PosReturn | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (item: PosReturn) => void;
  onApprove: (item: PosReturn) => void;
  onReject: (item: PosReturn) => void;
  isProcessing?: boolean;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ReturnDetailDrawer({
  item,
  isOpen,
  onClose,
  onPrint,
  onApprove,
  onReject,
  isProcessing = false,
}: ReturnDetailDrawerProps) {
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

  if (!isOpen || !item) return null;

  const statusCfg = RETURN_STATUS_CONFIG[item.status] || {
    label: item.status,
    badgeClass: 'apple-badge-neutral',
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-drawer-title"
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
              <RotateCcw size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="return-drawer-title" className="text-base font-semibold text-[var(--ink)] truncate">
                  Devolución {item.code}
                </h2>
                <span className={`apple-badge ${statusCfg.badgeClass} text-[10px]`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-[var(--ink2)] truncate">
                Factura {item.saleCode} · {item.date} {item.time}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrint(item)}
              className="apple-btn-secondary !h-8 !px-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Imprimir comprobante térmico"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Imprimir</span>
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
          {/* Status Banner */}
          {item.status === 'pending' ? (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                <Shield size={16} />
                <span>Solicitud de Reembolso Pendiente</span>
              </div>
              <p className="text-xs text-[var(--ink)] leading-relaxed">
                El cajero <strong>{item.user}</strong> ha solicitado autorización para reembolsar{' '}
                <strong className="text-rose-600 dark:text-rose-400 font-mono">
                  RD$ {formatMoney(item.total)}
                </strong>{' '}
                asociado a la venta {item.saleCode}.
              </p>
            </div>
          ) : item.status === 'rejected' ? (
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 space-y-1 text-xs">
              <span className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <XCircle size={15} /> Devolución rechazada por administración
              </span>
              {item.rejectionReason && (
                <p className="text-[var(--ink)]">{item.rejectionReason}</p>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Devolución aprobada y stock reincorporado al catálogo.</span>
            </div>
          )}

          {/* Información General */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <User size={13} className="text-[var(--accent)]" /> Cliente
              </span>
              <p className="font-semibold text-[var(--ink)] truncate">{item.customer}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <User size={13} className="text-[var(--accent)]" /> Cajero
              </span>
              <p className="font-semibold text-[var(--ink)] truncate">{item.user}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Receipt size={13} className="text-[var(--accent)]" /> Método Reembolso
              </span>
              <p className="font-semibold text-[var(--ink)]">
                {RETURN_METHOD_LABEL[item.method] || item.method}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Calendar size={13} className="text-[var(--accent)]" /> Tipo Devolución
              </span>
              <p className="font-semibold text-[var(--ink)]">
                {RETURN_TYPE_LABEL[item.type] || item.type}
              </p>
            </div>
          </div>

          {/* Motivo */}
          <div className="p-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
              Motivo Declarado
            </span>
            <p className="text-xs text-[var(--ink)] leading-relaxed">
              {item.reason || 'Sin motivo especificado'}
            </p>
          </div>

          {/* Lista de Productos Devueltos */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--surface2)] border-b border-[var(--line)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <RotateCcw size={13} className="text-[var(--accent)]" />
                Artículos Reembolsados
              </span>
              <span className="text-[10px] text-[var(--ink2)]">
                {item.products.length} ítem(s)
              </span>
            </div>

            <div className="divide-y divide-[var(--line)] max-h-56 overflow-y-auto">
              {item.products.map((p, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-[var(--ink)]">{p.name}</p>
                    <span className="font-mono text-[10px] text-[var(--ink2)]">
                      {p.sku || 'Sin SKU'} · Cant: {p.qty} × RD$ {formatMoney(p.price)}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-[var(--ink)] tabular-nums">
                    RD$ {formatMoney(p.subtotal ?? p.qty * p.price)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-[var(--surface2)] border-t border-[var(--line)] flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
                Total Reembolso
              </span>
              <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                RD$ {formatMoney(item.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--line)] bg-[var(--surface)] shrink-0">
          {item.status === 'pending' ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onReject(item)}
                disabled={isProcessing}
                className="apple-btn-secondary flex-1 !h-8 text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Rechazar</span>
              </button>
              <button
                type="button"
                onClick={() => onApprove(item)}
                disabled={isProcessing}
                className="apple-btn-primary flex-1 !h-8 text-xs font-medium !bg-emerald-600 hover:!bg-emerald-700 !text-white cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Aprobar devolución</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-[var(--ink2)]">
              <div className="flex items-center gap-1">
                <span>Presiona</span>
                <kbd className="apple-kbd">Esc</kbd>
                <span>para cerrar</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="apple-btn-secondary !h-8 !px-4 text-xs font-medium cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
