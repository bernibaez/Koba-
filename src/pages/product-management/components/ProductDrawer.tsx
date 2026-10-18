import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle, ArrowUp, ArrowDown, History, Check } from 'lucide-react';
import type { Product } from './ProductManagementScreen';
import CategoryIcon from '@/components/ui/CategoryIcon';

// Esquema Zod con mensajes claros y directos en español
export const productDrawerSchema = z.object({
  salePrice: z
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio debe ser mayor que 0'),
  currentStock: z
    .number({ invalid_type_error: 'El stock debe ser un número' })
    .min(0, 'El stock no puede ser negativo'),
  minStock: z
    .number({ invalid_type_error: 'El punto de reorden debe ser un número' })
    .min(0, 'El punto de reorden no puede ser negativo'),
  status: z.enum(['active', 'inactive', 'discontinued'] as const, {
    errorMap: () => ({ message: 'Selecciona un estado válido' }),
  }),
});

export type ProductDrawerFormValues = z.infer<typeof productDrawerSchema>;

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (updated: Partial<Product> & { id: string }) => Promise<void>;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  triggerElement?: HTMLElement | null;
}

export default function ProductDrawer({
  open,
  onClose,
  product,
  onSave,
  onNavigateNext,
  onNavigatePrev,
  hasNext = false,
  hasPrev = false,
  triggerElement,
}: ProductDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductDrawerFormValues>({
    resolver: zodResolver(productDrawerSchema),
    defaultValues: {
      salePrice: product?.salePrice ?? 0,
      currentStock: product?.currentStock ?? 0,
      minStock: product?.minStock ?? 0,
      status: (product?.status as 'active' | 'inactive' | 'discontinued') ?? 'active',
    },
  });

  // Guardar elemento enfocado antes de abrir y resetear valores
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = triggerElement || (document.activeElement as HTMLElement | null);
      if (product) {
        reset({
          salePrice: Number(product.salePrice) || 0,
          currentStock: Number(product.currentStock) || 0,
          minStock: Number(product.minStock) || 0,
          status: (product.status as 'active' | 'inactive' | 'discontinued') || 'active',
        });
      }
    } else {
      // Devolver foco al elemento disparador
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      }
    }
  }, [open, product, reset, triggerElement]);

  // Escape key y navegación con ↑ y ↓
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Si el foco no está en un input, textarea o select, navegar con ↑ y ↓
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputFocused =
        activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (!isInputFocused) {
        if (e.key === 'ArrowUp' && hasPrev && onNavigatePrev) {
          e.preventDefault();
          onNavigatePrev();
        } else if (e.key === 'ArrowDown' && hasNext && onNavigateNext) {
          e.preventDefault();
          onNavigateNext();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, onNavigateNext, onNavigatePrev, hasNext, hasPrev]);

  if (!open || !product) return null;

  const watchedStock = watch('currentStock');
  const watchedMinStock = watch('minStock');
  const isBelowReorderPoint =
    typeof watchedStock === 'number' &&
    typeof watchedMinStock === 'number' &&
    watchedStock <= watchedMinStock;

  const isWeighed = Boolean(
    product.isWeightProduct || product.saleType === 'weight' || product.saleType === 'both'
  );
  const weightUnit = product.weightUnit || 'lb';

  const metaParts: string[] = [];
  if (product.sku) metaParts.push(`SKU ${product.sku}`);
  if (product.plu) metaParts.push(`PLU ${product.plu}`);
  if (product.barcode && product.barcode !== product.plu) metaParts.push(product.barcode);

  const onSubmit = async (values: ProductDrawerFormValues) => {
    await onSave({
      id: product.id,
      salePrice: values.salePrice,
      currentStock: values.currentStock,
      minStock: values.minStock,
      status: values.status,
    });
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${product.name}`}
      className="fixed inset-0 z-[9990] flex justify-end"
    >
      {/* Scrim semitransparente */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
      />

      {/* Panel Lateral Drawer (420px, 100% en móvil) */}
      <div
        ref={drawerRef}
        className="relative w-full sm:w-[420px] h-full bg-[var(--surface)] text-[var(--ink)] border-l border-[var(--line)] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
      >
        {/* Cabecera del Drawer */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--line)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[10px] bg-[var(--chip)] border border-[var(--line)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <CategoryIcon category={product.category} name={product.name} size="sm" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--ink)] truncate leading-tight">
                {product.name}
              </h2>
              <p className="text-xs text-[var(--ink2)] mt-0.5 truncate font-normal">
                {metaParts.join(' · ') || 'Sin código'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Navegación ↑ y ↓ */}
            <div className="hidden sm:flex items-center gap-0.5 mr-1 text-[var(--ink2)]">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={onNavigatePrev}
                aria-label="Producto anterior (Flecha arriba)"
                title="Producto anterior (↑)"
                className="p-1 rounded-lg hover:bg-[var(--chip)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ArrowUp size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={onNavigateNext}
                aria-label="Producto siguiente (Flecha abajo)"
                title="Producto siguiente (↓)"
                className="p-1 rounded-lg hover:bg-[var(--chip)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ArrowDown size={14} strokeWidth={2} />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
              aria-label="Cerrar panel de detalle"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </header>

        {/* Formulario y Contenido */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Aviso en naranja de punto de reorden */}
            {isBelowReorderPoint && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-normal text-[var(--warn)] animate-in fade-in duration-150"
              >
                <AlertTriangle size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5 text-[var(--warn)]" />
                <div>
                  <p className="font-semibold text-[var(--warn)]">Stock bajo de existencias</p>
                  <p className="mt-0.5 text-[var(--ink)]">Está por debajo del punto de reorden. Conviene reponer.</p>
                </div>
              </div>
            )}

            {/* Campos Editables */}
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-[var(--ink2)]">Valores de inventario y precio</h3>

              {/* Precio de venta */}
              <div className="space-y-1">
                <label htmlFor="drawer-price" className="text-xs font-normal text-[var(--ink)] block">
                  Precio de venta (RD$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--ink2)] pointer-events-none">
                    RD$
                  </span>
                  <input
                    id="drawer-price"
                    type="number"
                    step="0.01"
                    {...register('salePrice', { valueAsNumber: true })}
                    className="w-full h-9 pl-11 pr-3 text-xs text-[var(--ink)] bg-[var(--chip)] rounded-[10px] border-none outline-none focus:ring-2 focus:ring-[var(--accent)] tabular-nums"
                  />
                </div>
                {errors.salePrice && (
                  <p className="text-xs text-[var(--bad)] mt-0.5">{errors.salePrice.message}</p>
                )}
              </div>

              {/* Stock y Punto de reorden */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="drawer-stock" className="text-xs font-normal text-[var(--ink)] block">
                    Stock {isWeighed ? `(${weightUnit})` : '(unidades)'}
                  </label>
                  <input
                    id="drawer-stock"
                    type="number"
                    step={isWeighed ? '0.01' : '1'}
                    {...register('currentStock', { valueAsNumber: true })}
                    className="w-full h-9 px-3 text-xs text-[var(--ink)] bg-[var(--chip)] rounded-[10px] border-none outline-none focus:ring-2 focus:ring-[var(--accent)] tabular-nums"
                  />
                  {errors.currentStock && (
                    <p className="text-xs text-[var(--bad)] mt-0.5">{errors.currentStock.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="drawer-reorder" className="text-xs font-normal text-[var(--ink)] block">
                    Punto de reorden
                  </label>
                  <input
                    id="drawer-reorder"
                    type="number"
                    step={isWeighed ? '0.01' : '1'}
                    {...register('minStock', { valueAsNumber: true })}
                    className="w-full h-9 px-3 text-xs text-[var(--ink)] bg-[var(--chip)] rounded-[10px] border-none outline-none focus:ring-2 focus:ring-[var(--accent)] tabular-nums"
                  />
                  {errors.minStock && (
                    <p className="text-xs text-[var(--bad)] mt-0.5">{errors.minStock.message}</p>
                  )}
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-1">
                <label htmlFor="drawer-status" className="text-xs font-normal text-[var(--ink)] block">
                  Estado
                </label>
                <select
                  id="drawer-status"
                  {...register('status')}
                  className="w-full h-9 px-3 text-xs text-[var(--ink)] bg-[var(--chip)] rounded-[10px] border-none outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="discontinued">Descontinuado</option>
                </select>
                {errors.status && (
                  <p className="text-xs text-[var(--bad)] mt-0.5">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-[var(--line)] pt-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink2)] mb-3">
                <History size={14} strokeWidth={1.8} />
                <span>Movimientos recientes</span>
              </div>

              {/* TODO: Conectar a endpoint de auditoría/kardex cuando esté disponible en backend */}
              <div className="space-y-2">
                {[
                  {
                    id: 'mov-1',
                    action: 'Venta POS #1092',
                    diff: isWeighed ? `-1.5 ${weightUnit}` : '-2 un.',
                    date: 'Hoy, 10:24 AM',
                    positive: false,
                  },
                  {
                    id: 'mov-2',
                    action: 'Entrada por compra #043',
                    diff: isWeighed ? `+50 ${weightUnit}` : '+24 un.',
                    date: 'Ayer, 4:15 PM',
                    positive: true,
                  },
                  {
                    id: 'mov-3',
                    action: 'Ajuste de inventario físico',
                    diff: isWeighed ? `+2.0 ${weightUnit}` : '+3 un.',
                    date: '14 Oct, 9:00 AM',
                    positive: true,
                  },
                ].map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--chip)] text-xs font-normal"
                  >
                    <div>
                      <p className="text-[var(--ink)] font-medium leading-tight">{mov.action}</p>
                      <p className="text-[11px] text-[var(--ink2)] mt-0.5">{mov.date}</p>
                    </div>
                    <span
                      className="font-mono text-xs tabular-nums font-semibold"
                      style={{ color: mov.positive ? 'var(--ok)' : 'var(--ink)' }}
                    >
                      {mov.diff}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pie de acciones del Drawer */}
          <footer className="p-4 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-end gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="apple-btn-ghost text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="apple-btn-primary text-xs"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check size={14} strokeWidth={2} />
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
