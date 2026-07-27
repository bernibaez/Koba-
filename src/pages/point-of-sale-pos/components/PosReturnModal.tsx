import React, { useState } from 'react';
import { X, Printer, Search, RotateCcw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { addPosReturn, getPosReturns, nextCode } from '@/lib/posStore';
import { logAuditEvent } from '@/lib/auditStore';

interface SaleItem {
  sku: string;
  name: string;
  price: number;
  cost: number;
  maxQty: number;
}

interface SaleLookup {
  code: string;
  customer: string;
  date: string;
  items: SaleItem[];
}

const mockExistingInvoices: Record<string, SaleLookup> = {
  'FAC-001': {
    code: 'FAC-001',
    customer: 'Juan Pérez',
    date: '2026-07-25',
    items: [
      { sku: 'ARR-SEL-5LB', name: 'Arroz Selecto 5lb', price: 285, cost: 210, maxQty: 3 },
      { sku: 'ACE-VEG-1L', name: 'Aceite Vegetal 1L', price: 195, cost: 140, maxQty: 2 },
      { sku: 'LEC-EVA-410', name: 'Leche Evaporada 410g', price: 145, cost: 100, maxQty: 4 },
    ],
  },
  'FAC-002': {
    code: 'FAC-002',
    customer: 'Empresa ABC S.R.L.',
    date: '2026-07-25',
    items: [
      { sku: 'AZU-BLA-2LB', name: 'Azúcar Blanca 2lb', price: 110, cost: 80, maxQty: 10 },
      { sku: 'HAB-ROJ-1LB', name: 'Habichuelas Rojas 1lb', price: 75, cost: 50, maxQty: 8 },
    ],
  },
  'FAC-003': {
    code: 'FAC-003',
    customer: 'Rosa Jiménez',
    date: '2026-07-24',
    items: [
      { sku: 'POL-ENT-1KG', name: 'Pollo Entero Fresco', price: 320, cost: 230, maxQty: 2 },
      { sku: 'LEC-ENT-1L', name: 'Leche Entera 1L', price: 85, cost: 60, maxQty: 6 },
    ],
  },
};

export default function PosReturnModal({ onClose }: { onClose: () => void }) {
  const [searchCode, setSearchCode] = useState('FAC-001');
  const [loadedSale, setLoadedSale] = useState<SaleLookup | null>(mockExistingInvoices['FAC-001']);
  const [customer, setCustomer] = useState('Juan Pérez');
  const [reason, setReason] = useState('Producto defectuoso');
  const [method, setMethod] = useState<'cash' | 'card' | 'credit_note' | 'exchange'>('cash');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [registeredReturnCode, setRegisteredReturnCode] = useState<string | null>(null);

  const handleLookup = () => {
    const codeKey = searchCode.trim().toUpperCase();
    const found = mockExistingInvoices[codeKey];
    if (found) {
      setLoadedSale(found);
      setCustomer(found.customer);
      setQty({});
      toast.success(`Factura ${found.code} cargada`);
    } else {
      // Default fallback sale lines for arbitrary invoice numbers
      const fallback: SaleLookup = {
        code: codeKey || 'FAC-DEV',
        customer: customer || 'Cliente General',
        date: new Date().toISOString().slice(0, 10),
        items: [
          { sku: 'ARR-SEL-5LB', name: 'Arroz Selecto 5lb', price: 285, cost: 210, maxQty: 5 },
          { sku: 'ACE-VEG-1L', name: 'Aceite Vegetal 1L', price: 195, cost: 140, maxQty: 3 },
        ],
      };
      setLoadedSale(fallback);
      toast.info(`Cargados productos de muestra para factura ${codeKey}`);
    }
  };

  const currentItems = loadedSale?.items ?? [];

  const selectedItems = currentItems
    .map((l) => ({ ...l, qty: qty[l.sku] || 0 }))
    .filter((l) => l.qty > 0);

  const totalReturnAmount = selectedItems.reduce((s, l) => s + l.qty * l.price, 0);
  const isFullReturn =
    currentItems.length > 0 &&
    selectedItems.length === currentItems.length &&
    selectedItems.every((l) => l.qty === l.maxQty);

  const handleProcessReturn = () => {
    if (selectedItems.length === 0) {
      toast.error('Selecciona al menos un producto e indica la cantidad a devolver');
      return;
    }
    const now = new Date();
    const code = nextCode('DEV', getPosReturns().length);

    addPosReturn({
      id: `ret-${Date.now()}`,
      code,
      saleCode: loadedSale?.code ?? searchCode,
      customer,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      user: 'Admin General',
      cashier: 'Caja #1',
      products: selectedItems.map((l) => ({ sku: l.sku, name: l.name, qty: l.qty, price: l.price })),
      total: totalReturnAmount,
      reason,
      method,
      type: isFullReturn ? 'full' : 'partial',
    });

    // System Audit Event
    logAuditEvent({
      user: 'Admin General',
      role: 'Administrador',
      action: 'Devolución',
      module: 'Devoluciones',
      details: `Devolución ${code} (${isFullReturn ? 'Total' : 'Parcial'}) sobre ${loadedSale?.code} por RD$ ${totalReturnAmount.toLocaleString()}`,
      before: { invoice: loadedSale?.code, customer },
      after: { returnCode: code, type: isFullReturn ? 'full' : 'partial', total: totalReturnAmount, items: selectedItems },
    });

    toast.success(`Devolución ${isFullReturn ? 'total' : 'parcial'} ${code} registrada`);
    setRegisteredReturnCode(code);
  };

  if (registeredReturnCode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={onClose}>
        <div className="card w-full max-w-md p-6 space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Comprobante de Devolución</h3>
          <p className="text-sm font-mono text-primary font-bold">{registeredReturnCode}</p>
          <div className="bg-secondary/40 rounded-xl p-4 text-left text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Factura Original:</span><span className="font-semibold">{loadedSale?.code}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span className="font-semibold">{customer}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Motivo:</span><span className="font-semibold">{reason}</span></div>
            <div className="flex justify-between border-t border-border pt-1 font-bold text-sm"><span>Total Reembolsado:</span><span className="text-danger">RD$ {totalReturnAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => window.print()} className="flex-1 btn-secondary flex items-center justify-center gap-1.5 text-xs py-2.5">
              <Printer size={14} /> Imprimir Comprobante
            </button>
            <button type="button" onClick={onClose} className="flex-1 btn-primary text-xs py-2.5">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={onClose}>
      <div className="card w-full max-w-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <RotateCcw size={20} className="text-danger" />
            <h3 className="font-bold text-foreground text-lg">Devolución de Mercancía</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Invoice Lookup */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buscar Factura Original</label>
            <div className="relative">
              <input
                className="input-field font-mono uppercase pl-9"
                placeholder="Ej: FAC-001"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <button type="button" onClick={handleLookup} className="btn-secondary self-end py-2">
            Cargar Factura
          </button>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-secondary/30 rounded-xl p-3">
          <div>
            <span className="text-muted-foreground block">Cliente</span>
            <input
              className="input-field text-xs py-1 mt-0.5"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>
          <div>
            <span className="text-muted-foreground block">Motivo de Devolución</span>
            <select className="input-field text-xs py-1 mt-0.5" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option>Producto defectuoso</option>
              <option>Error de cobro</option>
              <option>Cliente arrepentido</option>
              <option>Producto equivocado</option>
              <option>Fecha vencimiento próxima</option>
            </select>
          </div>
        </div>

        {/* Refund Method */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Método de Reembolso</label>
          <select className="input-field text-xs" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="cash">Efectivo</option>
            <option value="card">Reembolso Tarjeta</option>
            <option value="credit_note">Nota de Crédito</option>
            <option value="exchange">Cambio por otro Producto</option>
          </select>
        </div>

        {/* Product selection list for partial return */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Productos de la Factura (Selecciona Cantidades a Devolver)
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {currentItems.map((l) => (
              <div key={l.sku} className="flex items-center justify-between border border-border rounded-xl p-2.5 bg-card">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-semibold text-foreground truncate">{l.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {l.sku} · Precio: RD$ {l.price} · Comprados: <span className="font-bold text-foreground">{l.maxQty}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Cant. a devolver:</span>
                  <input
                    type="number"
                    min={0}
                    max={l.maxQty}
                    className="input-field w-20 text-center font-bold"
                    value={qty[l.sku] ?? 0}
                    onChange={(e) =>
                      setQty((q) => ({
                        ...q,
                        [l.sku]: Math.min(l.maxQty, Math.max(0, parseInt(e.target.value, 10) || 0)),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Return Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">Tipo: {isFullReturn ? 'Devolución Total' : 'Devolución Parcial'}</span>
            <span className="text-xs font-medium text-foreground">{selectedItems.length} producto(s) seleccionados</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Total Reembolso</span>
            <span className="text-xl font-bold text-danger tabular-nums">
              RD$ {totalReturnAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn-primary flex items-center gap-2" onClick={handleProcessReturn}>
            <RotateCcw size={16} />
            Procesar Devolución
          </button>
        </div>
      </div>
    </div>
  );
}
