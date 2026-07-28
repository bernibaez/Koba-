import React, { useMemo, useState } from 'react';
import { CreditCard, Banknote, Smartphone, Split, Printer, CheckCircle, X, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CartItem, Customer } from './POSTerminal';
import type { PaymentSplit } from '@/lib/posStore';
import { logAuditEvent } from '@/lib/auditStore';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit' | 'split';

interface PaymentPanelProps {
  total: number;
  cart: CartItem[];
  customer: Customer | null;
  onComplete: (payments: PaymentSplit) => void;
  orderCompleted: boolean;
  onClose?: () => void;
  onNewSale?: () => void;
}

const paymentMethods = [
  { id: 'cash' as PaymentMethod, label: 'Efectivo', icon: <Banknote size={16} /> },
  { id: 'card' as PaymentMethod, label: 'Tarjeta', icon: <CreditCard size={16} /> },
  { id: 'transfer' as PaymentMethod, label: 'Transf.', icon: <Smartphone size={16} /> },
  { id: 'credit' as PaymentMethod, label: 'Crédito', icon: <Split size={16} /> },
  { id: 'split' as PaymentMethod, label: 'Múltiple', icon: <Plus size={16} /> },
];

const quickCash = [100, 200, 500, 1000, 2000];

export default function PaymentPanel({
  total,
  cart,
  customer,
  onComplete,
  orderCompleted,
  onClose,
  onNewSale,
}: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [split, setSplit] = useState({ cash: '', card: '', transfer: '', credit: '' });
  const [lastChange, setLastChange] = useState(0);

  const fmt = (v: number) =>
    `RD$ ${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = method === 'cash' ? Math.max(0, cashAmount - total) : 0;
  const isCashInsufficient = method === 'cash' && cashAmount < total && cart.length > 0;

  const splitNums = useMemo(
    () => ({
      cash: parseFloat(split.cash) || 0,
      card: parseFloat(split.card) || 0,
      transfer: parseFloat(split.transfer) || 0,
      credit: parseFloat(split.credit) || 0,
    }),
    [split]
  );
  const splitTotal = splitNums.cash + splitNums.card + splitNums.transfer + splitNums.credit;
  const splitDiff = Math.round((splitTotal - total) * 100) / 100;

  const buildPayments = (): PaymentSplit | null => {
    if (method === 'split') {
      if (Math.abs(splitDiff) > 0.01) {
        toast.error(`La suma de pagos debe igualar el total. Diferencia: ${fmt(splitDiff)}`);
        return null;
      }
      if (splitNums.credit > 0 && !customer) {
        toast.error('Selecciona un cliente para usar crédito');
        return null;
      }
      return splitNums;
    }
    if (method === 'cash') {
      if (cashAmount < total) {
        toast.error('Monto recibido insuficiente para cubrir el total');
        return null;
      }
      return { cash: total, card: 0, transfer: 0, credit: 0 };
    }
    if (method === 'card') return { cash: 0, card: total, transfer: 0, credit: 0 };
    if (method === 'transfer') return { cash: 0, card: 0, transfer: total, credit: 0 };
    if (method === 'credit') {
      if (!customer) {
        toast.error('Se requiere un cliente para crédito');
        return null;
      }
      if (total > customer.credit) {
        toast.error('Crédito insuficiente');
        return null;
      }
      return { cash: 0, card: 0, transfer: 0, credit: total };
    }
    return null;
  };

  const handleProcess = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    const payments = buildPayments();
    if (!payments) return;

    setProcessing(true);
    const computedChange = method === 'cash' ? change : method === 'split' ? Math.max(0, splitNums.cash - (payments.cash || 0)) : 0;
    setLastChange(computedChange);

    setTimeout(() => {
      setProcessing(false);
      const parts = [
        payments.cash > 0 ? `Efectivo ${fmt(payments.cash)}` : null,
        payments.card > 0 ? `Tarjeta ${fmt(payments.card)}` : null,
        payments.transfer > 0 ? `Transferencia ${fmt(payments.transfer)}` : null,
        payments.credit > 0 ? `Crédito ${fmt(payments.credit)}` : null,
      ].filter(Boolean);

      logAuditEvent({
        user: 'Admin General',
        role: 'Administrador',
        action: 'Venta',
        module: 'POS',
        details: `Venta procesada por ${fmt(total)} (${parts.join(' · ')})`,
        after: { total, payments, change: computedChange, cartCount: cart.length },
      });

      toast.success(`Venta completada — ${fmt(total)}`);
      onComplete(payments);
    }, 400);
  };

  if (orderCompleted) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-4 bg-card">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle size={28} />
        </div>
        <div className="text-center">
          <p className="text-base font-black text-foreground">¡Venta Completada!</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-bold">{fmt(total)}</p>
        </div>
        {lastChange > 0 && (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Devuelta / Cambio</p>
            <p className="text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">{fmt(lastChange)}</p>
          </div>
        )}
        <div className="flex flex-col gap-2 w-full mt-2">
          <button type="button" onClick={() => window.print()} className="btn-secondary flex items-center justify-center gap-1.5 text-xs py-2">
            <Printer size={14} />
            Imprimir Recibo
          </button>
          <button type="button" onClick={onNewSale} className="btn-primary text-xs py-2 font-bold">
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-black uppercase text-foreground tracking-wider">Pago en Caja</span>
        {onClose && (
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {/* Total Display */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">TOTAL A PAGAR</p>
          <p className="text-2xl sm:text-3xl font-black tabular-nums text-primary mt-0.5">{fmt(total)}</p>
        </div>

        {/* Method buttons */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Forma de Pago</p>
          <div className="grid grid-cols-3 gap-1">
            {paymentMethods.map((m) => (
              <button
                key={`pm-${m.id}`}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all active:scale-95 text-center
                  ${method === m.id
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs border-primary'
                    : 'bg-secondary/60 border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                {m.icon}
                <span className="text-[10px] font-bold mt-1 leading-none">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash options */}
        {method === 'cash' && (
          <div className="space-y-2.5 bg-secondary/30 p-2.5 rounded-xl border border-border">
            <div>
              <label className="block text-[11px] font-bold text-foreground mb-1">
                Dinero Recibido (RD$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className={`input-field text-lg font-black tabular-nums text-center h-10 ${
                  isCashInsufficient && cashAmount > 0 ? 'border-danger text-danger' : ''
                }`}
              />
            </div>

            {/* Quick cash denomination buttons */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1 font-semibold">Billetes Rápidos</p>
              <div className="grid grid-cols-3 gap-1">
                {quickCash.map((v) => (
                  <button
                    key={`quick-${v}`}
                    type="button"
                    onClick={() => setCashReceived(v.toString())}
                    className="py-1 text-[11px] font-bold bg-card border border-border hover:bg-primary/10 hover:text-primary rounded transition-colors active:scale-95 tabular-nums"
                  >
                    RD$ {v}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCashReceived(String(total))}
                  className="py-1 text-[10px] font-extrabold bg-primary/15 text-primary border border-primary/30 rounded transition-colors"
                >
                  Exacto
                </button>
              </div>
            </div>

            {/* Change display */}
            <div className="pt-2 border-t border-border/60">
              <div className={`flex justify-between items-center p-2 rounded-lg font-bold border ${
                cashAmount >= total && total > 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-card border-border text-muted-foreground'
              }`}>
                <span className="text-xs">Devuelta:</span>
                <span className="text-lg font-black tabular-nums">{fmt(change)}</span>
              </div>
            </div>
          </div>
        )}

        {method === 'split' && (
          <div className="space-y-2 text-xs">
            {(
              [
                ['cash', 'Efectivo'],
                ['card', 'Tarjeta'],
                ['transfer', 'Transferencia'],
                ['credit', 'Crédito'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-[10px] font-bold text-muted-foreground">{label}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={split[key]}
                  onChange={(e) => setSplit((s) => ({ ...s, [key]: e.target.value }))}
                  className="input-field text-xs h-7 tabular-nums"
                />
              </div>
            ))}
          </div>
        )}

        {method === 'card' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
            <CreditCard size={22} className="text-blue-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">Pasar tarjeta en verifone</p>
          </div>
        )}

        {method === 'transfer' && (
          <div className="bg-secondary rounded-xl p-2.5 text-xs space-y-1">
            <p className="font-bold text-muted-foreground text-[10px] uppercase">Transferencia</p>
            <p className="font-mono text-foreground font-semibold">Banco Popular: 123-456789-0</p>
          </div>
        )}

        {method === 'credit' && (
          <div className="text-xs">
            {customer ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 space-y-1">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{customer.name}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">Crédito disponible: {fmt(customer.credit)}</p>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-amber-600 dark:text-amber-400 font-bold text-center text-xs">
                Selecciona cliente primero
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-border flex-shrink-0 bg-secondary/10">
        <button
          type="button"
          onClick={handleProcess}
          disabled={processing || cart.length === 0 || isCashInsufficient}
          className="w-full btn-primary py-3 text-sm font-black flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {processing ? (
            <span>Procesando...</span>
          ) : (
            <>
              <CheckCircle size={16} />
              Finalizar (F9)
            </>
          )}
        </button>
      </div>
    </div>
  );
}

