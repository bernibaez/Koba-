import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, RotateCcw, XCircle, Briefcase, Scale, Undo2, Pause, PlusCircle, Calendar, CreditCard
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
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const datePart = d.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timePart = d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true });
      setTimeStr(`${datePart} ${timePart}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 mb-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Button Menú Principal + Location & Date/Time Badge */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-sm active:scale-95"
            title="Ir al menú principal del sistema"
          >
            <Home size={16} />
            <span>Menú Principal</span>
          </Link>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:inline">Ubicación:</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              SUPERMERCADO {cashLabel}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">
            <Calendar size={14} />
            <span>{timeStr || '28-07-2026 01:49 PM'}</span>
          </div>
        </div>

        {/* Center: Square Icon Action Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={onClear}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-2xs"
            title="Venta Previa / Reajustar"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={onClear}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-2xs"
            title="Cancelar / Limpiar"
          >
            <XCircle size={16} />
          </button>

          <button
            type="button"
            onClick={onSwitchCash}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-2xs"
            title="Cambiar de Caja"
          >
            <Briefcase size={16} />
          </button>

          <button
            type="button"
            onClick={onScale}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-all shadow-2xs"
            title="Balanza (Pesados SKU: 200)"
          >
            <Scale size={16} />
          </button>

          <button
            type="button"
            onClick={onReturn}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-2xs"
            title="Devolución"
          >
            <Undo2 size={16} />
          </button>

          <button
            type="button"
            onClick={onSwitchCash}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-2xs"
            title="Terminal de Pago"
          >
            <CreditCard size={16} />
          </button>

          <button
            type="button"
            onClick={onHold}
            className="relative p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-all shadow-2xs"
            title="Suspender / Pausar Venta"
          >
            <Pause size={16} />
            {heldCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {heldCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Agregar gasto button */}
        <button
          type="button"
          onClick={onExpense}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-black hover:bg-slate-50 transition-all shadow-2xs"
        >
          <PlusCircle size={15} className="text-slate-900 dark:text-white" />
          <span>Agregar gasto</span>
        </button>
      </div>
    </div>
  );
}
