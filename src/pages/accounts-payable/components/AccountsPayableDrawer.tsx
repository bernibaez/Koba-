import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Wallet,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Truck,
  ArrowRight,
} from 'lucide-react';
import type { CuentaPagarUi } from '../types';
import { CXP_STATUS_CONFIG } from '../types';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';

interface AccountsPayableDrawerProps {
  cuenta: CuentaPagarUi | null;
  isOpen: boolean;
  onClose: () => void;
  onRegisterPayment: (params: {
    cuenta_id: string;
    monto: number;
    metodo_pago: string;
    nota: string;
  }) => Promise<void>;
  onPrint: (cuenta: CuentaPagarUi) => void;
}

function formatMoney(amount: number): string {
  return (amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AccountsPayableDrawer({
  cuenta,
  isOpen,
  onClose,
  onRegisterPayment,
  onPrint,
}: AccountsPayableDrawerProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentNote, setPaymentNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !cuenta) {
      setPaymentAmount('');
      setPaymentNote('');
      return;
    }
    setPaymentAmount(cuenta.balance > 0 ? String(cuenta.balance) : '');
  }, [isOpen, cuenta]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen || !cuenta) return null;

  const statusCfg = CXP_STATUS_CONFIG[cuenta.status] || {
    label: cuenta.status,
    badgeClass: 'apple-badge-neutral',
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;

    setSaving(true);
    try {
      await onRegisterPayment({
        cuenta_id: cuenta.id,
        monto: amount,
        metodo_pago: paymentMethod,
        nota: paymentNote || 'Pago a proveedor registrado',
      });
      setPaymentAmount('');
      setPaymentNote('');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cxp-drawer-title"
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
              <Truck size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="cxp-drawer-title" className="text-base font-semibold text-[var(--ink)] truncate">
                  {cuenta.supplier}
                </h2>
                <span className={`apple-badge ${statusCfg.badgeClass} text-[10px]`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-[var(--ink2)] truncate">
                Doc. {cuenta.code} · Compra {cuenta.purchase || 'Compra Directa'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrint(cuenta)}
              className="apple-btn-secondary !h-8 !px-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Imprimir estado de cuenta"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Cerrar panel"
              className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 select-none">
          {/* Resumen Financiero Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
                Total Compra
              </span>
              <p className="text-sm font-semibold font-mono text-[var(--ink)] mt-1">
                RD$ {formatMoney(cuenta.total)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
                Total Pagado
              </span>
              <p className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                RD$ {formatMoney(cuenta.paid)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
                Saldo Pendiente
              </span>
              <p
                className={`text-sm font-bold font-mono mt-1 ${
                  cuenta.balance > 0
                    ? cuenta.status === 'overdue'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-[var(--accent)]'
                    : 'text-[var(--ink2)]'
                }`}
              >
                RD$ {formatMoney(cuenta.balance)}
              </p>
            </div>
          </div>

          {/* Info del Documento */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Calendar size={13} className="text-[var(--accent)]" /> Emisión
              </span>
              <p className="font-semibold text-[var(--ink)] font-mono">{cuenta.issueDate}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Calendar size={13} className="text-amber-600 dark:text-amber-400" /> Vencimiento
              </span>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-[var(--ink)] font-mono">{cuenta.dueDate}</p>
                {cuenta.daysOverdue > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    +{cuenta.daysOverdue}d mora
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Formulario de Pago a Proveedor */}
          {cuenta.balance > 0 ? (
            <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-[var(--accent)]" />
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    Registrar Pago a Proveedor
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(cuenta.balance))}
                    className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface2)] hover:bg-[var(--line)] text-[var(--ink)] cursor-pointer"
                  >
                    Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String((cuenta.balance / 2).toFixed(2)))}
                    className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface2)] hover:bg-[var(--line)] text-[var(--ink)] cursor-pointer"
                  >
                    50%
                  </button>
                </div>
              </div>

              <form onSubmit={handlePay} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--ink2)] mb-1 block">
                      Monto a Pagar (RD$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={cuenta.balance}
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="apple-input w-full font-mono text-xs !h-8"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[var(--ink2)] mb-1 block">
                      Método de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="apple-select w-full text-xs !h-8"
                    >
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Cheque">Cheque Comercial</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta de Crédito Corporativa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[var(--ink2)] mb-1 block">
                    Referencia o Nota
                  </label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Ej: Transferencia Banco Reservas ref #102931..."
                    className="apple-input w-full text-xs !h-8"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !parseFloat(paymentAmount)}
                  className="apple-btn-primary w-full !h-8 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <ButtonSpinner />
                  ) : (
                    <>
                      <span>Confirmar desembolso de</span>
                      <span className="font-mono font-semibold">
                        RD$ {formatMoney(parseFloat(paymentAmount) || 0)}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 text-xs font-medium">
              <CheckCircle2 size={16} />
              <span>Esta factura ha sido completamente saldada al proveedor.</span>
            </div>
          )}

          {/* Historial de Pagos */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--surface2)] border-b border-[var(--line)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <Receipt size={14} className="text-[var(--accent)]" />
                Historial de Desembolsos Realizados
              </span>
              <span className="text-[10px] text-[var(--ink2)]">
                {cuenta.payments.length} pago(s)
              </span>
            </div>

            {cuenta.payments.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--ink2)]">
                No hay pagos registrados para este documento
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)] max-h-60 overflow-y-auto">
                {cuenta.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-[var(--surface2)]/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[var(--ink)] font-mono">{p.date}</span>
                        <span className="apple-badge apple-badge-neutral text-[10px]">
                          {p.method}
                        </span>
                      </div>
                      {p.note && (
                        <p className="text-[11px] text-[var(--ink2)] mt-0.5">{p.note}</p>
                      )}
                    </div>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +RD$ {formatMoney(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
            disabled={saving}
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
