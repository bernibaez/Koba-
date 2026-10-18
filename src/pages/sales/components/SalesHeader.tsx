import React from 'react';

interface SalesHeaderProps {
  onNewSale: () => void;
  onNewQuote: () => void;
  canCreate?: boolean;
}

export default function SalesHeader({
  onNewSale,
  onNewQuote,
  canCreate = true,
}: SalesHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 select-none">
      <div>
        <h1 className="apple-title">Ventas</h1>
        <p className="apple-subtitle mt-1">
          Facturación con ITBIS 18 %, cotizaciones y devoluciones.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {canCreate && (
          <button
            type="button"
            onClick={onNewQuote}
            className="apple-btn-ghost text-sm font-medium"
            aria-label="Crear nueva cotización (Atajo: C)"
            title="Crear nueva cotización (C)"
          >
            <span>Nueva cotización</span>
            <kbd className="apple-kbd ml-1">C</kbd>
          </button>
        )}

        {canCreate && (
          <button
            type="button"
            onClick={onNewSale}
            className="apple-btn-primary text-sm font-medium"
            aria-label="Registrar nueva venta (Atajo: N)"
            title="Registrar nueva venta (N)"
          >
            <span>Nueva venta</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/20 text-white">N</kbd>
          </button>
        )}
      </div>
    </header>
  );
}
