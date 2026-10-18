import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeftRight, Calendar, Building, Package, FileText } from 'lucide-react';
import type { TransferenciaUi } from '../types';
import { TRANSFER_STATUS_CONFIG } from '../types';

interface StockTransferDetailDrawerProps {
  transfer: TransferenciaUi | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StockTransferDetailDrawer({
  transfer,
  isOpen,
  onClose,
}: StockTransferDetailDrawerProps) {
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

  if (!isOpen || !transfer) return null;

  const statusCfg = TRANSFER_STATUS_CONFIG[transfer.estado] || {
    label: transfer.estado,
    badgeClass: 'apple-badge-neutral',
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-[var(--surface)] text-[var(--ink)] shadow-2xl flex flex-col border-l border-[var(--line)] animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <ArrowLeftRight size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="transfer-drawer-title" className="text-base font-semibold text-[var(--ink)] truncate">
                  Transferencia {transfer.codigo}
                </h2>
                <span className={`apple-badge ${statusCfg.badgeClass} text-[10px]`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-[var(--ink2)] truncate">
                {transfer.origen} → {transfer.destino}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 select-none">
          {/* Sucursales Flow */}
          <div className="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-3">
            <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
              Ruta de Despacho
            </span>
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[var(--ink2)]">Origen (Sale)</span>
                <p className="font-semibold text-[var(--ink)]">{transfer.origen}</p>
              </div>

              <div className="p-2 rounded-lg bg-[var(--surface)] text-[var(--accent)] border border-[var(--line)]">
                <ArrowLeftRight size={14} />
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-[var(--ink2)]">Destino (Recibe)</span>
                <p className="font-semibold text-[var(--ink)]">{transfer.destino}</p>
              </div>
            </div>
          </div>

          {/* Información del Traslado */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Calendar size={13} className="text-[var(--accent)]" /> Fecha de Envío
              </span>
              <p className="font-semibold text-[var(--ink)] font-mono">{transfer.fecha}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Package size={13} className="text-[var(--accent)]" /> Productos
              </span>
              <p className="font-semibold text-[var(--ink)] font-mono">
                {transfer.items} ítem(s) trasladados
              </p>
            </div>
          </div>

          {/* Motivo */}
          <div className="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
              Motivo o Justificación del Traslado
            </span>
            <p className="text-xs text-[var(--ink)] leading-relaxed">
              {transfer.motivo || 'Sin motivo registrado'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between text-xs text-[var(--ink2)] shrink-0">
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
      </div>
    </div>,
    document.body
  );
}
