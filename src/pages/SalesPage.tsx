import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  Banknote,
  CreditCard,
  Smartphone,
  Split,
  Layers,
  MoreVertical,
  ChevronLeft,
} from 'lucide-react';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from '@/lib/toast';
import { useVentas } from '@/hooks/useVentas';
import { useCotizaciones } from '@/hooks/useCotizaciones';
import { useDevoluciones } from '@/hooks/useDevoluciones';
import { obtenerClientes } from '@/services/clientes.service';
import { obtenerProductos } from '@/services/productos.service';
import type { Cliente, Producto, MetodoPago } from '@/types/database';
import type { VentaConDetalle } from '@/services/ventas.service';
import PrintableInvoice from '@/components/PrintableInvoice';
import { getInvoiceSettings } from '@/lib/invoiceSettingsStore';
import {
  obtenerDetalleCotizacion,
  type CotizacionConDetalle,
} from '@/services/cotizaciones.service';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissionsStore';
import '@/styles/apple-tokens.css';
import SalesHeader from './sales/components/SalesHeader';
import SalesMetrics from './sales/components/SalesMetrics';
import SalesToolbar from './sales/components/SalesToolbar';
import SalesEmptyState from './sales/components/SalesEmptyState';
import SalesTable from './sales/components/SalesTable';
import SaleDrawer from './sales/components/SaleDrawer';
import VoidSaleDialog from './sales/components/VoidSaleDialog';
import ReturnSaleDialog, { type ReturnPayloadData } from './sales/components/ReturnSaleDialog';
import {
  fromVentaConDetalleToSale,
  calculatePeriodDates,
  type SalesTab,
  type SalesPeriod,
} from './sales/types';

