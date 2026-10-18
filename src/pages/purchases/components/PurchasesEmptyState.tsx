import React from 'react';
import { Package, RotateCcw } from 'lucide-react';
import type { PurchasesTab } from '../types';

interface PurchasesEmptyStateProps {
  tab: PurchasesTab;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onNewPurchase?: () => void;
}

export default function PurchasesEmptyState({
  tab,
  hasFilters = false,
  onClearFilters,
  onNewPurchase,
}: PurchasesEmptyStateProps) {
  if (tab === 'returns') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--ink2)] mb-3">
          <RotateCcw size={22} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-[var(--ink)]">Aún no hay devoluciones a proveedores.</p>
        <p className="text-xs text-[var(--ink2)] mt-1 max-w-sm">
          Las devoluciones registradas con crédito o reembolso aparecerán listadas aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
      <div className="w-12 h-12 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--ink2)] mb-3">
        <Package size={22} strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-[var(--ink)]">
        {hasFilters ? 'No se encontraron órdenes de compra.' : 'Aún no hay órdenes de compra registradas.'}
      </p>
      <p className="text-xs text-[var(--ink2)] mt-1 max-w-sm">
        {hasFilters
          ? 'Intenta ajustar los filtros de búsqueda, fecha o estado.'
          : 'Registra tus compras a proveedores para alimentar el inventario con costos reales.'}
      </p>
      <div className="flex items-center gap-2 mt-4">
        {hasFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="apple-btn-ghost text-xs !h-8 !px-3 cursor-pointer"
          >
            Restablecer filtros
          </button>
        )}
        {onNewPurchase && (
          <button
            type="button"
            onClick={onNewPurchase}
            className="apple-btn-primary !h-8 !px-4 !text-xs cursor-pointer"
          >
            Nueva compra
          </button>
        )}
      </div>
    </div>
  );
}
