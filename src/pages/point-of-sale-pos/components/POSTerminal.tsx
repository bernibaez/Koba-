import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Banknote, CreditCard, XCircle, Pause, CheckCircle, FileText, ShoppingBag } from 'lucide-react';
import POSHeader from './POSHeader';
import ProductPanel from './ProductPanel';
import CartPanel from './CartPanel';
import PaymentPanel from './PaymentPanel';
import PosExpenseModal from './PosExpenseModal';
import PosHoldModal from './PosHoldModal';
import PosScaleModal from './PosScaleModal';
import PosReturnModal from './PosReturnModal';
import PosCashSwitchModal from './PosCashSwitchModal';
import RegisterDetailsModal from './RegisterDetailsModal';
import PosCashOpenModal from './PosCashOpenModal';
import FiscalInvoiceModal from '@/components/FiscalInvoiceModal';
import { getCashRegister, type CashRegisterId } from '@/lib/cashRegisters';
import {
  DELETE_SKU,
  getHeldSales,
  removeHeldSale,
  saveHeldSale,
  type HeldSale,
  type PaymentSplit,
} from '@/lib/posStore';
import type { FiscalInvoiceRecord } from '@/lib/ncfStore';
import { isSupabaseConfigured } from '@/services/clienteSupabase';
import { getCombos, recordComboSale } from '@/lib/comboStore';
import { procesarVenta } from '@/services/ventas.service';
import { registrarFacturaFiscal } from '@/services/ncf.service';
import type { MetodoPago } from '@/types/database';
import { useAuth } from '@/context/AuthContext';

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
  isCombo?: boolean;
  comboId?: string;
  comboItems?: any[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  credit: number;
}

