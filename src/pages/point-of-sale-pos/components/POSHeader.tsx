import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, RotateCcw, XCircle, Briefcase, Scale, Undo2, Pause, PlusCircle, Calendar, Monitor, PlayCircle
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
  onOpenRegisterDetails?: () => void;
  onOpenCash?: () => void;
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
  onOpenRegisterDetails,
  onOpenCash,
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

        {/* Center: Solid Vibrant Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={onClear}
            className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white transition-all shadow-xs active:scale-95 border border-slate-600"
            title="Venta Previa / Reajustar"
          >
            <RotateCcw size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onClear}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs active:scale-95 border border-red-500"
            title="Cancelar / Limpiar"
          >
            <XCircle size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onOpenRegisterDetails}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs active:scale-95 border border-emerald-500"
            title="Registrar detalles (Maleta)"
          >
            <Briefcase size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onScale}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs active:scale-95 border border-teal-500"
            title="Balanza (Pesados SKU: 200)"
          >
            <Scale size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onReturn}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs active:scale-95 border border-rose-500"
            title="Devolución"
          >
            <Undo2 size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onSwitchCash}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs active:scale-95 border border-indigo-500"
            title="Acceso Remoto / Entrar a una caja"
          >
            <Monitor size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onHold}
            className="relative p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs active:scale-95 border border-purple-500"
            title="Suspender / Pausar Venta"
          >
            <Pause size={18} strokeWidth={2.3} />
            {heldCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-slate-950 text-[11px] rounded-full flex items-center justify-center font-black border-2 border-white dark:border-slate-900 shadow-xs">
                {heldCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Iniciar caja + Agregar gasto */}
        <div className="flex items-center gap-2">
          {onOpenCash && (
            <button
              type="button"
              onClick={onOpenCash}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm active:scale-95 border border-emerald-500"
              title="Iniciar o abrir turno de caja con fondo inicial"
            >
              <PlayCircle size={15} />
              <span>Iniciar Caja</span>
            </button>
          )}

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
    </div>
  );
}
