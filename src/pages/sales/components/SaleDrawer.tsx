import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  RotateCcw,
  Ban,
  FileText,
  User,
  CreditCard,
  Calendar,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import type { VentaConDetalle } from '@/services/ventas.service';
import type { SalePermissions } from '../utils/saleActions';

export interface SaleDrawerProps {
  sale: VentaConDetalle | null;
  isLoading?: boolean;
  permissions?: SalePermissions;
  onClose: () => void;
  onPrint?: (sale: VentaConDetalle) => void;
  onReturn?: (sale: VentaConDetalle) => void;
  onVoid?: (sale: VentaConDetalle) => void;
}

const paymentLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  mixto: 'Mixto',
  pendiente: 'Pendiente',
};

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SaleDrawer({
  sale,
  isLoading = false,
  permissions = {},
  onClose,
  onPrint,
  onReturn,
  onVoid,
}: SaleDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sale) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sale, onClose]);

  if (!sale) return null;

  const isVoided = sale.estado === 'anulada';
  const isDraft = sale.numero_factura?.startsWith('BOR-') || (sale.estado as string) === 'pendiente' || (sale.estado as string) === 'draft';
  const isCompleted = !isVoided && !isDraft;

  const total = Number(sale.monto_total || 0);
  const subtotal = Number(sale.subtotal || 0);
  const itbis = Number(sale.monto_impuesto || 0);
  const descuento = Number(sale.monto_descuento || 0);
  const costoTotal = Number(sale.costo_total || 0);
  const ganancia = total - costoTotal;
  const marginPct = total > 0 ? ((ganancia / total) * 100).toFixed(1) : '0.0';

  const items = sale.detalle_ventas || [];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de Factura ${sale.numero_factura}`}
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
        className="relative w-full sm:w-[480px] md:w-[520px] h-full bg-[var(--surface)] text-[var(--ink)] border-l border-[var(--line)] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 select-none"
      >
        {/* Cabecera del Drawer */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--line)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--chip)] border border-[var(--line)] flex items-center justify-center flex-shrink-0 text-[var(--ink)]">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[var(--ink)] font-mono truncate leading-tight">
                  {sale.numero_factura}
                </h2>
                {/* Punto de estado discreto */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: isCompleted
                      ? 'var(--ok)'
                      : isDraft
                        ? 'var(--warn)'
                        : 'var(--ink3)',
                  }}
                  title={isCompleted ? 'Completada' : isDraft ? 'Borrador' : 'Anulada'}
                />
              </div>
              <p className="text-xs text-[var(--ink2)] mt-0.5 truncate font-normal">
                {sale.ncf ? `NCF: ${sale.ncf}` : 'Factura simple'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onPrint && (
              <button
                type="button"
                onClick={() => onPrint(sale)}
                aria-label="Imprimir factura"
                title="Imprimir factura"
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

        {/* Cuerpo del Drawer (desplazable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {isLoading && (
            <div className="py-6 text-center text-[var(--ink2)] animate-pulse">
              Cargando detalle de factura...
            </div>
          )}

          {/* Banner de estado anulado si aplica */}
          {isVoided && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--bad)]/20 bg-[var(--bad)]/5 text-[var(--bad)]">
              <XCircle size={15} className="flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Factura anulada</span>
                <span className="text-[11px] opacity-90">
                  {(sale as unknown as { motivo_anulacion?: string }).motivo_anulacion ||
                    'Esta factura fue anulada fiscal y comercialmente.'}
                </span>
              </div>
            </div>
          )}

          {/* Sección 1: Datos de la Venta */}
          <section className="rounded-xl border border-[var(--line)] bg-[var(--chip)]/40 p-3.5 space-y-2.5">
            <h3 className="font-semibold text-[var(--ink)] text-[11px] uppercase tracking-wider">
              Resumen comercial
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[var(--ink2)] block text-[11px]">Cliente</span>
                <span className="font-medium text-[var(--ink)] truncate block mt-0.5">
                  {sale.cliente_nombre || 'Cliente general'}
                </span>
              </div>

              <div>
                <span className="text-[var(--ink2)] block text-[11px]">Fecha y hora</span>
                <span className="font-medium text-[var(--ink)] tabular-nums block mt-0.5">
                  {new Date(sale.creado_en).toLocaleString('es-DO', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              <div>
                <span className="text-[var(--ink2)] block text-[11px]">Cajero responsable</span>
                <span className="font-medium text-[var(--ink)] truncate block mt-0.5">
                  {sale.cajero_nombre || 'Cajero'}
                </span>
              </div>

              <div>
                <span className="text-[var(--ink2)] block text-[11px]">Método de pago</span>
                <span className="font-medium text-[var(--ink)] block mt-0.5">
                  {paymentLabels[sale.metodo_pago] || sale.metodo_pago}
                </span>
              </div>
            </div>
          </section>

          {/* Sección 2: Lista de Ítems */}
          <section className="rounded-xl border border-[var(--line)] bg-[var(--chip)]/40 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--ink)] text-[11px] uppercase tracking-wider">
                Ítems facturados ({items.length})
              </h3>
              <span className="text-[11px] text-[var(--ink2)]">Precios en RD$</span>
            </div>

            {items.length === 0 ? (
              <p className="text-[var(--ink2)] text-center py-4">No hay ítems registrados en esta venta.</p>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {items.map((item, idx) => {
                  const qty = Number(item.cantidad || 0);
                  const price = Number(item.precio_unitario || 0);
                  const lineTotal = Number(item.subtotal || qty * price);

                  return (
                    <div key={item.id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div className="min-w-0 pr-3">
                        <p className="font-medium text-[var(--ink)] truncate text-xs">
                          {item.nombre_item}
                        </p>
                        <p className="text-[11px] text-[var(--ink2)] tabular-nums mt-0.5">
                          {qty} × RD$ {formatMoney(price)}
                        </p>
                      </div>
                      <div className="font-medium tabular-nums text-[var(--ink)] text-right flex-shrink-0">
                        RD$ {formatMoney(lineTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Sección 3: Transparencia Fiscal e Importes */}
          <section className="rounded-xl border border-[var(--line)] bg-[var(--chip)]/40 p-3.5 space-y-2">
            <h3 className="font-semibold text-[var(--ink)] text-[11px] uppercase tracking-wider">
              Desglose fiscal y financiero
            </h3>

            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between text-[var(--ink2)]">
                <span>Subtotal neto</span>
                <span className="tabular-nums font-mono text-[var(--ink)]">RD$ {formatMoney(subtotal)}</span>
              </div>

              {descuento > 0 && (
                <div className="flex justify-between text-[var(--ok)]">
                  <span>Descuento aplicado</span>
                  <span className="tabular-nums font-mono">- RD$ {formatMoney(descuento)}</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--ink2)]">
                <span>ITBIS (18 % transparentado)</span>
                <span className="tabular-nums font-mono text-[var(--ink)]">RD$ {formatMoney(itbis)}</span>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex justify-between items-baseline font-semibold text-sm text-[var(--ink)]">
                <span>Total</span>
                <span className="tabular-nums font-mono text-base font-bold">
                  RD$ {formatMoney(total)}
                </span>
              </div>
            </div>
          </section>

          {/* Sección 4: Rentabilidad */}
          <section className="rounded-xl border border-[var(--line)] bg-[var(--chip)]/40 p-3.5 space-y-2">
            <h3 className="font-semibold text-[var(--ink)] text-[11px] uppercase tracking-wider">
              Rentabilidad de la operación
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-[var(--ink2)] block text-[11px]">Costo total</span>
                <span className="font-mono tabular-nums text-[var(--ink)] block mt-0.5">
                  RD$ {formatMoney(costoTotal)}
                </span>
              </div>

              <div>
                <span className="text-[var(--ink2)] block text-[11px]">Ganancia bruta</span>
                <span className="font-mono tabular-nums text-[var(--ok)] font-medium block mt-0.5">
                  RD$ {formatMoney(ganancia)} ({marginPct} %)
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Pie de acciones del Drawer */}
        <footer className="p-4 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            {isCompleted && onReturn && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReturn(sale);
                }}
                className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-xs font-medium hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] flex items-center gap-1.5"
              >
                <RotateCcw size={13} className="text-amber-500" />
                <span>Devolución</span>
              </button>
            )}

            {isCompleted && permissions.canDelete && onVoid && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onVoid(sale);
                }}
                className="px-3 py-1.5 rounded-lg border border-[var(--bad)]/20 bg-[var(--bad)]/5 text-[var(--bad)] text-xs font-medium hover:bg-[var(--bad)]/10 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--bad)] flex items-center gap-1.5"
              >
                <Ban size={13} />
                <span>Anular</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                type="button"
                onClick={() => onPrint(sale)}
                className="px-4 py-1.5 rounded-full bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Imprimir</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
