import React, { useState, useEffect } from 'react';
import { Search, Scale, Boxes, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CartItem } from './POSTerminal';
import { DELETE_SKU } from '@/lib/posStore';
import { getCombos, checkComboStockAvailability, Combo } from '@/lib/comboStore';
import ComboStockAlertModal from '@/pages/combos/components/ComboStockAlertModal';
import { toast } from 'sonner';
import { scaleProducts } from '../utils/scaleUtils';

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

const standardProducts: Product[] = [
  { id: 'prod-001', sku: '11772', barcode: '7891000100103', name: '3 Evaporada Famosa', category: 'Lácteos', price: 145, cost: 108, stock: 457.39, unit: 'Und', tax: 0, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-002', sku: '42', barcode: '7891000200104', name: 'Ace Detallado', category: 'Limpieza', price: 95, cost: 65, stock: 42, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-003', sku: '7462381341418', barcode: '7462381341418', name: 'Aceite Aurora Med.', category: 'Granos', price: 185, cost: 130, stock: 0, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: true },
  { id: 'prod-004', sku: '7460193700096', barcode: '7460193700096', name: 'Aceite Crisol 16oz', category: 'Granos', price: 115, cost: 85, stock: 57, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-005', sku: '7460193705718', barcode: '7460193705718', name: 'Aceite Crisol 34oz', category: 'Granos', price: 195, cost: 140, stock: 41, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-006', sku: '7460193703301', barcode: '7460193703301', name: 'Aceite Crisol 8oz', category: 'Granos', price: 65, cost: 45, stock: 146, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-007', sku: '7460193700133', barcode: '7460193700133', name: 'Aceite Crisol Galón', category: 'Granos', price: 785, cost: 580, stock: 25, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-008', sku: '7460193703981', barcode: '7460193703981', name: 'Aceite Crisol Mas...', category: 'Granos', price: 215, cost: 160, stock: 0, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: true },
  { id: 'prod-009', sku: '7460193700119', barcode: '7460193700119', name: 'Aceite Crisol Medi...', category: 'Granos', price: 145, cost: 105, stock: 116, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-010', sku: '7460193741891', barcode: '7460193741891', name: 'Aceite Crisol Sache...', category: 'Granos', price: 35, cost: 24, stock: 52, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-011', sku: '7460193704063', barcode: '7460193704063', name: 'Aceite Crisol Yumbo', category: 'Granos', price: 425, cost: 310, stock: 56, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-012', sku: '718912323215', barcode: '718912323215', name: 'Aceite De Coco...', category: 'Granos', price: 295, cost: 210, stock: 17, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-013', sku: 'ACE-OLV-20ML', barcode: '7891001300115', name: 'Aceite De Oliva 20ml', category: 'Granos', price: 45, cost: 28, stock: 88, unit: 'Und', tax: 18, image: '', lowStock: false, outOfStock: false },
  { id: 'prod-014', sku: 'POL-ENT-LB', barcode: '7891000300105', name: 'Pollo Entero /lb', category: 'Carnes', price: 98, cost: 72, stock: 45, unit: 'LB', tax: 0, image: '', lowStock: false, outOfStock: false, isWeighted: true },
];

const products: Product[] = [
  ...standardProducts,
  ...scaleProducts
    .filter((sp) => !standardProducts.some((p) => p.sku === sp.sku))
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
    })),
];

interface ProductPanelProps {
  onAddToCart: (product: Omit<CartItem, 'qty' | 'discount'>, qty?: number) => void;
  onOpenScale?: (productId?: string, weight?: number) => void;
  awaitingDelete?: boolean;
}

export default function ProductPanel({ onAddToCart, onOpenScale }: ProductPanelProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('cat-all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertComboName, setAlertComboName] = useState('');
  const [missingItems, setMissingItems] = useState<{ productId: string; sku: string; name: string; required: number; available: number }[]>([]);

  // Reset pagination on category/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, search]);

  const allCombos = getCombos().filter((c) => c.active && c.visibleInPos);

  const filteredProducts = activeCategory === 'cat-combos' ? [] : products.filter((p) => {
    if (p.sku === DELETE_SKU) return false;
    const matchCat = activeCategory === 'cat-all' || categories.find((c) => c.id === activeCategory)?.label === p.category;
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredCombos = (activeCategory === 'cat-all' || activeCategory === 'cat-combos')
    ? allCombos.filter((c) => {
        const matchSearch =
          search === '' ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.barcode.includes(search) ||
          c.category.toLowerCase().includes(search.toLowerCase());
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

    if ((p.isWeighted || p.unit.toLowerCase() === 'libra' || p.unit.toLowerCase() === 'lb' || p.unit.toLowerCase() === 'kg') && onOpenScale) {
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
    });
  };

  const handleComboClick = (combo: Combo) => {
    const stockCheck = checkComboStockAvailability(combo, 1);
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
                  {/* Image Box */}
                  <div className="w-full h-16 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-600/40 flex items-center justify-center mb-1.5 relative">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <ImageIcon size={20} className="text-slate-300 dark:text-slate-500" />
                    )}
                    {p.isWeighted && (
                      <span className="absolute bottom-1 right-1 bg-emerald-600 text-white p-0.5 rounded text-[8px] font-bold" title="Balanza">
                        <Scale size={10} />
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 min-h-[2rem]">
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </p>

                  {/* Price & Stock */}
                  <div className="mt-1 flex flex-col items-center">
                    <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                      RD$ {p.price.toLocaleString('es-DO')}
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
    </div>
  );
}