export default function POSTerminal() {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [lastPayments, setLastPayments] = useState<PaymentSplit | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [scaleParams, setScaleParams] = useState<{ productId?: string; weight?: number } | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [registerDetailsOpen, setRegisterDetailsOpen] = useState(false);
  const [lastFiscalInvoice, setLastFiscalInvoice] = useState<FiscalInvoiceRecord | null>(null);
  const [fiscalEnabled, setFiscalEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenScale = (productId?: string, weight?: number) => {
    setScaleParams(productId || weight ? { productId, weight } : null);
    setScaleOpen(true);
  };
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => getHeldSales());
  const [awaitingDeleteScan, setAwaitingDeleteScan] = useState(false);
  const [activeCashId, setActiveCashId] = useState<CashRegisterId>(ADMIN_OWN_CASH);
  const [cashSwitchOpen, setCashSwitchOpen] = useState(false);
  const [openCashModalOpen, setOpenCashModalOpen] = useState(false);

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
      const existing = prev.find((item) => item.productId === product.productId || item.sku === product.sku);
      if (existing) {
        return prev.map((item) =>
          (item.productId === product.productId || item.sku === product.sku)
            ? { ...item, qty: Math.round((item.qty + qty) * 100) / 100 }
            : item
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

  const handleQuickCashSale = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío — agrega productos primero');
      return;
    }
    setPaymentOpen(true);
  };

  const paymentProps = {
    total,
    cart,
    customer: selectedCustomer,
    orderCompleted,
    fiscalEnabled,
    onToggleFiscal: (val: boolean) => setFiscalEnabled(val),
    onComplete: async (_payments: PaymentSplit, fiscalInvoice?: FiscalInvoiceRecord) => {
      const metodo: MetodoPago =
        [_payments.cash, _payments.card, _payments.transfer, _payments.credit].filter((v) => v > 0)
          .length > 1
          ? 'mixto'
          : _payments.cash > 0
            ? 'efectivo'
            : _payments.card > 0
              ? 'tarjeta'
              : _payments.transfer > 0
                ? 'transferencia'
                : _payments.credit > 0
                  ? 'credito'
                  : 'efectivo';

      const costoTotal = cart.reduce((s, i) => s + i.cost * i.qty, 0);
      const montoPagado =
        _payments.cash + _payments.card + _payments.transfer + _payments.credit;

      try {
        const resultado = await procesarVenta({
          cajero_id: user?.id ?? null,
          cliente_id: selectedCustomer?.id ?? null,
          caja_id: String(activeCashId),
          subtotal,
          monto_impuesto: taxTotal,
          monto_descuento: globalDiscountAmount,
          monto_total: total,
          costo_total: costoTotal,
          metodo_pago: metodo,
          monto_pagado: montoPagado,
          monto_efectivo: _payments.cash,
          monto_tarjeta: _payments.card,
          monto_transferencia: _payments.transfer,
          monto_credito: _payments.credit,
          devuelta_entregada: Math.max(0, montoPagado - total),
          // Con Supabase el RPC asigna NCF si hay tipo_ncf; no pasar NCF previo.
          ncf: isSupabaseConfigured() ? null : (fiscalInvoice?.ncf ?? null),
          tipo_ncf: fiscalInvoice?.ncfType ?? null,
          items: cart.map((item) => ({
            producto_id: item.isCombo ? null : item.productId,
            combo_id: item.comboId ?? null,
            tipo_item: item.isCombo ? 'combo' : 'producto',
            nombre_item: item.name,
            precio_unitario: item.price,
            costo_unitario: item.cost,
            cantidad: item.qty,
            porcentaje_impuesto: item.tax,
            subtotal: item.price * item.qty * (1 - item.discount / 100),
          })),
        });

        // Contador local de ventas de combo solo en modo offline
        if (!isSupabaseConfigured()) {
          cart.forEach((cartItem) => {
            if (cartItem.isCombo && cartItem.comboId) {
              const combo = getCombos().find((c) => c.id === cartItem.comboId);
              if (combo) {
                recordComboSale(combo, cartItem.qty, activeCash.label);
              }
            }
          });
        }

        setLastPayments(_payments);
        if (fiscalInvoice) {
          const finalInvoice: FiscalInvoiceRecord = {
            ...fiscalInvoice,
            ncf: resultado.ncf || fiscalInvoice.ncf,
          };
          try {
            if (finalInvoice.ncf) {
              await registrarFacturaFiscal({
                ...finalInvoice,
                venta_id: resultado.venta_id,
              });
            }
          } catch {
            /* no bloquear venta si falla el registro fiscal auxiliar */
          }
          setLastFiscalInvoice(finalInvoice);
          toast.success(`Venta completada — NCF: ${finalInvoice.ncf || '—'}`);
        }
        setOrderCompleted(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al registrar la venta');
        return;
      }
    },
    onNewSale: clearCart,
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 dark:bg-slate-950 p-2 sm:p-3 overflow-hidden">
      {/* Top Header */}
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
        onScale={() => handleOpenScale()}
        onReturn={() => setReturnOpen(true)}
        onCancelDelete={() => setAwaitingDeleteScan(false)}
        onSwitchCash={() => setCashSwitchOpen(true)}
        onOpenRegisterDetails={() => setRegisterDetailsOpen(true)}
        onOpenCash={() => setOpenCashModalOpen(true)}
      />

      {/* Main Grid: Left Panel (Cart) & Right Panel (Products Catalog) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden min-h-0">
        {/* Left Column: Cart & Input Area (58% / 7 cols) */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden h-full">
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
            fiscalEnabled={fiscalEnabled}
            onToggleFiscal={() => setFiscalEnabled((prev) => !prev)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right Column: Products Catalog (42% / 5 cols) */}
        <div className="lg:col-span-5 flex flex-col overflow-hidden h-full">
          <ProductPanel
            onAddToCart={addToCart}
            onOpenScale={handleOpenScale}
            awaitingDelete={awaitingDeleteScan}
          />
        </div>
      </div>

      {/* Bottom Bar: Supermarket Sticky Payment Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-3 mt-3 flex-shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left Action Shortcuts */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => setPaymentOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-200 transition-all shadow-2xs active:scale-95"
            title="Emitir Factura Fiscal con NCF de la DGII"
          >
            <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Factura Fiscal (NCF)</span>
          </button>
          <button
            type="button"
            onClick={() => toast.info('Generando preventa...')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            <FileText size={15} className="text-sky-500" />
            <span>Preventa</span>
          </button>
          <button
            type="button"
            onClick={() => toast.info('Creando cotización...')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            <FileText size={15} className="text-amber-500" />
            <span>Cotización</span>
          </button>
          <button
            type="button"
            onClick={() => setHoldOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            <Pause size={15} className="text-purple-500" />
            <span>Suspender</span>
          </button>
          <button
            type="button"
            onClick={() => toast.info('Venta a crédito seleccionada')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            <CheckCircle size={15} className="text-indigo-500" />
            <span>Venta a crédito</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            <CreditCard size={15} className="text-rose-500" />
            <span>Tarjeta</span>
          </button>
        </div>

        {/* Center Main Payment Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaymentOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-black text-xs shadow-sm transition-all active:scale-95"
          >
            <ShoppingBag size={16} />
            <span>Pago múltiple</span>
          </button>

          <button
            type="button"
            onClick={handleQuickCashSale}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95"
          >
            <Banknote size={18} />
            <span>Efectivo (F9)</span>
          </button>

          <button
            type="button"
            onClick={clearCart}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-sm transition-all active:scale-95"
          >
            <XCircle size={16} />
            <span>Cancelar</span>
          </button>
        </div>

        {/* Rightmost Total Payable */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <span className="text-xs font-black uppercase text-slate-900 dark:text-white">Total Payable:</span>
          <span className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Payment Drawer / Modal when clicking Efectivo or Pago Múltiple */}
      {paymentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh]">
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
          initialProductId={scaleParams?.productId}
          initialWeight={scaleParams?.weight}
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
      {registerDetailsOpen && (
        <RegisterDetailsModal
          onClose={() => setRegisterDetailsOpen(false)}
        />
      )}
      {lastFiscalInvoice && (
        <FiscalInvoiceModal
          invoice={lastFiscalInvoice}
          onClose={() => setLastFiscalInvoice(null)}
        />
      )}
      {openCashModalOpen && (
        <PosCashOpenModal
          initialCajaId={String(activeCashId)}
          onSuccess={() => {
            activeCash.open = true;
          }}
          onClose={() => setOpenCashModalOpen(false)}
        />
      )}
    </div>
  );
}
