import React from 'react';

interface PurchasesHeaderProps {
  onNewPurchase: () => void;
  canCreate?: boolean;
}

export default function PurchasesHeader({
  onNewPurchase,
  canCreate = true,
}: PurchasesHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 select-none">
      <div>
        <h1 className="apple-title">Compras</h1>
        <p className="apple-subtitle mt-1">
          Órdenes de compra a proveedores, recepción de stock y comprobantes fiscales (B11).
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {canCreate && (
          <button
            type="button"
            onClick={onNewPurchase}
            className="apple-btn-primary text-sm font-medium"
            aria-label="Registrar nueva compra (Atajo: N)"
            title="Registrar nueva compra (N)"
          >
            <span>Nueva compra</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/20 text-white">N</kbd>
          </button>
        )}
      </div>
    </header>
  );
}
