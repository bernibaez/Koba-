import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Trash2, Pause, Receipt, Scale, Undo2, XCircle, Shield, Monitor,
} from 'lucide-react';

interface POSHeaderProps {
  cartCount: number;
  total: number;
  heldCount: number;
  awaitingDelete: boolean;
  cashLabel: string;
  cashierName: string;
  isRemoteAdmin: boolean;
  onClear: () => void;
  onHold: () => void;
  onExpense: () => void;
  onScale: () => void;
  onReturn: () => void;
  onCancelDelete: () => void;
  onSwitchCash: () => void;
}

export default function POSHeader({
  cartCount,
  total,
  heldCount,
  awaitingDelete,
  cashLabel,
  cashierName,
  isRemoteAdmin,
  onClear,
  onHold,
  onExpense,
  onScale,
  onReturn,
  onCancelDelete,
  onSwitchCash,
}: POSHeaderProps) {
  return (
    <div className="flex flex-col flex-shrink-0 border-b border-border">
      {isRemoteAdmin && (
        <div className="bg-warning/15 border-b border-warning/30 px-3 py-1.5 flex items-center gap-2 text-xs">
          <Shield size={14} className="text-warning flex-shrink-0" />
          <span className="text-foreground font-medium">
            Modo admin · Operando {cashLabel} de {cashierName}
          </span>
          <span className="text-muted-foreground hidden sm:inline">
            — puedes vender, ajustar y ver la actividad en vivo sin cerrar sesión
          </span>
        </div>
      )}

      <div className="h-auto min-h-12 bg-card flex flex-wrap items-center px-3 py-2 gap-2">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Panel</span>
        </Link>

        <div className="w-px h-5 bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Punto de Venta</span>
          <span className="badge-info text-xs">{cashLabel}</span>
          <span className="text-xs text-muted-foreground hidden md:inline">{cashierName}</span>
        </div>

        <button
          type="button"
          onClick={onSwitchCash}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          title="Cambiar de caja (admin)"
        >
          <Monitor size={14} />
          <span className="hidden sm:inline">Cambiar caja</span>
        </button>

        {awaitingDelete && (
          <button
            type="button"
            onClick={onCancelDelete}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-danger-bg text-danger"
          >
            <XCircle size={14} />
            Cancelar eliminar
          </button>
        )}

        <div className="flex-1" />

        {cartCount > 0 && (
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg">
            <span className="text-xs font-medium text-primary">{cartCount} items</span>
            <span className="text-xs font-bold tabular-nums text-primary">
              RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <button type="button" onClick={onScale} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Producto pesado">
          <Scale size={14} />
          <span className="hidden md:inline">Pesados</span>
        </button>

        <button type="button" onClick={onExpense} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Gasto de caja">
          <Receipt size={14} />
          <span className="hidden md:inline">Gasto</span>
        </button>

        <button type="button" onClick={onReturn} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Devolución">
          <Undo2 size={14} />
          <span className="hidden md:inline">Devolución</span>
        </button>

        <button type="button" onClick={onHold} className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Pausar / retomar ventas">
          <Pause size={14} />
          <span className="hidden md:inline">Pausar</span>
          {heldCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
              {heldCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-danger-bg hover:text-danger transition-colors"
          title="Limpiar carrito"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      </div>
    </div>
  );
}
