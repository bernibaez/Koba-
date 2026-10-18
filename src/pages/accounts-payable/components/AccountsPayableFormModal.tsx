import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Wallet } from 'lucide-react';
import type { ProveedorOpcion } from '../types';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';

interface AccountsPayableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    proveedor_id: string;
    monto_total: number;
    fecha_emision: string;
    fecha_vencimiento: string;
  }) => Promise<void>;
  proveedores: ProveedorOpcion[];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AccountsPayableFormModal({
  isOpen,
  onClose,
  onSubmit,
  proveedores,
}: AccountsPayableFormModalProps) {
  const [formProveedor, setFormProveedor] = useState('');
  const [formMonto, setFormMonto] = useState('');
  const [formEmision, setFormEmision] = useState(today());
  const [formVence, setFormVence] = useState(plusDays(15));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormProveedor('');
      setFormMonto('');
      setFormEmision(today());
      setFormVence(plusDays(15));
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(formMonto);
    if (!formProveedor || !monto || monto <= 0) return;

    setSaving(true);
    try {
      await onSubmit({
        proveedor_id: formProveedor,
        monto_total: monto,
        fecha_emision: formEmision,
        fecha_vencimiento: formVence,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cxp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[var(--surface)] text-[var(--ink)] shadow-2xl border border-[var(--line)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <Wallet size={18} />
            </div>
            <div>
              <h2 id="cxp-modal-title" className="text-base font-semibold text-[var(--ink)]">
                Nueva Cuenta por Pagar
              </h2>
              <p className="text-xs text-[var(--ink2)]">
                Registra una factura por pagar a proveedor comercial
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
          <div>
            <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
              Proveedor Comercial *
            </label>
            <select
              required
              value={formProveedor}
              onChange={(e) => setFormProveedor(e.target.value)}
              className="apple-select w-full text-xs !h-9"
            >
              <option value="">Seleccionar proveedor…</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
              Monto Total de Factura (RD$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={formMonto}
              onChange={(e) => setFormMonto(e.target.value)}
              className="apple-input w-full text-xs !h-9 font-mono font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
                Fecha de Emisión
              </label>
              <input
                type="date"
                required
                value={formEmision}
                onChange={(e) => setFormEmision(e.target.value)}
                className="apple-input w-full text-xs !h-9 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                required
                value={formVence}
                onChange={(e) => setFormVence(e.target.value)}
                className="apple-input w-full text-xs !h-9 font-mono"
              />
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
              disabled={saving || !formProveedor || !parseFloat(formMonto)}
              className="apple-btn-primary text-xs !h-8 !px-4 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <ButtonSpinner /> : null}
              <span>{saving ? 'Guardando…' : 'Crear cuenta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
