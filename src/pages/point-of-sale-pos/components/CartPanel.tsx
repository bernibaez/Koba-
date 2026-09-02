import React, { useEffect, useState } from 'react';
import { Minus, Plus, Trash2, User, Search, PlusCircle, CreditCard, Info, X, Pencil, Scale } from 'lucide-react';
import type { CartItem, Customer } from './POSTerminal';
import { useClientes } from '@/hooks/useClientes';
import PosAddCustomerModal from './PosAddCustomerModal';

interface CartPanelProps {
  cart: CartItem[];
  customer: Customer | null;
  onSetCustomer: (c: Customer | null) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onUpdateDiscount: (id: string, discount: number) => void;
  onRemove: (id: string) => void;
  onEditWeight?: (item: CartItem) => void;
  onOpenWeightScan?: () => void;
  globalDiscount: number;
  onSetGlobalDiscount: (d: number) => void;
  subtotal: number;
  taxTotal: number;
  globalDiscountAmount: number;
  total: number;
  onCheckout: () => void;
  fiscalEnabled?: boolean;
  onToggleFiscal?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: (q: string) => void | Promise<boolean | void>;
}

export default function CartPanel({
  cart,
  customer,
  onSetCustomer,
  onUpdateQty,
  onRemove,
  onEditWeight,
  onOpenWeightScan,
  taxTotal,
  total,
  fiscalEnabled = false,
  onToggleFiscal,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
}: CartPanelProps) {
  const { clientes, refetch } = useClientes('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  useEffect(() => {
    setCustomers(
      clientes.map((c) => ({
        id: c.id,
        name: c.nombre,
        phone: c.telefono ?? '',
        credit: Number(c.limite_credito ?? 0),
      }))
    );
  }, [clientes]);

  const fmt = (v: number) =>
    `RD$ ${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalItemsCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (onSearchSubmit && searchQuery.trim()) {
        void onSearchSubmit(searchQuery);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 overflow-hidden">
      {/* Row 1: Customer selector + Barcode/Search input */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 flex-shrink-0">
        {/* Customer Select (Cols 5) */}
        <div className="md:col-span-5 flex items-center gap-1">
          <div className="relative flex-1">
            <User size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={customer?.id || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onSetCustomer(null);
                  return;
                }
                const found = customers.find((c) => c.id === val);
                if (found) onSetCustomer(found);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 h-10 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="">Seleccionar cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setAddCustomerOpen(true)}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-bold flex-shrink-0 transition-colors shadow-2xs"
            title="Agregar nuevo cliente"
          >
            <PlusCircle size={18} />
          </button>
        </div>

        {/* Product Search Input (Cols 7) */}
        <div className="md:col-span-7">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 pointer-events-none" />
            <input
              id="pos-barcode-search-input"
              type="text"
              placeholder="Escanear código, PLU o etiqueta de balanza / SKU / Nombre [Enter]..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full bg-slate-50 dark:bg-slate-800 border border-indigo-500 rounded-xl pl-9 pr-3 h-10 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 truncate"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Selectors bar (Factura, Precio, Consumidor Final) */}
      <div className="grid grid-cols-3 gap-2 mb-3 flex-shrink-0">
        <select defaultValue="factura" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 h-9 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <option value="factura">Factura</option>
          <option value="ticket">Ticket de caja</option>
        </select>

        <div className="flex items-center gap-1">
          <select defaultValue="predeterminado" className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 h-9 text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
            <option value="predeterminado">Precio de venta predeterminado</option>
            <option value="mayoreo">Precio de mayoreo</option>
          </select>
          <Info size={14} className="text-sky-500 flex-shrink-0 hidden sm:inline" />
        </div>

        <select defaultValue="B02" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 h-9 text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
          <option value="B02">Consumidor Final (B02)</option>
          <option value="B01">Crédito Fiscal (B01)</option>
          <option value="B15">Gubernamental (B15)</option>
          <option value="B14">Regimen Especial (B14)</option>
        </select>
      </div>

      {/* Row 3: Product Table Header */}
      <div className="bg-slate-100 dark:bg-slate-800/80 rounded-t-xl px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 text-xs font-black text-slate-800 dark:text-slate-200 flex-shrink-0">
        <div className="col-span-5 flex items-center gap-1">
          <span>Producto</span>
          <Info size={13} className="text-sky-500" />
        </div>
        <div className="col-span-3 text-center">Cantidad / Peso</div>
        <div className="col-span-3 text-right">Subtotal</div>
        <div className="col-span-1 flex items-center justify-center text-red-500">
          <X size={14} />
        </div>
      </div>

      {/* Table Body: Cart Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border-x border-b border-slate-200 dark:border-slate-700 rounded-b-xl mb-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
            <p className="text-sm font-semibold">El carrito está vacío</p>
            <p className="text-xs">Selecciona productos a la derecha o escanea un código</p>
          </div>
        ) : (
          cart.map((item) => {
            const isWeightItem = item.isWeighted || ['lb', 'kg', 'g', 'oz', 'libra'].some((u) => item.unit.toLowerCase().includes(u));
            const unitLabel = item.unit || 'lb';

            return (
              <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="col-span-5 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                  {isWeightItem ? (
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                      {item.qty} {unitLabel} × RD$ {item.price}
                    </p>
                  ) : (
                    <p className="text-[11px] font-mono text-slate-400 truncate">{item.sku}</p>
                  )}
                </div>

                <div className="col-span-3 flex items-center justify-center gap-1">
                  {isWeightItem ? (
                    <button
                      type="button"
                      onClick={() => onEditWeight && onEditWeight(item)}
                      className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-black tabular-nums transition-colors cursor-pointer flex items-center gap-1"
                      title="Haz clic para editar el peso"
                    >
                      <span>{item.qty} {unitLabel}</span>
                      <Pencil size={11} />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, item.qty - 1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-black text-xs flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={item.qty}
                        onChange={(e) => onUpdateQty(item.id, Number(e.target.value))}
                        className="w-10 h-7 text-center text-xs font-bold border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 tabular-nums focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, item.qty + 1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-black text-xs flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                    </>
                  )}
                </div>

                <div className="col-span-3 text-right">
                  <p className="text-xs sm:text-sm font-black tabular-nums text-slate-900 dark:text-white">
                    {fmt(item.price * item.qty * (1 - item.discount / 100))}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isWeightItem ? `RD$ ${item.price}/${unitLabel}` : `${fmt(item.price)} c/u`}
                  </p>
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                    title="Eliminar producto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary Footer */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex-shrink-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-black text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-3">
            <div>
              <span>Artículos: </span>
              <span className="text-indigo-600 font-black tabular-nums">{totalItemsCount.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={() => onToggleFiscal && onToggleFiscal()}
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer shadow-2xs ${
                fiscalEnabled
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-indigo-100 hover:text-indigo-700'
              }`}
              title={fiscalEnabled ? 'Comprobante Fiscal Activado — Clic para desactivar' : 'Comprobante Fiscal Desactivado — Clic para activar'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${fiscalEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{fiscalEnabled ? 'NCF Activado (DGII)' : 'Sin Comprobante Fiscal'}</span>
            </button>
          </div>

          <div>
            <span>Total: </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums text-sm">{fmt(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1">
            <span>Descuento (i) PUNTOS (-):</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-0.5"><Pencil size={10} className="text-muted-foreground inline" /> 0.00</span>
          </div>
          <div>
            ITBIS (18%) desglosado: <span className="font-bold text-slate-800 dark:text-slate-200">RD$ {taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Transporte(+): (i)</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-0.5"><Pencil size={10} className="text-muted-foreground inline" /> 0.00</span>
          </div>
        </div>
      </div>

      {addCustomerOpen && (
        <PosAddCustomerModal
          onClose={() => setAddCustomerOpen(false)}
          onCreated={async (c) => {
            await refetch();
            onSetCustomer(c);
          }}
        />
      )}
    </div>
  );
}
