import React, { useState } from 'react';
import { X, Printer, Search, RotateCcw, Clock, Shield, AlertCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { logAuditEvent } from '@/lib/auditStore';
import { obtenerVentaPorNumeroFactura } from '@/services/ventas.service';
import { crearDevolucion } from '@/services/devoluciones.service';
import { useAuth } from '@/context/AuthContext';
import PrintableReturnReceipt from '@/components/printing/PrintableReturnReceipt';

interface SaleItem {
  producto_id: string | null;
  sku: string;
  name: string;
  price: number;
  cost: number;
  maxQty: number;
}

interface SaleLookup {
  ventaId: string;
  code: string;
  customer: string;
  clienteId: string | null;
  date: string;
  items: SaleItem[];
}

export default function PosReturnModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [searchCode, setSearchCode] = useState('');
  const [loadedSale, setLoadedSale] = useState<SaleLookup | null>(null);
  const [customer, setCustomer] = useState('');
  const [reason, setReason] = useState('Producto defectuoso');
  const [method, setMethod] = useState<'cash' | 'card' | 'credit_note' | 'exchange'>('cash');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [registeredReturnCode, setRegisteredReturnCode] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLookup = async () => {
    const codeKey = searchCode.trim();
    if (!codeKey) {
      toast.error('Ingresa el número de factura');
      return;
    }
    setLookingUp(true);
    try {
      const venta = await obtenerVentaPorNumeroFactura(codeKey);
      if (!venta || venta.estado === 'anulada') {
        setLoadedSale(null);
        toast.error(`No se encontró la factura ${codeKey.toUpperCase()}`);
        return;
      }
      const items: SaleItem[] = (venta.detalle_ventas ?? []).map((d) => ({
        producto_id: d.producto_id,
        sku: d.producto_id ? d.nombre_item.slice(0, 12) : d.nombre_item,
        name: d.nombre_item,
        price: d.precio_unitario,
        cost: d.costo_unitario,
        maxQty: d.cantidad,
      }));
      if (items.length === 0) {
        toast.error('La factura no tiene ítems para devolver');
        setLoadedSale(null);
        return;
      }
      const sale: SaleLookup = {
        ventaId: venta.id,
        code: venta.numero_factura,
        customer: venta.cliente_nombre ?? 'Cliente general',
        clienteId: venta.cliente_id,
        date: venta.creado_en.slice(0, 10),
        items,
      };
      setLoadedSale(sale);
      setCustomer(sale.customer);
      setQty({});
      toast.success(`Factura ${sale.code} cargada`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al buscar la factura');
    } finally {
      setLookingUp(false);
    }
  };

  const currentItems = loadedSale?.items ?? [];

  const selectedItems = currentItems
    .map((l, idx) => ({ ...l, key: `${l.sku}-${idx}`, qty: qty[`${l.sku}-${idx}`] || 0 }))
    .filter((l) => l.qty > 0);

  const totalReturnAmount = selectedItems.reduce((s, l) => s + l.qty * l.price, 0);
  const isFullReturn =
    currentItems.length > 0 &&
    currentItems.every((item, idx) => (qty[`${item.sku}-${idx}`] || 0) === item.maxQty);

  const methodDb =
    method === 'cash'
      ? 'efectivo'
      : method === 'card'
        ? 'tarjeta'
        : method === 'credit_note'
          ? 'nota_credito'
          : 'cambio';

  const handleProcessReturn = async () => {
    if (!loadedSale) {
      toast.error('Carga una factura primero');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Selecciona al menos un producto e indica la cantidad a devolver');
      return;
    }

    setSubmitting(true);
    try {
      const dev = await crearDevolucion({
        venta_id: loadedSale.ventaId,
        numero_factura: loadedSale.code,
        cliente_id: loadedSale.clienteId,
        cajero_id: user?.id ?? null,
        monto_total: totalReturnAmount,
        motivo: reason,
        metodo_reembolso: methodDb,
        tipo: isFullReturn ? 'total' : 'parcial',
        items: selectedItems.map((l) => ({
          producto_id: l.producto_id,
          sku: l.sku,
          nombre_item: l.name,
          cantidad: l.qty,
          precio_unitario: l.price,
          subtotal: l.qty * l.price,
        })),
      });

      logAuditEvent({
        user: user?.name || user?.email || 'Cajero POS',
        role: 'Cajero',
        action: 'Devolución',
        module: 'Devoluciones',
        details: `Solicitud de devolución ${dev.codigo} (Pendiente) por RD$ ${totalReturnAmount.toLocaleString()} sobre factura ${loadedSale.code}`,
        before: { invoice: loadedSale.code, customer },
        after: { returnCode: dev.codigo, status: 'pendiente', total: totalReturnAmount },
      });

      setRegisteredReturnCode(dev.codigo);
      toast.info(`Solicitud ${dev.codigo} enviada para aprobación del administrador`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar la devolución');
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredReturnCode) {
    return (
      <div className="dialog-inline-host print:p-0 print:bg-white print:static" onClick={onClose}>
        {/* COMPROBANTE OFICIAL PARA IMPRESIÓN (SOLO VISIBLE EN PRINT) */}
        <div className="hidden print:block printable-document">
          <PrintableReturnReceipt
            data={{
              code: registeredReturnCode,
              originalInvoiceCode: loadedSale?.code || '',
              date: new Date().toLocaleDateString('es-DO'),
              customerName: customer || 'Consumidor Final',
              cashierName: user?.name || 'Cajero',
              reason,
              items: selectedItems.map((it) => ({
                name: it.name,
                qty: it.qty,
                price: it.price,
                subtotal: it.qty * it.price,
              })),
              totalAmount: totalReturnAmount,
            }}
          />
        </div>

        {/* VISTA INTERACTIVA WEB (OCULTA EN PRINT) */}
        <div className="print:hidden card w-full max-w-md p-6 space-y-4 text-center shadow-2xl border-amber-500/30" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Clock size={36} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Solicitud de Devolución Enviada</h3>
          <p className="text-sm font-mono text-primary font-bold">{registeredReturnCode}</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
            <Clock size={14} />
            <span>Pendiente de Aprobación por Administrador</span>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 text-xs text-muted-foreground flex items-start gap-2.5 text-left">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              La solicitud fue registrada. Se ha enviado a la pantalla de <strong>Devoluciones</strong> donde un administrador podrá revisarla, aceptarla o rechazarla.
            </p>
          </div>

          <div className="bg-secondary/40 rounded-xl p-4 text-left text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Factura Original:</span><span className="font-semibold">{loadedSale?.code}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span className="font-semibold">{customer}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Motivo:</span><span className="font-semibold">{reason}</span></div>
            <div className="flex justify-between border-t border-border pt-1 font-bold text-sm"><span>Total Solicitado:</span><span className="text-danger">RD$ {totalReturnAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></div>
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
    <div className="dialog-inline-host" onClick={onClose}>
      <div className="card w-full max-w-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <RotateCcw size={20} className="text-danger" />
            <h3 className="font-bold text-foreground text-lg">Devolución de Mercancía</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Shield size={13} />
              Revisión por Admin
            </span>
            <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buscar Factura Original</label>
            <div className="relative">
              <input
                className="input-field font-mono uppercase !pl-9"
                placeholder="Ej: FAC-20260803-..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleLookup();
                }}
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
            </div>
          </div>
          <button type="button" onClick={() => void handleLookup()} disabled={lookingUp} className="btn-secondary self-end py-2">
            {lookingUp ? 'Buscando…' : 'Cargar Factura'}
          </button>
        </div>

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

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Método de Reembolso</label>
          <select className="input-field text-xs" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="cash">Efectivo</option>
            <option value="card">Reembolso Tarjeta</option>
            <option value="credit_note">Nota de Crédito</option>
            <option value="exchange">Cambio por otro Producto</option>
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Productos de la Factura (Selecciona Cantidades a Devolver)
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {currentItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Busca y carga una factura real para continuar</p>
            ) : (
              currentItems.map((l, idx) => {
                const key = `${l.sku}-${idx}`;
                return (
                  <div key={key} className="flex items-center justify-between border border-border rounded-xl p-2.5 bg-card">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-semibold text-foreground truncate">{l.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Precio: RD$ {l.price} · Comprados: <span className="font-bold text-foreground">{l.maxQty}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Cant. a devolver:</span>
                      <input
                        type="number"
                        min={0}
                        max={l.maxQty}
                        className="input-field w-20 text-center font-bold"
                        value={qty[key] ?? 0}
                        onChange={(e) =>
                          setQty((q) => ({
                            ...q,
                            [key]: Math.min(l.maxQty, Math.max(0, parseInt(e.target.value, 10) || 0)),
                          }))
                        }
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting || !loadedSale}
            className="btn-primary flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => void handleProcessReturn()}
          >
            <RotateCcw size={16} />
            {submitting ? 'Enviando…' : 'Solicitar Devolución'}
          </button>
        </div>
      </div>
    </div>
  );
}
