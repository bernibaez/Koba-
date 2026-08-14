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
import { useCashRegisters } from '@/hooks/useCashRegisters';
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
import { getCombos, recordComboSale, checkComboStockAvailability } from '@/lib/comboStore';
import { procesarVenta } from '@/services/ventas.service';
import { registrarFacturaFiscal } from '@/services/ncf.service';
import { crearCotizacion } from '@/services/cotizaciones.service';
import type { MetodoPago } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProductos } from '@/hooks/useProductos';
import { useCombos } from '@/hooks/useCombos';
import { initialProducts } from '@/pages/product-management/components/ProductManagementScreen';
import { parseScaleBarcode } from '../utils/scaleUtils';

const ADMIN_OWN_CASH: CashRegisterId = '1';
const DEFAULT_CASHIER_CASH: CashRegisterId = '2';

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
  const navigate = useNavigate();
  const isAdminUser = user?.role === 'Administrador';
  const { registers } = useCashRegisters();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [preferredPayMethod, setPreferredPayMethod] = useState<'cash' | 'card' | 'transfer' | 'credit' | 'split' | undefined>();
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [lastPayments, setLastPayments] = useState<PaymentSplit | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [scaleParams, setScaleParams] = useState<{ productId?: string; weight?: number } | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [registerDetailsOpen, setRegisterDetailsOpen] = useState(false);
  const [lastFiscalInvoice, setLastFiscalInvoice] = useState<FiscalInvoiceRecord | null>(null);
  const [fiscalEnabled, setFiscalEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenScale = (productId?: string, weight?: number) => {
    setScaleParams(productId || weight ? { productId, weight } : null);
    setScaleOpen(true);
  };
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => getHeldSales());
  const [awaitingDeleteScan, setAwaitingDeleteScan] = useState(false);
  const [activeCashId, setActiveCashId] = useState<CashRegisterId>(() =>
    user?.role === 'Administrador' ? ADMIN_OWN_CASH : DEFAULT_CASHIER_CASH
  );
  const [cashSwitchOpen, setCashSwitchOpen] = useState(false);
  const [openCashModalOpen, setOpenCashModalOpen] = useState(false);

  const activeCashSession = registers.find((c) => c.id === activeCashId);
  const activeCash = activeCashSession || getCashRegister(activeCashId);
  const isRemoteAdmin = isAdminUser && !activeCash.isAdminBox;

  useEffect(() => {
    if (registers.length === 0) return;

    // Admin: asegurar caja principal real (UUID/código de DB), no el fallback fijo "1"
    if (isAdminUser) {
      const exists = registers.some((c) => c.id === activeCashId);
      if (!exists) {
        const adminBox = registers.find((c) => c.isAdminBox) || registers[0];
        if (adminBox) setActiveCashId(adminBox.id as CashRegisterId);
      }
      return;
    }

    const current = registers.find((c) => c.id === activeCashId);
    if (current?.isAdminBox) {
      const fallback = registers.find((c) => !c.isAdminBox);
      if (fallback) setActiveCashId(fallback.id as CashRegisterId);
    }
  }, [isAdminUser, registers, activeCashId]);

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



  const { productosUi } = useProductos({ pagina: 1, limite: 500, estado: 'todos' });
  const { combos } = useCombos(true);

  const handleSearchSubmit = useCallback(
    (rawQuery: string) => {
      const q = rawQuery.trim();
      if (!q) return;

      const storeProducts = productosUi.map((p) => ({
        id: p.id,
        sku: p.sku,
        barcode: p.barcode || '',
        name: p.name,
        price: p.salePrice,
        cost: p.costPrice,
        stock: p.currentStock,
        unit: p.unit,
        tax: p.tax,
        image: p.image,
        outOfStock: p.stockStatus === 'out',
        isWeighted:
          p.isWeightProduct ||
          p.saleType === 'weight' ||
          p.saleType === 'both' ||
          p.unit.toLowerCase().includes('lb') ||
          p.unit.toLowerCase().includes('kg'),
        saleType: p.saleType,
      }));

      const storeSkus = new Set(storeProducts.map((p) => p.sku.toLowerCase()));
      const demoExtras = initialProducts
        .filter((ip) => !storeSkus.has(ip.sku.toLowerCase()))
        .map((ip) => ({
          id: ip.id,
          sku: ip.sku,
          barcode: ip.barcode || '',
          name: ip.name,
          price: ip.salePrice,
          cost: ip.costPrice,
          stock: ip.currentStock,
          unit: ip.unit,
          tax: ip.tax,
          image: ip.image,
          outOfStock: ip.stockStatus === 'out',
          isWeighted:
            ip.isWeightProduct ||
            ip.saleType === 'weight' ||
            ip.saleType === 'both' ||
            ip.unit.toLowerCase().includes('lb') ||
            ip.unit.toLowerCase().includes('kg'),
          saleType: ip.saleType,
        }));

      const allProds = [...storeProducts, ...demoExtras];

      const realScaleCatalog = allProds.map((p) => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        cost: p.cost,
        tax: p.tax,
        unit: p.unit || 'lb',
        barcode: p.barcode || '',
        category: '',
        image: p.image,
      }));

      // Check scale barcode parse (e.g. 2001001015004 or scale barcode)
      const scaleParsed = parseScaleBarcode(q, realScaleCatalog);
      if (scaleParsed) {
        addToCart(
          {
            id: `cart-${scaleParsed.product.productId}-${Date.now()}`,
            productId: scaleParsed.product.productId,
            name: scaleParsed.product.name,
            sku: scaleParsed.product.sku,
            price: scaleParsed.price,
            cost: scaleParsed.product.cost,
            tax: scaleParsed.product.tax,
            image: scaleParsed.product.image || '',
            unit: scaleParsed.product.unit || 'lb',
            isWeighted: true,
          },
          scaleParsed.weight
        );
        toast.success(
          `Producto balanza agregado: ${scaleParsed.product.name} (${scaleParsed.weight} ${
            scaleParsed.product.unit || 'lb'
          })`
        );
        setSearchQuery('');
        return;
      }

      const qLower = q.toLowerCase();

      let matchedProd = allProds.find(
        (p) => p.barcode.toLowerCase() === qLower || p.sku.toLowerCase() === qLower
      );

      if (!matchedProd) {
        matchedProd = allProds.find((p) => p.name.toLowerCase() === qLower);
      }

      if (!matchedProd) {
        matchedProd = allProds.find(
          (p) =>
            p.barcode.toLowerCase().includes(qLower) ||
            p.sku.toLowerCase().includes(qLower) ||
            p.name.toLowerCase().includes(qLower)
        );
      }

      if (matchedProd) {
        if (matchedProd.outOfStock && matchedProd.sku !== DELETE_SKU) {
          toast.error(`Producto agotado: ${matchedProd.name}`);
          return;
        }

        if (
          matchedProd.isWeighted ||
          matchedProd.saleType === 'weight' ||
          matchedProd.unit.toLowerCase().includes('lb') ||
          matchedProd.unit.toLowerCase().includes('kg')
        ) {
          handleOpenScale(matchedProd.id, 1.000);
          setSearchQuery('');
          return;
        }

        addToCart({
          id: `cart-${matchedProd.id}-${Date.now()}`,
          productId: matchedProd.id,
          name: matchedProd.name,
          sku: matchedProd.sku,
          price: matchedProd.price,
          cost: matchedProd.cost,
          tax: matchedProd.tax,
          image: matchedProd.image,
          unit: matchedProd.unit,
          isWeighted: false,
        });
        toast.success(`Agregado: ${matchedProd.name} (${matchedProd.sku || matchedProd.barcode})`);
        setSearchQuery('');
        return;
      }

      // 3. Search combos
      const activeCombos = combos.filter((c) => c.active);
      let matchedCombo = activeCombos.find(
        (c) => c.code.toLowerCase() === qLower || (c.barcode && c.barcode.toLowerCase() === qLower)
      );

      if (!matchedCombo) {
        matchedCombo = activeCombos.find(
          (c) =>
            c.name.toLowerCase().includes(qLower) ||
            c.code.toLowerCase().includes(qLower) ||
            (c.barcode && c.barcode.toLowerCase().includes(qLower))
        );
      }

      if (matchedCombo) {
        const stockCheck = checkComboStockAvailability(matchedCombo, 1, productosUi as any);
        if (!stockCheck.available) {
          toast.error(`Stock insuficiente para combo ${matchedCombo.name}`);
          return;
        }

        addToCart({
          id: `cart-combo-${matchedCombo.id}-${Date.now()}`,
          productId: matchedCombo.id,
          name: matchedCombo.name,
          sku: matchedCombo.code,
          price: matchedCombo.price,
          cost: Math.round(matchedCombo.normalPrice * 0.7),
          tax: matchedCombo.applyTax ? 18 : 0,
          image: matchedCombo.image || '',
          unit: 'Combo',
          isCombo: true,
          comboId: matchedCombo.id,
          comboItems: matchedCombo.items,
        });
        toast.success(`Combo agregado: ${matchedCombo.name}`);
        setSearchQuery('');
        return;
      }

      toast.error(`No se encontró producto ni combo con SKU o código: "${q}"`);
    },
    [addToCart, handleOpenScale, productosUi, combos]
  );

  useEffect(() => {
    let scanBuffer = '';
    let lastKeyTime = Date.now();

    const onGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isModalOrOtherInput =
        (target.tagName === 'INPUT' && target.id !== 'pos-barcode-search-input') ||
        target.tagName === 'TEXTAREA';

      if (e.key === 'F6') {
        e.preventDefault();
        setPreferredPayMethod('cash');
        setPaymentOpen(true);
        return;
      }
      if (e.key === 'F7') {
        e.preventDefault();
        setPreferredPayMethod('card');
        setPaymentOpen(true);
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setPreferredPayMethod('transfer');
        setPaymentOpen(true);
        return;
      }
      if (e.key === 'F5') {
        e.preventDefault();
        setPreferredPayMethod('split');
        setPaymentOpen(true);
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        setPaymentOpen((prev) => !prev);
        return;
      }
      if (e.key === 'F12' && orderCompleted) {
        e.preventDefault();
        let closed = false;
        const finish = () => {
          if (closed) return;
          closed = true;
          clearCart();
          setPaymentOpen(false);
        };
        window.addEventListener('afterprint', finish, { once: true });
        window.print();
        window.setTimeout(finish, 1200);
        return;
      }
      if (e.key === 'F2' && orderCompleted) {
        e.preventDefault();
        clearCart();
        setPaymentOpen(false);
        return;
      }
      if (e.key === 'Escape' && paymentOpen) {
        e.preventDefault();
        setPaymentOpen(false);
        return;
      }

      // Ignore scans if user is editing inside another text field/modal
      if (isModalOrOtherInput) return;

      const now = Date.now();
      if (now - lastKeyTime > 80) {
        scanBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (scanBuffer.trim().length >= 2) {
          e.preventDefault();
          handleSearchSubmit(scanBuffer);
          scanBuffer = '';
          const searchInput = document.getElementById('pos-barcode-search-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.value = '';
          }
        }
        scanBuffer = '';
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        scanBuffer += e.key;
      }
    };

    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [handleSearchSubmit, orderCompleted, paymentOpen, clearCart]);

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
    initialMethod: preferredPayMethod,
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
            onEditWeight={(item) => handleOpenScale(item.productId, item.qty)}
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
            onSearchSubmit={handleSearchSubmit}
          />
        </div>

        {/* Right Column: Products Catalog (42% / 5 cols) */}
        <div className="lg:col-span-5 flex flex-col overflow-hidden h-full">
          <ProductPanel
            onAddToCart={addToCart}
            onOpenScale={handleOpenScale}
            awaitingDelete={awaitingDeleteScan}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      </div>

      {/* Bottom Bar: Supermarket Sticky Payment Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-3 mt-3 flex-shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left Action Shortcuts */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => {
              if (cart.length === 0) {
                toast.error('Agrega productos para crear una preventa');
                return;
              }
              setHoldOpen(true);
              toast.info('Guarda la preventa como venta suspendida');
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            <FileText size={15} className="text-sky-500" />
            <span>Preventa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              void (async () => {
                if (cart.length === 0) {
                  toast.error('Agrega productos para crear una cotización');
                  return;
                }
                try {
                  const cot = await crearCotizacion({
                    cliente_id: selectedCustomer?.id ?? null,
                    vendedor_id: user?.id ?? null,
                    subtotal,
                    monto_impuesto: taxTotal,
                    monto_total: total,
                    items: cart.map((item) => ({
                      producto_id: item.isCombo ? null : item.productId,
                      nombre_item: item.name,
                      precio_unitario: item.price,
                      cantidad: item.qty,
                      subtotal: item.price * item.qty * (1 - item.discount / 100),
                    })),
                  });
                  toast.success(`Cotización ${cot.codigo} creada`);
                  navigate('/sales');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'No se pudo crear la cotización');
                }
              })();
            }}
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
            onClick={() => {
              if (cart.length === 0) {
                toast.error('El carrito está vacío');
                return;
              }
              if (!selectedCustomer) {
                toast.error('Selecciona un cliente para venta a crédito');
                return;
              }
              setPreferredPayMethod('credit');
              setPaymentOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            <CheckCircle size={15} className="text-indigo-500" />
            <span>Venta a crédito</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPreferredPayMethod('card');
              setPaymentOpen(true);
            }}
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

          {/* Factura Fiscal Button - Located strictly between Efectivo and Cancelar */}
          <button
            type="button"
            onClick={() => {
              const next = !fiscalEnabled;
              setFiscalEnabled(next);
              if (next) {
                toast.info('Factura Fiscal (NCF) activada para esta venta', {
                  description: 'Se solicitarán los datos del comprobante fiscal al cobrar.',
                });
              } else {
                toast.info('Factura Fiscal desactivada');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs shadow-sm transition-all active:scale-95 border ${
              fiscalEnabled
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-500/20 shadow-md ring-2 ring-indigo-400/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={fiscalEnabled ? 'Factura Fiscal NCF Activada — Clic para desactivar' : 'Factura Fiscal NCF Desactivada — Clic para activar'}
          >
            <FileText size={16} className={fiscalEnabled ? 'text-white animate-bounce' : 'text-indigo-600 dark:text-indigo-400'} />
            <span>Factura Fiscal</span>
            <span className={`px-1.5 py-0.5 text-[9px] rounded font-black uppercase tracking-wider ${
              fiscalEnabled ? 'bg-white/20 text-white shadow-2xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {fiscalEnabled ? 'ON' : 'OFF'}
            </span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className={`w-full ${
              orderCompleted ? 'max-w-4xl' : 'max-w-2xl'
            } bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[94vh] flex flex-col transition-all duration-300`}
          >
            <PaymentPanel {...paymentProps} onClose={() => setPaymentOpen(false)} />
          </div>
        </div>
      )}

      {expenseOpen && (
        <PosExpenseModal
          onClose={() => setExpenseOpen(false)}
          cajaId={String(activeCashId)}
          cashierLabel={activeCash.label}
        />
      )}
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
          onSelect={(id) => {
            const target = registers.find((c) => c.id === id);
            if (!isAdminUser && target?.isAdminBox) {
              toast.error('Solo el administrador puede entrar a la caja principal');
              return;
            }
            setActiveCashId(id);
          }}
          onClose={() => setCashSwitchOpen(false)}
        />
      )}
      {registerDetailsOpen && (
        <RegisterDetailsModal
          onClose={() => setRegisterDetailsOpen(false)}
          cajaId={String(activeCashId)}
          cajaLabel={activeCash.label}
          includeUserSales={isAdminUser}
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
