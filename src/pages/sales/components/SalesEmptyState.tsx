import React from 'react';
import { ShoppingCart, FileText, RotateCcw } from 'lucide-react';
import type { SalesTab } from '../types';

interface SalesEmptyStateProps {
  tab: SalesTab;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onNewSale?: () => void;
  onNewQuote?: () => void;
  onNewReturn?: () => void;
}

export default function SalesEmptyState({
  tab,
  hasFilters = false,
  onClearFilters,
  onNewSale,
  onNewQuote,
  onNewReturn,
}: SalesEmptyStateProps) {
  if (tab === 'quotes') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--ink2)] mb-3">
          <FileText size={22} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-[var(--ink)]">Aún no hay cotizaciones.</p>
        <p className="text-xs text-[var(--ink2)] mt-1 max-w-sm">
          Crea propuestas comerciales con validez y productos del catálogo para tus clientes.
        </p>
        {onNewQuote && (
          <button
            type="button"
            onClick={onNewQuote}
            className="apple-btn-primary !h-8 !px-4 !text-xs mt-4"
          >
            Nueva cotización
          </button>
        )}
      </div>
    );
  }

  if (tab === 'returns') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--ink2)] mb-3">
          <RotateCcw size={22} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-[var(--ink)]">Aún no hay devoluciones.</p>
        <p className="text-xs text-[var(--ink2)] mt-1 max-w-sm">
          Las devoluciones y notas de crédito registradas aparecerán aquí.
        </p>
        {onNewReturn && (
          <button
            type="button"
            onClick={onNewReturn}
            className="apple-btn-primary !h-8 !px-4 !text-xs mt-4"
          >
            Registrar devolución
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
      <div className="w-12 h-12 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--ink2)] mb-3">
        <ShoppingCart size={22} strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-[var(--ink)]">No hay ventas en este periodo.</p>
      <p className="text-xs text-[var(--ink2)] mt-1 max-w-sm">
        {hasFilters
          ? 'Intenta cambiar el rango de fechas o los términos de búsqueda.'
          : 'Comienza registrando tu primera venta en el sistema.'}
      </p>
      <div className="flex items-center gap-2 mt-4">
        {hasFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="apple-btn-ghost text-xs !h-8 !px-3"
          >
            Restablecer filtros
          </button>
        )}
        {onNewSale && (
          <button
            type="button"
            onClick={onNewSale}
            className="apple-btn-primary !h-8 !px-4 !text-xs"
          >
            Nueva venta
          </button>
        )}
      </div>
    </div>
  );
}
