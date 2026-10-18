import React from 'react';
import { Plus, Download, Store } from 'lucide-react';

interface CajasHeaderProps {
  cajasCount: number;
  limiteInfo?: { actual: number; limite: number } | null;
  onNewCaja: () => void;
  onExportPdf: () => void;
}

export default function CajasHeader({
  cajasCount,
  limiteInfo,
  onNewCaja,
  onExportPdf,
}: CajasHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)] select-none">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-semibold text-[var(--ink)] tracking-tight">
            Cajas registradoras
          </h1>
          {limiteInfo && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--chip)] text-[var(--ink2)] border border-[var(--line)]">
              <Store size={12} className="text-[var(--ink2)]" />
              <span>
                Plan: {cajasCount} / {limiteInfo.limite === -1 ? 'Ilimitadas' : `${limiteInfo.limite}`}
              </span>
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--ink2)] mt-0.5">
          Configuración y control de terminales activas para el Punto de Venta (POS)
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportPdf}
          aria-label="Exportar listado de cajas en PDF"
          className="apple-btn-secondary text-xs !h-8 !px-3 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Download size={13} />
          <span>Exportar PDF</span>
        </button>

        <button
          type="button"
          onClick={onNewCaja}
          aria-label="Crear nueva caja registradora"
          className="apple-btn-primary text-xs !h-8 !px-3.5 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>Nueva caja</span>
          <kbd className="ml-1 px-1.5 py-0.2 bg-white/20 dark:bg-black/20 text-[10px] rounded font-mono">
            N
          </kbd>
        </button>
      </div>
    </header>
  );
}
