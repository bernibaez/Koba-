import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Monitor, CheckCircle } from 'lucide-react';
import type { Caja, CajaFormData } from '../types';

interface CajaFormDialogProps {
  isOpen: boolean;
  editingCaja: Caja | null;
  form: CajaFormData;
  setForm: React.Dispatch<React.SetStateAction<CajaFormData>>;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CajaFormDialog({
  isOpen,
  editingCaja,
  form,
  setForm,
  isSaving,
  onClose,
  onSubmit,
}: CajaFormDialogProps) {
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => codeInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="caja-modal-title"
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl p-5 z-10 animate-in zoom-in-95 duration-150 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--chip)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)]">
              <Monitor size={16} />
            </div>
            <div>
              <h2 id="caja-modal-title" className="text-sm font-semibold text-[var(--ink)]">
                {editingCaja ? 'Editar caja registradora' : 'Nueva caja registradora'}
              </h2>
              <p className="text-[11px] text-[var(--ink2)] mt-0.5">
                Terminal de cobro para el Punto de Venta
              </p>
            </div>
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

        {/* Formulario */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--ink2)] block mb-1">
                Código *
              </label>
              <input
                ref={codeInputRef}
                type="text"
                required
                value={form.codigo}
                onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                placeholder="1"
                className="w-full h-8 px-2.5 text-xs font-mono font-medium rounded-xl border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-[var(--ink2)] block mb-1">
                Nombre de la terminal *
              </label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Caja #1 - Mostrador Principal"
                className="w-full h-8 px-2.5 text-xs rounded-xl border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--ink2)] block mb-1">
              Descripción o ubicación (opcional)
            </label>
            <textarea
              rows={2}
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Ej: Ubicada en el área de salida principal..."
              className="w-full p-2.5 text-xs rounded-xl border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] outline-none focus:border-[var(--accent)] resize-none"
            />
          </div>

          {/* Opciones */}
          <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)]/40 space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs text-[var(--ink)] cursor-pointer">
              <input
                type="checkbox"
                checked={form.es_caja_principal}
                onChange={(e) => setForm((prev) => ({ ...prev, es_caja_principal: e.target.checked }))}
                className="rounded border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)] h-4 w-4 cursor-pointer"
              />
              <div>
                <span className="font-medium block leading-tight">Marcar como Caja Principal</span>
                <span className="text-[11px] text-[var(--ink2)]">
                  Caja por defecto seleccionada al iniciar el punto de venta
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[var(--ink)] cursor-pointer pt-2 border-t border-[var(--line)]">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(e) => setForm((prev) => ({ ...prev, activa: e.target.checked }))}
                className="rounded border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)] h-4 w-4 cursor-pointer"
              />
              <div>
                <span className="font-medium block leading-tight">Caja activa para cobros</span>
                <span className="text-[11px] text-[var(--ink2)]">
                  Habilita a los cajeros para abrir turnos en esta terminal
                </span>
              </div>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="apple-btn-ghost text-xs !h-8 !px-3.5 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.codigo.trim() || !form.nombre.trim()}
              className="apple-btn-primary text-xs !h-8 !px-4 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle size={14} />
              <span>{isSaving ? 'Guardando…' : editingCaja ? 'Guardar cambios' : 'Crear caja'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
