import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { ShoppingBag, RotateCcw, Plus, Search, Filter, Download, Eye, Edit2, Trash2, X, PackagePlus, Check, CheckCircle2, ShoppingCart, Minus } from 'lucide-react';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { getStoredProducts, updateProductStockInStore, updateProductPurchaseDataInStore, ProductItem } from '@/lib/productStore';
import { toast } from 'sonner';

interface Purchase {
  id: number;
  code: string;
  supplier: string;
  date: string;
  items: number;
  subtotal: number;
  tax: number;
  total: number;
  status: 'received' | 'pending' | 'partial';
  payment: string;
}

interface ReturnItem {
  id: number;
  code: string;
  purchaseCode: string;
  supplier: string;
  date: string;
  total: number;
  reason: string;
  status: 'approved' | 'pending';
}

export interface PurchaseLineItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  qty: number;
  price: number; // Cost Price
  salePrice: number; // Sale Price
  taxPercent: number;
}

const mockPurchases: Purchase[] = [
  { id: 1, code: 'OC-001', supplier: 'Distribuidora Nacional S.A.', date: '2024-01-15', items: 12, subtotal: 45000, tax: 8100, total: 53100, status: 'received', payment: 'Transferencia' },
  { id: 2, code: 'OC-002', supplier: 'Importadora del Caribe', date: '2024-01-14', items: 5, subtotal: 18500, tax: 3330, total: 21830, status: 'pending', payment: 'Crédito' },
  { id: 3, code: 'OC-003', supplier: 'Alimentos Frescos RD', date: '2024-01-13', items: 28, subtotal: 32000, tax: 5760, total: 37760, status: 'received', payment: 'Efectivo' },
  { id: 4, code: 'OC-004', supplier: 'Bebidas y Más', date: '2024-01-12', items: 8, subtotal: 12000, tax: 2160, total: 14160, status: 'partial', payment: 'Cheque' },
  { id: 5, code: 'OC-005', supplier: 'Distribuidora Nacional S.A.', date: '2024-01-10', items: 20, subtotal: 67000, tax: 12060, total: 79060, status: 'received', payment: 'Transferencia' },
];

const mockReturns: ReturnItem[] = [
  { id: 1, code: 'DEV-001', purchaseCode: 'OC-001', supplier: 'Distribuidora Nacional S.A.', date: '2024-01-16', total: 3500, reason: 'Productos dañados', status: 'approved' },
  { id: 2, code: 'DEV-002', purchaseCode: 'OC-003', supplier: 'Alimentos Frescos RD', date: '2024-01-14', total: 1200, reason: 'Fecha de vencimiento próxima', status: 'pending' },
];

type Tab = 'list' | 'returns';

const statusMap = {
  received: { label: 'Recibido', cls: 'badge-success' },
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  partial: { label: 'Parcial', cls: 'badge-info' },
  approved: { label: 'Aprobado', cls: 'badge-success' },
};

function nextPurchaseInvoice() {
  const seq = String(Date.now()).slice(-3);
  return `FAC-COMP-${seq}`;
}

