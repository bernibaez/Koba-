import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import POSHeader from './POSHeader';
import ProductPanel from './ProductPanel';
import CartPanel from './CartPanel';
import PaymentPanel from './PaymentPanel';
import PosExpenseModal from './PosExpenseModal';
import PosHoldModal from './PosHoldModal';
import PosScaleModal from './PosScaleModal';
import PosReturnModal from './PosReturnModal';
import PosCashSwitchModal from './PosCashSwitchModal';
import { getCashRegister, type CashRegisterId } from '@/lib/cashRegisters';
import {
  DELETE_SKU,
  getHeldSales,
  removeHeldSale,
  saveHeldSale,
  type HeldSale,
  type PaymentSplit,
} from '@/lib/posStore';

const ADMIN_OWN_CASH: CashRegisterId = '1';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  qty: number;
  discount: number;
  tax: number;
  image: string;
  unit: string;
  isWeighted?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  credit: number;
}

export default function POSTerminal() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [lastPayments, setLastPayments] = useState<PaymentSplit | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => getHeldSales());
  const [awaitingDeleteScan, setAwaitingDeleteScan] = useState(false);
  const [activeCashId, setActiveCashId] = useState<CashRegisterId>(ADMIN_OWN_CASH);
  const [cashSwitchOpen, setCashSwitchOpen] = useState(false);

  const activeCash = getCashRegister(activeCashId);
  const isRemoteAdmin = activeCashId !== ADMIN_OWN_CASH;

  const refreshHeld = () => setHeldSales(getHeldSales());

  const addToCart = useCallback((product: Omit<CartItem, 'qty' | 'discount'>, qty = 1) => {
    if (product.sku.toUpperCase() === DELETE_SKU || product.sku.toUpperCase() === 'ELIMINAR') {
      setAwaitingDeleteScan(true);
      toast.info('Modo eliminar: escanea el SKU del producto a quitar del carrito');
      return;
    }

    if (awaitingDeleteScan) {
      setCart((prev) => {
        const idx = [...prev].reverse().findIndex((i) => i.sku === product.sku || i.productId === product.productId);
        if (idx === -1) {
          toast.error(`No hay ${product.name} en el carrito`);
          return prev;
        }
        const realIdx = prev.length - 1 - idx;
        toast.success(`Eliminado: ${prev[realIdx].name}`);
        return prev.filter((_, i) => i !== realIdx);
      });
      setAwaitingDeleteScan(false);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.productId && !product.isWeighted);
      if (existing && !product.isWeighted) {
        return prev.map((item) =>
          item.productId === product.productId ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { ...product, qty, discount: 0 }];
    });
  }, [awaitingDeleteScan]);

  const updateQty = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== cartId));
    } else {
      setCart((prev) => prev.map((item) => (item.id === cartId ? { ...item, qty } : item)));
    }
  }, []);

  const updateDiscount = useCallback((cartId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === cartId ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((cartId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setGlobalDiscount(0);
    setOrderCompleted(false);
    setLastPayments(null);
    setAwaitingDeleteScan(false);
  }, []);

  const holdCurrentSale = (label: string) => {
    if (cart.length === 0) {
      toast.error('No hay productos para pausar');
      return;
    }
    const sale: HeldSale = {
      id: `hold-${Date.now()}`,
      label: label || `Venta ${new Date().toLocaleTimeString('es-DO')}`,
      cart,
      customer: selectedCustomer,
      globalDiscount,
      savedAt: new Date().toISOString(),
    };
    saveHeldSale(sale);
    refreshHeld();
    clearCart();
    setHoldOpen(false);
    toast.success('Venta pausada y guardada');
  };

  const resumeHeldSale = (sale: HeldSale) => {
    if (cart.length > 0) {
      toast.error('Limpia o pausa la venta actual antes de retomar otra');
      return;
    }
    setCart(sale.cart as CartItem[]);
    setSelectedCustomer(sale.customer as Customer | null);
    setGlobalDiscount(sale.globalDiscount);
    removeHeldSale(sale.id);
    refreshHeld();
    setHoldOpen(false);
    toast.success(`Retomada: ${sale.label}`);
  };

  const subtotal = cart.reduce((sum, item) => {
    const lineTotal = item.price * item.qty;
    const lineDiscount = lineTotal * (item.discount / 100);
    return sum + lineTotal - lineDiscount;
  }, 0);

  const globalDiscountAmount = subtotal * (globalDiscount / 100);
  const afterDiscount = subtotal - globalDiscountAmount;
  const taxTotal = cart
    .filter((i) => i.tax > 0)
    .reduce((sum, item) => {
      const lineTotal = item.price * item.qty * (1 - item.discount / 100);
      return sum + lineTotal * (item.tax / 100);
    }, 0);
  const total = afterDiscount + taxTotal;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        setPaymentOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const paymentProps = {
    total,
    cart,
    customer: selectedCustomer,
    orderCompleted,
    onComplete: (_payments: PaymentSplit) => {
      setLastPayments(_payments);
      setOrderCompleted(true);
      setPaymentOpen(false);
    },
    onNewSale: clearCart,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px-48px)] -mx-4 lg:-mx-6 xl:-mx-8 2xl:-mx-10 -my-6">
      <POSHeader
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        total={total}
        heldCount={heldSales.length}
        awaitingDelete={awaitingDeleteScan}
        cashLabel={activeCash.label}
        cashierName={activeCash.cashier}
        isRemoteAdmin={isRemoteAdmin}
        onClear={clearCart}
        onHold={() => setHoldOpen(true)}
        onExpense={() => setExpenseOpen(true)}
        onScale={() => setScaleOpen(true)}
        onReturn={() => setReturnOpen(true)}
        onCancelDelete={() => setAwaitingDeleteScan(false)}
        onSwitchCash={() => setCashSwitchOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-0 border-r border-border overflow-hidden flex flex-col">
          <ProductPanel
            onAddToCart={addToCart}
            onOpenScale={() => setScaleOpen(true)}
            awaitingDelete={awaitingDeleteScan}
          />
        </div>

        <div className="w-80 xl:w-96 border-r border-border flex flex-col overflow-hidden flex-shrink-0">
          <CartPanel
            cart={cart}
            customer={selectedCustomer}
            onSetCustomer={setSelectedCustomer}
            onUpdateQty={updateQty}
            onUpdateDiscount={updateDiscount}
            onRemove={removeFromCart}
            globalDiscount={globalDiscount}
            onSetGlobalDiscount={setGlobalDiscount}
            subtotal={subtotal}
            taxTotal={taxTotal}
            globalDiscountAmount={globalDiscountAmount}
            total={total}
            onCheckout={() => setPaymentOpen(true)}
          />
        </div>

        <div className="hidden xl:flex w-72 2xl:w-80 flex-col overflow-hidden flex-shrink-0">
          {isRemoteAdmin ? (
            <div className="flex flex-col h-full bg-card">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Actividad en vivo</p>
                  <p className="text-sm font-bold text-foreground">{activeCash.label} · {activeCash.cashier}</p>
                </div>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary"
                  onClick={() => toast.success('Actividad actualizada')}
                  title="Actualizar"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 border-b border-border text-xs">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">Ventas hoy</p>
                  <p className="font-bold">RD$ {activeCash.salesToday.toLocaleString('es-DO')}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">Tickets</p>
                  <p className="font-bold">{activeCash.tickets}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">Carrito cajero</p>
                  <p className="font-bold">{activeCash.cartItems} ítems</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">Total carrito</p>
                  <p className="font-bold text-primary">
                    RD$ {activeCash.currentTotal.toLocaleString('es-DO')}
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activeCash.movements.map((m, i) => (
                  <div key={`${m.time}-${i}`} className="text-xs border-b border-border/60 pb-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-foreground">{m.time} · {m.type}</span>
                      <span className={`tabular-nums font-semibold ${m.amount < 0 ? 'text-danger' : 'text-foreground'}`}>
                        {m.amount === 0 ? '—' : `RD$ ${m.amount.toLocaleString('es-DO')}`}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{m.detail}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border text-xs text-muted-foreground">
                Cobro con F9 o el botón Cobrar del carrito
              </div>
            </div>
          ) : (
            <PaymentPanel {...paymentProps} />
          )}
        </div>
      </div>

      {paymentOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-foreground/40 flex items-end">
          <div className="w-full bg-card rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <PaymentPanel {...paymentProps} onClose={() => setPaymentOpen(false)} />
          </div>
        </div>
      )}

      {expenseOpen && <PosExpenseModal onClose={() => setExpenseOpen(false)} />}
      {holdOpen && (
        <PosHoldModal
          heldSales={heldSales}
          canHold={cart.length > 0}
          onHold={holdCurrentSale}
          onResume={resumeHeldSale}
          onDelete={(id) => {
            removeHeldSale(id);
            refreshHeld();
            toast.success('Venta pausada eliminada');
          }}
          onClose={() => setHoldOpen(false)}
        />
      )}
      {scaleOpen && (
        <PosScaleModal
          onClose={() => setScaleOpen(false)}
          onConfirm={(item, qty) => {
            addToCart(item, qty);
            setScaleOpen(false);
          }}
        />
      )}
      {returnOpen && <PosReturnModal onClose={() => setReturnOpen(false)} />}
      {cashSwitchOpen && (
        <PosCashSwitchModal
          currentId={activeCashId}
          onSelect={setActiveCashId}
          onClose={() => setCashSwitchOpen(false)}
        />
      )}
    </div>
  );
}
