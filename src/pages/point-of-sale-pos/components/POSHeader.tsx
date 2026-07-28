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

      <div className="min-h-16 bg-card/90 backdrop-blur-md flex flex-wrap items-center px-4 py-3 gap-3 border-b border-border/80">
        <Link to="/" className="flex items-center gap-2 text-base font-bold text-foreground/80 hover:text-primary transition-colors">
          <ArrowLeft size={18} className="text-primary" />
          <span className="hidden sm:inline">Panel</span>
        </Link>

        <div className="w-px h-6 bg-border/80 hidden sm:block" />

        <div className="flex items-center gap-2.5">
          <span className="text-base font-extrabold text-foreground tracking-tight">Punto de Venta</span>
          <span className="badge-info text-xs sm:text-sm font-bold">{cashLabel}</span>
          <span className="text-xs font-semibold text-muted-foreground hidden md:inline">{cashierName}</span>
        </div>

        <button
          type="button"
          onClick={onSwitchCash}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all shadow-sm"
          title="Cambiar de caja (admin)"
        >
          <Monitor size={18} />
          <span className="hidden sm:inline">Cambiar caja</span>
        </button>

        {awaitingDelete && (
          <button
            type="button"
            onClick={onCancelDelete}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-danger-bg text-danger border border-danger/30 animate-pulse"
          >
            <XCircle size={18} />
            <span>Cancelar eliminar</span>
          </button>
        )}

        <div className="flex-1 min-w-[8px]" />

        {cartCount > 0 && (
          <div className="flex items-center gap-3 bg-primary/15 border border-primary/30 px-3.5 py-2 rounded-xl">
            <span className="text-xs font-extrabold uppercase tracking-wide text-primary">{cartCount} items</span>
            <span className="text-sm font-black tabular-nums text-primary">
              RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onScale}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all shadow-sm"
          title="Producto pesado (SKU: 200 / F4)"
        >
          <Scale size={18} />
          <span className="hidden md:inline">Pesados</span>
          <span className="hidden xl:inline text-[10px] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow-sm">SKU: 200</span>
        </button>

        <button
          type="button"
          onClick={onExpense}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all shadow-sm"
          title="Gasto de caja"
        >
          <Receipt size={18} />
          <span className="hidden md:inline">Gasto</span>
        </button>

        <button
          type="button"
          onClick={onReturn}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all shadow-sm"
          title="Devolución"
        >
          <Undo2 size={18} />
          <span className="hidden md:inline">Devolución</span>
        </button>

        <button
          type="button"
          onClick={onHold}
          className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all shadow-sm"
          title="Pausar / retomar ventas"
        >
          <Pause size={18} />
          <span className="hidden md:inline">Pausar</span>
          {heldCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
              {heldCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          title="Limpiar carrito"
        >
          <Trash2 size={18} />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      </div>
    </div>
  );
}