export default function PurchasesPage() {
  const [tab, setTab] = useState<Tab>('list');
  const [purchasesList, setPurchasesList] = useState<Purchase[]>(mockPurchases);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(() => nextPurchaseInvoice());
  const [supplier, setSupplier] = useState('Distribuidora Nacional S.A.');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Dynamic Purchase Items State
  const [purchaseItems, setPurchaseItems] = useState<PurchaseLineItem[]>([
    { id: '1', productId: 'prod-001', name: 'Arroz Selecto 5lb', sku: 'ARR-SEL-5LB', qty: 50, price: 210, salePrice: 285, taxPercent: 0 },
    { id: '2', productId: 'prod-002', name: 'Aceite Vegetal 1L', sku: 'ACE-VEG-1L', qty: 24, price: 140, salePrice: 195, taxPercent: 18 },
    { id: '3', productId: 'prod-005', name: 'Azúcar Blanca 5lb', sku: 'AZU-BLA-5LB', qty: 36, price: 128, salePrice: 175, taxPercent: 0 },
  ]);

  // Modal for Adding Products
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalPrice, setModalPrice] = useState<number>(0); // Precio Costo
  const [modalSalePrice, setModalSalePrice] = useState<number>(0); // Precio Venta
  const [customName, setCustomName] = useState('');
  const [lastAddedNotice, setLastAddedNotice] = useState<string | null>(null);

  const systemProducts = getStoredProducts();

  const filteredPurchases = purchasesList.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSystemProducts = systemProducts.filter(p =>
    p.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(modalSearch.toLowerCase()) ||
    p.barcode.includes(modalSearch)
  );

  // Calculations for current Purchase Form
  const subtotal = purchaseItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  const taxTotal = purchaseItems.reduce((sum, item) => {
    if (item.taxPercent > 0) {
      return sum + (item.qty * item.price * (item.taxPercent / 100));
    }
    return sum;
  }, 0);
  const grandTotal = subtotal + taxTotal;

  // Handlers for Line Items
  const handleUpdateLineQty = (id: string, qty: number) => {
    setPurchaseItems(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
  };

  const handleUpdateLinePrice = (id: string, price: number) => {
    setPurchaseItems(prev => prev.map(item => item.id === id ? { ...item, price: Math.max(0, price) } : item));
  };

  const handleUpdateLineSalePrice = (id: string, salePrice: number) => {
    setPurchaseItems(prev => prev.map(item => item.id === id ? { ...item, salePrice: Math.max(0, salePrice) } : item));
  };

  const handleRemoveLine = (id: string) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== id));
    toast.info('Producto removido de la orden');
  };

  const handleAddProductToPurchase = (shouldCloseModal = false) => {
    if (!selectedProduct && !customName.trim()) {
      toast.error('Selecciona un producto del catálogo o escribe un nombre');
      return;
    }

    if (modalQty <= 0) {
      toast.error('Ingresa una cantidad válida mayor a 0');
      return;
    }

    const itemName = selectedProduct ? selectedProduct.name : customName.trim();
    const itemCostPrice = modalPrice > 0 ? modalPrice : (selectedProduct ? (selectedProduct.costPrice || selectedProduct.salePrice) : 100);
    const itemSalePrice = modalSalePrice > 0 ? modalSalePrice : (selectedProduct ? selectedProduct.salePrice : Math.round(itemCostPrice * 1.3));

    const newItem: PurchaseLineItem = {
      id: `item-${Date.now()}`,
      productId: selectedProduct ? selectedProduct.id : `custom-${Date.now()}`,
      name: itemName,
      sku: selectedProduct ? selectedProduct.sku : `CUSTOM-${Date.now().toString().slice(-4)}`,
      qty: modalQty,
      price: itemCostPrice,
      salePrice: itemSalePrice,
      taxPercent: selectedProduct ? (selectedProduct.tax ?? 18) : 18,
    };

    setPurchaseItems(prev => [...prev, newItem]);
    
    // In-modal visual confirmation feedback
    const noticeText = `✓ Añadido: ${itemName} (${modalQty} und) — Costo: RD$ ${itemCostPrice.toLocaleString('es-DO')} | Venta: RD$ ${itemSalePrice.toLocaleString('es-DO')}`;
    setLastAddedNotice(noticeText);
    toast.success(`Añadido: ${itemName} (${modalQty} und)`);

    // Reset inputs for next product WITHOUT closing modal
    setSelectedProduct(null);
    setCustomName('');
    setModalQty(1);
    setModalPrice(0);
    setModalSalePrice(0);
    setModalSearch('');

    if (shouldCloseModal) {
      setShowProductModal(false);
    }
  };

  const handleSavePurchase = () => {
    if (purchaseItems.length === 0) {
      toast.error('Agrega al menos un producto a la compra');
      return;
    }

    // 1. Update Inventory Stock and Prices in catalog
    purchaseItems.forEach(item => {
      if (item.productId && !item.productId.startsWith('custom-')) {
        updateProductPurchaseDataInStore(item.productId, item.qty, item.price, item.salePrice);
      }
    });

    // 2. Add to purchases list
    const newPurchase: Purchase = {
      id: Date.now(),
      code: `OC-${String(purchasesList.length + 1).padStart(3, '0')}`,
      supplier,
      date: purchaseDate,
      items: purchaseItems.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      tax: taxTotal,
      total: grandTotal,
      status: 'received',
      payment: paymentMethod,
    };

    setPurchasesList(prev => [newPurchase, ...prev]);
    toast.success('Compra guardada exitosamente. Stock, precio de costo y precio de venta actualizados en catálogo.');
    setShowAddForm(false);
  };

  const handleExportPdf = () => {
    if (tab === 'list') {
      exportTableToPdf({
        title: 'Órdenes de Compra',
        filename: 'compras',
        headers: ['Orden', 'Fecha', 'Proveedor', 'Ítems', 'Subtotal', 'ITBIS', 'Total', 'Pago', 'Estado'],
        rows: filteredPurchases.map((p) => [
          p.code,
          p.date,
          p.supplier,
          p.items,
          formatMoneyPdf(p.subtotal),
          formatMoneyPdf(p.tax),
          formatMoneyPdf(p.total),
          p.payment,
          statusMap[p.status]?.label ?? p.status,
        ]),
        landscape: true,
      });
      return;
    }
    exportTableToPdf({
      title: 'Devoluciones de Compra',
      filename: 'devoluciones-compra',
      headers: ['Código', 'Orden', 'Proveedor', 'Fecha', 'Total', 'Motivo', 'Estado'],
      rows: mockReturns.map((r) => [
        r.code,
        r.purchaseCode,
        r.supplier,
        r.date,
        formatMoneyPdf(r.total),
        r.reason,
        statusMap[r.status]?.label ?? r.status,
      ]),
    });
  };

  if (showAddForm) {
    return (
      <AppLayout>
        <div className="space-y-6 slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nueva Compra</h1>
              <p className="text-sm text-muted-foreground mt-1">Registrar orden de compra y actualizar existencias</p>
            </div>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">← Volver a Compras</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Purchase General Info Header */}
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Información de la Compra</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Proveedor *</label>
                    <select
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="input-field"
                    >
                      <option value="Distribuidora Nacional S.A.">Distribuidora Nacional S.A.</option>
                      <option value="Importadora del Caribe">Importadora del Caribe</option>
                      <option value="Alimentos Frescos RD">Alimentos Frescos RD</option>
                      <option value="Bebidas y Más">Bebidas y Más</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Fecha de Compra *</label>
                    <input
                      type="date"
                      className="input-field"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Método de Pago</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input-field"
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Crédito">Crédito</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">No. Factura / Comprobante Proveedor</label>
                    <input
                      className="input-field font-mono"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="FAC-COMP-XXX"
                    />
                  </div>
                </div>
              </div>

              {/* Products Table Card */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Productos en la Compra</h3>
                    <p className="text-xs text-muted-foreground">Agrega los ítems recibidos para incrementar inventario</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLastAddedNotice(null);
                      setShowProductModal(true);
                    }}
                    className="btn-primary flex items-center gap-2 text-xs py-2 px-3.5 shadow-md"
                  >
                    <Plus size={16} />
                    Agregar producto
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold">Producto</th>
                        <th className="text-center py-2.5 px-3 text-muted-foreground font-semibold">Cantidad</th>
                        <th className="text-right py-2.5 px-3 text-muted-foreground font-semibold">Precio Costo (RD$)</th>
                        <th className="text-right py-2.5 px-3 text-muted-foreground font-semibold">Precio Venta (RD$)</th>
                        <th className="text-center py-2.5 px-3 text-muted-foreground font-semibold">Margen</th>
                        <th className="text-right py-2.5 px-3 text-muted-foreground font-semibold">Subtotal</th>
                        <th className="text-center py-2.5 px-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {purchaseItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            No has agregado ningún producto a esta compra. Haz clic en <strong>Agregar producto</strong> arriba.
                          </td>
                        </tr>
                      ) : (
                        purchaseItems.map((item) => {
                          const marginAmt = item.salePrice - item.price;
                          const marginPct = item.price > 0 ? ((marginAmt / item.price) * 100) : 0;

                          return (
                            <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="py-2.5 px-3">
                                <p className="font-bold text-foreground">{item.name}</p>
                                <p className="text-xs font-mono text-muted-foreground">{item.sku}</p>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) => handleUpdateLineQty(item.id, Number(e.target.value))}
                                  className="input-field w-20 text-center py-1 font-bold"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) => handleUpdateLinePrice(item.id, Number(e.target.value))}
                                  className="input-field w-24 text-right py-1 font-bold tabular-nums"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={item.salePrice}
                                  onChange={(e) => handleUpdateLineSalePrice(item.id, Number(e.target.value))}
                                  className="input-field w-24 text-right py-1 font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold tabular-nums ${
                                  marginAmt >= 0
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-danger-bg text-danger border border-danger/20'
                                }`}>
                                  {marginPct >= 0 ? `+${marginPct.toFixed(0)}%` : `${marginPct.toFixed(0)}%`}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-foreground tabular-nums">
                                RD$ {(item.qty * item.price).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(item.id)}
                                  className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger-bg rounded-lg transition-colors"
                                  title="Eliminar ítem"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Summary Column */}
            <div className="space-y-4">
              <div className="card p-5 space-y-3 bg-card border border-border shadow-sm">
                <h3 className="font-semibold text-foreground border-b border-border pb-2">Resumen de la Compra</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ítems Totales</span>
                  <span className="font-bold text-foreground">{purchaseItems.reduce((s, i) => s + i.qty, 0)} unidades</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold tabular-nums">RD$ {subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ITBIS Estimado (18%)</span>
                  <span className="font-bold tabular-nums">RD$ {taxTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-black text-lg text-foreground">
                  <span>Total Final</span>
                  <span className="text-primary tabular-nums">RD$ {grandTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="card p-5 space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Observaciones / Notas</h3>
                <textarea className="input-field text-xs" rows={3} placeholder="Instrucciones de entrega, detalles del proveedor..." />
              </div>

              <button
                type="button"
                onClick={handleSavePurchase}
                className="btn-primary w-full py-3 text-base font-bold shadow-md flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Guardar Compra
              </button>
            </div>
          </div>
        </div>

        {/* MODAL MEJORADO: Agregar Múltiples Productos Continuamente */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header with Added Counter */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                    <PackagePlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground text-base">Agregar Productos a la Compra</h3>
                    <p className="text-xs text-muted-foreground">Actualiza el costo y precio de venta al registrar la entrada</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-black border border-emerald-500/20">
                    <ShoppingCart size={14} />
                    <span>{purchaseItems.length} en orden</span>
                  </div>
                  <button type="button" onClick={() => setShowProductModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Toast/Notice Banner inside modal */}
              {lastAddedNotice && (
                <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-bold animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>{lastAddedNotice}</span>
                  </div>
                  <button onClick={() => setLastAddedNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-black">✕</button>
                </div>
              )}

              <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
                {/* Search Input */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Buscar Producto en Catálogo</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="text"
                      placeholder="Escribe para buscar por nombre, SKU o código..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="input-field pl-10 h-11 text-sm font-medium shadow-2xs"
                      autoFocus
                    />
                  </div>
                </div>

                {/* System Products Grid / Picker */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Productos Encontrados</p>
                  <div className="max-h-44 overflow-y-auto border border-border rounded-xl divide-y divide-border/60 bg-secondary/10 scrollbar-thin">
                    {filteredSystemProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No se encontraron productos en catálogo. Escribe un nombre abajo para agregar un ítem personalizado.
                      </div>
                    ) : (
                      filteredSystemProducts.map((p) => {
                        const isSelected = selectedProduct?.id === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProduct(p);
                              setModalPrice(p.costPrice || p.salePrice);
                              setModalSalePrice(p.salePrice);
                              setCustomName('');
                            }}
                            className={`p-3 flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-primary/15 border-l-4 border-primary text-foreground shadow-2xs'
                                : 'hover:bg-secondary/60 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="text-xs font-extrabold truncate">{p.name}</p>
                              <p className="text-[11px] font-mono text-muted-foreground">{p.sku} · Stock actual: <strong className="text-foreground">{p.currentStock}</strong> {p.unit}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-black tabular-nums text-primary">
                                Costo actual: RD$ {(p.costPrice || p.salePrice).toLocaleString()}
                              </p>
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Venta actual: RD$ {p.salePrice.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Custom Product Entry (Alternative) */}
                <div className="pt-2 border-t border-border">
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">O Crear Ítem no registrado en inventario</label>
                  <input
                    type="text"
                    placeholder="Nombre del nuevo producto o ítem personalizado..."
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      setSelectedProduct(null);
                    }}
                    className="input-field text-sm h-10"
                  />
                </div>

                {/* Quantity & Price Section */}
                <div className="bg-secondary/30 p-4 rounded-2xl border border-border space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Quantity with Increment Buttons */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Cantidad Recibida <span className="text-danger">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                          className="w-9 h-10 rounded-xl bg-secondary hover:bg-border flex items-center justify-center font-bold text-foreground"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={modalQty}
                          onChange={(e) => setModalQty(Number(e.target.value))}
                          className="input-field text-base font-black text-center h-10 flex-1 tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => setModalQty((q) => q + 1)}
                          className="w-9 h-10 rounded-xl bg-secondary hover:bg-border flex items-center justify-center font-bold text-foreground"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      {/* Quantity Preset Buttons */}
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1, 5, 10, 24, 50, 100].map((preset) => (
                          <button
                            key={`preset-${preset}`}
                            type="button"
                            onClick={() => setModalQty(preset)}
                            className="flex-1 py-0.5 text-[10px] font-bold bg-card border border-border hover:bg-primary/10 hover:text-primary rounded-lg transition-colors tabular-nums"
                          >
                            +{preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cost Price */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Precio Costo (RD$) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={modalPrice}
                        onChange={(e) => setModalPrice(Number(e.target.value))}
                        className="input-field text-base font-black text-right h-10 tabular-nums"
                      />
                      {selectedProduct && selectedProduct.costPrice > 0 && (
                        <span className="text-[10px] text-muted-foreground mt-1 block text-right font-medium">
                          Anterior: RD$ {selectedProduct.costPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Sale Price */}
                    <div>
                      <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        Precio de Venta (RD$) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={modalSalePrice}
                        onChange={(e) => setModalSalePrice(Number(e.target.value))}
                        className="input-field text-base font-black text-right h-10 tabular-nums border-emerald-500/50 focus:border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      />
                      {selectedProduct && selectedProduct.salePrice > 0 && (
                        <span className="text-[10px] text-muted-foreground mt-1 block text-right font-medium">
                          Actual tienda: RD$ {selectedProduct.salePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profit Margin Calculator & Presets */}
                  {modalPrice > 0 && (
                    <div className="bg-card p-3 rounded-xl border border-border space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-muted-foreground">Calcular Precio Venta por Margen:</span>
                        <div className="flex items-center gap-1">
                          {[20, 30, 35, 40, 50].map((pct) => (
                            <button
                              key={`margin-${pct}`}
                              type="button"
                              onClick={() => setModalSalePrice(Math.round(modalPrice * (1 + pct / 100)))}
                              className="px-2 py-0.5 text-[11px] font-extrabold bg-secondary hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md border border-border transition-colors tabular-nums"
                            >
                              +{pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Ganancia por unidad:</span>
                          <span className={`font-black tabular-nums ${modalSalePrice - modalPrice >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}>
                            RD$ {(modalSalePrice - modalPrice).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground font-medium">Margen %:</span>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-black tabular-nums ${
                            modalSalePrice - modalPrice >= 0
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-danger-bg text-danger border border-danger/30'
                          }`}>
                            {modalPrice > 0 ? (((modalSalePrice - modalPrice) / modalPrice) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live Item Total Preview */}
                  {(selectedProduct || customName) && (
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground">Importe total para esta compra:</span>
                      <span className="font-black text-base text-primary tabular-nums">
                        RD$ {(modalQty * modalPrice).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-secondary/20">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="btn-secondary text-xs px-4 py-2.5 font-bold"
                >
                  ✓ Listo / Finalizar
                </button>

                <button
                  type="button"
                  onClick={() => handleAddProductToPurchase(false)}
                  disabled={!selectedProduct && !customName.trim()}
                  className="btn-primary text-xs px-5 py-2.5 font-black flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Plus size={16} />
                  Añadir y seguir agregando
                </button>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Compras</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona órdenes de compra y devoluciones</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setInvoiceNumber(nextPurchaseInvoice());
              setPurchaseItems([
                { id: '1', productId: 'prod-001', name: 'Arroz Selecto 5lb', sku: 'ARR-SEL-5LB', qty: 50, price: 210, salePrice: 285, taxPercent: 0 },
                { id: '2', productId: 'prod-002', name: 'Aceite Vegetal 1L', sku: 'ACE-VEG-1L', qty: 24, price: 140, salePrice: 195, taxPercent: 18 },
              ]);
              setShowAddForm(true);
            }}
            className="btn-primary flex items-center gap-2 w-fit shadow-md"
          >
            <Plus size={16} />Nueva Compra
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4"><p className="text-xs text-muted-foreground">Compras del mes</p><p className="text-2xl font-bold text-foreground mt-1">RD$ 205.9K</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">Órdenes totales</p><p className="text-2xl font-bold text-info mt-1">{purchasesList.length}</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-warning mt-1">5</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">Devoluciones</p><p className="text-2xl font-bold text-danger mt-1">2</p></div>
        </div>

        <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
          {[{ id: 'list' as Tab, label: 'Lista de Compras', icon: <ShoppingBag size={16} /> }, { id: 'returns' as Tab, label: 'Devoluciones', icon: <RotateCcw size={16} /> }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="input-field pl-9" placeholder="Buscar por código o proveedor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2"><Filter size={16} />Filtrar</button>
            <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-2"><Download size={16} />Exportar PDF</button>
          </div>
        </div>

        {tab === 'list' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Proveedor</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Productos</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">ITBIS</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((p, i) => (
                    <tr key={p.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-3 font-mono text-primary font-medium">{p.code}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.supplier}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.date}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{p.items} items</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">RD$ {p.tax.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-foreground">RD$ {p.total.toLocaleString()}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className={statusMap[p.status].cls}>{statusMap[p.status].label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
              <span>Mostrando {filteredPurchases.length} de {purchasesList.length} compras</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 rounded-lg hover:bg-secondary transition-colors">Anterior</button>
                <button className="px-3 py-1 rounded-lg bg-primary text-primary-foreground">1</button>
                <button className="px-3 py-1 rounded-lg hover:bg-secondary transition-colors">Siguiente</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'returns' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Compra Ref.</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Proveedor</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Motivo</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReturns.map((r, i) => (
                    <tr key={r.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-3 font-mono text-danger font-medium">{r.code}</td>
                      <td className="px-4 py-3 font-mono text-primary">{r.purchaseCode}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.supplier}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.date}</td>
                      <td className="px-4 py-3 font-bold text-foreground">RD$ {r.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{r.reason}</td>
                      <td className="px-4 py-3"><span className={statusMap[r.status].cls}>{statusMap[r.status].label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
