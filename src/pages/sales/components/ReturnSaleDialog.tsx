import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, X, Minus, Plus, AlertCircle } from 'lucide-react';
import type { VentaConDetalle } from '@/services/ventas.service';

export interface ReturnItemData {
  producto_id?: string | null;
  sku?: string | null;
  nombre_item: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface ReturnPayloadData {
  items: ReturnItemData[];
  monto_total: number;
  motivo: string;
  metodo_reembolso: 'efectivo' | 'tarjeta' | 'nota_credito' | 'cambio';
}

export interface ReturnSaleDialogProps {
  sale: VentaConDetalle | null;
  isOpen: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: (payload: ReturnPayloadData) => Promise<void> | void;
}

const suggestedReasons = [
  'Producto defectuoso',
  'Error de despacho',
  'Cliente no satisfecho',
  'Cambio de talla / modelo',
];

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ReturnSaleDialog({
  sale,
  isOpen,
  isProcessing = false,
  onClose,
  onConfirm,
}: ReturnSaleDialogProps) {
  // Map item ID -> return quantity
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [motivo, setMotivo] = useState('Producto defectuoso');
  const [metodoReembolso, setMetodoReembolso] = useState<'efectivo' | 'tarjeta' | 'nota_credito' | 'cambio'>('efectivo');

  // Inicializar cantidades cuando abre el modal
  useEffect(() => {
    if (isOpen && sale) {
      setReturnQuantities({});
      setMotivo('Producto defectuoso');
      setMetodoReembolso(
        sale.metodo_pago === 'tarjeta' ? 'tarjeta' : 'efectivo'
      );
    }
  }, [isOpen, sale]);

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

  const items = sale.detalle_ventas || [];

  const handleSetQuantity = (itemId: string, maxQty: number, nextQty: number) => {
    const clamped = Math.max(0, Math.min(maxQty, nextQty));
    setReturnQuantities((prev) => ({
      ...prev,
      [itemId]: clamped,
    }));
  };

  const handleSelectAll = () => {
    const all: Record<string, number> = {};
    items.forEach((item, idx) => {
      const id = item.id || `item-${idx}`;
      all[id] = Number(item.cantidad || 0);
    });
    setReturnQuantities(all);
  };

  const handleClearAll = () => {
    setReturnQuantities({});
  };

  // Ítems a devolver con cantidad > 0
  const selectedItemsToReturn: ReturnItemData[] = items
    .map((item, idx) => {
      const id = item.id || `item-${idx}`;
      const qty = returnQuantities[id] || 0;
      const unitPrice = Number(item.precio_unitario || 0);
      return {
        producto_id: item.producto_id,
        nombre_item: item.nombre_item,
        cantidad: qty,
        precio_unitario: unitPrice,
        subtotal: qty * unitPrice,
      };
    })
    .filter((i) => i.cantidad > 0);

  const subtotalReembolso = selectedItemsToReturn.reduce(
    (sum, i) => sum + i.subtotal,
    0
  );

  // Proporción de impuesto según factura (habitualmente 18 %)
  const taxRatio =
    Number(sale.subtotal || 0) > 0
      ? Number(sale.monto_impuesto || 0) / Number(sale.subtotal || 0)
      : 0.18;
  const impuestoReembolso = Math.round(subtotalReembolso * taxRatio * 100) / 100;
  const totalReembolso = subtotalReembolso + impuestoReembolso;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemsToReturn.length === 0) return;
    if (!motivo.trim()) return;

