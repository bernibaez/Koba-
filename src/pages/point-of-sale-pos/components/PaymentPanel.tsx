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
  { id: 'cash' as PaymentMethod, label: 'Efectivo', icon: <Banknote size={18} /> },
  { id: 'card' as PaymentMethod, label: 'Tarjeta', icon: <CreditCard size={18} /> },
  { id: 'transfer' as PaymentMethod, label: 'Transferencia', icon: <Smartphone size={18} /> },
  { id: 'credit' as PaymentMethod, label: 'Crédito', icon: <Split size={18} /> },
  { id: 'split' as PaymentMethod, label: 'Múltiple', icon: <Plus size={18} /> },
];

const quickCash = [500, 1000, 2000, 5000];

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
  const isCashInsufficient = method === 'cash' && cashAmount < total;

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
        toast.error('Selecciona un cliente para usar crédito en el pago múltiple');
        return null;
      }
      return splitNums;
    }
    if (method === 'cash') {
      if (cashAmount < total) {
        toast.error('Monto recibido insuficiente para cubrir el total de la factura');
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
      toast.error('El carrito está vacío — agrega productos antes de procesar');
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

      // Audit Log
      logAuditEvent({
        user: 'Admin General',
        role: 'Administrador',
        action: 'Venta',
        module: 'POS',
        details: `Venta procesada por ${fmt(total)} (${parts.join(' · ')})`,
        after: { total, payments, change: computedChange, cartCount: cart.length },
      });

      toast.success(`Venta procesada — ${fmt(total)}`, {
        description: parts.join(' · ') || undefined,
      });
      if (printReceipt) {
        toast.info('Enviando recibo a impresora…');
      }
      onComplete(payments);
    }, 600);
  };

  if (orderCompleted) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center">
          <CheckCircle size={32} className="text-success" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">¡Venta Completada!</p>
          <p className="text-sm text-muted-foreground mt-1">Total Factura: {fmt(total)}</p>
        </div>
        {lastChange > 0 && (
          <div className="w-full bg-success-bg border border-success/30 rounded-xl p-4 text-center">
            <p className="text-xs font-medium text-success-foreground">Cambio a devolver</p>
            <p className="text-3xl font-extrabold tabular-nums text-success mt-1">{fmt(lastChange)}</p>
          </div>
        )}
        <div className="flex gap-2 w-full mt-2">
          <button type="button" onClick={() => window.print()} className="flex-1 btn-secondary flex items-center justify-center gap-2 text-xs py-2.5">
            <Printer size={14} />
            Imprimir Recibo
          </button>
          <button type="button" onClick={onNewSale} className="flex-1 btn-primary text-xs py-2.5">
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">Método de Pago</span>
        {onClose && (
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Total Factura Header */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Factura</p>
          <p className="text-3xl font-extrabold tabular-nums text-primary mt-1">{fmt(total)}</p>
          {customer && <p className="text-xs text-muted-foreground mt-1 font-medium">Cliente: {customer.name}</p>}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Forma de Pago</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((m) => (
              <button
                key={`pm-${m.id}`}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150 active:scale-95
                  ${method === m.id
                    ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                {m.icon}
                <span className="text-xs font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Cash Payment Calculations (Módulo 2 Requirement) */}
        {method === 'cash' && (
          <div className="space-y-3 bg-secondary/20 p-3.5 rounded-xl border border-border">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Monto Recibido del Cliente (RD$) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className={`input-field text-xl font-black tabular-nums text-center ${
                  isCashInsufficient && cashAmount > 0 ? 'border-danger text-danger focus:ring-danger' : ''
                }`}
              />
              {isCashInsufficient && cashAmount > 0 && (
                <p className="text-xs text-danger font-semibold mt-1 flex items-center justify-center gap-1">
                  <AlertCircle size={14} /> Monto insuficiente — Faltan: {fmt(total - cashAmount)}
                </p>
              )}
            </div>

            {/* Quick cash denomination buttons */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Billetes sugeridos</p>
              <div className="grid grid-cols-4 gap-1.5">
                {quickCash.map((v) => (
                  <button
                    key={`quick-${v}`}
                    type="button"
                    onClick={() => setCashReceived(v.toString())}
                    className="py-1.5 text-xs font-bold bg-secondary hover:bg-border rounded-lg transition-colors active:scale-95 tabular-nums"
                  >
                    {v >= 1000 ? `${v / 1000}k` : v}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCashReceived(String(total))}
                className="w-full mt-1.5 py-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
              >
                Monto Exacto: {fmt(total)}
              </button>
            </div>

            {/* Total Factura, Monto Recibido & Cambio a Devolver Breakdown */}
            <div className="border-t border-border/80 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Factura:</span>
                <span className="font-bold text-foreground">{fmt(total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Monto Recibido:</span>
                <span className="font-bold text-foreground">{fmt(cashAmount)}</span>
              </div>
              <div
                className={`flex justify-between items-center p-3 rounded-xl font-bold border ${
                  cashAmount >= total
                    ? 'bg-success-bg border-success/30 text-success'
                    : 'bg-secondary border-border text-muted-foreground'
                }`}
              >
                <span className="text-sm">Cambio a Devolver:</span>
                <span className="text-2xl font-black tabular-nums">{fmt(change)}</span>
              </div>
            </div>
          </div>
        )}

        {method === 'split' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Distribuye el total entre varios métodos. La suma debe ser exacta.</p>
            {(
              [
                ['cash', 'Efectivo'],
                ['card', 'Tarjeta'],
                ['transfer', 'Transferencia'],
                ['credit', 'Crédito'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{label}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={split[key]}
                  onChange={(e) => setSplit((s) => ({ ...s, [key]: e.target.value }))}
                  className="input-field tabular-nums"
                />
              </div>
            ))}
            <div className={`rounded-xl p-3 text-sm flex justify-between ${Math.abs(splitDiff) < 0.01 ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
              <span>Suma / Total</span>
              <span className="font-bold tabular-nums">
                {fmt(splitTotal)} / {fmt(total)}
              </span>
            </div>
            {Math.abs(splitDiff) >= 0.01 && (
              <p className="text-xs text-danger">Diferencia: {fmt(splitDiff)} (ajusta para igualar)</p>
            )}
          </div>
        )}

        {method === 'card' && (
          <div className="bg-info-bg border border-info/20 rounded-xl p-4 text-center">
            <CreditCard size={28} className="text-info mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Insertar o deslizar tarjeta</p>
            <p className="text-xs text-muted-foreground mt-1">Terminal listo para cobrar {fmt(total)}</p>
          </div>
        )}

        {method === 'transfer' && (
          <div className="bg-secondary rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos para transferencia</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Banco:</span>
              <span className="font-semibold text-foreground">Banco Popular</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cuenta:</span>
              <span className="font-semibold font-mono text-foreground">123-456789-0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monto:</span>
              <span className="font-bold tabular-nums text-primary">{fmt(total)}</span>
            </div>
          </div>
        )}

        {method === 'credit' && (
          <div className="space-y-3">
            {customer ? (
              <div className="bg-success-bg border border-success/20 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-semibold">{customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crédito disponible:</span>
                  <span className="font-bold text-success">{fmt(customer.credit)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-warning-bg border border-warning/20 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-warning">Se requiere seleccionar un cliente</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setPrintReceipt((p) => !p)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${printReceipt ? 'bg-primary' : 'bg-border'}`}
            role="switch"
            aria-checked={printReceipt}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${printReceipt ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-xs font-medium text-foreground">Imprimir recibo al procesar</span>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-border flex-shrink-0">
        <button
          type="button"
          onClick={handleProcess}
          disabled={processing || cart.length === 0 || isCashInsufficient}
          className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Procesando Venta...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Finalizar Venta {fmt(total)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
