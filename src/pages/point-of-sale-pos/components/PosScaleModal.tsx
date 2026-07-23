import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { CartItem } from './POSTerminal';

const scaleProducts = [
  { productId: 'prod-scale-pollo', name: 'Pollo Entero', sku: 'POL-ENT-LB', price: 98, cost: 72, tax: 0, unit: 'Libra', barcode: '2001001' },
  { productId: 'prod-scale-res', name: 'Carne de Res', sku: 'RES-LB', price: 185, cost: 140, tax: 0, unit: 'Libra', barcode: '2001002' },
  { productId: 'prod-scale-queso', name: 'Queso Blanco', sku: 'QUE-BLA-LB', price: 120, cost: 90, tax: 0, unit: 'Libra', barcode: '2001003' },
  { productId: 'prod-scale-platano', name: 'Plátano Verde', sku: 'PLA-VER-LB', price: 25, cost: 15, tax: 0, unit: 'Libra', barcode: '2001004' },
];

interface Props {
  onClose: () => void;
  onConfirm: (item: Omit<CartItem, 'qty' | 'discount'>, qty: number) => void;
}

export default function PosScaleModal({ onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState(scaleProducts[0].productId);
  const [weight, setWeight] = useState('1.000');

  const product = scaleProducts.find((p) => p.productId === selected)!;
  const qty = parseFloat(weight) || 0;
  const lineTotal = qty * product.price;

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
        image: '',
        unit: product.unit,
        isWeighted: true,
      },
      qty
    );
    toast.success(`Agregado: ${qty.toFixed(3)} ${product.unit} de ${product.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={onClose}>
      <div className="card w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Producto pesado (balanza)</h3>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Producto</label>
          <select className="input-field" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {scaleProducts.map((p) => (
              <option key={p.productId} value={p.productId}>{p.name} — RD$ {p.price}/{p.unit}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Peso ({product.unit})</label>
          <input
            className="input-field text-lg font-bold tabular-nums text-center"
            type="number"
            min={0.001}
            step="0.001"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex justify-between text-sm">
          <span className="text-muted-foreground">Total línea</span>
          <span className="font-bold text-primary tabular-nums">
            RD$ {lineTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={confirm}>Agregar al carrito</button>
        </div>
      </div>
    </div>
  );
}
