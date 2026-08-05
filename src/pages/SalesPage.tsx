import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import {
  ShoppingCart,
  FileText,
  RotateCcw,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  Printer,
  X,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRightLeft,
  AlertTriangle,
  User,
  Package,
  Edit,
  ChevronDown,
  Receipt,
} from 'lucide-react';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';
import { useVentas } from '@/hooks/useVentas';
import { useCotizaciones } from '@/hooks/useCotizaciones';
import { useDevoluciones } from '@/hooks/useDevoluciones';
import { obtenerClientes } from '@/services/clientes.service';
import { obtenerProductos } from '@/services/productos.service';
import type { Cliente, Producto, MetodoPago } from '@/types/database';
import type { VentaConDetalle } from '@/services/ventas.service';
import {
  obtenerDetalleCotizacion,
  type CotizacionConDetalle,
} from '@/services/cotizaciones.service';

type Tab = 'sales' | 'quotes' | 'returns';

const saleStatusMap: Record<string, { label: string; cls: string }> = {
  completada: { label: 'Completada', cls: 'badge-success' },
  paid: { label: 'Pagada', cls: 'badge-success' },
  anulada: { label: 'Anulada', cls: 'badge-danger' },
  cancelled: { label: 'Cancelada', cls: 'badge-danger' },
  reembolsada: { label: 'Reembolsada', cls: 'badge-warning' },
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  pendiente: { label: 'Pendiente', cls: 'badge-warning' },
  aprobada: { label: 'Aprobada', cls: 'badge-success' },
  approved: { label: 'Aprobada', cls: 'badge-success' },
  rechazada: { label: 'Rechazada', cls: 'badge-danger' },
  rejected: { label: 'Rechazada', cls: 'badge-danger' },
  convertida: { label: 'Convertida', cls: 'badge-info' },
  converted: { label: 'Convertida', cls: 'badge-info' },
};

const metodoLabel: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  mixto: 'Mixto',
  nota_credito: 'Nota de crédito',
  cambio: 'Cambio',
};

interface CartItem {
  producto: Producto;
  cantidad: number;
  precio_unitario: number;
}

