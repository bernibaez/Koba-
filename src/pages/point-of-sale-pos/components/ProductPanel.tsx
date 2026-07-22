import React, { useState, useRef } from 'react';
import { Search, Barcode, Grid3x3, List, X } from 'lucide-react';
import type { CartItem } from './POSTerminal';
import AppImage from '@/components/ui/AppImage';

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
}

const categories = [
  { id: 'cat-all', label: 'Todos' },
  { id: 'cat-lacteos', label: 'Lácteos' },
  { id: 'cat-carnes', label: 'Carnes' },
  { id: 'cat-granos', label: 'Granos' },
  { id: 'cat-bebidas', label: 'Bebidas' },
  { id: 'cat-limpieza', label: 'Limpieza' },
  { id: 'cat-panaderia', label: 'Panadería' },
  { id: 'cat-frutas', label: 'Frutas' },
  { id: 'cat-snacks', label: 'Snacks' },
];

const products: Product[] = [
  { id: 'prod-001', sku: 'ARR-SEL-5LB', barcode: '7891000100103', name: 'Arroz Selecto 5lb', category: 'Granos', price: 285, cost: 210, stock: 124, unit: 'Unidad', tax: 0, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-002', sku: 'ACE-VEG-1L', barcode: '7891000200104', name: 'Aceite Vegetal 1L', category: 'Granos', price: 195, cost: 140, stock: 8, unit: 'Unidad', tax: 18, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&h=120&fit=crop', lowStock: true, outOfStock: false },
  { id: 'prod-003', sku: 'POL-ENT-LB', barcode: '7891000300105', name: 'Pollo Entero /lb', category: 'Carnes', price: 98, cost: 72, stock: 45, unit: 'Libra', tax: 0, image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-004', sku: 'LEC-EVA-410', barcode: '7891000400106', name: 'Leche Evaporada 410g', category: 'Lácteos', price: 145, cost: 108, stock: 62, unit: 'Unidad', tax: 0, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-005', sku: 'AZU-BLA-5LB', barcode: '7891000500107', name: 'Azúcar Blanca 5lb', category: 'Granos', price: 175, cost: 128, stock: 89, unit: 'Unidad', tax: 0, image: 'https://images.unsplash.com/photo-1571211905393-9b7e6e2e8b7e?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-006', sku: 'HUE-X12', barcode: '7891000600108', name: 'Huevos x12', category: 'Lácteos', price: 165, cost: 120, stock: 34, unit: 'Cartón', tax: 0, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-007', sku: 'PAN-AGU-UN', barcode: '7891000700109', name: 'Pan de Agua', category: 'Panadería', price: 12, cost: 7, stock: 210, unit: 'Unidad', tax: 0, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-008', sku: 'HAB-NEG-1LB', barcode: '7891000800110', name: 'Habichuelas Negras 1lb', category: 'Granos', price: 85, cost: 62, stock: 156, unit: 'Unidad', tax: 0, image: 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-009', sku: 'LEC-PAS-1L', barcode: '7891000900111', name: 'Leche Pasteurizada 1L', category: 'Lácteos', price: 115, cost: 84, stock: 0, unit: 'Unidad', tax: 0, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120&h=120&fit=crop', lowStock: false, outOfStock: true },
  { id: 'prod-010', sku: 'JUG-NAR-1L', barcode: '7891001000112', name: 'Jugo Naranja 1L', category: 'Bebidas', price: 145, cost: 105, stock: 28, unit: 'Unidad', tax: 18, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-011', sku: 'DET-LIQ-1.5', barcode: '7891001100113', name: 'Detergente Líq. 1.5L', category: 'Limpieza', price: 285, cost: 195, stock: 6, unit: 'Unidad', tax: 18, image: 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=120&h=120&fit=crop', lowStock: true, outOfStock: false },
  { id: 'prod-012', sku: 'YOG-GRI-500', barcode: '7891001200114', name: 'Yogur Griego 500g', category: 'Lácteos', price: 195, cost: 140, stock: 48, unit: 'Unidad', tax: 18, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-013', sku: 'PAP-HIG-X4', barcode: '7891001300115', name: 'Papel Higiénico x4', category: 'Limpieza', price: 195, cost: 138, stock: 3, unit: 'Paquete', tax: 18, image: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=120&h=120&fit=crop', lowStock: true, outOfStock: false },
  { id: 'prod-014', sku: 'CAF-BUS-250', barcode: '7891001400116', name: 'Café Bustelo 250g', category: 'Bebidas', price: 225, cost: 165, stock: 71, unit: 'Unidad', tax: 18, image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-015', sku: 'MAI-AME-UN', barcode: '7891001500117', name: 'Maíz Americano', category: 'Frutas', price: 35, cost: 22, stock: 185, unit: 'Unidad', tax: 0, image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
  { id: 'prod-016', sku: 'CHI-LAY-42', barcode: '7891001600118', name: 'Chips Lay\'s 42g', category: 'Snacks', price: 75, cost: 52, stock: 92, unit: 'Unidad', tax: 18, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120&h=120&fit=crop', lowStock: false, outOfStock: false },
];

interface ProductPanelProps {
  onAddToCart: (product: Omit<CartItem, 'qty' | 'discount'>) => void;
}

export default function ProductPanel({ onAddToCart }: ProductPanelProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('cat-all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const barcodeRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'cat-all' || categories.find((c) => c.id === activeCategory)?.label === p.category;
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = (p: Product) => {
    if (p.outOfStock) return;
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

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={barcodeRef}
            type="text"
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors flex-shrink-0"
          title="Escanear código de barras (F2)"
          onClick={() => barcodeRef.current?.focus()}
        >
          <Barcode size={14} />
          <span className="hidden sm:inline">F2</span>
        </button>
        <div className="flex border border-border rounded-lg overflow-hidden flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Vista cuadrícula"
          >
            <Grid3x3 size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Vista lista"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto scrollbar-thin flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-border'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Search size={32} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No se encontraron productos</p>
            <button onClick={() => { setSearch(''); setActiveCategory('cat-all'); }} className="text-xs text-primary hover:underline">
              Limpiar filtros
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p)}
                disabled={p.outOfStock}
                className={`pos-product-card relative flex flex-col bg-card border rounded-xl p-3 text-left transition-all
                  ${p.outOfStock ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-primary/40 hover:shadow-card cursor-pointer'}
                `}
              >
                <div className="aspect-square w-full mb-2 rounded-lg overflow-hidden bg-secondary">
                  <AppImage
                    src={p.image}
                    alt={`Fotografía de ${p.name} — producto de supermercado`}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                </div>
                {p.lowStock && !p.outOfStock && (
                  <span className="absolute top-2 right-2 badge-warning text-xs py-0 px-1.5">Bajo</span>
                )}
                {p.outOfStock && (
                  <span className="absolute top-2 right-2 badge-danger text-xs py-0 px-1.5">Agotado</span>
                )}
                <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.unit}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-sm font-bold tabular-nums text-primary">
                    RD$ {p.price.toLocaleString('es-DO')}
                  </p>
                  {p.tax > 0 && (
                    <span className="text-xs text-muted-foreground">+ITBIS</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Stock: {p.stock}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p)}
                disabled={p.outOfStock}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all
                  ${p.outOfStock ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer'}
                `}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <AppImage
                    src={p.image}
                    alt={`Imagen de ${p.name}`}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-primary">RD$ {p.price.toLocaleString('es-DO')}</p>
                  <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                </div>
                {p.lowStock && <span className="badge-warning flex-shrink-0">Bajo</span>}
                {p.outOfStock && <span className="badge-danger flex-shrink-0">Agotado</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer shortcuts */}
      <div className="px-3 py-2 border-t border-border bg-secondary/30 flex items-center gap-3 flex-shrink-0">
        {[
          { key: 'F1', label: 'Ayuda' },
          { key: 'F2', label: 'Barcode' },
          { key: 'F3', label: 'Cliente' },
          { key: 'F9', label: 'Pago' },
          { key: 'F10', label: 'Limpiar' },
          { key: 'Esc', label: 'Cancelar' },
        ].map((s) => (
          <div key={`shortcut-${s.key}`} className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-xs font-mono font-semibold text-foreground">{s.key}</kbd>
            <span className="text-xs text-muted-foreground hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}