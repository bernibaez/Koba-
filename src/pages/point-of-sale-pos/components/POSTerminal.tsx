import React, { useState, useCallback } from 'react';
import POSHeader from './POSHeader';
import ProductPanel from './ProductPanel';
import CartPanel from './CartPanel';
import PaymentPanel from './PaymentPanel';

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
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  credit: number;
}

const ITBIS_RATE = 0.18;

export default function POSTerminal() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);

  const addToCart = useCallback((product: Omit<CartItem, 'qty' | 'discount'>) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ...product, qty: 1, discount: 0 }];
    });
  }, []);

  const updateQty = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== cartId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === cartId ? { ...item, qty } : item))
      );
    }
  }, []);

  const updateDiscount = useCallback((cartId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === cartId ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item))
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
  }, []);

  const subtotal = cart.reduce((sum, item) => {
    const lineTotal = item.price * item.qty;
    const lineDiscount = lineTotal * (item.discount / 100);
    return sum + lineTotal - lineDiscount;
  }, 0);

  const globalDiscountAmount = subtotal * (globalDiscount / 100);
  const afterDiscount = subtotal - globalDiscountAmount;
  const taxableItems = cart.filter((i) => i.tax > 0);
  const taxTotal = taxableItems.reduce((sum, item) => {
    const lineTotal = item.price * item.qty * (1 - item.discount / 100);
    return sum + lineTotal * (item.tax / 100);
  }, 0);
  const total = afterDiscount + taxTotal;

  return (
    <div className="flex flex-col h-[calc(100vh-64px-48px)] -mx-4 lg:-mx-6 xl:-mx-8 2xl:-mx-10 -my-6">
      <POSHeader
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        total={total}
        onClear={clearCart}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 min-w-0 border-r border-border overflow-hidden flex flex-col">
          <ProductPanel onAddToCart={addToCart} />
        </div>

        {/* Center: Cart */}
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

        {/* Right: Payment (always visible on xl+) */}
        <div className="hidden xl:flex w-72 2xl:w-80 flex-col overflow-hidden flex-shrink-0">
          <PaymentPanel
            total={total}
            cart={cart}
            customer={selectedCustomer}
            onComplete={() => {
              setOrderCompleted(true);
              setTimeout(() => clearCart(), 1800);
            }}
            orderCompleted={orderCompleted}
          />
        </div>
      </div>

      {/* Mobile payment modal */}
      {paymentOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-foreground/40 flex items-end">
          <div className="w-full bg-card rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <PaymentPanel
              total={total}
              cart={cart}
              customer={selectedCustomer}
              onComplete={() => {
                setPaymentOpen(false);
                setOrderCompleted(true);
                setTimeout(() => clearCart(), 1800);
              }}
              orderCompleted={orderCompleted}
              onClose={() => setPaymentOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}