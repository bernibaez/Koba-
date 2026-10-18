import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  Smartphone,
  Receipt,
  DollarSign,
  FileText,
} from 'lucide-react';
import type { CashClosure } from '../types';
import { getDifferenceType } from '../types';

interface CashClosureDrawerProps {
  closure: CashClosure | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (closure: CashClosure) => void;
  onExportPdf: (closure: CashClosure) => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CashClosureDrawer({
  closure,
  isOpen,
  onClose,
  onPrint,
  onExportPdf,
}: CashClosureDrawerProps) {
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

  if (!isOpen || !closure) return null;

  const diffType = getDifferenceType(closure.difference);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cash-closure-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-[var(--surface)] text-[var(--ink)] shadow-2xl flex flex-col border-l border-[var(--line)] animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="cash-closure-drawer-title" className="text-base font-semibold text-[var(--ink)] truncate">
                  Cierre {closure.code}
                </h2>
                <span className="apple-badge apple-badge-neutral text-[10px] tracking-wide uppercase">
                  Cerrado
                </span>
              </div>
              <p className="text-xs text-[var(--ink2)] truncate">
                {closure.cashRegisterLabel || `Caja #${closure.cashRegisterId}`} · {closure.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrint(closure)}
              className="apple-btn-secondary !h-8 !px-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Imprimir comprobante térmico"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              type="button"
              onClick={() => onExportPdf(closure)}
              className="apple-btn-secondary !h-8 !px-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Exportar comprobante en PDF"
            >
              <Download size={13} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel"
              className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 select-none">
          {/* Banner de Arqueo / Cuadre */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              diffType === 'exact'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : diffType === 'surplus'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {diffType === 'exact' ? (
                <CheckCircle2 size={24} className="shrink-0" />
              ) : (
                <AlertTriangle size={24} className="shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-90">
                  {diffType === 'exact'
                    ? 'Cuadre exacto verificado'
                    : diffType === 'surplus'
                      ? 'Sobrante detectado en caja'
                      : 'Faltante detectado en caja'}
                </span>
                <span className="text-lg font-bold font-mono">
                  {closure.difference >= 0
                    ? `+RD$ ${formatMoney(closure.difference)}`
                    : `-RD$ ${formatMoney(Math.abs(closure.difference))}`}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-medium text-[var(--ink2)] block">
                Contado vs Esperado
              </span>
              <span className="text-xs font-mono font-medium text-[var(--ink)]">
                {formatMoney(closure.countedCash)} / {formatMoney(closure.expectedCash)}
              </span>
            </div>
          </div>

          {/* Información del Turno */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <User size={13} className="text-[var(--accent)]" /> Cajero responsable
              </span>
              <p className="font-semibold text-[var(--ink)] truncate">{closure.userName}</p>
              <p className="text-[10px] text-[var(--ink2)] truncate">@{closure.username || 'usuario'}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Calendar size={13} className="text-[var(--accent)]" /> Fecha del turno
              </span>
              <p className="font-semibold text-[var(--ink)]">{closure.date}</p>
              <p className="text-[10px] text-[var(--ink2)]">Jornada finalizada</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Clock size={13} className="text-emerald-600 dark:text-emerald-400" /> Apertura
              </span>
              <p className="font-semibold font-mono text-[var(--ink)]">{closure.openedAt || '—'}</p>
              <p className="text-[10px] text-[var(--ink2)]">Inicio de jornada</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Clock size={13} className="text-amber-600 dark:text-amber-400" /> Cierre
              </span>
              <p className="font-semibold font-mono text-[var(--ink)]">{closure.closedAt || '—'}</p>
              <p className="text-[10px] text-[var(--ink2)]">Fin de jornada</p>
            </div>
          </div>

          {/* Conciliación de Efectivo Físico */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--surface2)] border-b border-[var(--line)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <DollarSign size={14} className="text-[var(--accent)]" />
                Arqueo y Conciliación de Efectivo
              </span>
              <span className="text-[10px] font-mono text-[var(--ink2)]">RD$</span>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[var(--ink2)]">
                <span>Fondo inicial (Apertura de turno)</span>
                <span className="font-mono font-medium text-[var(--ink)]">
                  RD$ {formatMoney(closure.baseCash ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[var(--ink2)]">
                <span className="flex items-center gap-1">
                  <ArrowUpRight size={12} className="text-emerald-600 dark:text-emerald-400" />
                  Ventas cobradas en efectivo
                </span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  +RD$ {formatMoney(closure.totalCash ?? 0)}
                </span>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex justify-between items-center font-medium">
                <span className="text-[var(--ink)]">Efectivo físico esperado</span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  RD$ {formatMoney(closure.expectedCash)}
                </span>
              </div>

              <div className="flex justify-between items-center font-medium">
                <span className="text-[var(--ink)]">Efectivo físico contado</span>
                <span className="font-mono font-semibold text-[var(--accent)]">
                  RD$ {formatMoney(closure.countedCash)}
                </span>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex justify-between items-center font-semibold">
                <span className="text-[var(--ink)]">Diferencia de arqueo</span>
                <span
                  className={`font-mono ${
                    closure.difference === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : closure.difference > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {closure.difference >= 0 ? '+' : '-'}RD$ {formatMoney(Math.abs(closure.difference))}
                </span>
              </div>
            </div>
          </div>

          {/* Desglose por Método de Pago */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--surface2)] border-b border-[var(--line)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <Receipt size={14} className="text-[var(--accent)]" />
                Desglose por Métodos de Pago
              </span>
              <span className="text-[10px] font-mono text-[var(--ink2)]">Ventas</span>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--ink2)] flex items-center gap-1.5">
                  <DollarSign size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Efectivo
                </span>
                <span className="font-mono font-medium text-[var(--ink)]">
                  RD$ {formatMoney(closure.totalCash ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--ink2)] flex items-center gap-1.5">
                  <CreditCard size={13} className="text-blue-600 dark:text-blue-400" />
                  Tarjetas de débito / crédito
                </span>
                <span className="font-mono font-medium text-[var(--ink)]">
                  RD$ {formatMoney(closure.totalCard ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--ink2)] flex items-center gap-1.5">
                  <Smartphone size={13} className="text-amber-600 dark:text-amber-400" />
                  Transferencias bancarias
                </span>
                <span className="font-mono font-medium text-[var(--ink)]">
                  RD$ {formatMoney(closure.totalTransfer ?? 0)}
                </span>
              </div>

              {(closure.totalCredit ?? 0) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink2)] flex items-center gap-1.5">
                    <FileText size={13} className="text-purple-600 dark:text-purple-400" />
                    Ventas a crédito (CxC)
                  </span>
                  <span className="font-mono font-medium text-[var(--ink)]">
                    RD$ {formatMoney(closure.totalCredit ?? 0)}
                  </span>
                </div>
              )}

              <div className="pt-2.5 border-t border-[var(--line)] flex justify-between items-center font-semibold bg-[var(--surface2)] -mx-4 -mb-4 px-4 py-2.5">
                <span className="text-xs uppercase tracking-wider text-[var(--ink)]">
                  Total Facturado en Turno
                </span>
                <span className="text-sm font-mono font-bold text-[var(--ink)]">
                  RD$ {formatMoney(closure.totalSales)}
                </span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {closure.notes && (
            <div className="p-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] font-semibold text-[var(--ink2)] block uppercase tracking-wider">
                Observaciones del Cierre
              </span>
              <p className="text-xs text-[var(--ink)] leading-relaxed">{closure.notes}</p>
            </div>
          )}
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
