import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Barcode, Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CartItem } from './POSTerminal';
import { parseScaleBarcode, type ScaleProduct } from '../utils/scaleUtils';
import { useProductos } from '@/hooks/useProductos';

interface Props {
  onClose: () => void;
  onConfirm: (item: Omit<CartItem, 'qty' | 'discount'>, qty: number) => void;
  initialProductId?: string;
  initialWeight?: number;
}

export default function PosScaleModal({ onClose, onConfirm, initialProductId, initialWeight }: Props) {
  const { productosUi } = useProductos({ pagina: 1, limite: 200, estado: 'activo' });

  const catalogProducts: ScaleProduct[] = useMemo(() => {
    if (!Array.isArray(productosUi) || productosUi.length === 0) return [];

    const filtered = productosUi.filter(
      (p) =>
        p.isWeightProduct ||
        p.saleType === 'weight' ||
        p.saleType === 'both' ||
        (typeof p.unit === 'string' && (p.unit.toLowerCase().includes('lb') || p.unit.toLowerCase().includes('kg')))
    );

    const listToUse = filtered.length > 0 ? filtered : productosUi;

    return listToUse.map((p) => ({
      productId: p.id,
      name: p.name || 'Producto sin nombre',
      sku: p.sku || '',
      price: p.salePrice ?? 0,
      cost: p.costPrice ?? 0,
      tax: p.tax ?? 0,
      unit: p.unit || p.weightUnit || 'lb',
      barcode: p.barcode || '',
      category: p.category || '',
      image: p.image,
    }));
  }, [productosUi]);

  const [selected, setSelected] = useState<string>(() => {
    if (initialProductId && catalogProducts.some((p) => p.productId === initialProductId)) {
      return initialProductId;
    }
    return catalogProducts[0]?.productId || '';
  });

  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : '1.000');
  const [scanCode, setScanCode] = useState('');
  const weightInputRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialProductId && catalogProducts.some((p) => p.productId === initialProductId)) {
      setSelected(initialProductId);
    } else if (catalogProducts.length > 0 && (!selected || !catalogProducts.some((p) => p.productId === selected))) {
      setSelected(catalogProducts[0].productId);
    }
  }, [initialProductId, catalogProducts, selected]);

  useEffect(() => {
    if (initialWeight) {
      setWeight(String(initialWeight));
    }
  }, [initialWeight]);

  useEffect(() => {
    const timer = setTimeout(() => {
      weightInputRef.current?.focus();
      weightInputRef.current?.select();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onClose]);

  const product = catalogProducts.find((p) => p.productId === selected) || catalogProducts[0];
  const qty = parseFloat(weight) || 0;
  const lineTotal = product ? Math.round(qty * (product.price || 0) * 100) / 100 : 0;

  const handleScanKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const code = scanCode.trim();
    if (!code) return;

    const parsed = parseScaleBarcode(code, catalogProducts);
    if (parsed) {
      setSelected(parsed.product.productId);
      setWeight(parsed.weight.toFixed(3));
      setScanCode('');
      toast.success(`Detectado: ${parsed.product.name} (${parsed.weight.toFixed(3)} ${parsed.product.unit})`);
    } else {
      toast.error('Código de pesados no reconocido');
    }
  };

  const confirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!product) {
      toast.error('No hay producto seleccionado');
      return;
    }
    if (qty <= 0) {
      toast.error('Ingresa un peso mayor a cero');
      return;
    }
    onConfirm(
      {
        id: `cart-scale-${product.productId}-${Date.now()}`,
        productId: product.productId,
        name: product.name,
        sku: product.sku,
        price: product.price,
        cost: product.cost,
        tax: product.tax,
        image: product.image || '',
        unit: product.unit,
        isWeighted: true,
      },
      qty
    );
    toast.success(`Agregado: ${qty.toFixed(3)} ${product.unit} de ${product.name}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Scale size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">
                Producto Pesado (Balanza)
              </h3>
              <p className="text-xs text-slate-400 font-medium">Balanza electrónica o peso manual</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {catalogProducts.length === 0 ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                No hay productos en el catálogo
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Registra productos en el inventario para poder pesarlos y venderlos.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Cerrar (Esc)
            </button>
          </div>
        ) : !product ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-xs text-slate-400">Cargando datos del producto...</p>
          </div>
        ) : (
          <>
            {/* Quick Barcode Scanner inside modal */}
            <div className="relative">
              <Barcode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Escanear etiqueta de balanza EAN-13 o SKU..."
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={handleScanKey}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 h-11 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <form onSubmit={confirm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Producto Seleccionado
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 h-12 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {catalogProducts.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.name} — RD$ {p.price} / {p.unit} {p.sku ? `(SKU: ${p.sku})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Peso o Cantidad ({product.unit})
                </label>
                <div className="relative">
                  <input
                    ref={weightInputRef}
                    className="w-full text-center text-3xl font-black tabular-nums h-16 rounded-2xl border-2 border-emerald-500/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:outline-none"
                    type="number"
                    min={0.001}
                    step="0.001"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 pointer-events-none">
                    {product.unit}
                  </span>
                </div>
              </div>

              {/* Subtotal calculated */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center text-sm">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  Subtotal Producto
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  RD$ {lineTotal.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                  onClick={onClose}
                >
                  Cancelar (Esc)
                </button>
                <button
                  type="submit"
                  disabled={qty <= 0}
                  className="flex-1 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Agregar Al Carrito (Enter)</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
