import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import type { Purchase } from '../types';

interface VoidPurchaseDialogProps {
  purchase: Purchase | null;
  isOpen: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

export default function VoidPurchaseDialog({
  purchase,
  isOpen,
  isProcessing = false,
  onClose,
  onConfirm,
}: VoidPurchaseDialogProps) {
  const [motivo, setMotivo] = useState('Error en digitación o compra cancelada por proveedor');

  if (!isOpen || !purchase) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    onConfirm(motivo.trim());
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="void-purchase-title"
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl p-5 z-10 animate-in zoom-in-95 duration-150 select-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bad)]/10 text-[var(--bad)] flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="text-[var(--ink2)] hover:text-[var(--ink)] p-1 rounded-lg hover:bg-[var(--chip)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3">
          <h2 id="void-purchase-title" className="text-sm font-semibold text-[var(--ink)]">
            ¿Anular orden de compra {purchase.code}?
          </h2>
          <p className="text-xs text-[var(--ink2)] mt-1.5 leading-relaxed">
            Esta acción reversará automáticamente del inventario los productos ingresados en esta compra y cancelará la obligación contable.
          </p>

          <div className="mt-3 p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)]/50 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--ink2)]">Proveedor:</span>
              <span className="font-medium text-[var(--ink)]">{purchase.supplier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink2)]">Total invertido:</span>
              <span className="font-mono font-medium text-[var(--ink)]">
                RD$ {(purchase.total || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--ink2)] block mb-1">
                Motivo de anulación
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                required
                placeholder="Escribe el motivo de la anulación..."
                className="w-full text-xs p-2.5 rounded-xl border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="apple-btn-ghost text-xs !h-8 !px-3 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProcessing || !motivo.trim()}
                className="inline-flex items-center justify-center px-4 h-8 rounded-xl bg-[var(--bad)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
              >
                {isProcessing ? 'Anulando...' : 'Anular compra'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