type Tab = SalesTab;

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
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State Synchronization
  const tab = (searchParams.get('tab') as SalesTab) || 'sales';
  const period = (searchParams.get('period') as SalesPeriod) || 'all';
  const urlFrom = searchParams.get('from') || '';
  const urlTo = searchParams.get('to') || '';
  const search = searchParams.get('q') || '';
  const sortField = searchParams.get('sort') || 'date';
  const sortDir = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

  const updateUrlParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (
              !value ||
              value.trim() === '' ||
              (key === 'tab' && value === 'sales') ||
              (key === 'period' && value === 'all') ||
              (key === 'sort' && value === 'date') ||
              (key === 'order' && value === 'desc')
            ) {
              next.delete(key);
            } else {
              next.set(key, value.trim());
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const effectiveDates = useMemo(() => {
    if (period === 'custom') {
      return { from: urlFrom, to: urlTo };
    }
    return calculatePeriodDates(period);
  }, [period, urlFrom, urlTo]);

  const dateFrom = effectiveDates.from;
  const dateTo = effectiveDates.to;

  const handleClearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('period');
        next.delete('from');
        next.delete('to');
        next.delete('q');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const isAdmin = user?.role === 'Administrador';
  const canSeeAllSales = isAdmin || user?.role === 'Contador';
  const canEditSales = hasPermission(user?.role ?? 'Cajero', 'ventas', 'editar');
  const canDeleteSales = hasPermission(user?.role ?? 'Cajero', 'ventas', 'eliminar');
  const canCreateSales = hasPermission(user?.role ?? 'Cajero', 'ventas', 'crear');
  const canExportSales = hasPermission(user?.role ?? 'Cajero', 'ventas', 'exportar');
  const ownCajeroId = !canSeeAllSales ? user?.id : undefined;

  // Inline forms (reemplazan la lista, como en Compras) & modals de confirmación
  const [showAddSaleForm, setShowAddSaleForm] = useState(false);
  const [showAddQuoteForm, setShowAddQuoteForm] = useState(false);

  const [viewingSale, setViewingSale] = useState<VentaConDetalle | null>(null);
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false);

  const [anulandoSale, setAnulandoSale] = useState<VentaConDetalle | null>(null);
  const [anularMotivo, setAnularMotivo] = useState('Anulación por error de facturación');
  const [procesandoAnular, setProcesandoAnular] = useState(false);

  const [returningSale, setReturningSale] = useState<VentaConDetalle | null>(null);
  const [loadingReturnDetail, setLoadingReturnDetail] = useState(false);
  const [procesandoDevolucion, setProcesandoDevolucion] = useState(false);

  const [optimisticallyDeletedIds, setOptimisticallyDeletedIds] = useState<Set<string>>(new Set());

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
  const [printFormat, setPrintFormat] = useState<'ticket' | 'a4'>(() => {
    return getInvoiceSettings().printFormat === 'full_page' ? 'a4' : 'ticket';
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo, tab]);

  // Supabase hooks
  const { ventas, total: totalVentas, loading: loadingVentas, error: errorVentas, refetch, cobrar, obtenerDetalle, anular, actualizar } = useVentas({
    pagina: page,
    limite: limit,
    busqueda: search,
    fechaInicio: dateFrom || undefined,
    fechaFin: dateTo || undefined,
    cajeroId: ownCajeroId,
  });

  const salesList = useMemo(() => {
    return ventas
      .filter((v) => !optimisticallyDeletedIds.has(v.id))
      .map(fromVentaConDetalleToSale);
  }, [ventas, optimisticallyDeletedIds]);

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

  // Global Keyboard Shortcuts (Fase 6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      // Escape: cerrar formularios o modales activos
      if (e.key === 'Escape') {
        if (openActionsId) {
          setOpenActionsId(null);
          return;
        }
        if (showAddSaleForm) {
          closeSaleForm();
          return;
        }
        if (showAddQuoteForm) {
          closeQuoteForm();
          return;
        }
        if (viewingQuote) {
          setViewingQuote(null);
          return;
        }
        if (convertQuote) {
          setConvertQuote(null);
          return;
        }
        if (editingSale) {
          setEditingSale(null);
          return;
        }
        if (printingSale) {
          setPrintingSale(null);
          return;
        }
        return;
      }

      // Si el foco está en un campo de texto o hay modal activo, ignorar atajos alfabéticos
      if (
        isInputFocused ||
        showAddSaleForm ||
        showAddQuoteForm ||
        viewingSale ||
        viewingQuote ||
        convertQuote ||
        anulandoSale ||
        returningSale ||
        editingSale ||
        printingSale
      ) {
        return;
      }

      // N o Alt+N: Nueva venta
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey) {
        if (canCreateSales) {
          e.preventDefault();
          setShowAddSaleForm(true);
        }
        return;
      }

      // C o Alt+C: Nueva cotización
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        if (canCreateSales) {
          e.preventDefault();
          setShowAddQuoteForm(true);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canCreateSales,
    openActionsId,
    showAddSaleForm,
    showAddQuoteForm,
    viewingSale,
    viewingQuote,
    convertQuote,
    anulandoSale,
    returningSale,
    editingSale,
    printingSale,
  ]);

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
  const handleConfirmAnular = async (motivoPersonalizado?: string) => {
    if (!anulandoSale) return;
    if (!canDeleteSales) {
      toast.error('Solo un administrador puede anular o eliminar facturas');
      return;
    }
    setProcesandoAnular(true);
    try {
      await anular(anulandoSale.id, motivoPersonalizado || anularMotivo);
      toast.success(`Factura ${anulandoSale.numero_factura} anulada exitosamente`);
      setAnulandoSale(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al anular la venta';
      toast.error(msg);
    } finally {
      setProcesandoAnular(false);
    }
  };

  // Return Sale
  const handleOpenReturnSale = async (s: VentaConDetalle) => {
    setReturningSale(s);
    setLoadingReturnDetail(true);
    try {
      const full = await obtenerDetalle(s.id);
      if (full) setReturningSale(full);
    } catch {
      // Keep summary if detail fails
    } finally {
      setLoadingReturnDetail(false);
    }
  };

  const handleConfirmReturnSale = async (data: ReturnPayloadData) => {
    if (!returningSale) return;
    setProcesandoDevolucion(true);
    try {
      await registrarDevolucion({
        venta_id: returningSale.id,
        numero_factura: returningSale.numero_factura,
        cliente_id: returningSale.cliente_id,
        cajero_id: user?.id || null,
        monto_total: data.monto_total,
        motivo: data.motivo,
        metodo_reembolso: data.metodo_reembolso,
        tipo: data.items.length === (returningSale.detalle_ventas?.length || 0) ? 'total' : 'parcial',
        items: data.items,
      });
      toast.success(`Devolución para ${returningSale.numero_factura} registrada exitosamente`);
      setReturningSale(null);
      void refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la devolución';
      toast.error(msg);
    } finally {
      setProcesandoDevolucion(false);
    }
  };

  // Optimistic Draft Deletion with Undo Toast (5s)
  const handleDeleteDraft = (draft: VentaConDetalle) => {
    if (!canDeleteSales) {
      toast.error('Solo un administrador puede eliminar borradores');
      return;
    }
    const draftId = draft.id;
    setOptimisticallyDeletedIds((prev) => new Set(prev).add(draftId));

    let undone = false;
    const timer = setTimeout(async () => {
      if (undone) return;
      try {
        await anular(draftId, 'Borrador eliminado por el usuario');
      } catch {
        setOptimisticallyDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(draftId);
          return next;
        });
        toast.error('Error al eliminar el borrador');
      }
    }, 5000);

    toast.success(`Borrador ${draft.numero_factura} eliminado`, {
      duration: 5000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          undone = true;
          clearTimeout(timer);
          setOptimisticallyDeletedIds((prev) => {
            const next = new Set(prev);
            next.delete(draftId);
            return next;
          });
          toast.info(`Eliminación de ${draft.numero_factura} deshecha`);
        },
      },
    });
  };

  // Open Edit Sale Modal
  const handleOpenEditSale = (s: VentaConDetalle) => {
    if (!canEditSales) {
      toast.error('Solo un administrador puede editar facturas');
      return;
    }
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
    if (!canEditSales) {
      toast.error('Solo un administrador puede editar facturas');
      return;
    }
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
        title: 'Historial Detallado de Ventas',
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
    <AppLayout fullWidth>
      <div className="apple-scope space-y-6">
        {!(viewingQuote || convertQuote || editingSale || printingSale) && (
        <>
        {/* Apple Design Header */}
        <SalesHeader
          onNewSale={() => setShowAddSaleForm(true)}
          onNewQuote={() => setShowAddQuoteForm(true)}
          canCreate={canCreateSales}
        />

        {/* Apple Design Metrics */}
        <SalesMetrics sales={salesList} />

        {/* Apple Design Toolbar: Vistas, Periodos, Búsqueda debounced y Exportar */}
        <SalesToolbar
          currentTab={tab}
          onTabChange={(newTab) => updateUrlParam({ tab: newTab })}
          tabCounts={{
            sales: totalVentas,
            quotes: cotizaciones.length,
            returns: devoluciones.length,
          }}
          currentPeriod={period}
          onPeriodChange={(newPeriod) => {
            if (newPeriod === 'custom') {
              updateUrlParam({ period: 'custom' });
            } else {
              updateUrlParam({ period: newPeriod, from: undefined, to: undefined });
            }
          }}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onCustomDateChange={(from, to) => updateUrlParam({ period: 'custom', from, to })}
          search={search}
          onSearchChange={(newSearch) => updateUrlParam({ q: newSearch })}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />

        {/* TAB 1: TODAS LAS VENTAS */}
        {tab === 'sales' && (
          <SalesTable
            sales={salesList}
            isLoading={loadingVentas}
            error={errorVentas}
            onRetry={() => {
              void refetch();
            }}
            sortField={sortField}
            sortDir={sortDir}
            onSortChange={(field, dir) => {
              updateUrlParam({ sort: field, order: dir });
            }}
            onRowClick={(sale) => {
              if (sale.rawSale) void handleOpenSaleDetail(sale.rawSale);
            }}
            hasFilters={Boolean(search || dateFrom || dateTo || period !== 'all')}
            onClearFilters={handleClearFilters}
            permissions={{
              canEdit: canEditSales,
              canDelete: canDeleteSales,
              canCreate: canCreateSales,
            }}
            openActionsId={openActionsId}
            onToggleActionsId={setOpenActionsId}
            onAction={(actionType, sale) => {
              const s = sale.rawSale;
              if (!s) return;
              if (actionType === 'detail') {
                void handleOpenSaleDetail(s);
              } else if (actionType === 'print') {
                void handleOpenPrintSale(s);
              } else if (actionType === 'edit') {
                handleOpenEditSale(s);
              } else if (actionType === 'void') {
                setAnulandoSale(s);
              } else if (actionType === 'return') {
                void handleOpenReturnSale(s);
              } else if (actionType === 'delete') {
                handleDeleteDraft(s);
              }
            }}
          />
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
                        Cargando cotizaciones...
                      </td>
                    </tr>
                  ) : cotizaciones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8">
                        <SalesEmptyState
                          tab="quotes"
                          onNewQuote={() => setShowAddQuoteForm(true)}
                        />
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
                        Cargando devoluciones...
                      </td>
                    </tr>
                  ) : devoluciones.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8">
                        <SalesEmptyState
                          tab="returns"
                          onNewReturn={() => {
                            toast.info('Para registrar una devolución, selecciona la factura en la pestaña Ventas.');
                          }}
                        />
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

        </>
        )}

        {/* SALE DRAWER (Apple Design) */}
        <SaleDrawer
          sale={viewingSale}
          isLoading={loadingSaleDetail}
          permissions={{
            canEdit: canEditSales,
            canDelete: canDeleteSales,
            canCreate: canCreateSales,
          }}
          onClose={() => setViewingSale(null)}
          onPrint={(s) => void handleOpenPrintSale(s)}
          onReturn={(s) => void handleOpenReturnSale(s)}
          onVoid={(s) => setAnulandoSale(s)}
        />

        {/* VIEW QUOTE DETAIL */}
        {viewingQuote &&
          (
            <div
              className="dialog-inline-host"
              onClick={() => setViewingQuote(null)}
            >
              <div
                className="card w-full max-w-xl my-auto max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border-primary/20"
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
        {convertQuote &&
          (
            <div
              className="dialog-inline-host"
              onClick={() => setConvertQuote(null)}
            >
              <div
                className="card w-full max-w-md my-auto max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border-primary/30"
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

        {/* VOID SALE DIALOG (Apple Design) */}
        <VoidSaleDialog
          sale={anulandoSale}
          isOpen={Boolean(anulandoSale)}
          isProcessing={procesandoAnular}
          onClose={() => setAnulandoSale(null)}
          onConfirm={(motivo) => void handleConfirmAnular(motivo)}
        />

        {/* RETURN SALE DIALOG (Apple Design) */}
        <ReturnSaleDialog
          sale={returningSale}
          isOpen={Boolean(returningSale)}
          isProcessing={loadingReturnDetail || procesandoDevolucion}
          onClose={() => setReturningSale(null)}
          onConfirm={handleConfirmReturnSale}
        />

        {/* MODAL: EDITAR FACTURA */}
        {editingSale &&
          (
            <div
              className="dialog-inline-host"
              onClick={() => setEditingSale(null)}
            >
              <div
                className="card w-full max-w-lg my-auto max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border-amber-500/20"
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
        {printingSale &&
          (
            <div
              className="dialog-inline-host print:p-0 print:bg-white print:static"
              onClick={() => setPrintingSale(null)}
            >
              <div
                className="card w-full max-w-2xl my-auto max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border-blue-500/20 print:max-h-none print:shadow-none print:border-none print:w-full print:p-0"
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
              ) : (
                <div className="printable-document">
                  <PrintableInvoice
                    invoiceData={{
                      invoiceNumber: printingSale.numero_factura,
                      isFiscal: Boolean(printingSale.ncf),
                      ncf: printingSale.ncf || undefined,
                      ncfType: printingSale.ncf ? printingSale.ncf.slice(0, 3) : undefined,
                      issueDate: new Date(printingSale.creado_en).toLocaleDateString('es-DO'),
                      issueTime: new Date(printingSale.creado_en).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
                      cashier: printingSale.cajero_nombre || 'Cajero',
                      customerName: printingSale.cliente_nombre || dbClientes.find((c) => c.id === printingSale.cliente_id)?.nombre || 'Consumidor Final',
                      customerRnc: dbClientes.find((c) => c.id === printingSale.cliente_id)?.rnc_cedula || undefined,
                      customerPhone: dbClientes.find((c) => c.id === printingSale.cliente_id)?.telefono || undefined,
                      customerAddress: dbClientes.find((c) => c.id === printingSale.cliente_id)?.direccion || undefined,
                      items: (printingSale.detalle_ventas || []).map((it) => ({
                        sku: it.producto_id || undefined,
                        name: it.nombre_item,
                        qty: it.cantidad,
                        price: it.precio_unitario,
                        subtotal: it.subtotal,
                        itbis: (it.precio_unitario - it.precio_unitario / 1.18) * it.cantidad,
                      })),
                      subtotal: printingSale.subtotal,
                      discount: printingSale.monto_descuento || undefined,
                      itbis: printingSale.monto_impuesto,
                      total: printingSale.monto_total,
                      paymentMethod: printingSale.metodo_pago,
                    }}
                    formatOverride={printFormat === 'ticket' ? 'ticket_80mm' : 'full_page'}
                  />
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
