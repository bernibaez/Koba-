import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sliders,
  Package,
  Calendar,
  Clock,
  User,
  Tag,
  ArrowRight,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { StockAdjustmentItem } from '../types';
import { ADJUSTMENT_TYPE_CONFIG } from '../types';

interface StockAdjustmentDetailDrawerProps {
  item: StockAdjustmentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StockAdjustmentDetailDrawer({
  item,
  isOpen,
  onClose,
}: StockAdjustmentDetailDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const typeCfg = ADJUSTMENT_TYPE_CONFIG[item.type] || {
    label: item.type,
    badgeClass: 'apple-badge-neutral',
    icon: 'down',
  };
  const delta = item.newQty - item.previousQty;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-adj-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-[var(--surface)] text-[var(--ink)] shadow-2xl flex flex-col border-l border-[var(--line)] animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <Sliders size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="stock-adj-drawer-title" className="text-base font-semibold text-[var(--ink)] truncate">
                  Ajuste {item.code}
                </h2>
                <span className={`apple-badge ${typeCfg.badgeClass} text-[10px]`}>
                  {typeCfg.label}
                </span>
              </div>
              <p className="text-xs text-[var(--ink2)] truncate">
                {item.productName} · {item.date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 select-none">
          {/* Card Producto */}
          <div className="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider">
                Producto Afectado
              </span>
              <span className="apple-badge apple-badge-neutral text-[10px]">
                {item.category || 'General'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[var(--ink)]">{item.productName}</h3>
            <p className="font-mono text-xs text-[var(--ink2)]">SKU: {item.sku || 'Sin SKU'}</p>
          </div>

          {/* Comparativa de Inventario */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-center">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
                Stock Previo
              </span>
              <p className="text-base font-bold font-mono text-[var(--ink2)] mt-1">
                {item.previousQty} unds
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-center">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
                Nuevo Stock
              </span>
              <p className="text-base font-bold font-mono text-[var(--ink)] mt-1">
                {item.newQty} unds
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-center">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
                Variación
              </span>
              <p
                className={`text-base font-bold font-mono mt-1 ${
                  delta > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {delta > 0 ? `+${delta}` : `${delta}`}
              </p>
            </div>
          </div>

          {/* Motivo del Ajuste */}
          <div className="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
              Motivo o Justificación Registrada
            </span>
            <p className="text-xs text-[var(--ink)] leading-relaxed">
              {item.reason || 'Sin motivo especificado'}
            </p>
          </div>

          {/* Auditoría / Metadatos */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <User size={13} className="text-[var(--accent)]" /> Responsable
              </span>
              <p className="font-semibold text-[var(--ink)] truncate">{item.responsible}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Clock size={13} className="text-[var(--accent)]" /> Fecha y Hora
              </span>
              <p className="font-semibold text-[var(--ink)] font-mono">
                {item.date} {item.time}
              </p>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between text-xs text-[var(--ink2)] shrink-0">
          <div className="flex items-center gap-1">
            <span>Presiona</span>
            <kbd className="apple-kbd">Esc</kbd>
            <span>para cerrar</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="apple-btn-secondary !h-8 !px-4 text-xs font-medium cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