export default function SalesPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('sales');
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  // Inline forms (reemplazan la lista, como en Compras) & modals de confirmación
  const [showAddSaleForm, setShowAddSaleForm] = useState(false);
  const [showAddQuoteForm, setShowAddQuoteForm] = useState(false);

  const [viewingSale, setViewingSale] = useState<VentaConDetalle | null>(null);
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false);

  const [anulandoSale, setAnulandoSale] = useState<VentaConDetalle | null>(null);
  const [anularMotivo, setAnularMotivo] = useState('Anulación por error de facturación');

  const [viewingQuote, setViewingQuote] = useState<CotizacionConDetalle | null>(null);
  const [loadingQuoteDetail, setLoadingQuoteDetail] = useState(false);
  const [convertQuote, setConvertQuote] = useState<CotizacionConDetalle | null>(null);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<MetodoPago>('efectivo');

  const [rejectingReturnId, setRejectingReturnId] = useState<string | null>(null);
  const [rejectReturnReason, setRejectReturnReason] = useState('No cumple con las políticas de devolución');

  // Actions dropdown state
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

  // Edit Sale modal state
  const [editingSale, setEditingSale] = useState<VentaConDetalle | null>(null);
  const [editCustomerId, setEditCustomerId] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<MetodoPago>('efectivo');
  const [editTipoNcf, setEditTipoNcf] = useState<string>('B02');
  const [editNcf, setEditNcf] = useState<string>('');
  const [editMontoDescuento, setEditMontoDescuento] = useState<number>(0);
  const [editEstado, setEditEstado] = useState<string>('completada');

  // Print Sale modal state
  const [printingSale, setPrintingSale] = useState<VentaConDetalle | null>(null);
  const [loadingPrintDetail, setLoadingPrintDetail] = useState(false);
  const [printFormat, setPrintFormat] = useState<'ticket' | 'a4'>('a4');

  // Supabase hooks
  const { ventas, total: totalVentas, loading: loadingVentas, cobrar, obtenerDetalle, anular, actualizar } = useVentas({
    busqueda: search,
    fechaInicio: dateFrom || undefined,
    fechaFin: dateTo || undefined,
  });

  const {
    cotizaciones,
    loading: loadingCotizaciones,
    guardarCotizacion,
    cambiarEstado: cambiarEstadoCotizacion,
    convertirAVenta,
  } = useCotizaciones({
    busqueda: tab === 'quotes' ? search : undefined,
  });

  const {
    devoluciones,
    loading: loadingDevoluciones,
    registrarDevolucion,
    procesarEstado: procesarEstadoDevolucion,
  } = useDevoluciones({
    busqueda: tab === 'returns' ? search : undefined,
  });

  // DB Data for creation modals
  const [dbClientes, setDbClientes] = useState<Cliente[]>([]);
  const [dbProductos, setDbProductos] = useState<Producto[]>([]);

  useEffect(() => {
    let active = true;
    obtenerClientes({ limite: 100 }).then((res) => {
      if (active) setDbClientes(res.datos);
    });
    obtenerProductos({ limite: 100 }).then((res) => {
      if (active) setDbProductos(res.datos);
    });
    return () => {
      active = false;
    };
  }, []);

  // Nueva Venta form state
  const [saleCustomerId, setSaleCustomerId] = useState<string>('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<MetodoPago>('efectivo');
  const [saleTipoNcf, setSaleTipoNcf] = useState<string>('B02');
  const [saleCart, setSaleCart] = useState<CartItem[]>([]);
  const [saleMontoPagado, setSaleMontoPagado] = useState<number>(0);
  const [saleSearchProd, setSaleSearchProd] = useState('');

  // Nueva Cotización form state
  const [quoteCustomerId, setQuoteCustomerId] = useState<string>('');
  const [quoteValidaHasta, setQuoteValidaHasta] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [quoteCart, setQuoteCart] = useState<CartItem[]>([]);

  const closeSaleForm = () => {
    setShowAddSaleForm(false);
    setSaleCart([]);
    setSaleMontoPagado(0);
    setSaleSearchProd('');
    setSaleCustomerId('');
    setSalePaymentMethod('efectivo');
    setSaleTipoNcf('B02');
  };

  const closeQuoteForm = () => {
    setShowAddQuoteForm(false);
    setQuoteCart([]);
    setQuoteCustomerId('');
    setQuoteValidaHasta(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  };

  // Open Sale Detail modal with live items
  const handleOpenSaleDetail = async (v: VentaConDetalle) => {
    setViewingSale(v);
    setLoadingSaleDetail(true);
    try {
      const full = await obtenerDetalle(v.id);
      if (full) setViewingSale(full);
    } catch {
      // Keep initial summary
    } finally {
      setLoadingSaleDetail(false);
    }
  };

  const handleOpenQuoteDetail = async (q: CotizacionConDetalle) => {
    setViewingQuote(q);
    setLoadingQuoteDetail(true);
    try {
      const full = await obtenerDetalleCotizacion(q.id);
      if (full) setViewingQuote(full);
    } catch {
      // Keep list summary if detail fails
    } finally {
      setLoadingQuoteDetail(false);
    }
  };

  // Void Sale
  const handleConfirmAnular = async () => {
    if (!anulandoSale) return;
    try {
      await anular(anulandoSale.id, anularMotivo);
      toast.success(`Factura ${anulandoSale.numero_factura} anulada exitosamente`);
      setAnulandoSale(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al anular la venta');
    }
  };

  // Open Edit Sale Modal
  const handleOpenEditSale = (s: VentaConDetalle) => {
    setEditingSale(s);
    setEditCustomerId(s.cliente_id || '');
    setEditPaymentMethod(s.metodo_pago || 'efectivo');
    setEditTipoNcf(s.tipo_ncf || 'B02');
    setEditNcf(s.ncf || '');
    setEditMontoDescuento(s.monto_descuento || 0);
    setEditEstado(s.estado || 'completada');
  };

  // Save Edited Sale
  const handleSaveEditSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    try {
      await actualizar(editingSale.id, {
        cliente_id: editCustomerId || null,
        metodo_pago: editPaymentMethod,
        tipo_ncf: editTipoNcf || null,
        ncf: editNcf || null,
        monto_descuento: Number(editMontoDescuento),
        estado: editEstado as any,
      });
      toast.success(`Factura ${editingSale.numero_factura} actualizada exitosamente`);
      setEditingSale(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la factura');
    }
  };

  // Open Print Sale Modal
  const handleOpenPrintSale = async (s: VentaConDetalle) => {
    setPrintingSale(s);
    setLoadingPrintDetail(true);
    try {
      const full = await obtenerDetalle(s.id);
      if (full) setPrintingSale(full);
    } catch {
      // Keep summary if detail fails
    } finally {
      setLoadingPrintDetail(false);
    }
  };

  // Add Item to New Sale Cart
  const handleAddProductToSaleCart = (p: Producto) => {
    setSaleCart((prev) => {
      const idx = prev.findIndex((item) => item.producto.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].cantidad += 1;
        return next;
      }
      return [...prev, { producto: p, cantidad: 1, precio_unitario: p.precio_venta }];
    });
  };

  // Calculations for New Sale Cart
  const saleSubtotal = useMemo(
    () => saleCart.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0),
    [saleCart]
  );
  const saleTax = useMemo(() => Math.round(saleSubtotal * 0.18 * 100) / 100, [saleSubtotal]);
  const saleTotal = useMemo(() => saleSubtotal + saleTax, [saleSubtotal]);
  const saleCostoTotal = useMemo(
    () => saleCart.reduce((sum, item) => sum + item.cantidad * (item.producto.precio_costo || 0), 0),
    [saleCart]
  );
  const saleDevuelta = useMemo(() => Math.max(0, saleMontoPagado - saleTotal), [saleMontoPagado, saleTotal]);

  // Submit New Sale
  const handleCreateSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleCart.length === 0) {
      toast.error('Agrega al menos un producto al carrito');
      return;
    }

    try {
      const payload = {
        cliente_id: saleCustomerId || null,
        tipo_ncf: saleTipoNcf,
        subtotal: saleSubtotal,
        monto_impuesto: saleTax,
        monto_descuento: 0,
        monto_total: saleTotal,
        costo_total: saleCostoTotal,
        metodo_pago: salePaymentMethod,
        monto_pagado: salePaymentMethod === 'efectivo' ? (saleMontoPagado || saleTotal) : saleTotal,
        devuelta_entregada: saleDevuelta,
        items: saleCart.map((item) => ({
          producto_id: item.producto.id,
          tipo_item: 'producto' as const,
          nombre_item: item.producto.nombre,
          precio_unitario: item.precio_unitario,
          costo_unitario: item.producto.precio_costo || 0,
          cantidad: item.cantidad,
          porcentaje_impuesto: item.producto.porcentaje_impuesto || 18,
          subtotal: item.cantidad * item.precio_unitario,
        })),
      };

      const res = await cobrar(payload);
      toast.success(`¡Venta procesada con éxito! Factura: ${res.numero_factura}`);
      closeSaleForm();
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la venta');
    }
  };

  // Calculations for New Quote Cart
  const quoteSubtotal = useMemo(
    () => quoteCart.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0),
    [quoteCart]
  );
  const quoteTax = useMemo(() => Math.round(quoteSubtotal * 0.18 * 100) / 100, [quoteSubtotal]);
  const quoteTotal = useMemo(() => quoteSubtotal + quoteTax, [quoteSubtotal]);

  // Submit New Quote
  const handleCreateQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteCart.length === 0) {
      toast.error('Agrega al menos un producto a la cotización');
      return;
    }

    try {
      const cot = await guardarCotizacion({
        cliente_id: quoteCustomerId || null,
        subtotal: quoteSubtotal,
        monto_impuesto: quoteTax,
        monto_total: quoteTotal,
        valida_hasta: quoteValidaHasta,
        items: quoteCart.map((it) => ({
          producto_id: it.producto.id,
          nombre_item: it.producto.nombre,
          precio_unitario: it.precio_unitario,
          cantidad: it.cantidad,
          subtotal: it.cantidad * it.precio_unitario,
        })),
      });

      toast.success(`Cotización ${cot.codigo} guardada exitosamente`);
      closeQuoteForm();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la cotización');
    }
  };

  // Convert Quote to Sale
  const handleConfirmConvertQuote = async () => {
    if (!convertQuote) return;
    try {
      const res = await convertirAVenta(convertQuote.id, convertPaymentMethod);
      toast.success(`Cotización convertida a factura: ${res.numero_factura}`);
      setConvertQuote(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al convertir la cotización');
    }
  };

  // Export PDF & Excel
  const handleExportPdf = () => {
    if (tab === 'sales') {
      exportTableToPdf({
        title: 'Historial Detallado de Ventas (Supabase)',
        filename: 'historial-ventas',
        headers: [
          'Factura',
          'NCF',
          'Fecha/Hora',
          'Cliente',
          'Cajero',
          'Pago',
          'Subtotal',
          'ITBIS (18%)',
          'Total',
          'Ganancia',
          'Estado',
        ],
        rows: ventas.map((v) => [
          v.numero_factura,
          v.ncf || '—',
          new Date(v.creado_en).toLocaleString('es-DO'),
          v.cliente_nombre || 'General',
          v.cajero_nombre || 'Cajero',
          metodoLabel[v.metodo_pago] || v.metodo_pago,
          formatMoneyPdf(v.subtotal),
          formatMoneyPdf(v.monto_impuesto),
          formatMoneyPdf(v.monto_total),
          formatMoneyPdf(v.monto_total - v.costo_total),
          saleStatusMap[v.estado]?.label ?? v.estado,
        ]),
        landscape: true,
      });
      return;
    }
    if (tab === 'quotes') {
      exportTableToPdf({
        title: 'Listado de Cotizaciones',
        filename: 'cotizaciones',
        headers: ['Código', 'Cliente', 'Fecha Emisión', 'Válida hasta', 'Total', 'Estado'],
        rows: cotizaciones.map((q) => [
          q.codigo,
          q.cliente_nombre || 'General',
          new Date(q.creado_en).toLocaleDateString('es-DO'),
          q.valida_hasta || '—',
          formatMoneyPdf(q.monto_total),
          saleStatusMap[q.estado]?.label ?? q.estado,
        ]),
      });
      return;
    }
    exportTableToPdf({
      title: 'Historial de Devoluciones de Venta',
      filename: 'devoluciones-venta',
      headers: ['Código', 'Factura Ref.', 'Cliente', 'Fecha', 'Total Reembolso', 'Motivo', 'Estado'],
      rows: devoluciones.map((r) => [
        r.codigo,
        r.numero_factura || '—',
        r.cliente_nombre || 'General',
        new Date(r.creado_en).toLocaleString('es-DO'),
        formatMoneyPdf(r.monto_total),
        r.motivo,
        saleStatusMap[r.estado]?.label ?? r.estado,
      ]),
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Historial Detallado de Ventas',
      filename: 'historial-ventas',
      headers: [
        'Factura',
        'NCF',
        'Fecha',
        'Cliente',
        'Cajero',
        'Método Pago',
        'Subtotal',
        'ITBIS (18%)',
        'Descuento',
        'Total Factura',
        'Costo Total',
        'Ganancia Bruta',
        'Estado',
      ],
      rows: ventas.map((v) => [
        v.numero_factura,
        v.ncf || '',
        new Date(v.creado_en).toLocaleString('es-DO'),
        v.cliente_nombre || 'General',
        v.cajero_nombre || 'Cajero',
        metodoLabel[v.metodo_pago] || v.metodo_pago,
        v.subtotal,
        v.monto_impuesto,
        v.monto_descuento,
        v.monto_total,
        v.costo_total,
        v.monto_total - v.costo_total,
        saleStatusMap[v.estado]?.label ?? v.estado,
      ]),
    });
  };

  if (showAddSaleForm) {
    return (
      <AppLayout>
        <div className="space-y-6 slide-up">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ShoppingCart className="text-primary" size={26} />
                Nueva Venta
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Registrar factura con ITBIS 18% transparentado y actualizar inventario
              </p>
            </div>
            <button type="button" onClick={closeSaleForm} className="btn-secondary">
              ← Volver a Ventas
            </button>
          </div>

          <form onSubmit={handleCreateSaleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Información de la Venta</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente</label>
                    <select
                      className="input-field"
                      value={saleCustomerId}
                      onChange={(e) => setSaleCustomerId(e.target.value)}
                    >
                      <option value="">Cliente General (Contado)</option>
                      {dbClientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.rnc_cedula ? `(${c.rnc_cedula})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo Comprobante (NCF)</label>
                    <select
                      className="input-field"
                      value={saleTipoNcf}
                      onChange={(e) => setSaleTipoNcf(e.target.value)}
                    >
                      <option value="B02">Factura Consumo (B02)</option>
                      <option value="B01">Crédito Fiscal (B01)</option>
                      <option value="B14">Gubernamental (B14)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Método de Pago</label>
                    <select
                      className="input-field"
                      value={salePaymentMethod}
                      onChange={(e) => setSalePaymentMethod(e.target.value as MetodoPago)}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                      <option value="credito">Crédito (A pagar)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">Productos</h3>
                  <p className="text-xs text-muted-foreground">Busca y agrega ítems al carrito de la venta</p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="input-field !pl-10"
                    placeholder="Buscar producto por nombre o código..."
                    value={saleSearchProd}
                    onChange={(e) => setSaleSearchProd(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border text-sm">
                  {dbProductos
                    .filter((p) => p.nombre.toLowerCase().includes(saleSearchProd.toLowerCase()))
                    .slice(0, 10)
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleAddProductToSaleCart(p)}
                        className="px-3.5 py-3 hover:bg-primary/10 cursor-pointer flex justify-between items-center transition-colors gap-3"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground block truncate">{p.nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            Stock: {p.stock_actual} {p.unidad}
                          </span>
                        </div>
                        <span className="font-bold text-primary whitespace-nowrap">
                          RD$ {p.precio_venta.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 border-b border-border">
                      <tr>
                        <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Producto</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Precio</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground">Cant.</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">Subtotal</th>
                        <th className="px-3 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {saleCart.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-muted-foreground">
                            El carrito de ventas está vacío. Selecciona productos arriba.
                          </td>
                        </tr>
                      ) : (
                        saleCart.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2.5 font-medium">{item.producto.nombre}</td>
                            <td className="px-3 py-2.5">RD$ {item.precio_unitario.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="number"
                                min={1}
                                value={item.cantidad}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value) || 1);
                                  setSaleCart((prev) =>
                                    prev.map((c, i) => (i === idx ? { ...c, cantidad: val } : c))
                                  );
                                }}
                                className="input-field text-center w-16 py-1.5 text-sm inline-block"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold">
                              RD$ {(item.cantidad * item.precio_unitario).toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => setSaleCart((prev) => prev.filter((_, i) => i !== idx))}
                                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="card p-5 space-y-3.5 bg-secondary/20 sticky top-4">
                <h4 className="font-bold text-foreground border-b border-border pb-2.5">Resumen de Factura</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal Neto</span>
                  <span className="font-mono font-medium">
                    RD$ {saleSubtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ITBIS Transparentado (18%)</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    RD$ {saleTax.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-black text-foreground text-lg">
                  <span>Total Venta</span>
                  <span className="text-primary font-mono">
                    RD$ {saleTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {salePaymentMethod === 'efectivo' && (
                  <div className="pt-2 space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">Monto Recibido</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      className="input-field font-mono"
                      value={saleMontoPagado || ''}
                      onChange={(e) => setSaleMontoPagado(Number(e.target.value))}
                    />
                    <div className="flex justify-between text-sm font-bold">
                      <span>Devuelta / Cambio:</span>
                      <span className="text-emerald-600 font-mono">
                        RD$ {saleDevuelta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saleCart.length === 0}
                    className="btn-primary w-full py-3 font-bold shadow-md disabled:opacity-50"
                  >
                    Procesar y Guardar
                  </button>
                  <button type="button" onClick={closeSaleForm} className="btn-secondary w-full">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </AppLayout>
    );
  }

  if (showAddQuoteForm) {
    return (
      <AppLayout>
        <div className="space-y-6 slide-up">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText className="text-primary" size={26} />
                Nueva Cotización
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Crear cotización comercial con validez y productos del catálogo
              </p>
            </div>
            <button type="button" onClick={closeQuoteForm} className="btn-secondary">
              ← Volver a Ventas
            </button>
          </div>

          <form onSubmit={handleCreateQuoteSubmit} className="space-y-4">
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Información de la Cotización</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente</label>
                  <select
                    className="input-field"
                    value={quoteCustomerId}
                    onChange={(e) => setQuoteCustomerId(e.target.value)}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {dbClientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Válida Hasta</label>
                  <input
                    type="date"
                    className="input-field"
                    value={quoteValidaHasta}
                    onChange={(e) => setQuoteValidaHasta(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Productos</h3>
                <p className="text-xs text-muted-foreground">Selecciona productos para agregarlos a la cotización</p>
              </div>
              <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border text-sm">
                {dbProductos.slice(0, 12).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setQuoteCart((prev) => {
                        const idx = prev.findIndex((item) => item.producto.id === p.id);
                        if (idx >= 0) {
                          const next = [...prev];
                          next[idx].cantidad += 1;
                          return next;
                        }
                        return [...prev, { producto: p, cantidad: 1, precio_unitario: p.precio_venta }];
                      });
                    }}
                    className="px-3.5 py-3 hover:bg-primary/10 cursor-pointer flex justify-between items-center transition-colors gap-3"
                  >
                    <span className="font-semibold text-foreground truncate">{p.nombre}</span>
                    <span className="font-bold text-primary whitespace-nowrap">
                      RD$ {p.precio_venta.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 border-b border-border">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Producto</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Precio</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground">Cant.</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">Subtotal</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quoteCart.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                          Selecciona productos arriba para agregarlos a la cotización
                        </td>
                      </tr>
                    ) : (
                      quoteCart.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2.5 font-medium">{item.producto.nombre}</td>
                          <td className="px-3 py-2.5">RD$ {item.precio_unitario.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.cantidad}
                              onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value) || 1);
                                setQuoteCart((prev) =>
                                  prev.map((c, i) => (i === idx ? { ...c, cantidad: val } : c))
                                );
                              }}
                              className="input-field text-center w-16 py-1.5 text-sm inline-block"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold">
                            RD$ {(item.cantidad * item.precio_unitario).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setQuoteCart((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 text-rose-500 rounded hover:bg-rose-500/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
                <div className="font-bold text-base">
                  Total Cotización:{' '}
                  <span className="text-primary font-mono text-lg">
                    RD$ {quoteTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={closeQuoteForm} className="btn-secondary">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={quoteCart.length === 0}
                    className="btn-primary font-bold disabled:opacity-50"
                  >
                    Guardar Cotización
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="text-primary" size={26} />
              Módulo de Ventas y Gestión Comercial
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control de ventas, facturación con ITBIS 18% transparentado, cotizaciones y devoluciones con Supabase
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddQuoteForm(true)}
              className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
            >
              <FileText size={15} /> Nueva Cotización
            </button>
            <button
              onClick={() => setShowAddSaleForm(true)}
              className="btn-primary flex items-center gap-2 font-bold shadow-md"
            >
              <Plus size={16} /> Nueva Venta
            </button>
          </div>
        </div>

        {/* Live Key Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 hover:border-primary/40 transition-all">
            <p className="text-xs text-muted-foreground font-medium">Ventas Totales (En Filtro)</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              RD$ {ventas.reduce((s, x) => s + x.monto_total, 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4 hover:border-emerald-500/40 transition-all">
            <p className="text-xs text-muted-foreground font-medium">Ganancia Bruta Estimada</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              RD${' '}
              {ventas
                .reduce((s, x) => s + (x.monto_total - x.costo_total), 0)
                .toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4 hover:border-amber-500/40 transition-all">
            <p className="text-xs text-muted-foreground font-medium">ITBIS (18% Transparentado)</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              RD$ {ventas.reduce((s, x) => s + x.monto_impuesto, 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4 hover:border-blue-500/40 transition-all">
            <p className="text-xs text-muted-foreground font-medium">Facturas Emitidas</p>
            <p className="text-2xl font-bold text-info mt-1">{totalVentas} facturas</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit flex-wrap border border-border/60">
          {[
            { id: 'sales' as Tab, label: 'Todas las Ventas', icon: <ShoppingCart size={16} />, count: totalVentas },
            { id: 'quotes' as Tab, label: 'Cotizaciones', icon: <FileText size={16} />, count: cotizaciones.length },
            { id: 'returns' as Tab, label: 'Devoluciones', icon: <RotateCcw size={16} />, count: devoluciones.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t.id
                  ? 'bg-card text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-secondary text-muted-foreground font-mono">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buscar en Supabase</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="input-field !pl-9"
                  placeholder="Buscar por número de factura, NCF, cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Desde (Fecha)</label>
              <input
                type="date"
                className="input-field"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Hasta (Fecha)</label>
              <input
                type="date"
                className="input-field"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground font-medium">
              Mostrando {tab === 'sales' ? ventas.length : tab === 'quotes' ? cotizaciones.length : devoluciones.length}{' '}
              registro(s)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
              >
                <Download size={14} /> PDF
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: TODAS LAS VENTAS */}
        {tab === 'sales' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Factura / NCF</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha/Hora</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                      Cajero
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                      Método Pago
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Subtotal</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">ITBIS 18%</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">
                      Ganancia
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Estado
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingVentas ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                        Cargando ventas desde Supabase...
                      </td>
                    </tr>
                  ) : ventas.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                        No se encontraron ventas registradas
                      </td>
                    </tr>
                  ) : (
                    ventas.map((s, i) => (
                      <tr
                        key={s.id}
                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-secondary/10'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono text-primary font-bold">{s.numero_factura}</div>
                          {s.ncf && <div className="text-[10px] text-muted-foreground font-mono">NCF: {s.ncf}</div>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(s.creado_en).toLocaleString('es-DO')}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{s.cliente_nombre || 'Cliente General'}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                          {s.cajero_nombre || 'Cajero'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                          <span className="badge-neutral">{metodoLabel[s.metodo_pago] || s.metodo_pago}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          RD$ {s.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                          RD$ {s.monto_impuesto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          RD$ {s.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400 hidden xl:table-cell">
                          RD$ {(s.monto_total - s.costo_total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={saleStatusMap[s.estado]?.cls ?? 'badge-neutral'}>
                            {saleStatusMap[s.estado]?.label ?? s.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setOpenActionsId(openActionsId === s.id ? null : s.id)}
                              className="btn-secondary py-1 px-3 text-xs font-bold flex items-center gap-1.5 hover:border-primary/50 transition-all shadow-xs"
                            >
                              <span>Acciones</span>
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${
                                  openActionsId === s.id ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {openActionsId === s.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setOpenActionsId(null)}
                                />
                                <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-card border border-border shadow-2xl z-40 py-1 divide-y divide-border/60 text-xs animate-in fade-in zoom-in-95">
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionsId(null);
                                        void handleOpenSaleDetail(s);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-foreground hover:bg-primary/10 hover:text-primary flex items-center gap-2.5 font-semibold transition-colors"
                                    >
                                      <Eye size={15} className="text-primary" />
                                      <span>Ver Detalle</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionsId(null);
                                        handleOpenEditSale(s);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-foreground hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2.5 font-semibold transition-colors"
                                    >
                                      <Edit size={15} className="text-amber-500" />
                                      <span>Editar Factura</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionsId(null);
                                        void handleOpenPrintSale(s);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-foreground hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 font-semibold transition-colors"
                                    >
                                      <Printer size={15} className="text-blue-500" />
                                      <span>Imprimir Factura</span>
                                    </button>
                                  </div>
                                  {s.estado !== 'anulada' && (
                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionsId(null);
                                          setAnulandoSale(s);
                                        }}
                                        className="w-full text-left px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 font-semibold transition-colors"
                                      >
                                        <Trash2 size={15} />
                                        <span>Eliminar / Anular</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: COTIZACIONES */}
        {tab === 'quotes' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Fecha Emisión
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Válida hasta
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCotizaciones ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        Cargando cotizaciones desde Supabase...
                      </td>
                    </tr>
                  ) : cotizaciones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        No hay cotizaciones registradas
                      </td>
                    </tr>
                  ) : (
                    cotizaciones.map((q, i) => (
                      <tr
                        key={q.id}
                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-secondary/10'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-primary font-bold">{q.codigo}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{q.cliente_nombre || 'Cliente general'}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                          {new Date(q.creado_en).toLocaleDateString('es-DO')}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs font-mono">
                          {q.valida_hasta || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          RD$ {q.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={saleStatusMap[q.estado]?.cls ?? 'badge-neutral'}>
                            {saleStatusMap[q.estado]?.label ?? q.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {q.estado === 'pendiente' && (
                              <button
                                onClick={() => setConvertQuote(q)}
                                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-xs font-bold flex items-center gap-1 transition-all"
                                title="Convertir a Factura"
                              >
                                <ArrowRightLeft size={13} /> Convertir Venta
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleOpenQuoteDetail(q)}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              title="Ver Detalle Cotización"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DEVOLUCIONES */}
        {tab === 'returns' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Factura Ref.</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Cliente
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Fecha
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total Reembolso</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                      Motivo
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDevoluciones ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        Cargando devoluciones desde Supabase...
                      </td>
                    </tr>
                  ) : devoluciones.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        No hay devoluciones registradas
                      </td>
                    </tr>
                  ) : (
                    devoluciones.map((r, i) => (
                      <tr
                        key={r.id}
                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-secondary/10'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-rose-600 dark:text-rose-400 font-bold">{r.codigo}</td>
                        <td className="px-4 py-3 font-mono text-primary font-semibold">
                          {r.numero_factura || '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {r.cliente_nombre || 'Cliente general'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                          {new Date(r.creado_en).toLocaleString('es-DO')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          RD$ {r.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{r.motivo}</td>
                        <td className="px-4 py-3">
                          <span className={saleStatusMap[r.estado]?.cls ?? 'badge-neutral'}>
                            {saleStatusMap[r.estado]?.label ?? r.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.estado === 'pendiente' ? (
                              <>
                                <button
                                  onClick={() => {
                                    procesarEstadoDevolucion(r.id, 'aprobada');
                                    toast.success(`Devolución ${r.codigo} aprobada exitosamente`);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1"
                                >
                                  <CheckCircle size={13} /> Aprobar
                                </button>
                                <button
                                  onClick={() => setRejectingReturnId(r.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1"
                                >
                                  <XCircle size={13} /> Rechazar
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground font-mono">Procesado</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: VIEW SALE DETAIL & TAX BREAKDOWN */}
        {viewingSale && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setViewingSale(null)}
          >
            <div
              className="card w-full max-w-xl p-6 space-y-4 shadow-2xl border-primary/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                    <FileText className="text-primary" size={20} />
                    Detalle de Factura {viewingSale.numero_factura}
                  </h3>
                  {viewingSale.ncf && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">NCF Fiscal: {viewingSale.ncf}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setViewingSale(null)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {loadingSaleDetail ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Cargando productos de factura...</div>
              ) : (
                <div className="space-y-3 text-xs">
                  {/* General Info */}
                  <div className="grid grid-cols-2 gap-2 bg-secondary/30 rounded-xl p-3">
                    <div>
                      <span className="text-muted-foreground block">Cliente:</span>
                      <span className="font-bold text-foreground">{viewingSale.cliente_nombre || 'Cliente general'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Fecha / Hora:</span>
                      <span>{new Date(viewingSale.creado_en).toLocaleString('es-DO')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Cajero Solicitante:</span>
                      <span>{viewingSale.cajero_nombre || 'Cajero'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Método de Pago:</span>
                      <span className="badge-neutral font-medium">
                        {metodoLabel[viewingSale.metodo_pago] || viewingSale.metodo_pago}
                      </span>
                    </div>
                  </div>

                  {/* Detalle de productos */}
                  <div className="space-y-1">
                    <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                      Ítems de Facturación ({viewingSale.detalle_ventas?.length || 0})
                    </p>
                    <div className="bg-secondary/40 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                      {(viewingSale.detalle_ventas || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center border-b border-border/40 pb-1.5 last:border-none"
                        >
                          <div>
                            <span className="font-semibold text-foreground">{item.nombre_item}</span>
                            <span className="text-[11px] text-muted-foreground block font-mono">
                              {item.cantidad}x @ RD${' '}
                              {item.precio_unitario.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <span className="font-bold font-mono text-foreground">
                            RD$ {item.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transparencia Fiscal ITBIS */}
                  <div className="border-t border-border pt-3 space-y-1.5">
                    <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                      Transparencia Fiscal y Costos
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal Neto:</span>
                      <span className="font-mono">
                        RD$ {viewingSale.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descuento Aplicado:</span>
                      <span className="font-mono text-emerald-600">
                        - RD$ {viewingSale.monto_descuento.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-muted-foreground">ITBIS (18% Transparentado):</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                        RD$ {viewingSale.monto_impuesto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                      <span>Total Factura:</span>
                      <span className="text-primary font-black text-base">
                        RD$ {viewingSale.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Rentabilidad */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium block">Costo de Inversión:</span>
                      <span className="font-mono text-foreground font-semibold">
                        RD$ {viewingSale.costo_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground font-medium block">Ganancia Bruta:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        RD${' '}
                        {(viewingSale.monto_total - viewingSale.costo_total).toLocaleString('es-DO', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary flex items-center gap-1.5 text-xs py-2"
                >
                  <Printer size={14} /> Imprimir Factura
                </button>
                <button type="button" onClick={() => setViewingSale(null)} className="btn-primary text-xs py-2">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW QUOTE DETAIL */}
        {viewingQuote && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setViewingQuote(null)}
          >
            <div
              className="card w-full max-w-xl p-6 space-y-4 shadow-2xl border-primary/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                    <FileText className="text-primary" size={20} />
                    Cotización {viewingQuote.codigo}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Estado:{' '}
                    <span className={saleStatusMap[viewingQuote.estado]?.cls ?? 'badge-neutral'}>
                      {saleStatusMap[viewingQuote.estado]?.label ?? viewingQuote.estado}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingQuote(null)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {loadingQuoteDetail ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Cargando detalle de cotización...
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-secondary/30 rounded-xl p-3">
                    <div>
                      <span className="text-muted-foreground block">Cliente:</span>
                      <span className="font-bold text-foreground">
                        {viewingQuote.cliente_nombre || 'Cliente general'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Fecha emisión:</span>
                      <span>{new Date(viewingQuote.creado_en).toLocaleString('es-DO')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Válida hasta:</span>
                      <span className="font-mono">{viewingQuote.valida_hasta || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Vendedor:</span>
                      <span>{viewingQuote.vendedor_nombre || '—'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                      Ítems ({viewingQuote.items?.length || 0})
                    </p>
                    <div className="bg-secondary/40 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                      {(viewingQuote.items || []).length === 0 ? (
                        <p className="text-muted-foreground text-center py-2">Sin ítems</p>
                      ) : (
                        (viewingQuote.items || []).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center border-b border-border/40 pb-1.5 last:border-none"
                          >
                            <div>
                              <span className="font-semibold text-foreground">{item.nombre_item}</span>
                              <span className="text-[11px] text-muted-foreground block font-mono">
                                {item.cantidad}x @ RD${' '}
                                {item.precio_unitario.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <span className="font-bold font-mono text-foreground">
                              RD$ {item.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-mono">
                        RD$ {viewingQuote.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-muted-foreground">ITBIS:</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                        RD$ {viewingQuote.monto_impuesto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                      <span>Total:</span>
                      <span className="text-primary font-black text-base">
                        RD$ {viewingQuote.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => setViewingQuote(null)} className="btn-primary text-xs py-2">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}


        {/* MODAL 4: CONVERTIR COTIZACIÓN A VENTA */}
        {convertQuote && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-xs animate-in fade-in"
            onClick={() => setConvertQuote(null)}
          >
            <div
              className="card w-full max-w-md p-6 space-y-4 shadow-2xl border-primary/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="text-primary" size={22} />
                  <h3 className="font-extrabold text-foreground text-lg">Convertir Cotización a Venta</h3>
                </div>
                <button type="button" onClick={() => setConvertQuote(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Estás a punto de procesar la cotización <strong className="font-mono text-foreground">{convertQuote.codigo}</strong> por el monto total de{' '}
                <strong className="text-primary">
                  RD$ {convertQuote.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </strong>
                . Se generará una factura formal y se descontará el stock en Supabase.
              </p>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Seleccionar Método de Pago</label>
                <select
                  className="input-field text-xs py-2 w-full"
                  value={convertPaymentMethod}
                  onChange={(e) => setConvertPaymentMethod(e.target.value as MetodoPago)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => setConvertQuote(null)} className="btn-secondary text-xs py-2">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmConvertQuote}
                  className="btn-primary text-xs py-2 font-bold flex items-center gap-1.5"
                >
                  <CheckCircle size={15} /> Confirmar Facturación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: ANULAR FACTURA */}
        {anulandoSale && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-xs animate-in fade-in"
            onClick={() => setAnulandoSale(null)}
          >
            <div
              className="card w-full max-w-md p-6 space-y-4 shadow-2xl border-rose-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={24} />
                  <h3 className="font-extrabold text-foreground text-lg">Anular Factura de Venta</h3>
                </div>
                <button type="button" onClick={() => setAnulandoSale(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                ¿Estás seguro de anular la factura <strong className="font-mono text-foreground">{anulandoSale.numero_factura}</strong> por{' '}
                <strong className="text-rose-600 font-bold">
                  RD$ {anulandoSale.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </strong>
                ? El estado de la factura cambiará a &quot;Anulada&quot; y el stock será restaurado en la base de datos.
              </p>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Motivo de Anulación</label>
                <input
                  className="input-field text-xs py-1.5 w-full"
                  value={anularMotivo}
                  onChange={(e) => setAnularMotivo(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => setAnulandoSale(null)} className="btn-secondary text-xs py-2">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAnular}
                  className="btn-primary text-xs py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Confirmar Anulación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDITAR FACTURA */}
        {editingSale && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setEditingSale(null)}
          >
            <div
              className="card w-full max-w-lg p-6 space-y-4 shadow-2xl border-amber-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Edit size={22} />
                  <h3 className="font-extrabold text-foreground text-lg">
                    Editar Factura {editingSale.numero_factura}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditSale} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-muted-foreground mb-1 block">Cliente</label>
                    <select
                      className="input-field w-full"
                      value={editCustomerId}
                      onChange={(e) => setEditCustomerId(e.target.value)}
                    >
                      <option value="">Cliente General (Contado)</option>
                      {dbClientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.rnc_cedula ? `(${c.rnc_cedula})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground mb-1 block">Método de Pago</label>
                    <select
                      className="input-field w-full"
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value as MetodoPago)}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                      <option value="credito">Crédito</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground mb-1 block">Tipo de NCF</label>
                    <select
                      className="input-field w-full"
                      value={editTipoNcf}
                      onChange={(e) => setEditTipoNcf(e.target.value)}
                    >
                      <option value="B02">Factura Consumo (B02)</option>
                      <option value="B01">Crédito Fiscal (B01)</option>
                      <option value="B14">Gubernamental (B14)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground mb-1 block">NCF Fiscal</label>
                    <input
                      type="text"
                      className="input-field w-full font-mono"
                      placeholder="Ej: B0200000001"
                      value={editNcf}
                      onChange={(e) => setEditNcf(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground mb-1 block">Descuento Aplicado (RD$)</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      className="input-field w-full font-mono"
                      value={editMontoDescuento}
                      onChange={(e) => setEditMontoDescuento(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground mb-1 block">Estado de Factura</label>
                    <select
                      className="input-field w-full"
                      value={editEstado}
                      onChange={(e) => setEditEstado(e.target.value)}
                    >
                      <option value="completada">Completada / Pagada</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="anulada">Anulada</option>
                    </select>
                  </div>
                </div>

                <div className="bg-secondary/30 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Monto Total Actual:</span>
                    <span className="font-bold text-foreground font-mono">
                      RD$ {editingSale.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Fecha Emisión:</span>
                    <span>{new Date(editingSale.creado_en).toLocaleString('es-DO')}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEditingSale(null)}
                    className="btn-secondary text-xs py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle size={15} /> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: IMPRIMIR FACTURA */}
        {printingSale && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in print:p-0 print:bg-white print:static"
            onClick={() => setPrintingSale(null)}
          >
            <div
              className="card w-full max-w-2xl p-6 space-y-4 shadow-2xl border-blue-500/20 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:w-full print:p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3 print:hidden">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Printer size={22} />
                  <div>
                    <h3 className="font-extrabold text-foreground text-lg">
                      Imprimir Factura {printingSale.numero_factura}
                    </h3>
                    {printingSale.ncf && (
                      <p className="text-xs text-muted-foreground font-mono">NCF: {printingSale.ncf}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex p-1 bg-secondary rounded-xl text-xs font-bold border border-border">
                    <button
                      type="button"
                      onClick={() => setPrintFormat('a4')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        printFormat === 'a4'
                          ? 'bg-card text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <FileText size={13} /> Hoja A4
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintFormat('ticket')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        printFormat === 'ticket'
                          ? 'bg-card text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Receipt size={13} /> Ticket 80mm
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrintingSale(null)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {loadingPrintDetail ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Cargando información de impresión...
                </div>
              ) : printFormat === 'ticket' ? (
                /* Ticket Format (Thermal printer 80mm) */
                <div className="max-w-xs mx-auto bg-card p-5 rounded-2xl border border-border font-mono text-xs space-y-4 print:bg-white print:border-none print:shadow-none print:w-full">
                  <div className="text-center space-y-1 pb-3 border-b border-dashed border-border">
                    <h3 className="font-black text-sm uppercase text-foreground">MERCATO SUPERMERCADO</h3>
                    <p className="text-[11px] text-muted-foreground">RNC: 131-45678-9</p>
                    <p className="text-[10px] text-muted-foreground">Santo Domingo, Rep. Dom.</p>
                  </div>

                  <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-border">
                    <p className="font-bold text-foreground">Factura: {printingSale.numero_factura}</p>
                    {printingSale.ncf && (
                      <p className="font-black text-primary text-xs">NCF: {printingSale.ncf}</p>
                    )}
                    <p className="text-muted-foreground">
                      Fecha: {new Date(printingSale.creado_en).toLocaleString('es-DO')}
                    </p>
                    <p className="text-muted-foreground">
                      Cliente: {printingSale.cliente_nombre || 'Consumidor Final'}
                    </p>
                    <p className="text-muted-foreground">
                      Cajero: {printingSale.cajero_nombre || 'Cajero'}
                    </p>
                  </div>

                  <div className="space-y-2 pb-3 border-b border-dashed border-border">
                    {(printingSale.detalle_ventas || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-[11px]">
                        <div>
                          <span className="font-bold text-foreground block">{item.nombre_item}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {item.cantidad} x RD$ {item.precio_unitario.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <span className="font-bold tabular-nums font-mono">
                          RD$ {item.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 text-[11px] pt-1 font-bold text-right">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>RD$ {printingSale.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {printingSale.monto_descuento > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Descuento:</span>
                        <span>- RD$ {printingSale.monto_descuento.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>ITBIS (18%):</span>
                      <span>RD$ {printingSale.monto_impuesto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-foreground font-black text-sm pt-1 border-t border-border">
                      <span>TOTAL FACTURA:</span>
                      <span className="text-primary">
                        RD$ {printingSale.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="text-center pt-2 text-[10px] text-muted-foreground space-y-0.5">
                    <p>Comprobante Emitido según Normas DGII</p>
                    <p>¡Gracias por su preferencia!</p>
                  </div>
                </div>
              ) : (
                /* Documento A4 Format */
                <div className="space-y-5 bg-card p-4 rounded-2xl border border-border print:border-none print:p-0">
                  <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                      <h2 className="text-xl font-black text-foreground">MERCATO SUPERMERCADO S.R.L.</h2>
                      <p className="text-xs text-muted-foreground">RNC: 131-45678-9 | Tel: (809) 555-0199</p>
                      <p className="text-xs text-muted-foreground">Santo Domingo, República Dominicana</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full inline-block">
                        FACTURA {printingSale.numero_factura}
                      </span>
                      {printingSale.ncf && (
                        <p className="text-xs font-mono font-bold text-foreground mt-1">NCF: {printingSale.ncf}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Fecha: {new Date(printingSale.creado_en).toLocaleString('es-DO')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-secondary/30 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-muted-foreground block font-semibold">CLIENTE:</span>
                      <span className="font-bold text-foreground">{printingSale.cliente_nombre || 'Consumidor Final'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-semibold">MÉTODO DE PAGO:</span>
                      <span className="font-bold text-foreground uppercase">{metodoLabel[printingSale.metodo_pago] || printingSale.metodo_pago}</span>
                    </div>
                  </div>

                  <table className="w-full text-xs">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="text-left py-2 px-3">Ítem / Producto</th>
                        <th className="text-center py-2 px-3">Cant.</th>
                        <th className="text-right py-2 px-3">Precio Unit.</th>
                        <th className="text-right py-2 px-3">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(printingSale.detalle_ventas || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-medium">{item.nombre_item}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{item.cantidad}</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            RD$ {item.precio_unitario.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold font-mono">
                            RD$ {item.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-3 border-t border-border">
                    <div className="w-64 space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal Neto:</span>
                        <span className="font-mono font-medium">
                          RD$ {printingSale.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {printingSale.monto_descuento > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Descuento:</span>
                          <span className="font-mono">
                            - RD$ {printingSale.monto_descuento.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                        <span>ITBIS (18% Transparentado):</span>
                        <span className="font-mono">
                          RD$ {printingSale.monto_impuesto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between font-black text-foreground text-sm pt-2 border-t border-border">
                        <span>Total Factura:</span>
                        <span className="text-primary font-mono text-base">
                          RD$ {printingSale.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    exportTableToPdf({
                      title: `FACTURA FISCAL - ${printingSale.numero_factura}`,
                      subtitle: `Cliente: ${printingSale.cliente_nombre || 'Consumidor Final'} | NCF: ${printingSale.ncf || 'N/A'}`,
                      filename: `factura-${printingSale.numero_factura}`,
                      headers: ['Producto', 'Cant.', 'Precio Unit.', 'Subtotal'],
                      rows: (printingSale.detalle_ventas || []).map((it) => [
                        it.nombre_item,
                        it.cantidad,
                        formatMoneyPdf(it.precio_unitario),
                        formatMoneyPdf(it.subtotal),
                      ]),
                    });
                  }}
                  className="btn-secondary text-xs py-2 flex items-center gap-1.5"
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary text-xs py-2 font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer size={15} /> Imprimir Ahora
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
