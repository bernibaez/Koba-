import React, { useState, useEffect, useMemo } from 'react';
import { Search, Scale, Boxes, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CartItem } from './POSTerminal';
import { DELETE_SKU } from '@/lib/posStore';
import { checkComboStockAvailability, type Combo } from '@/lib/comboStore';
import ComboStockAlertModal from '@/pages/combos/components/ComboStockAlertModal';
import { toast } from 'sonner';
import { scaleProducts } from '../utils/scaleUtils';
import { useProductos } from '@/hooks/useProductos';
import { useCombos } from '@/hooks/useCombos';

import CategoryIcon from '@/components/ui/CategoryIcon';
import WeightBadge from '@/components/weight/WeightBadge';
import MixedSaleTypeModal from '@/components/weight/MixedSaleTypeModal';
import type { SaleType, WeightUnit } from '@/types/database';

interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  tax: number;
  image: string;
  lowStock: boolean;
  outOfStock: boolean;
  isWeighted?: boolean;
  saleType?: SaleType;
  weightUnit?: WeightUnit;
  pricePerWeight?: number;
  minWeight?: number;
  maxWeight?: number;
  allowDecimal?: boolean;
}

const categories = [
  { id: 'cat-all', label: 'Todos' },
  { id: 'cat-combos', label: 'Combos & Ofertas' },
  { id: 'cat-lacteos', label: 'Lácteos' },
  { id: 'cat-carnes', label: 'Carnes' },
  { id: 'cat-granos', label: 'Granos' },
  { id: 'cat-bebidas', label: 'Bebidas' },
  { id: 'cat-limpieza', label: 'Limpieza' },
  { id: 'cat-panaderia', label: 'Panadería' },
  { id: 'cat-frutas', label: 'Frutas' },
  { id: 'cat-snacks', label: 'Snacks' },
];

