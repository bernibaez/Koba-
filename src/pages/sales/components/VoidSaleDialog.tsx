import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Ban } from 'lucide-react';
import type { VentaConDetalle } from '@/services/ventas.service';

export interface VoidSaleDialogProps {
  sale: VentaConDetalle | null;
  isOpen: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void> | void;
}

const suggestedReasons = [
  'Error de facturación',
  'Devolución total de productos',
  'Factura duplicada',
  'Cambio de comprobante fiscal',
  'Cancelación por solicitud del cliente',
];

export default function VoidSaleDialog({
  sale,
  isOpen,
  isProcessing = false,
  onClose,
  onConfirm,
}: VoidSaleDialogProps) {
  const [motivo, setMotivo] = useState('Error de facturación');

  useEffect(() => {
    if (isOpen) {
      setMotivo('Error de facturación');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen || !sale) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    void onConfirm(motivo.trim());
  };

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="void-sale-title"
      aria-describedby="void-sale-desc"
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4"
    >
      {/* Scrim desenfocado */}
      <div
        onClick={() => {
          if (!isProcessing) onClose();
        }}
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-2xl p-5 sm:p-6 space-y-4.5 z-10 animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bad)]/10 text-[var(--bad)] border border-[var(--bad)]/20 flex items-center justify-center flex-shrink-0">
              <Ban size={20} />
            </div>
            <div>
              <h2 id="void-sale-title" className="text-sm sm:text-base font-semibold text-[var(--ink)]">
                Anular factura {sale.numero_factura}
              </h2>
              <p id="void-sale-desc" className="text-xs text-[var(--ink2)] mt-0.5">
                {sale.ncf ? `Comprobante NCF: ${sale.ncf}` : 'Factura simple'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Cerrar modal"
            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          >
            <X size={15} />
          </button>
        </div>

        {/* Advertencia fiscal */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--bad)]/20 bg-[var(--bad)]/5 text-xs text-[var(--bad)]">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Esta acción reversará el stock y las transacciones asociadas. La anulación de este comprobante quedará registrada para fines fiscales y contables.
          </p>
        </div>

        {/* Formulario de motivo */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="void-motivo-input" className="block text-xs font-medium text-[var(--ink)] mb-1.5">
              Motivo de anulación
            </label>

            {/* Chips de motivos sugeridos */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {suggestedReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setMotivo(reason)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    motivo === reason
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                      : 'border-[var(--line)] bg-[var(--chip)] text-[var(--ink2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              id="void-motivo-input"
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Especifica el motivo de la anulación..."
              required
              disabled={isProcessing}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink3)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          {/* Pie de acciones */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-full border border-[var(--line)] bg-[var(--surface)] text-xs font-medium text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing || !motivo.trim()}
              className="px-4 py-2 rounded-full bg-[var(--bad)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--bad)] focus-visible:ring-offset-1 flex items-center gap-1.5 shadow-xs"
            >
              <Ban size={13} />
              <span>{isProcessing ? 'Anulando...' : 'Anular factura'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
