import React, { useState, useEffect, useId } from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  DollarSign,
  Package,
  Layers,
  Store,
  Calendar,
  Clock,
  Check,
  RefreshCw,
  Info,
  Percent,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Combo, ComboItem, PricingMode } from '@/lib/comboStore';
import type { ProductItem } from '@/lib/productStore';
import { obtenerProductos, productoAUi } from '@/services/productos.service';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { toast } from 'sonner';

interface ComboFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (combo: Combo) => void;
  editingCombo?: Combo | null;
}

const CATEGORIES = [
  'Desayunos & Ofertas',
  'Despensa',
  'Hogar & Limpieza',
  'Meriendas',
  'Carnes & Asados',
  'Bebidas & Licores',
  'Paquete Escolar',
  'Promocional Especial',
];

const BRANCHES_LIST = [
  'Sucursal Principal',
  'Sucursal Norte',
  'Sucursal Este',
  'Sucursal Sur',
];

const PRESET_IMAGES = [
  { label: 'Desayuno', url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&h=200&fit=crop' },
  { label: 'Granos', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop' },
  { label: 'Limpieza', url: 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=200&h=200&fit=crop' },
  { label: 'Snacks', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop' },
  { label: 'Carnes', url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&h=200&fit=crop' },
  { label: 'Bebidas', url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop' },
];

export default function ComboFormModal({
  isOpen,
  onClose,
  onSave,
  editingCombo,
}: ComboFormModalProps) {
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const formId = useId();

  // Card 1: General
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [image, setImage] = useState(PRESET_IMAGES[0].url);

  // Card 2: Items
  const [items, setItems] = useState<ComboItem[]>([]);
  const [selectedProdId, setSelectedProdId] = useState('');

  // Card 3: Pricing
  const [discountType, setDiscountType] = useState<PricingMode>('fixed');
  const [priceInput, setPriceInput] = useState<number>(0);
  const [percentInput, setPercentInput] = useState<number>(10);
  const [amountInput, setAmountInput] = useState<number>(50);

  // Card 4: Config
  const [active, setActive] = useState(true);
  const [visibleInPos, setVisibleInPos] = useState(true);
  const [allowSaleWithoutStock, setAllowSaleWithoutStock] = useState(false);
  const [applyTax, setApplyTax] = useState(false);
  const [allBranches, setAllBranches] = useState(true);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(BRANCHES_LIST);

  // Card 5: Vigencia
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)
  );
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('22:00');

  // Search & Filter for adding products
  const [prodSearchTerm, setProdSearchTerm] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await obtenerProductos({ pagina: 1, limite: 500, estado: 'activo' });
        if (alive) setAvailableProducts(res.datos.map(productoAUi) as ProductItem[]);
      } catch {
        if (alive) setAvailableProducts([]);
      }
    })();

    if (editingCombo) {
      setName(editingCombo.name);
      setCode(editingCombo.code);
      setBarcode(editingCombo.barcode);
      setDescription(editingCombo.description);
      setCategory(editingCombo.category || CATEGORIES[0]);
      setImage('');
      setItems(editingCombo.items || []);
      setDiscountType(editingCombo.discountType || 'fixed');
      setPriceInput(editingCombo.price || 0);
      setPercentInput(editingCombo.discountValue || 10);
      setAmountInput(editingCombo.discountValue || 50);
      setActive(editingCombo.active);
      setVisibleInPos(editingCombo.visibleInPos);
      setAllowSaleWithoutStock(editingCombo.allowSaleWithoutStock);
      setApplyTax(editingCombo.applyTax);
      setAllBranches(editingCombo.allBranches);
      setSelectedBranches(editingCombo.branches || BRANCHES_LIST);
      setStartDate(editingCombo.startDate || new Date().toISOString().slice(0, 10));
      setEndDate(editingCombo.endDate || new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10));
      setStartTime(editingCombo.startTime || '06:00');
      setEndTime(editingCombo.endTime || '22:00');
    } else {
      // Reset defaults for creation
      const randomCode = `CMB-${Math.floor(100 + Math.random() * 900)}`;
      const randomBar = `${Math.floor(7892000000000 + Math.random() * 999999999)}`;
      setName('');
      setCode(randomCode);
      setBarcode(randomBar);
      setDescription('');
      setCategory(CATEGORIES[0]);
      setImage('');
      setItems([]);
      setDiscountType('fixed');
      setPriceInput(0);
      setPercentInput(10);
      setAmountInput(50);
      setActive(true);
      setVisibleInPos(true);
      setAllowSaleWithoutStock(false);
      setApplyTax(false);
      setAllBranches(true);
      setSelectedBranches(BRANCHES_LIST);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate(new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10));
      setStartTime('06:00');
      setEndTime('22:00');
    }

    return () => {
      alive = false;
    };
  }, [editingCombo, isOpen]);

  // Real-time calculations
  const normalPrice = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);

  let finalPrice = 0;
  if (discountType === 'fixed') {
    finalPrice = priceInput;
  } else if (discountType === 'percent') {
    finalPrice = Math.max(0, normalPrice * (1 - percentInput / 100));
  } else if (discountType === 'amount') {
    finalPrice = Math.max(0, normalPrice - amountInput);
  }

  const savingsAmount = Math.max(0, normalPrice - finalPrice);
  const savingsPercent = normalPrice > 0 ? (savingsAmount / normalPrice) * 100 : 0;
  const profitMargin = finalPrice > 0 ? ((finalPrice - totalCost) / finalPrice) * 100 : 0;

  const prodCategoriesList = Array.from(new Set(availableProducts.map((p) => p.category))).filter(Boolean);

  const filteredAvailableProducts = availableProducts.filter((p) => {
    const matchSearch =
      !prodSearchTerm.trim() ||
      p.name.toLowerCase().includes(prodSearchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(prodSearchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(prodSearchTerm.toLowerCase()) ||
      p.barcode.includes(prodSearchTerm);

    const matchCat = prodCategoryFilter === 'all' || p.category === prodCategoryFilter;
    return matchSearch && matchCat;
  });

  // Handlers for Items
  const addSpecificProductToCombo = (prod: ProductItem) => {
    if (items.some((i) => i.productId === prod.id)) {
      toast.warning(`"${prod.name}" ya está en el combo. Puedes incrementar su cantidad en la tabla.`);
      return;
    }

    const newItem: ComboItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
      quantity: 1,
      unitPrice: prod.salePrice,
      costPrice: prod.costPrice,
      subtotal: prod.salePrice * 1,
    };

    const updated = [...items, newItem];
    setItems(updated);
    toast.success(`✓ "${prod.name}" agregado al combo`);

    if (priceInput === 0 && discountType === 'fixed') {
      const newNormal = updated.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      setPriceInput(Math.round(newNormal * 0.9));
    }
  };

  const handleAddItem = () => {
    if (!selectedProdId) {
      toast.error('Selecciona un producto para agregar');
      return;
    }
    const prod = availableProducts.find((p) => p.id === selectedProdId);
    if (prod) addSpecificProductToCombo(prod);
    setSelectedProdId('');
  };

  const handleUpdateItemQty = (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, quantity: newQty, subtotal: i.unitPrice * newQty } : i
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleGenerateBarcode = () => {
    setBarcode(`${Math.floor(7892000000000 + Math.random() * 999999999)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del combo es obligatorio');
      return;
    }
    if (!code.trim()) {
      toast.error('El código interno es obligatorio');
      return;
    }
    if (items.length === 0) {
      toast.error('Debes agregar al menos un producto al combo');
      return;
    }

    const comboToSave: Combo = {
      id: editingCombo ? editingCombo.id : `cmb-${Date.now()}`,
      name: name.trim(),
      code: code.trim(),
      barcode: barcode.trim() || code.trim(),
      description: description.trim(),
      category,
      price: Math.round(finalPrice),
      totalCost: Math.round(totalCost),
      normalPrice: Math.round(normalPrice),
      discountType,
      discountValue:
        discountType === 'fixed'
          ? priceInput
          : discountType === 'percent'
          ? percentInput
          : amountInput,
      savingsAmount: Math.round(savingsAmount),
      savingsPercent: Number(savingsPercent.toFixed(2)),
      marginPercent: Number(profitMargin.toFixed(2)),
      active,
      visibleInPos,
      allowSaleWithoutStock,
      applyTax,
      allBranches,
      branches: allBranches ? BRANCHES_LIST : selectedBranches,
      startDate,
      endDate,
      startTime,
      endTime,
      image,
      items,
      createdAt: editingCombo ? editingCombo.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      salesCount: editingCombo ? editingCombo.salesCount : 0,
    };

    onSave(comboToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {editingCombo ? 'Editar Combo' : 'Crear Nuevo Combo'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configura los productos componentes, precios y vigencia del combo
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="btn-secondary">
          ← Volver a Combos
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
          {/* CARD 1: INFORMACIÓN GENERAL */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Info size={18} className="text-primary" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                1. Información General
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-name`} className="text-xs font-bold text-muted-foreground mb-1 block">
                  Nombre del Combo *
                </label>
                <input
                  id={`${formId}-name`}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Combo Desayuno Familiar"
                  className="input-field text-sm font-semibold"
                />
              </div>

              <div>
                <label htmlFor={`${formId}-category`} className="text-xs font-bold text-muted-foreground mb-1 block">
                  Categoría
                </label>
                <select
                  id={`${formId}-category`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field text-sm font-semibold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`${formId}-code`} className="text-xs font-bold text-muted-foreground mb-1 block">
                  Código Interno *
                </label>
                <input
                  id={`${formId}-code`}
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej. CMB-001"
                  className="input-field text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label htmlFor={`${formId}-barcode`} className="text-xs font-bold text-muted-foreground mb-1 block">
                  Código de Barras
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`${formId}-barcode`}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="7892000100101"
                    className="input-field text-sm font-mono font-bold flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="btn-secondary text-xs font-bold p-2.5 flex items-center gap-1"
                    title="Generar código aleatorio"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-description`} className="text-xs font-bold text-muted-foreground mb-1 block">
                Descripción del Combo
              </label>
              <textarea
                id={`${formId}-description`}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción del contenido o promoción del combo..."
                className="input-field text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                Icono Representativo del Combo
              </label>
              <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl border border-border/60">
                <CategoryIcon category={category} name={name} isCombo size="lg" />
                <div>
                  <span className="text-xs font-bold text-foreground block">Icono por categoría</span>
                  <span className="text-[11px] text-muted-foreground block">Icono visual asignado a "{category || 'Combo'}"</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: PRODUCTOS DEL COMBO */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-primary" />
                <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                  2. Productos del Combo
                </h3>
              </div>
              <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
                {items.length} Componente{items.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Interactive Product Search & Quick-Add List */}
            <div className="space-y-3 p-4 bg-secondary/30 rounded-2xl border border-border/60">
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre (ej. arroz, aceite), SKU o categoría..."
                    value={prodSearchTerm}
                    onChange={(e) => setProdSearchTerm(e.target.value)}
                    className="input-field pl-10 h-10 text-xs font-bold w-full"
                  />
                </div>

                <select
                  aria-label="Filtrar por categoría"
                  value={prodCategoryFilter}
                  onChange={(e) => setProdCategoryFilter(e.target.value)}
                  className="input-field h-10 text-xs font-bold w-full sm:w-auto"
                >
                  <option value="all">Todas las Categorías ({availableProducts.length})</option>
                  {prodCategoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Matching Products List */}
              <div className="max-h-48 overflow-y-auto scrollbar-thin border border-border/60 rounded-xl divide-y divide-border/60 bg-card">
                {filteredAvailableProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No se encontraron productos coincidentes con "{prodSearchTerm}"
                  </div>
                ) : (
                  filteredAvailableProducts.map((p) => {
                    const isAdded = items.some((i) => i.productId === p.id);
                    return (
                      <div key={p.id} className="p-2.5 flex items-center justify-between hover:bg-secondary/40 transition-colors gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CategoryIcon category={p.category} name={p.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-xs truncate">{p.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {p.sku} | Costo: RD$ {p.costPrice} | Venta: RD$ {p.salePrice} | Stock: {p.currentStock} {p.unit}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => addSpecificProductToCombo(p)}
                          disabled={isAdded}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-colors flex-shrink-0 ${
                            isAdded
                              ? 'bg-emerald-500/10 text-emerald-600 cursor-not-allowed border border-emerald-500/20'
                              : 'btn-primary shadow-2xs'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 size={13} /> Agregado
                            </>
                          ) : (
                            <>
                              <Plus size={13} /> Agregar
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-border/70 rounded-xl text-center text-muted-foreground text-xs font-semibold">
                No has agregado productos a este combo todavía. Usa el selector arriba para añadir productos.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 text-muted-foreground font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Código</th>
                      <th className="p-3 text-center">Stock Disp.</th>
                      <th className="p-3 text-center">Cantidad</th>
                      <th className="p-3 text-right">Costo Unit.</th>
                      <th className="p-3 text-right">Venta Unit.</th>
                      <th className="p-3 text-right">Subtotal Costo</th>
                      <th className="p-3 text-right">Subtotal Venta</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {items.map((item) => {
                      const prod = availableProducts.find((p) => p.id === item.productId || p.sku === item.sku);
                      const currentStock = prod ? prod.currentStock : 0;
                      return (
                        <tr key={item.id} className="hover:bg-secondary/20">
                          <td className="p-3 font-extrabold text-foreground">{item.name}</td>
                          <td className="p-3 font-mono text-muted-foreground">{item.sku}</td>
                          <td className="p-3 text-center font-bold">
                            <span className={currentStock < item.quantity ? 'text-danger font-black' : 'text-emerald-600'}>
                              {currentStock}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQty(item.id, parseInt(e.target.value, 10) || 1)}
                              className="w-16 input-field text-center font-bold text-xs p-1"
                            />
                          </td>
                          <td className="p-3 text-right font-semibold text-muted-foreground">RD$ {item.costPrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">RD$ {item.unitPrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-slate-600 dark:text-slate-300">
                            RD$ {(item.costPrice * item.quantity).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-black text-foreground">
                            RD$ {item.subtotal.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-muted-foreground hover:text-danger rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-secondary/40 font-extrabold border-t border-border/80 text-xs">
                    <tr>
                      <td colSpan={6} className="p-3 text-right uppercase tracking-wider text-muted-foreground">
                        Totales Componentes (Costo vs Venta Normal):
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-200">
                        RD$ {totalCost.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-black text-foreground">
                        RD$ {normalPrice.toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* CARD 3: PRECIO Y DESCUENTO */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <DollarSign size={18} className="text-primary" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                3. Precio de Costo, Precio de Venta y Margen del Combo
              </h3>
            </div>

            {/* Pricing Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={`p-3 rounded-xl border font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                  discountType === 'fixed'
                    ? 'bg-primary/10 border-primary text-primary shadow-xs'
                    : 'bg-secondary/40 border-border/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <DollarSign size={18} />
                <span>Precio Venta Fijo Directo</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`p-3 rounded-xl border font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                  discountType === 'percent'
                    ? 'bg-primary/10 border-primary text-primary shadow-xs'
                    : 'bg-secondary/40 border-border/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Percent size={18} />
                <span>% Descuento s/Venta Normal</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscountType('amount')}
                className={`p-3 rounded-xl border font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                  discountType === 'amount'
                    ? 'bg-primary/10 border-primary text-primary shadow-xs'
                    : 'bg-secondary/40 border-border/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles size={18} />
                <span>Monto Descuento en RD$</span>
              </button>
            </div>

            {/* Inputs & Cost/Sale Breakdown */}
            <div className="space-y-4 bg-secondary/30 p-4 rounded-xl border border-border/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cost Price Info */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">
                    Precio Costo (RD$)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={`RD$ ${totalCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
                      className="input-field text-base font-black bg-secondary/60 cursor-not-allowed text-foreground"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block font-medium">
                      Suma del costo de adquisición de los componentes
                    </span>
                  </div>
                </div>

                {/* Sale Price Input */}
                {discountType === 'fixed' && (
                  <div>
                    <label htmlFor={`${formId}-price-fixed`} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">
                      Precio de Venta (RD$) *
                    </label>
                    <input
                      id={`${formId}-price-fixed`}
                      type="number"
                      min={0}
                      step={1}
                      value={priceInput}
                      onChange={(e) => setPriceInput(parseFloat(e.target.value) || 0)}
                      className="input-field text-base font-black text-emerald-600 dark:text-emerald-400 border-emerald-500/40 focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block font-medium">
                      Precio de venta final que pagará el cliente
                    </span>
                  </div>
                )}

                {discountType === 'percent' && (
                  <div>
                    <label htmlFor={`${formId}-price-percent`} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">
                      Porcentaje de Descuento (%)
                    </label>
                    <input
                      id={`${formId}-price-percent`}
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={percentInput}
                      onChange={(e) => setPercentInput(parseFloat(e.target.value) || 0)}
                      className="input-field text-base font-black text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block font-medium">
                      Precio de Venta calculado: RD$ {finalPrice.toFixed(2)}
                    </span>
                  </div>
                )}

                {discountType === 'amount' && (
                  <div>
                    <label htmlFor={`${formId}-price-amount`} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">
                      Monto de Descuento en RD$
                    </label>
                    <input
                      id={`${formId}-price-amount`}
                      type="number"
                      min={0}
                      step={5}
                      value={amountInput}
                      onChange={(e) => setAmountInput(parseFloat(e.target.value) || 0)}
                      className="input-field text-base font-black text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block font-medium">
                      Precio de Venta calculado: RD$ {finalPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Real-time Financial Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-border/50">
                <div className="bg-card p-3 rounded-xl border border-border/80">
                  <span className="text-[10px] text-muted-foreground font-bold block uppercase">Precio Costo</span>
                  <span className="font-extrabold text-foreground text-sm">RD$ {totalCost.toFixed(2)}</span>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border/80">
                  <span className="text-[10px] text-emerald-600 font-bold block uppercase">Precio de Venta</span>
                  <span className="font-black text-emerald-600 text-sm">RD$ {finalPrice.toFixed(2)}</span>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border/80">
                  <span className="text-[10px] text-purple-600 font-bold block uppercase">Ganancia Neta</span>
                  <span className="font-extrabold text-purple-600 text-sm">
                    RD$ {(finalPrice - totalCost).toFixed(2)}
                  </span>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border/80">
                  <span className="text-[10px] text-purple-600 font-bold block uppercase">Margen Ganancia %</span>
                  <span className="font-extrabold text-purple-600 text-sm">{profitMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: CONFIGURACIÓN */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Store size={18} className="text-primary" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                4. Configuración & Sucursales
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60 cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-foreground block">☑ Activo</span>
                  <span className="text-[11px] text-muted-foreground">Habilitar combo en el sistema</span>
                </div>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60 cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-foreground block">☑ Visible en POS</span>
                  <span className="text-[11px] text-muted-foreground">Mostrar botón en Terminal POS</span>
                </div>
                <input
                  type="checkbox"
                  checked={visibleInPos}
                  onChange={(e) => setVisibleInPos(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60 cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-foreground block">☑ Permitir venta sin stock</span>
                  <span className="text-[11px] text-muted-foreground">Permitir vender aun sin existencias</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowSaleWithoutStock}
                  onChange={(e) => setAllowSaleWithoutStock(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60 cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-foreground block">☑ Aplicar ITBIS / Impuestos</span>
                  <span className="text-[11px] text-muted-foreground">Calcular impuesto en la venta</span>
                </div>
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Branches Configuration */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60 cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-foreground block">☑ Disponible en todas las sucursales</span>
                  <span className="text-[11px] text-muted-foreground">Habilita este combo universalmente</span>
                </div>
                <input
                  type="checkbox"
                  checked={allBranches}
                  onChange={(e) => setAllBranches(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </label>

              {!allBranches && (
                <div className="p-3 bg-secondary/20 rounded-xl border border-border/60 space-y-2">
                  <span className="text-xs font-bold text-muted-foreground block">Seleccionar Sucursales:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {BRANCHES_LIST.map((b) => (
                      <label key={b} className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBranches.includes(b)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBranches((prev) => [...prev, b]);
                            } else {
                              setSelectedBranches((prev) => prev.filter((item) => item !== b));
                            }
                          }}
                          className="w-4 h-4 accent-primary rounded"
                        />
                        {b}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARD 5: VIGENCIA */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Calendar size={18} className="text-primary" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                5. Vigencia y Horario
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor={`${formId}-start-date`} className="text-xs font-bold text-muted-foreground mb-1 block">
                  Fecha Inicio
                </label>
                <input
                  id={`${formId}-start-date`}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field text-xs font-semibold"
                />
              </div>

              <div>
                <label htmlFor={`${formId}-end-date`} className="text-xs font-bold text-muted-foreground mb-1 block">
                  Fecha Fin
                </label>
                <input
                  id={`${formId}-end-date`}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field text-xs font-semibold"
                />
              </div>

              <div>
                <label htmlFor={`${formId}-start-time`} className="text-xs font-bold text-muted-foreground mb-1 block">
                  Hora Inicio
                </label>
                <input
                  id={`${formId}-start-time`}
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field text-xs font-semibold"
                />
              </div>

              <div>
                <label htmlFor={`${formId}-end-time`} className="text-xs font-bold text-muted-foreground mb-1 block">
                  Hora Fin
                </label>
                <input
                  id={`${formId}-end-time`}
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary text-xs font-bold">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary text-sm font-black px-6 py-2.5 flex items-center gap-2 shadow-md shadow-primary/20"
            >
              <Check size={18} />
              {editingCombo ? 'Guardar Cambios' : 'Crear Combo'}
            </button>
          </div>
        </form>
    </div>
  );
}