interface ProductPanelProps {
  onAddToCart: (product: Omit<CartItem, 'qty' | 'discount'>, qty?: number) => void;
  onOpenScale?: (productId?: string, weight?: number) => void;
  awaitingDelete?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function ProductPanel({ onAddToCart, onOpenScale, searchQuery }: ProductPanelProps) {
  const [search, setSearch] = useState('');
  const activeSearch = searchQuery !== undefined ? searchQuery : search;
  const [activeCategory, setActiveCategory] = useState('cat-all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertComboName, setAlertComboName] = useState('');
  const [missingItems, setMissingItems] = useState<{ productId: string; sku: string; name: string; required: number; available: number }[]>([]);

  // State for Mixed Sale Type Modal
  const [mixedProduct, setMixedProduct] = useState<Product | null>(null);

  const { productosUi } = useProductos({ pagina: 1, limite: 200, busqueda: activeSearch, estado: 'activo' });
  const { combos } = useCombos(true);

  const products: Product[] = useMemo(() => {
    const fromStore = productosUi.map(
      (p): Product => {
        const isWeight = p.isWeightProduct || p.saleType === 'weight' || p.saleType === 'both' || p.unit.toLowerCase().includes('lb') || p.unit.toLowerCase().includes('kg');
        return {
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          category: p.category,
          price: p.salePrice,
          cost: p.costPrice,
          stock: p.currentStock,
          unit: p.unit,
          tax: p.tax,
          image: p.image,
          lowStock: p.stockStatus === 'low',
          outOfStock: p.stockStatus === 'out',
          isWeighted: isWeight,
          saleType: p.saleType ?? (isWeight ? 'weight' : 'unit'),
          weightUnit: p.weightUnit ?? 'lb',
          pricePerWeight: p.pricePerWeight ?? p.salePrice,
          minWeight: p.minWeight ?? 0.01,
          maxWeight: p.maxWeight ?? 999.99,
          allowDecimal: p.allowDecimal ?? true,
        };
      }
    );
    const weightedExtras = scaleProducts
      .filter((sp) => !fromStore.some((p) => p.sku === sp.sku))
      .map((sp) => ({
        id: sp.productId,
        sku: sp.sku,
        barcode: sp.barcode,
        name: sp.name,
        category: sp.category || 'Carnes',
        price: sp.price,
        cost: sp.cost,
        stock: 85,
        unit: sp.unit,
        tax: sp.tax,
        image: sp.image || '',
        lowStock: false,
        outOfStock: false,
        isWeighted: true,
        saleType: 'weight' as SaleType,
        weightUnit: 'lb' as WeightUnit,
        pricePerWeight: sp.price,
      }));
    return [...fromStore, ...weightedExtras];
  }, [productosUi]);

  // Reset pagination on category/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeSearch]);

  const allCombos = combos.filter((c) => c.active && c.visibleInPos);

  const filteredProducts = activeCategory === 'cat-combos' ? [] : products.filter((p) => {
    if (p.sku === DELETE_SKU) return false;
    const matchCat = activeCategory === 'cat-all' || categories.find((c) => c.id === activeCategory)?.label === p.category;
    const term = activeSearch.trim().toLowerCase();
    const matchSearch =
      term === '' ||
      p.name.toLowerCase().includes(term) ||
      p.barcode.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term);
    return matchCat && matchSearch;
  });

  const filteredCombos = (activeCategory === 'cat-all' || activeCategory === 'cat-combos')
    ? allCombos.filter((c) => {
        const term = activeSearch.trim().toLowerCase();
        const matchSearch =
          term === '' ||
          c.name.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term) ||
          c.barcode.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term);
        return matchSearch;
      })
    : [];

  // Combine items for pagination of 6
  const allDisplayItems = [
    ...filteredCombos.map((c) => ({ type: 'combo' as const, data: c })),
    ...filteredProducts.map((p) => ({ type: 'product' as const, data: p })),
  ];

  const totalItems = allDisplayItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentDisplayItems = allDisplayItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleProductClick = (p: Product) => {
    if (p.outOfStock && p.sku !== DELETE_SKU) return;

    if (p.saleType === 'both') {
      setMixedProduct(p);
      return;
    }

    if ((p.saleType === 'weight' || p.isWeighted || p.unit.toLowerCase() === 'libra' || p.unit.toLowerCase() === 'lb' || p.unit.toLowerCase() === 'kg') && onOpenScale) {
      onOpenScale(p.id, 1.000);
      return;
    }

    onAddToCart({
      id: `cart-${p.id}-${Date.now()}`,
      productId: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      cost: p.cost,
      tax: p.tax,
      image: p.image,
      unit: p.unit,
      isWeighted: false,
    });
  };

  const handleComboClick = (combo: Combo) => {
    const stockCheck = checkComboStockAvailability(combo, 1, productosUi as any);
    if (!stockCheck.available) {
      setAlertComboName(combo.name);
      setMissingItems(stockCheck.missingItems);
      setAlertOpen(true);
      return;
    }

    onAddToCart({
      id: `cart-combo-${combo.id}-${Date.now()}`,
      productId: combo.id,
      name: combo.name,
      sku: combo.code,
      price: combo.price,
      cost: Math.round(combo.normalPrice * 0.7),
      tax: combo.applyTax ? 18 : 0,
      image: combo.image || '',
      unit: 'Combo',
      isCombo: true,
      comboId: combo.id,
      comboItems: combo.items,
    });
    toast.success(`Combo agregado: ${combo.name}`);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 overflow-hidden">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-thin border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Grid: 6 Items per page */}
      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 flex flex-col justify-between">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Search size={30} className="text-slate-300" />
            <p className="text-xs font-medium text-slate-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {currentDisplayItems.map((item) => {
              if (item.type === 'combo') {
                const c = item.data;
                return (
                  <button
                    key={`combo-${c.id}`}
                    onClick={() => handleComboClick(c)}
                    className="group relative flex flex-col items-center text-center bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-xl p-2.5 transition-all hover:shadow-md hover:border-purple-500 cursor-pointer"
                  >
                    <span className="absolute top-1 right-1 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                      COMBO
                    </span>
                    <div className="w-full h-16 rounded-lg bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center mb-1.5">
                      <Boxes size={22} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 min-h-[2rem]">
                      {c.name} ({c.code})
                    </p>
                    <p className="text-xs font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                      RD$ {c.price.toLocaleString('es-DO')}
                    </p>
                  </button>
                );
              }

              const p = item.data;
              return (
                <button
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  disabled={p.outOfStock}
                  className={`group relative flex flex-col items-center text-center bg-white dark:bg-slate-800/90 border rounded-xl p-2.5 transition-all hover:shadow-md
                    ${p.outOfStock ? 'opacity-40 border-slate-200 cursor-not-allowed' : 'border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 cursor-pointer'}
                  `}
                >
                  {/* Icon Box */}
                  <div className="w-full h-16 rounded-lg flex items-center justify-center mb-1.5 relative overflow-hidden">
                    <CategoryIcon category={p.category} name={p.name} size="lg" className="w-full h-full rounded-lg" />
                    {(p.isWeighted || p.saleType === 'weight' || p.saleType === 'both') && (
                      <div className="absolute bottom-1 right-1 z-10 shadow-xs">
                        <WeightBadge saleType={p.saleType} weightUnit={p.weightUnit} isWeighted={p.isWeighted} size="sm" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 min-h-[2rem]">
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </p>

                  {/* Price & Stock */}
                  <div className="mt-1 flex flex-col items-center">
                    <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                      RD$ {p.price.toLocaleString('es-DO')} {(p.saleType === 'weight' || p.saleType === 'both') ? `/${p.weightUnit || 'lb'}` : ''}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 tabular-nums">
                      {p.outOfStock ? 'Agotado' : `${p.stock} ${p.unit || 'Und'} en stock`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls Bar (6 per page) */}
      {totalPages >= 1 && (
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1"
          >
            <ChevronLeft size={15} />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Pág.</span>
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-xs font-black tabular-nums">{currentPage}</span>
            <span>de {totalPages}</span>
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1"
          >
            <span>Siguiente</span>
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      <ComboStockAlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        comboName={alertComboName}
        missingItems={missingItems}
      />

      {mixedProduct && (
        <MixedSaleTypeModal
          productName={mixedProduct.name}
          productSku={mixedProduct.sku}
          price={mixedProduct.price}
          weightUnit={mixedProduct.weightUnit}
          onClose={() => setMixedProduct(null)}
          onSelectUnit={() => {
            const p = mixedProduct;
            setMixedProduct(null);
            onAddToCart({
              id: `cart-${p.id}-${Date.now()}`,
              productId: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              cost: p.cost,
              tax: p.tax,
              image: p.image,
              unit: p.unit || 'Unidad',
              isWeighted: false,
            });
          }}
          onSelectWeight={() => {
            const p = mixedProduct;
            setMixedProduct(null);
            if (onOpenScale) {
              onOpenScale(p.id, 1.000);
            }
          }}
        />
      )}
    </div>
  );
}