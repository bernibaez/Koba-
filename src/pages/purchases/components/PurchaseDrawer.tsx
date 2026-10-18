import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Package,
  Calendar,
  CreditCard,
  Building2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';
import type { CompraDetalle } from '@/services/compras.service';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';

export interface PurchaseDrawerProps {
  purchase: CompraDetalle | null;
  isLoading?: boolean;
  onClose: () => void;
  onVoid?: (purchase: CompraDetalle) => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function PurchaseDrawer({
  purchase,
  isLoading = false,
  onClose,
  onVoid,
}: PurchaseDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!purchase && !isLoading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [purchase, isLoading, onClose]);

  if (!purchase && !isLoading) return null;

  const isVoided = purchase?.estado === 'anulada';
  const isReceived = purchase?.estado === 'recibida';
  const isPending = purchase?.estado === 'pendiente';

  const handlePrint = () => {
    if (!purchase) return;
    exportTableToPdf({
      title: `Detalle de Orden de Compra: ${purchase.codigo}`,
      filename: `compra-${purchase.codigo}`,
      headers: ['Producto', 'Cant.', 'Costo Unit.', 'P. Venta', 'Subtotal'],
      rows: (purchase.lineas || []).map((line) => [
        line.nombre,
        line.cantidad,
        formatMoneyPdf(line.precio_costo),
        formatMoneyPdf(line.precio_venta),
        formatMoneyPdf(line.subtotal),
      ]),
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de Orden de Compra ${purchase?.codigo || ''}`}
      className="fixed inset-0 z-[9990] flex justify-end"
    >
      {/* Scrim semitransparente con desenfoque Apple */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
      />

      {/* Panel lateral estilo Apple */}
      <div
        ref={drawerRef}
        className="relative w-full sm:w-[480px] md:w-[540px] h-full bg-[var(--surface)] text-[var(--ink)] border-l border-[var(--line)] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 select-none"
      >
        {/* Cabecera del Drawer */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--line)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--chip)] border border-[var(--line)] flex items-center justify-center flex-shrink-0 text-[var(--ink)]">
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[var(--ink)] font-mono truncate leading-tight">
                  {purchase?.codigo || 'Cargando orden...'}
                </h2>
                {/* Punto de estado */}
                {purchase && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: isReceived
                        ? 'var(--ok)'
                        : isPending
                          ? 'var(--warn)'
                          : 'var(--bad)',
                    }}
                    title={purchase.estado}
                  />
                )}
              </div>
              <p className="text-xs text-[var(--ink2)] mt-0.5 truncate font-normal">
                {purchase?.proveedor || 'Detalle de abastecimiento'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {purchase && (
              <button
                type="button"
                onClick={handlePrint}
                aria-label="Imprimir detalle de orden"
                title="Imprimir o exportar PDF"
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              >
                <Printer size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel"
              title="Cerrar (Esc)"
              className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Cuerpo del Drawer */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {isLoading && (
            <div className="py-8 text-center text-[var(--ink2)] animate-pulse">
              Cargando detalle de la compra...
            </div>
          )}

          {purchase && (
            <>
              {/* Banner de estado anulado */}
              {isVoided && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--bad)]/20 bg-[var(--bad)]/5 text-[var(--bad)]">
                  <XCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Compra anulada</span>
                    <span className="text-[11px] opacity-90">
                      Esta orden de compra fue cancelada y su stock reversado.
                    </span>
                  </div>
                </div>
              )}

              {/* Sección 1: Información del Proveedor y Pago */}
              <section className="rounded-xl border border-[var(--line)] bg-[var(--chip)]/40 p-3.5 space-y-2.5">
                <h3 className="font-semibold text-[var(--ink)] text-[11px] uppercase tracking-wider">
                  Datos de la orden
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--ink2)] block text-[11px]">Proveedor</span>
                    <span className="font-medium text-[var(--ink)] truncate block mt-0.5">
                      {purchase.proveedor}
                    </span>
                  </div>

                  <div>
                    <span className="text-[var(--ink2)] block text-[11px]">Fecha de registro</span>
                    <span className="font-medium text-[var(--ink)] tabular-nums block mt-0.5">
                      {formatDate(purchase.fecha)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[var(--ink2)] block text-[11px]">Método de pago</span>
                    <span className="font-medium text-[var(--ink)] block mt-0.5 capitalize">
                      {purchase.metodo_pago}
                    </span>
                  </div>

                  <div>
                    <span className="text-[var(--ink2)] block text-[11px]">Estado</span>
                    <span className="font-medium text-[var(--ink)] block mt-0.5 capitalize">
                      {purchase.estado}
                    </span>
                  </div>
                </div>

                {purchase.notas && (
                  <div className="pt-2 border-t border-[var(--line)]">
                    <span className="text-[var(--ink2)] block text-[11px]">Notas u observaciones</span>
                    <p className="text-[var(--ink)] mt-0.5 italic">{purchase.notas}</p>
                  </div>
                )}
              </section>

              {/* Sección 2: Productos y Líneas de Compra */}
              <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--ink)] text-[11px] uppercase tracking-wider">
                    Productos recibidos ({purchase.lineas?.length || 0})
                  </h3>
                  <span className="text-[11px] text-[var(--ink2)]">
                    {purchase.items} unidades en total
                  </span>
                </div>

                <div className="space-y-2 divide-y divide-[var(--line)]">
                  {(purchase.lineas || []).map((line, idx) => (
                    <div key={line.id || idx} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-[var(--ink)]">{line.nombre}</span>
                        <span className="font-mono font-medium text-[var(--ink)] text-right tabular-nums">
                          RD$ {formatMoney(line.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[var(--ink2)]">
                        <span>
                          {line.cantidad} un. × RD$ {formatMoney(line.precio_costo)} (costo)
                        </span>
                        {line.precio_venta > 0 && (
                          <span>PVP sugerido: RD$ {formatMoney(line.precio_venta)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sección 3: Totales y desglose fiscal */}
              <section className="rounded-xl border border-[var(--line)] bg-[var(--chip)]/30 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-[var(--ink2)]">
                  <span>Subtotal neto</span>
                  <span className="font-mono tabular-nums">RD$ {formatMoney(purchase.subtotal)}</span>
                </div>

                <div className="flex justify-between text-[var(--ink2)]">
                  <span>ITBIS transparentado (18%)</span>
                  <span className="font-mono tabular-nums">RD$ {formatMoney(purchase.impuesto)}</span>
                </div>

                <div className="border-t border-[var(--line)] pt-2.5 flex justify-between font-semibold text-sm text-[var(--ink)]">
                  <span>Total inversión</span>
                  <span className="font-mono tabular-nums text-[var(--ink)] font-bold">
                    RD$ {formatMoney(purchase.total)}
                  </span>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer del Drawer */}
        {purchase && (
          <footer className="p-4 border-t border-[var(--line)] flex items-center justify-between gap-2 flex-shrink-0 bg-[var(--surface)]">
            {!isVoided && onVoid ? (
              <button
                type="button"
                onClick={() => onVoid(purchase)}
                className="apple-btn-ghost !text-[var(--bad)] hover:!bg-[var(--bad)]/10 text-xs !h-8 !px-3 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Anular orden</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="apple-btn-secondary text-xs !h-8 !px-4 cursor-pointer"
            >
              Cerrar
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
