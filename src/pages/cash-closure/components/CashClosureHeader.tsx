import React from 'react';
import { Lock, PlayCircle } from 'lucide-react';

interface CashClosureHeaderProps {
  isAdmin?: boolean;
  onOpenRegister: () => void;
  onCloseRegister: () => void;
}

export default function CashClosureHeader({
  isAdmin = false,
  onOpenRegister,
  onCloseRegister,
}: CashClosureHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)] select-none">
      <div>
        <h1 className="text-xl font-semibold text-[var(--ink)] tracking-tight">
          Cierres de caja y turnos
        </h1>
        <p className="text-xs text-[var(--ink2)] mt-0.5">
          {isAdmin
            ? 'Auditoría integral de arqueos diarios y cuadres de todas las terminales'
            : 'Historial de turnos y cuadres diarios de tu terminal asignada'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenRegister}
          aria-label="Abrir turno o caja"
          className="apple-btn-secondary text-xs !h-8 !px-3 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <PlayCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>Abrir caja</span>
        </button>

        <button
          type="button"
          onClick={onCloseRegister}
          aria-label="Realizar cierre de turno de hoy"
          className="apple-btn-primary text-xs !h-8 !px-3.5 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Lock size={13} />
          <span>Cierre de hoy</span>
        </button>
      </div>
    </header>
  );
}
