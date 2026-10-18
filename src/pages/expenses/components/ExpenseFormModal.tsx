import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign } from 'lucide-react';
import type { GastoUi, CategoriaGastoUi } from '../types';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    categoria_id: string;
    descripcion: string;
    monto: number;
    tiene_recibo: boolean;
  }) => Promise<void>;
  categorias: CategoriaGastoUi[];
  editingGasto?: GastoUi | null;
}

export default function ExpenseFormModal({
  isOpen,
  onClose,
  onSubmit,
  categorias,
  editingGasto,
}: ExpenseFormModalProps) {
  const [catId, setCatId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [tieneRecibo, setTieneRecibo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingGasto) {
        setCatId(editingGasto.categoryId ?? '');
        setDescripcion(editingGasto.description);
        setMonto(String(editingGasto.amount));
        setTieneRecibo(editingGasto.receipt);
      } else {
        setCatId('');
        setDescripcion('');
        setMonto('');
        setTieneRecibo(false);
      }
    }
  }, [isOpen, editingGasto]);

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
    const m = parseFloat(monto);
    if (!catId || !descripcion.trim() || !(m > 0)) return;

    setSaving(true);
    try {
      await onSubmit({
        categoria_id: catId,
        descripcion: descripcion.trim(),
        monto: m,
        tiene_recibo: tieneRecibo,
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
      aria-labelledby="expense-form-title"
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
              <DollarSign size={18} />
            </div>
            <div>
              <h2 id="expense-form-title" className="text-base font-semibold text-[var(--ink)]">
                {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <p className="text-xs text-[var(--ink2)]">
                {editingGasto
                  ? `Modifica los datos del registro ${editingGasto.code}`
                  : 'Registra un egreso corriente o compra operativa'}
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
              Categoría de Gasto *
            </label>
            <select
              required
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="apple-select w-full text-xs !h-9"
            >
              <option value="">Seleccionar categoría…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
              Descripción del Gasto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Pago de internet de la oficina, compra de insumos de limpieza..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="apple-input w-full text-xs !h-9"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
              Monto del Gasto (RD$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="apple-input w-full text-xs !h-9 font-mono font-medium"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2.5 text-xs text-[var(--ink)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tieneRecibo}
                onChange={(e) => setTieneRecibo(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span>Cuenta con comprobante fiscal o factura digital</span>
            </label>
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
              disabled={saving || !catId || !descripcion.trim() || !(parseFloat(monto) > 0)}
              className="apple-btn-primary text-xs !h-8 !px-4 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <ButtonSpinner /> : null}
              <span>{saving ? 'Guardando…' : editingGasto ? 'Guardar cambios' : 'Registrar gasto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