    void onConfirm({
      items: selectedItemsToReturn,
      monto_total: totalReembolso,
      motivo: motivo.trim(),
      metodo_reembolso: metodoReembolso,
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-sale-title"
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
        className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-2xl p-5 sm:p-6 space-y-4.5 z-10 animate-in zoom-in-95 duration-150 select-none max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 id="return-sale-title" className="text-sm sm:text-base font-semibold text-[var(--ink)]">
                Devolución de factura {sale.numero_factura}
              </h2>
              <p className="text-xs text-[var(--ink2)] mt-0.5">
                {sale.cliente_nombre ? `Cliente: ${sale.cliente_nombre}` : 'Cliente general'}
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

        {/* Formulario con scroll en ítems */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Selector de ítems */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider text-[11px]">
                Selecciona los productos a devolver
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[var(--accent)] hover:underline cursor-pointer font-medium"
                >
                  Devolver todo
                </button>
                <span className="text-[var(--line)]">·</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[var(--ink2)] hover:underline cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="border border-[var(--line)] rounded-xl divide-y divide-[var(--line)] bg-[var(--chip)]/30 overflow-hidden">
              {items.map((item, idx) => {
                const id = item.id || `item-${idx}`;
                const maxQty = Number(item.cantidad || 0);
                const currentQty = returnQuantities[id] || 0;
                const unitPrice = Number(item.precio_unitario || 0);

                return (
                  <div key={id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--ink)] truncate">{item.nombre_item}</p>
                      <p className="text-[11px] text-[var(--ink2)] tabular-nums mt-0.5">
                        Comprado: {maxQty} × RD$ {formatMoney(unitPrice)}
                      </p>
                    </div>

                    {/* Stepper de cantidad */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetQuantity(id, maxQty, currentQty - 1)}
                        disabled={currentQty <= 0}
                        aria-label={`Reducir cantidad de ${item.nombre_item}`}
                        className="w-6 h-6 rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] inline-flex items-center justify-center hover:bg-[var(--chip)] disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>

                      <span className="w-8 text-center tabular-nums font-mono font-semibold text-[var(--ink)]">
                        {currentQty}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSetQuantity(id, maxQty, currentQty + 1)}
                        disabled={currentQty >= maxQty}
                        aria-label={`Aumentar cantidad de ${item.nombre_item}`}
                        className="w-6 h-6 rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] inline-flex items-center justify-center hover:bg-[var(--chip)] disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Motivo de devolución */}
          <div>
            <label htmlFor="return-motivo-input" className="block text-xs font-medium text-[var(--ink)] mb-1.5">
              Motivo de la devolución
            </label>

            <div className="flex flex-wrap gap-1.5 mb-2">
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
              id="return-motivo-input"
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explica la causa de la devolución..."
              required
              disabled={isProcessing}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink3)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          {/* Método de reembolso */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink)] mb-1.5">
              Método de reembolso
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['efectivo', 'tarjeta', 'nota_credito', 'cambio'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetodoReembolso(m)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium capitalize transition-colors cursor-pointer text-center ${
                    metodoReembolso === m
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)]'
                  }`}
                >
                  {m === 'nota_credito' ? 'Nota de crédito' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen del reembolso */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--chip)]/40 p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between text-[var(--ink2)]">
              <span>Subtotal devuelto</span>
              <span className="font-mono tabular-nums text-[var(--ink)]">RD$ {formatMoney(subtotalReembolso)}</span>
            </div>
            <div className="flex justify-between text-[var(--ink2)]">
              <span>ITBIS proporcional</span>
              <span className="font-mono tabular-nums text-[var(--ink)]">RD$ {formatMoney(impuestoReembolso)}</span>
            </div>
            <div className="pt-2 border-t border-[var(--line)] flex justify-between items-baseline font-semibold text-sm text-[var(--ink)]">
              <span>Total a reembolsar</span>
              <span className="font-mono tabular-nums text-base font-bold text-amber-600 dark:text-amber-400">
                RD$ {formatMoney(totalReembolso)}
              </span>
            </div>
          </div>

          {/* Pie de acciones */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)] flex-shrink-0">
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
              disabled={isProcessing || selectedItemsToReturn.length === 0 || !motivo.trim()}
              className="px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 flex items-center gap-1.5 shadow-xs"
            >
              <RotateCcw size={13} />
              <span>{isProcessing ? 'Procesando...' : 'Registrar devolución'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
