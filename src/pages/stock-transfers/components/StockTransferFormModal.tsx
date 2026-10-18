import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeftRight } from 'lucide-react';
import type { SucursalUi } from '../types';
import type { ProductItem } from '@/lib/productStore';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';

interface StockTransferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    sucursal_origen_id: string;
    sucursal_destino_id: string;
    motivo?: string;
    producto_id: string;
    cantidad: number;
  }) => Promise<void>;
  sucursales: SucursalUi[];
  productos: ProductItem[];
}

export default function StockTransferFormModal({
  isOpen,
  onClose,
  onSubmit,
  sucursales,
  productos,
}: StockTransferFormModalProps) {
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOrigenId('');
      setDestinoId('');
      setMotivo('');
      setProductoId('');
      setCantidad('1');
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
    const qty = Number(cantidad);
    if (!origenId || !destinoId || !productoId || !(qty > 0)) return;

    setSaving(true);
    try {
      await onSubmit({
        sucursal_origen_id: origenId,
        sucursal_destino_id: destinoId,
        motivo: motivo.trim() || undefined,
        producto_id: productoId,
        cantidad: qty,
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
      aria-labelledby="transfer-modal-title"
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
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <h2 id="transfer-modal-title" className="text-base font-semibold text-[var(--ink)]">
                Nueva Transferencia de Stock
              </h2>
              <p className="text-xs text-[var(--ink2)]">
                Mueve inventario entre sucursales y almacenes activos
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
          {sucursales.length < 2 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              Se requieren al menos dos sucursales configuradas para trasladar mercancía.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
                Sucursal Origen (Sale de) *
              </label>
              <select
                required
                value={origenId}
                onChange={(e) => setOrigenId(e.target.value)}
                className="apple-select w-full text-xs !h-9"
              >
                <option value="">Seleccionar origen…</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === destinoId}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
                Sucursal Destino (Entra a) *
              </label>
              <select
                required
                value={destinoId}
                onChange={(e) => setDestinoId(e.target.value)}
                className="apple-select w-full text-xs !h-9"
              >
                <option value="">Seleccionar destino…</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === origenId}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
              Producto a Trasladar *
            </label>
            <select
              required
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="apple-select w-full text-xs !h-9"
            >
              <option value="">Seleccionar producto…</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Stock actual: {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
                Cantidad a Enviar *
              </label>
              <input
                type="number"
                min={1}
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="apple-input w-full text-xs !h-9 font-mono font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--ink2)] mb-1 block">
                Motivo / Justificación
              </label>
              <input
                type="text"
                placeholder="Ej: Reposición de vitrina..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="apple-input w-full text-xs !h-9"
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
              disabled={
                saving ||
                !origenId ||
                !destinoId ||
                !productoId ||
                origenId === destinoId ||
                !(Number(cantidad) > 0)
              }
              className="apple-btn-primary text-xs !h-8 !px-4 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <ButtonSpinner /> : null}
              <span>{saving ? 'Guardando…' : 'Crear transferencia'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
