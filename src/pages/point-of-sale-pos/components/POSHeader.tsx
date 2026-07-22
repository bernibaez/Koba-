import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Settings, Printer, Wifi } from 'lucide-react';

interface POSHeaderProps {
  cartCount: number;
  total: number;
  onClear: () => void;
}

export default function POSHeader({ cartCount, total, onClear }: POSHeaderProps) {
  return (
    <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">Panel</span>
      </Link>

      <div className="w-px h-5 bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Punto de Venta</span>
        <span className="badge-info text-xs">Caja #1</span>
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        <Wifi size={13} className="text-success" />
        <span className="text-xs text-success font-medium">En línea</span>
      </div>

      <div className="flex-1" />

      {cartCount > 0 && (
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg">
          <span className="text-xs font-medium text-primary">{cartCount} items</span>
          <span className="text-xs font-bold tabular-nums text-primary">
            RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <button
        onClick={onClear}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-danger-bg hover:text-danger transition-colors"
        title="Limpiar carrito — esta acción no se puede deshacer"
      >
        <Trash2 size={14} />
        <span className="hidden sm:inline">Limpiar</span>
      </button>

      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        title="Imprimir recibo"
      >
        <Printer size={14} />
      </button>

      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        title="Configuración del POS"
      >
        <Settings size={14} />
      </button>
    </div>
  );
}