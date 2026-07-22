import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Split, Printer, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import type { CartItem, Customer } from './POSTerminal';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit';

interface PaymentPanelProps {
  total: number;
  cart: CartItem[];
  customer: Customer | null;
  onComplete: () => void;
  orderCompleted: boolean;
  onClose?: () => void;
}

const paymentMethods = [
  { id: 'cash' as PaymentMethod, label: 'Efectivo', icon: <Banknote size={18} /> },
  { id: 'card' as PaymentMethod, label: 'Tarjeta', icon: <CreditCard size={18} /> },
  { id: 'transfer' as PaymentMethod, label: 'Transferencia', icon: <Smartphone size={18} /> },
  { id: 'credit' as PaymentMethod, label: 'Crédito', icon: <Split size={18} /> },
];

const quickCash = [500, 1000, 2000, 5000];

export default function PaymentPanel({
  total,
  cart,
  customer,
  onComplete,
  orderCompleted,
  onClose,
}: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [splitAmounts, setSplitAmounts] = useState({ cash: '', card: '' });

  const fmt = (v: number) =>
    `RD$ ${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = method === 'cash' ? Math.max(0, cashAmount - total) : 0;
  const insufficient = method === 'cash' && cashAmount > 0 && cashAmount < total;

  const handleProcess = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío — agrega productos antes de procesar');
      return;
    }
    if (method === 'cash' && cashAmount < total) {
      toast.error('Monto recibido insuficiente para cubrir el total');
      return;
    }
    setProcessing(true);
    // Backend integration point: POST /api/pos/transactions
    setTimeout(() => {
      setProcessing(false);
      toast.success(`Venta procesada — ${fmt(total)}`, {
        description: method === 'cash' ? `Cambio: ${fmt(change)}` : 'Pago con ' + paymentMethods.find((m) => m.id === method)?.label,
      });
      onComplete();
    }, 1000);
  };

  if (orderCompleted) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center">
          <CheckCircle size={32} className="text-success" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">¡Venta Completada!</p>
          <p className="text-sm text-muted-foreground mt-1">{fmt(total)}</p>
        </div>
        {change > 0 && (
          <div className="w-full bg-success-bg border border-success/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">Cambio a entregar</p>
            <p className="text-2xl font-bold tabular-nums text-success mt-1">{fmt(change)}</p>
          </div>
        )}
        <div className="flex gap-2 w-full mt-2">
          <button className="flex-1 btn-secondary flex items-center justify-center gap-2 text-xs py-2.5">
            <Printer size={14} />
            Imprimir
          </button>
          <button className="flex-1 btn-primary text-xs py-2.5">
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">Método de Pago</span>
        {onClose && (
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Total display */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total a Cobrar</p>
          <p className="text-3xl font-bold tabular-nums text-primary mt-1">{fmt(total)}</p>
          {customer && (
            <p className="text-xs text-muted-foreground mt-1">Cliente: {customer.name}</p>
          )}
        </div>

        {/* Payment method selector */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Forma de Pago</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((m) => (
              <button
                key={`pm-${m.id}`}
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150 active:scale-95
                  ${method === m.id
                    ? 'bg-primary/10 border-primary/40 text-primary' :'bg-card border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                {m.icon}
                <span className="text-xs font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash section */}
        {method === 'cash' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Monto Recibido (RD$)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className={`input-field text-lg font-bold tabular-nums text-center ${
                  insufficient ? 'border-danger focus:ring-danger' : ''
                }`}
              />
              {insufficient && (
                <p className="text-xs text-danger mt-1">
                  Faltan: {fmt(total - cashAmount)}
                </p>
              )}
            </div>

            {/* Quick cash buttons */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Billetes comunes</p>
              <div className="grid grid-cols-4 gap-1.5">
                {quickCash.map((v) => (
                  <button
                    key={`quick-${v}`}
                    onClick={() => setCashReceived(v.toString())}
                    className="py-1.5 text-xs font-semibold bg-secondary hover:bg-border rounded-lg transition-colors active:scale-95 tabular-nums"
                  >
                    {v >= 1000 ? `${v / 1000}k` : v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCashReceived(Math.ceil(total / 100) * 100 + '')}
                className="w-full mt-1.5 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
              >
                Exacto: {fmt(Math.ceil(total / 100) * 100)}
              </button>
            </div>

            {/* Change display */}
            {cashAmount >= total && cashAmount > 0 && (
              <div className="bg-success-bg border border-success/20 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Cambio a entregar</p>
                <p className="text-2xl font-bold tabular-nums text-success">{fmt(change)}</p>
              </div>
            )}
          </div>
        )}

        {/* Card section */}
        {method === 'card' && (
          <div className="space-y-3">
            <div className="bg-info-bg border border-info/20 rounded-xl p-4 text-center">
              <CreditCard size={28} className="text-info mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Insertar o deslizar tarjeta</p>
              <p className="text-xs text-muted-foreground mt-1">Terminal listo para cobrar {fmt(total)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Últimos 4 dígitos (opcional)</label>
              <input
                type="text"
                maxLength={4}
                placeholder="0000"
                className="input-field text-center font-mono tracking-widest"
              />
            </div>
          </div>
        )}

        {/* Transfer section */}
        {method === 'transfer' && (
          <div className="space-y-3">
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
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Número de confirmación</label>
              <input type="text" placeholder="Ej: 202607211648" className="input-field font-mono" />
            </div>
          </div>
        )}

        {/* Credit section */}
        {method === 'credit' && (
          <div className="space-y-3">
            {customer ? (
              <div className="bg-success-bg border border-success/20 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-semibold text-foreground">{customer.name}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Crédito disponible:</span>
                  <span className="font-bold tabular-nums text-success">{fmt(customer.credit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Esta venta:</span>
                  <span className={`font-bold tabular-nums ${total > customer.credit ? 'text-danger' : 'text-foreground'}`}>
                    {fmt(total)}
                  </span>
                </div>
                {total > customer.credit && (
                  <p className="text-xs text-danger mt-2 font-medium">
                    Crédito insuficiente — diferencia: {fmt(total - customer.credit)}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-warning-bg border border-warning/20 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-warning">Se requiere seleccionar un cliente</p>
                <p className="text-xs text-muted-foreground mt-1">Asigna un cliente en el carrito para usar crédito</p>
              </div>
            )}
          </div>
        )}

        {/* Receipt options */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setPrintReceipt((p) => !p)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
              printReceipt ? 'bg-primary' : 'bg-border'
            }`}
            role="switch"
            aria-checked={printReceipt}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                printReceipt ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <label className="text-xs font-medium text-foreground cursor-pointer" onClick={() => setPrintReceipt((p) => !p)}>
            Imprimir recibo al procesar
          </label>
        </div>
      </div>

      {/* Process button */}
      <div className="px-4 py-4 border-t border-border flex-shrink-0 space-y-2">
        <button
          onClick={handleProcess}
          disabled={processing || cart.length === 0 || (method === 'cash' && cashAmount < total && cashAmount > 0)}
          className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {processing ? (
            <>
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Cobrar {fmt(total)}
            </>
          )}
        </button>
        <p className="text-xs text-center text-muted-foreground">
          Presiona <kbd className="px-1 bg-secondary border border-border rounded text-xs font-mono">F9</kbd> para cobrar rápido
        </p>
      </div>
    </div>
  );
}