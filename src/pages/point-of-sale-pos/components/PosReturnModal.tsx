import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { addPosReturn, getPosReturns, nextCode } from '@/lib/posStore';

const mockSaleLines = [
  { sku: 'ARR-SEL-5LB', name: 'Arroz Selecto 5lb', price: 285, maxQty: 2 },
  { sku: 'ACE-VEG-1L', name: 'Aceite Vegetal 1L', price: 195, maxQty: 1 },
  { sku: 'LEC-EVA-410', name: 'Leche Evaporada 410g', price: 145, maxQty: 3 },
];

export default function PosReturnModal({ onClose }: { onClose: () => void }) {
  const [saleCode, setSaleCode] = useState('FAC-001');
  const [customer, setCustomer] = useState('Juan Pérez');
  const [reason, setReason] = useState('Producto defectuoso');
  const [method, setMethod] = useState<'cash' | 'card' | 'credit_note' | 'exchange'>('cash');
  const [qty, setQty] = useState<Record<string, number>>({});

  const selected = mockSaleLines
    .map((l) => ({ ...l, qty: qty[l.sku] || 0 }))
    .filter((l) => l.qty > 0);

  const total = selected.reduce((s, l) => s + l.qty * l.price, 0);
  const isFull = selected.length === mockSaleLines.length && selected.every((l) => l.qty === l.maxQty);

  const save = () => {
    if (selected.length === 0) {
      toast.error('Selecciona al menos un producto a devolver');
      return;
    }
    const now = new Date();
    addPosReturn({
      id: `ret-${Date.now()}`,
      code: nextCode('DEV', getPosReturns().length),
      saleCode,
      customer,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      user: 'Admin General',
      cashier: 'Caja #1',
      products: selected.map((l) => ({ sku: l.sku, name: l.name, qty: l.qty, price: l.price })),
      total,
      reason,
      method,
      type: isFull ? 'full' : 'partial',
    });
    toast.success(`Devolución ${isFull ? 'completa' : 'parcial'} registrada`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={onClose}>
      <div className="card w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Devolución de venta</h3>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Factura</label>
            <input className="input-field" value={saleCode} onChange={(e) => setSaleCode(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente</label>
            <input className="input-field" value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Motivo</label>
          <select className="input-field" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>Producto defectuoso</option>
            <option>Error de cobro</option>
            <option>Cliente arrepentido</option>
            <option>Producto equivocado</option>
            <option>Otro</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Método de devolución</label>
          <select className="input-field" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="credit_note">Nota de crédito</option>
            <option value="exchange">Cambio de producto</option>
          </select>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Productos de la factura</p>
          {mockSaleLines.map((l) => (
            <div key={l.sku} className="flex items-center gap-3 border border-border rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.sku} · máx {l.maxQty}</p>
              </div>
              <input
                type="number"
                min={0}
                max={l.maxQty}
                className="input-field w-20 text-center"
                value={qty[l.sku] ?? 0}
                onChange={(e) => setQty((q) => ({ ...q, [l.sku]: Math.min(l.maxQty, Math.max(0, Number(e.target.value))) }))}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Total a devolver</span>
          <span className="text-primary">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={save}>Registrar devolución</button>
        </div>
      </div>
    </div>
  );
}
