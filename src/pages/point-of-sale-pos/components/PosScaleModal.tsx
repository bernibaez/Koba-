import React, { useState, useEffect, useRef } from 'react';
import { X, Barcode, Scale } from 'lucide-react';
import { toast } from 'sonner';
import type { CartItem } from './POSTerminal';
import { scaleProducts, parseScaleBarcode } from '../utils/scaleUtils';

interface Props {
  onClose: () => void;
  onConfirm: (item: Omit<CartItem, 'qty' | 'discount'>, qty: number) => void;
  initialProductId?: string;
  initialWeight?: number;
}

export default function PosScaleModal({ onClose, onConfirm, initialProductId, initialWeight }: Props) {
  const [selected, setSelected] = useState(initialProductId || scaleProducts[0].productId);
  const [weight, setWeight] = useState(initialWeight ? initialWeight.toFixed(3) : '1.000');
  const [scanCode, setScanCode] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialProductId) {
      setSelected(initialProductId);
    }
    if (initialWeight) {
      setWeight(initialWeight.toFixed(3));
    }
  }, [initialProductId, initialWeight]);

  useEffect(() => {
    // Auto focus barcode input when modal opens
    setTimeout(() => {
      barcodeRef.current?.focus();
    }, 100);
  }, []);

  const product = scaleProducts.find((p) => p.productId === selected) || scaleProducts[0];
  const qty = parseFloat(weight) || 0;
  const lineTotal = qty * product.price;

  const handleScanKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const code = scanCode.trim();
    if (!code) return;

    const parsed = parseScaleBarcode(code);
    if (parsed) {
      setSelected(parsed.product.productId);
      setWeight(parsed.weight.toFixed(3));
      setScanCode('');
      toast.success(`Detectado: ${parsed.product.name} (${parsed.weight.toFixed(3)} ${parsed.product.unit})`);
    } else {
      toast.error('Código de pesados no reconocido');
    }
  };

  const confirm = () => {
    if (qty <= 0) {
      toast.error('Ingresa un peso válido');
      return;
    }
    onConfirm(
      {
        id: `cart-scale-${Date.now()}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs" onClick={onClose}>
      <div className="card w-full max-w-md p-5 space-y-4 shadow-xl border-primary/20" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Scale className="text-emerald-600 dark:text-emerald-400" size={22} />
            <h3 className="font-bold text-foreground text-lg">Producto pesado (Balanza)</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Quick Barcode Scanner inside modal */}
        <div className="relative">
          <Barcode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={barcodeRef}
            type="text"
            placeholder="Escanear etiqueta de balanza o SKU..."
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onKeyDown={handleScanKey}
            className="input-field pl-10 pr-4 h-10 text-sm bg-secondary/40 focus:bg-background"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Producto seleccionado</label>
          <select className="input-field h-11 text-base font-medium" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {scaleProducts.map((p) => (
              <option key={p.productId} value={p.productId}>{p.name} — RD$ {p.price}/{p.unit} (SKU: {p.sku})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Peso o Cantidad ({product.unit})</label>
          <input
            className="input-field text-xl font-extrabold tabular-nums text-center h-12 text-primary focus:ring-emerald-500"
            type="number"
            min={0.001}
            step="0.001"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex justify-between items-center text-sm">
          <span className="text-muted-foreground font-semibold">Subtotal producto</span>
          <span className="font-black text-lg text-emerald-600 dark:text-emerald-400 tabular-nums">
            RD$ {lineTotal.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button type="button" className="btn-secondary h-11 px-4 text-sm" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary h-11 px-5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" onClick={confirm}>
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
