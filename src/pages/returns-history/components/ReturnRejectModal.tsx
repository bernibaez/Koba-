import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, XCircle } from 'lucide-react';
import type { PosReturn } from '../types';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';

interface ReturnRejectModalProps {
  item: PosReturn | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: PosReturn, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'No cumple políticas de tienda',
  'Producto deteriorado o usado',
  'Fuera del plazo permitido (30 días)',
  'Falta comprobante fiscal original',
  'Error en la solicitud del cajero',
];

export default function ReturnRejectModal({
  item,
  isOpen,
  onClose,
  onConfirm,
}: ReturnRejectModalProps) {
  const [reason, setReason] = useState('No cumple con las políticas de devolución de tienda');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('No cumple con las políticas de devolución de tienda');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSaving(true);
    try {
      await onConfirm(item, reason.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-reject-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--surface)] text-[var(--ink)] shadow-2xl border border-[var(--line)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <XCircle size={18} />
            </div>
            <div>
              <h2 id="return-reject-title" className="text-base font-semibold text-[var(--ink)]">
                Rechazar Devolución
              </h2>
              <p className="text-xs text-[var(--ink2)]">
                {item.code} · Factura {item.saleCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-[var(--ink2)] leading-relaxed">
            Especifica el motivo por el cual estás denegando el reembolso solicitado por el cajero{' '}
            <strong>{item.user}</strong> por un monto de{' '}
            <strong className="text-rose-600 dark:text-rose-400 font-mono">
              RD$ {item.total.toLocaleString()}
            </strong>
            .
          </p>

          <div>
            <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
              Motivo o Justificación del Rechazo *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="apple-input w-full text-xs p-2.5 resize-none"
              placeholder="Escribe el motivo..."
              autoFocus
            />
          </div>

          <div>
            <span className="text-[11px] font-medium text-[var(--ink2)] block mb-1.5">
              Opciones rápidas sugeridas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    reason === preset
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium'
                      : 'bg-[var(--surface2)] border-[var(--line)] text-[var(--ink2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="apple-btn-secondary text-xs !h-8 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !reason.trim()}
              className="apple-btn-primary text-xs !h-8 !px-4 inline-flex items-center gap-1.5 cursor-pointer !bg-rose-600 hover:!bg-rose-700 !text-white disabled:opacity-50"
            >
              {saving ? <ButtonSpinner /> : <XCircle size={14} />}
              <span>{saving ? 'Rechazando…' : 'Confirmar rechazo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
