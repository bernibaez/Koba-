import React, { useState } from 'react';
import { X, Printer, Barcode } from 'lucide-react';
import type { Product } from './ProductManagementScreen';
import { generateBarcodeBars } from '@/lib/barcodeUtils';
import { toast } from 'sonner';

interface PriceLabelModalProps {
  products: Product[];
  onClose: () => void;
}

export default function PriceLabelModal({ products, onClose }: PriceLabelModalProps) {
  const [copies, setCopies] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.id] = 1;
    });
    return initial;
  });

  const [businessName, setBusinessName] = useState('Mi Colmado / Supermercado ERP');
  const [printerFormat, setPrinterFormat] = useState<'thermal-58' | 'thermal-80' | 'sticker-grid'>('thermal-58');

  const handlePrint = () => {
    toast.success('Enviando trabajo de impresión a impresora térmica…');
    window.print();
  };

  const selectedList = products.map((p) => ({
    product: p,
    count: copies[p.id] || 1,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={onClose}>
      <div className="card w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Barcode size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Imprimir Etiquetas de Precios y Códigos de Barras</h3>
              <p className="text-xs text-muted-foreground">Configura el formato térmico y la cantidad de etiquetas</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Configurations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-secondary/30 rounded-xl p-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nombre del Negocio (Configurable)</label>
            <input
              className="input-field text-xs font-semibold"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Formato de Impresora</label>
            <select
              className="input-field text-xs"
              value={printerFormat}
              onChange={(e) => setPrinterFormat(e.target.value as typeof printerFormat)}
            >
              <option value="thermal-58">Térmica 58mm (Rollo Continuo)</option>
              <option value="thermal-80">Térmica 80mm (Rollo Ancho)</option>
              <option value="sticker-grid">Hoja Adhesiva (Rejilla / Grid)</option>
            </select>
          </div>
        </div>

        {/* Selected Products Quantities */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Productos Seleccionados ({products.length})
          </p>
          <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between border border-border rounded-lg p-2 bg-card text-xs">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-muted-foreground font-mono">SKU: {p.sku} · Barcode: {p.barcode || 'Sin Código'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Copias:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="input-field w-16 text-center font-bold"
                    value={copies[p.id] ?? 1}
                    onChange={(e) =>
                      setCopies((prev) => ({
                        ...prev,
                        [p.id]: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thermal Label Live Preview */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Previsualización de Etiqueta Térmica ({printerFormat})
          </p>

          <div className="bg-muted/40 p-6 rounded-xl flex items-center justify-center overflow-x-auto min-h-[160px]">
            <div
              className={`bg-white text-black p-3 rounded shadow-md font-sans text-center space-y-1 ${
                printerFormat === 'thermal-58'
                  ? 'w-[200px]'
                  : printerFormat === 'thermal-80'
                  ? 'w-[280px]'
                  : 'w-[240px]'
              }`}
            >
              {/* Business Name */}
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-700 truncate">{businessName}</p>
              
              {/* Product Name */}
              <p className="text-xs font-black text-black leading-tight truncate px-1">
                {products[0]?.name || 'Producto de Ejemplo'}
              </p>

              {/* Price */}
              <p className="text-xl font-extrabold text-black tracking-tight my-1">
                RD$ {(products[0]?.salePrice || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>

              {/* Barcode Graphics SVG */}
              <div className="flex justify-center items-center py-1">
                <svg className="h-9 w-full max-w-[170px]" viewBox="0 0 160 30" preserveAspectRatio="none">
                  {generateBarcodeBars(products[0]?.barcode || products[0]?.sku || '123456789').map((bar, idx) => {
                    let xOffset = 10;
                    for (let i = 0; i < idx; i++) {
                      xOffset += generateBarcodeBars(products[0]?.barcode || products[0]?.sku || '123456789')[i].width * 1.5;
                    }
                    return (
                      <rect
                        key={bar.key}
                        x={xOffset}
                        y={0}
                        width={bar.width * 1.2}
                        height={25}
                        fill={bar.key.includes('space') || bar.key.startsWith('s-') ? 'none' : '#000'}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Code details */}
              <p className="text-[10px] font-mono font-bold text-gray-900 tracking-widest">
                {products[0]?.barcode || products[0]?.sku}
              </p>
              <p className="text-[9px] font-mono text-gray-600">SKU: {products[0]?.sku}</p>
            </div>
          </div>
        </div>

        {/* Printable hidden area for thermal print */}
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999] print:p-2">
          {selectedList.map(({ product: p, count }) =>
            Array.from({ length: count }).map((_, idx) => (
              <div
                key={`print-${p.id}-${idx}`}
                className="w-[58mm] bg-white text-black p-2 mb-2 text-center font-sans break-inside-avoid border border-black/20"
              >
                <p className="text-[9px] font-bold uppercase">{businessName}</p>
                <p className="text-xs font-bold">{p.name}</p>
                <p className="text-lg font-black">RD$ {p.salePrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] font-mono font-bold">{p.barcode || p.sku}</p>
                <p className="text-[8px] font-mono">SKU: {p.sku}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={handlePrint} className="btn-primary flex items-center gap-2">
            <Printer size={16} />
            Imprimir Etiquetas ({selectedList.reduce((s, item) => s + item.count, 0)})
          </button>
        </div>
      </div>
    </div>
  );
}
