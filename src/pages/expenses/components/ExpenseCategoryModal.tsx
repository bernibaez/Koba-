import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag } from 'lucide-react';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';

interface ExpenseCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    nombre: string;
    descripcion: string;
    presupuesto_mensual: number;
  }) => Promise<void>;
}

export default function ExpenseCategoryModal({
  isOpen,
  onClose,
  onSubmit,
}: ExpenseCategoryModalProps) {
  const [catNombre, setCatNombre] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catPresupuesto, setCatPresupuesto] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCatNombre('');
      setCatDesc('');
      setCatPresupuesto('');
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
    if (!catNombre.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        nombre: catNombre.trim(),
        descripcion: catDesc.trim(),
        presupuesto_mensual: parseFloat(catPresupuesto) || 0,
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
      aria-labelledby="expense-category-title"
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
              <Tag size={18} />
            </div>
            <div>
              <h2 id="expense-category-title" className="text-base font-semibold text-[var(--ink)]">
                Nueva Categoría de Gasto
              </h2>
              <p className="text-xs text-[var(--ink2)]">
                Define un centro de costo con presupuesto mensual asignado
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
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Servicios Públicos, Nómina, Publicidad, Alquiler..."
              value={catNombre}
              onChange={(e) => setCatNombre(e.target.value)}
              className="apple-input w-full text-xs !h-9"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
              Descripción (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Detalle o propósito de este rubro de gastos..."
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="apple-input w-full text-xs p-2.5 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
              Presupuesto Mensual Sugerido (RD$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00 (Dejar en blanco o 0 si no tiene tope)"
              value={catPresupuesto}
              onChange={(e) => setCatPresupuesto(e.target.value)}
              className="apple-input w-full text-xs !h-9 font-mono font-medium"
            />
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
              disabled={saving || !catNombre.trim()}
              className="apple-btn-primary text-xs !h-8 !px-4 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <ButtonSpinner /> : null}
              <span>{saving ? 'Guardando…' : 'Crear categoría'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
