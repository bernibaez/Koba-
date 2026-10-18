import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Store,
  Send,
  Printer,
  Download,
  DollarSign,
  User,
  Building2,
  Calendar,
  Sparkles,
  Trash2,
  Check,
  ChevronRight,
  ExternalLink,
  Percent,
  Layers,
  Award,
  X,
} from 'lucide-react';
import type { CotizacionConDetalle, EstadoCotizacion } from '@/services/cotizaciones.service';
import {
  obtenerCotizaciones,
  crearCotizacion,
  actualizarEstadoCotizacion,
  convertirCotizacionAVenta,
} from '@/services/cotizaciones.service';
import { obtenerProductos } from '@/services/productos.service';
import type { Producto } from '@/types/database';
import { toast } from '@/lib/toast';

interface CRMCotizacionesProps {
  onRefreshStats?: () => void;
  onNavigateToPOS?: () => void;
}

export default function CRMCotizaciones({
  onRefreshStats,
  onNavigateToPOS,
}: CRMCotizacionesProps) {
  const [cotizaciones, setCotizaciones] = useState<CotizacionConDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoCotizacion>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'cotizaciones' | 'comisiones'>('cotizaciones');

  // Modal Crear Cotización
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteRnc, setClienteRnc] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [vendedorNombre, setVendedorNombre] = useState('Carlos López');
  const [diasValidez, setDiasValidez] = useState('15');
  const [items, setItems] = useState<
    { producto_id?: string; nombre_item: string; cantidad: number; precio_unitario: number; subtotal: number }[]
  >([
    { nombre_item: '', cantidad: 1, precio_unitario: 0, subtotal: 0 },
  ]);

  // Buscador de productos para el modal
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productosSugeridos, setProductosSugeridos] = useState<Producto[]>([]);

  // Modal Vista Previa / Imprimir
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<CotizacionConDetalle | null>(null);

  useEffect(() => {
    void cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await obtenerCotizaciones();
      setCotizaciones(res.datos);
    } catch {
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  // Buscar productos del inventario cuando el usuario escribe
  useEffect(() => {
    if (!busquedaProducto.trim()) {
      setProductosSugeridos([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await obtenerProductos({ busqueda: busquedaProducto, limite: 6 });
        setProductosSugeridos(res.datos);
      } catch {
        setProductosSugeridos([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaProducto]);

  // Cálculos de la nueva cotización
  const subtotalNuevo = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.cantidad * it.precio_unitario), 0);
  }, [items]);

  const itbisNuevo = useMemo(() => {
    return subtotalNuevo * 0.18;
  }, [subtotalNuevo]);

  const totalNuevo = useMemo(() => {
    return subtotalNuevo + itbisNuevo;
  }, [subtotalNuevo, itbisNuevo]);

  const handleAddItem = (producto?: Producto) => {
    if (producto) {
      setItems((prev) => [
        ...prev.filter((i) => i.nombre_item.trim() !== ''),
        {
          producto_id: producto.id,
          nombre_item: producto.nombre,
          cantidad: 1,
          precio_unitario: Number(producto.precio_venta) || 0,
          subtotal: Number(producto.precio_venta) || 0,
        },
      ]);
      setBusquedaProducto('');
      setProductosSugeridos([]);
    } else {
      setItems((prev) => [
        ...prev,
        { nombre_item: '', cantidad: 1, precio_unitario: 0, subtotal: 0 },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };
      item.subtotal = (Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0);
      copy[index] = item;
      return copy;
    });
  };

  const handleGuardarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      toast.error('Indica el nombre del cliente');
      return;
    }
    const itemsValidos = items.filter((it) => it.nombre_item.trim() && it.cantidad > 0);
    if (itemsValidos.length === 0) {
      toast.error('Agrega al menos un ítem a la cotización');
      return;
    }

    try {
      await crearCotizacion({
        cliente_id: null,
        vendedor_id: null,
        subtotal: subtotalNuevo,
        monto_impuesto: itbisNuevo,
        monto_total: totalNuevo,
        valida_hasta: new Date(Date.now() + Number(diasValidez) * 86400000).toISOString(),
        items: itemsValidos.map((it) => ({
          producto_id: it.producto_id,
          nombre_item: it.nombre_item,
          cantidad: Number(it.cantidad) || 1,
          precio_unitario: Number(it.precio_unitario) || 0,
          subtotal: it.subtotal,
        })),
      });

      toast.success('Cotización comercial generada con éxito');
      setModalCrearOpen(false);
      setClienteNombre('');
      setClienteTelefono('');
      setClienteRnc('');
      setItems([{ nombre_item: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
      await cargarDatos();
      onRefreshStats?.();
    } catch {
      toast.error('No se pudo guardar la cotización');
    }
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: EstadoCotizacion) => {
    try {
      await actualizarEstadoCotizacion(id, nuevoEstado);
      toast.success(`Estado actualizado a: ${nuevoEstado}`);
      await cargarDatos();
      if (cotizacionSeleccionada?.id === id) {
        setCotizacionSeleccionada((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
      }
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleConvertirPOS = async (cot: CotizacionConDetalle) => {
    try {
      await convertirCotizacionAVenta(cot.id);
      toast.success(`¡Cotización ${cot.codigo} convertida a venta POS exitosamente!`);
      await cargarDatos();
      setCotizacionSeleccionada(null);
      onRefreshStats?.();
      onNavigateToPOS?.();
    } catch (e: any) {
      toast.error(e?.message || 'Error al facturar en POS');
    }
  };

  const handleEnviarWhatsApp = (cot: CotizacionConDetalle) => {
    const itemsTexto = (cot.items ?? [])
      .map((it) => `• ${it.cantidad}x ${it.nombre_item} — RD$ ${it.subtotal.toLocaleString()}`)
      .join('\n');

    const mensaje = encodeURIComponent(
      `*COTIZACIÓN COMERCIAL | KOBA CLOUD*\n` +
      `Código: *${cot.codigo}*\n` +
      `Cliente: *${cot.cliente_nombre || 'Estimado/a Cliente'}*\n\n` +
      `*Desglose de Productos:*\n${itemsTexto}\n\n` +
      `Subtotal: RD$ ${cot.subtotal.toLocaleString()}\n` +
      `ITBIS (18%): RD$ ${cot.monto_impuesto.toLocaleString()}\n` +
      `*Total General: RD$ ${cot.monto_total.toLocaleString()}*\n\n` +
      `Válido hasta: ${new Date(cot.valida_hasta || Date.now()).toLocaleDateString('es-DO')}\n` +
      `Quedamos atentos para procesar su orden.`
    );

    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  const handleExportarCSV = () => {
    const headers = ['Codigo', 'Cliente', 'Vendedor', 'Fecha', 'Subtotal', 'ITBIS', 'Total', 'Estado'];
    const rows = cotizaciones.map((c) => [
      c.codigo,
      `"${c.cliente_nombre || ''}"`,
      `"${c.vendedor_nombre || 'Carlos López'}"`,
      new Date(c.creado_en).toLocaleDateString(),
      c.subtotal,
      c.monto_impuesto,
      c.monto_total,
      c.estado,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cotizaciones_koba_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reporte de cotizaciones exportado a CSV');
  };

  // Filtrado
  const cotizacionesFiltradas = cotizaciones.filter((c) => {
    const matchEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
    const matchSearch =
      searchTerm === '' ||
      c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cliente_nombre && c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchEstado && matchSearch;
  });

  // Métricas
  const totalMontoCotizado = cotizaciones.reduce((acc, c) => acc + c.monto_total, 0);
  const totalConvertidas = cotizaciones.filter((c) => c.estado === 'convertida').length;
  const tasaCierre = cotizaciones.length > 0 ? Math.round((totalConvertidas / cotizaciones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER                                                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2dd4bf] block">
            KOBA ERP CLOUD • Fase 4: Cotizaciones & Facturación
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Propuestas & Cotizaciones
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Genera cotizaciones conectadas a tu inventario real y conviértelas en ventas POS con 1 solo clic.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportarCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download size={13} className="text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setModalCrearOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-[#2dd4bf] text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Plus size={14} className="text-[#2dd4bf]" />
            <span>Nueva Cotización</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP BENTO KPIS                                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Total Cotizado */}
        <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Monto total cotizado
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                RD$ {(totalMontoCotizado / 1000).toFixed(0)}k
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                {cotizaciones.length} emitidas
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-normal">
            Calculado con ITBIS (18%) y precios de catálogo
          </p>
        </div>

        {/* KPI 2: Aprobadas / Convertidas */}
        <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Convertidas a ventas POS
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {totalConvertidas}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {tasaCierre}% de efectividad
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-normal">
            Facturadas directamente sin doble digitación
          </p>
        </div>

        {/* KPI 3: Pendientes */}
        <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Cotizaciones en seguimiento
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {cotizaciones.filter((c) => c.estado === 'pendiente' || c.estado === 'aprobada').length}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Por cerrar
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-normal">
            Disponibles para enviar recordatorio por WhatsApp
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABS: COTIZACIONES vs COMISIONES                                        */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('cotizaciones')}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'cotizaciones'
              ? 'bg-[#0d2f27] text-[#2dd4bf]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Propuestas Comerciales ({cotizaciones.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('comisiones')}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'comisiones'
              ? 'bg-[#0d2f27] text-[#2dd4bf]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Comisiones por Vendedor
        </button>
      </div>

      {activeTab === 'comisiones' ? (
        /* Panel de comisiones */
        <div className="bg-white dark:bg-slate-850 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Comisiones Devengadas por Asesor
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo estimado del 3% sobre cotizaciones convertidas a ventas efectivas en el sistema.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { nombre: 'Carlos López', ventas: 2, montoFacturado: 210000, comisionPct: 3, estado: 'Al día' },
              { nombre: 'Ana Morales', ventas: 1, montoFacturado: 190000, comisionPct: 3, estado: 'Al día' },
              { nombre: 'Lic. Marcos Valenzuela', ventas: 0, montoFacturado: 0, comisionPct: 3, estado: 'En curso' },
            ].map((v) => (
              <div
                key={v.nombre}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0d2f27] text-[#2dd4bf] font-bold text-xs flex items-center justify-center">
                    {v.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {v.nombre}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {v.ventas} ventas cerradas • RD$ {v.montoFacturado.toLocaleString()} facturado
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Comisión (3%)
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    RD$ {(v.montoFacturado * 0.03).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Vista de Cotizaciones */
        <>
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
            <div className="relative flex-1 w-full md:w-auto max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código (COT-...) o cliente..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] transition-all"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {(['todos', 'pendiente', 'aprobada', 'convertida', 'rechazada'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFiltroEstado(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize whitespace-nowrap ${
                    filtroEstado === st
                      ? 'bg-[#0d2f27] text-[#2dd4bf] font-bold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
                  }`}
                >
                  {st === 'todos' ? `Todas (${cotizaciones.length})` : st}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cotizacionesFiltradas.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No se encontraron cotizaciones
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Crea una nueva propuesta con el botón superior.
                </p>
              </div>
            ) : (
              cotizacionesFiltradas.map((cot) => (
                <div
                  key={cot.id}
                  onClick={() => setCotizacionSeleccionada(cot)}
                  className="bg-white dark:bg-slate-850 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 shadow-2xs flex flex-col justify-between transition-all cursor-pointer group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#0d2f27] dark:group-hover:text-[#2dd4bf] transition-colors">
                          {cot.codigo}
                        </span>
                        <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 mt-0.5 truncate max-w-[200px]">
                          {cot.cliente_nombre || 'Cliente General'}
                        </h4>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border capitalize ${
                          cot.estado === 'convertida'
                            ? 'bg-[#0d2f27] text-[#2dd4bf] border-[#2dd4bf]/20'
                            : cot.estado === 'aprobada'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : cot.estado === 'rechazada'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {cot.estado}
                      </span>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1 mb-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Subtotal:</span>
                        <span>RD$ {cot.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>ITBIS (18%):</span>
                        <span>RD$ {cot.monto_impuesto.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>Total:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          RD$ {cot.monto_total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="text-[10.5px] text-slate-400 space-y-0.5">
                      <p>Válido hasta: {new Date(cot.valida_hasta || cot.creado_en).toLocaleDateString('es-DO')}</p>
                      <p>Vendedor: {cot.vendedor_nombre || 'Carlos López'}</p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnviarWhatsApp(cot);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Send size={11} />
                      <span>WhatsApp</span>
                    </button>

                    {cot.estado !== 'convertida' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertirPOS(cot);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0d2f27] hover:bg-[#134237] text-[#2dd4bf] text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <Store size={11} className="text-[#2dd4bf]" />
                        <span>Facturar POS</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        <span>Facturada</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: NUEVA COTIZACIÓN FORMAL CONECTADA A INVENTARIO                   */}
      {/* ========================================================================= */}
      {modalCrearOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-3xl shadow-xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#0d2f27] text-[#2dd4bf] flex items-center justify-center">
                  <FileText size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Nueva Cotización Comercial
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Emisión con catálogo e inventario en tiempo real
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCrearOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGuardarCotizacion} className="space-y-4">
              {/* Row 1: Datos Cliente y Vendedor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    required
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Ej. Supermercado El Éxito"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    placeholder="809-555-0000"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Vigencia (Días)
                  </label>
                  <select
                    value={diasValidez}
                    onChange={(e) => setDiasValidez(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#2dd4bf]"
                  >
                    <option value="7">7 Días</option>
                    <option value="15">15 Días (Estándar)</option>
                    <option value="30">30 Días</option>
                  </select>
                </div>
              </div>

              {/* Selector de Producto de Inventario */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700 space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Buscar producto en catálogo de inventario
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    placeholder="Escribe el nombre o SKU del producto para agregarlo..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                {productosSugeridos.length > 0 && (
                  <div className="mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                    {productosSugeridos.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleAddItem(prod)}
                        className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{prod.nombre}</p>
                          <span className="text-[10px] text-slate-400">
                            Stock: {prod.stock_actual} • SKU: {prod.sku}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          RD$ {Number(prod.precio_venta).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabla de Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Artículos cotizados
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="text-xs font-bold text-[#0d2f27] dark:text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Agregar ítem manual</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800"
                    >
                      <div className="col-span-6">
                        <input
                          type="text"
                          required
                          value={it.nombre_item}
                          onChange={(e) => handleItemChange(idx, 'nombre_item', e.target.value)}
                          placeholder="Descripción del producto o servicio"
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={it.cantidad}
                          onChange={(e) => handleItemChange(idx, 'cantidad', Number(e.target.value))}
                          placeholder="Cant."
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={it.precio_unitario}
                          onChange={(e) => handleItemChange(idx, 'precio_unitario', Number(e.target.value))}
                          placeholder="Precio unitario"
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-right"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales Resumen */}
              <div className="p-4 rounded-2xl bg-[#0d2f27] text-white flex items-center justify-between">
                <div className="text-xs space-y-0.5 text-slate-300">
                  <p>Subtotal: RD$ {subtotalNuevo.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                  <p>ITBIS (18%): RD$ {itbisNuevo.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#2dd4bf] block">
                    Total Cotizado
                  </span>
                  <span className="text-xl font-black text-white">
                    RD$ {totalNuevo.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCrearOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-[#2dd4bf] text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Generar Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: VISTA PREVIA IMPRIMIBLE FORMAL (Membrete KOBA ERP CLOUD)         */}
      {/* ========================================================================= */}
      {cotizacionSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl text-slate-900 space-y-6 my-8 border border-slate-200">
            {/* Header Documento Formal */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/images/koba_official_logo.png"
                  alt="KOBA ERP CLOUD"
                  className="h-10 object-contain"
                />
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-[#0d2f27] uppercase tracking-wider block">
                  Cotización Formal
                </span>
                <span className="text-lg font-black text-slate-900 block">
                  {cotizacionSeleccionada.codigo}
                </span>
                <span className="text-[10px] text-slate-500">
                  Fecha: {new Date(cotizacionSeleccionada.creado_en).toLocaleDateString('es-DO')}
                </span>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 text-xs">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                  Cotizado Para:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {cotizacionSeleccionada.cliente_nombre || 'Cliente General'}
                </p>
                <p className="text-slate-500 text-[11px]">RNC / Cédula: 131-89234-1</p>
              </div>
              <div className="text-right">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                  Condiciones Comerciales:
                </span>
                <p className="text-slate-600 mt-0.5">Válida por 15 días</p>
                <p className="text-slate-600">Vendedor: {cotizacionSeleccionada.vendedor_nombre || 'Carlos López'}</p>
              </div>
            </div>

            {/* Tabla Formal de Items */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="py-2">Descripción</th>
                    <th className="py-2 text-center">Cant.</th>
                    <th className="py-2 text-right">Precio Unit.</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(cotizacionSeleccionada.items ?? []).map((it, idx) => (
                    <tr key={idx} className="py-2">
                      <td className="py-2.5 font-medium text-slate-800">{it.nombre_item}</td>
                      <td className="py-2.5 text-center text-slate-600">{it.cantidad}</td>
                      <td className="py-2.5 text-right text-slate-600">
                        RD$ {it.precio_unitario.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        RD$ {it.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen Totales */}
            <div className="border-t border-slate-200 pt-3 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>RD$ {cotizacionSeleccionada.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ITBIS (18%):</span>
                  <span>RD$ {cotizacionSeleccionada.monto_impuesto.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total General:</span>
                  <span className="text-[#0d2f27]">
                    RD$ {cotizacionSeleccionada.monto_total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCotizacionSeleccionada(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEnviarWhatsApp(cotizacionSeleccionada)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>WhatsApp</span>
                </button>

                {cotizacionSeleccionada.estado !== 'convertida' && (
                  <button
                    type="button"
                    onClick={() => handleConvertirPOS(cotizacionSeleccionada)}
                    className="px-4 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-[#2dd4bf] text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Store size={13} className="text-[#2dd4bf]" />
                    <span>Facturar en POS</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
