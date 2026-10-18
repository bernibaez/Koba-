import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Printer,
  Send,
  Building2,
  User,
  CreditCard,
  DollarSign,
  Calendar,
  AlertCircle,
  X,
  Store,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
  FileText,
} from 'lucide-react';
import type { CRMFacturaPreload } from '@/types/crm';
import type { Cliente, Producto } from '@/types/database';
import { obtenerProductos } from '@/services/productos.service';
import { toast } from '@/lib/toast';

const CRM_FACTURAS_STORAGE_KEY = 'koba_crm_facturas_prueba_v1';

export interface CRMFacturaPrueba {
  id: string;
  numero_factura: string;
  ncf: string;
  tipo_ncf: string;
  cliente_id?: string | null;
  cliente_nombre: string;
  cliente_rnc?: string;
  subtotal: number;
  monto_impuesto: number;
  monto_total: number;
  metodo_pago: string;
  monto_credito?: number;
  dias_credito?: string;
  creado_en: string;
  detalle_ventas: Array<{
    producto_id?: string | null;
    nombre_item: string;
    cantidad: number;
    precio_unitario: number;
    porcentaje_impuesto: number;
    subtotal: number;
  }>;
}

function getStoredCrmFacturas(): CRMFacturaPrueba[] {
  try {
    const raw = localStorage.getItem(CRM_FACTURAS_STORAGE_KEY);
    if (!raw) {
      const demo: CRMFacturaPrueba[] = [
        {
          id: 'fac-crm-demo-1',
          numero_factura: 'FAC-CRM-100234',
          ncf: 'B0100000042',
          tipo_ncf: 'B01',
          cliente_nombre: 'Constructora del Norte SRL',
          cliente_rnc: '131-44556-2',
          subtotal: 125000,
          monto_impuesto: 22500,
          monto_total: 147500,
          metodo_pago: 'credito',
          monto_credito: 147500,
          dias_credito: '30',
          creado_en: new Date(Date.now() - 3600000 * 24).toISOString(),
          detalle_ventas: [
            {
              nombre_item: 'Licenciamiento ERP KOBA Enterprise (Anual)',
              cantidad: 1,
              precio_unitario: 125000,
              porcentaje_impuesto: 18,
              subtotal: 125000,
            },
          ],
        },
        {
          id: 'fac-crm-demo-2',
          numero_factura: 'FAC-CRM-100235',
          ncf: 'B0200000108',
          tipo_ncf: 'B02',
          cliente_nombre: 'Grupo Médico Santiago',
          cliente_rnc: '130-99887-1',
          subtotal: 45000,
          monto_impuesto: 8100,
          monto_total: 53100,
          metodo_pago: 'transferencia',
          monto_credito: 0,
          creado_en: new Date(Date.now() - 3600000 * 6).toISOString(),
          detalle_ventas: [
            {
              nombre_item: 'Consultoría e Implementación Servidor Cloud',
              cantidad: 1,
              precio_unitario: 45000,
              porcentaje_impuesto: 18,
              subtotal: 45000,
            },
          ],
        },
      ];
      localStorage.setItem(CRM_FACTURAS_STORAGE_KEY, JSON.stringify(demo));
      return demo;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredCrmFacturas(facts: CRMFacturaPrueba[]) {
  try {
    localStorage.setItem(CRM_FACTURAS_STORAGE_KEY, JSON.stringify(facts));
  } catch (err) {
    console.error('Error guardando facturas CRM de prueba:', err);
  }
}

interface CRMFacturadorProps {
  clientes: Cliente[];
  preloadData?: CRMFacturaPreload | null;
  onClearPreload?: () => void;
  onFacturaCompletada?: (ventaId: string) => void;
}

export default function CRMFacturador({
  clientes,
  preloadData,
  onClearPreload,
  onFacturaCompletada,
}: CRMFacturadorProps) {
  const [activeTab, setActiveTab] = useState<'emitir' | 'historial'>('emitir');

  // Cliente seleccionado
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteManualNombre, setClienteManualNombre] = useState('');
  const [clienteManualRnc, setClienteManualRnc] = useState('');
  const [clienteManualTelefono, setClienteManualTelefono] = useState('');

  // Configuración Fiscal
  const [tipoNcf, setTipoNcf] = useState<'B01' | 'B02' | 'B14' | 'B15'>('B01');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'credito'>('transferencia');
  const [diasCredito, setDiasCredito] = useState<string>('30');

  // Ítems de la factura
  const [items, setItems] = useState<
    {
      producto_id?: string;
      nombre_item: string;
      cantidad: number;
      precio_unitario: number;
      porcentaje_impuesto: number;
      subtotal: number;
    }[]
  >([
    { nombre_item: '', cantidad: 1, precio_unitario: 0, porcentaje_impuesto: 18, subtotal: 0 },
  ]);

  // Buscador de productos del catálogo
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productosSugeridos, setProductosSugeridos] = useState<Producto[]>([]);

  // Historial de Facturas (Aislado para el CRM de prueba)
  const [facturasHistorial, setFacturasHistorial] = useState<CRMFacturaPrueba[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [filtroHistorial, setFiltroHistorial] = useState<'todas' | 'credito' | 'contado'>('todas');
  const [searchHistorial, setSearchHistorial] = useState('');

  // Modal Factura Emitida
  const [facturaEmitidaModal, setFacturaEmitidaModal] = useState<{
    numero_factura: string;
    ncf: string;
    tipo_ncf: string;
    cliente_nombre: string;
    cliente_rnc?: string;
    items: typeof items;
    subtotal: number;
    monto_impuesto: number;
    monto_total: number;
    metodo_pago: string;
    fecha: string;
  } | null>(null);

  // Aplicar datos precargados si vienen de Kanban o Cotización
  useEffect(() => {
    if (preloadData) {
      if (preloadData.cliente_id) {
        setClienteSeleccionadoId(preloadData.cliente_id);
      }
      if (preloadData.cliente_nombre) {
        setClienteManualNombre(preloadData.cliente_nombre);
      }
      if (preloadData.rnc_cedula) {
        setClienteManualRnc(preloadData.rnc_cedula);
      }
      if (preloadData.telefono) {
        setClienteManualTelefono(preloadData.telefono);
      }
      if (preloadData.items && preloadData.items.length > 0) {
        setItems(
          preloadData.items.map((it) => ({
            producto_id: it.producto_id,
            nombre_item: it.nombre_item,
            cantidad: it.cantidad,
            precio_unitario: it.precio_unitario,
            porcentaje_impuesto: 18,
            subtotal: it.subtotal,
          }))
        );
      } else if (preloadData.monto_total) {
        const sub = Math.round(preloadData.monto_total / 1.18);
        setItems([
          {
            nombre_item: `Servicio / Oportunidad Comercial: ${preloadData.cliente_nombre || 'Cliente'}`,
            cantidad: 1,
            precio_unitario: sub,
            porcentaje_impuesto: 18,
            subtotal: sub,
          },
        ]);
      }
      setActiveTab('emitir');
      toast.info('Datos precargados en el Facturador CRM');
    }
  }, [preloadData]);

  // Cargar historial de facturas exclusivo del CRM
  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = () => {
    setLoadingHistorial(true);
    try {
      const datos = getStoredCrmFacturas();
      setFacturasHistorial(datos);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Buscar productos para autocompletar
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
    }, 200);
    return () => clearTimeout(timer);
  }, [busquedaProducto]);

  // Cliente activo
  const clienteActivo = useMemo(() => {
    return clientes.find((c) => c.id === clienteSeleccionadoId);
  }, [clientes, clienteSeleccionadoId]);

  // Cálculos financieros
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.cantidad * it.precio_unitario), 0);
  }, [items]);

  const totalITBIS = useMemo(() => {
    return items.reduce((acc, it) => {
      const itbisRate = (it.porcentaje_impuesto || 0) / 100;
      return acc + (it.cantidad * it.precio_unitario * itbisRate);
    }, 0);
  }, [items]);

  const totalGeneral = useMemo(() => {
    return subtotal + totalITBIS;
  }, [subtotal, totalITBIS]);

  const handleAddItem = (producto?: Producto) => {
    if (producto) {
      setItems((prev) => [
        ...prev.filter((i) => i.nombre_item.trim() !== ''),
        {
          producto_id: producto.id,
          nombre_item: producto.nombre,
          cantidad: 1,
          precio_unitario: Number(producto.precio_venta) || 0,
          porcentaje_impuesto: Number(producto.porcentaje_impuesto) ?? 18,
          subtotal: Number(producto.precio_venta) || 0,
        },
      ]);
      setBusquedaProducto('');
      setProductosSugeridos([]);
    } else {
      setItems((prev) => [
        ...prev,
        { nombre_item: '', cantidad: 1, precio_unitario: 0, porcentaje_impuesto: 18, subtotal: 0 },
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

  const handleEliminarFacturaPrueba = (id: string) => {
    const filtradas = facturasHistorial.filter((f) => f.id !== id);
    saveStoredCrmFacturas(filtradas);
    setFacturasHistorial(filtradas);
    toast.success('Factura de prueba eliminada del CRM');
  };

  const handleEmitirFactura = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreFinal = clienteActivo?.nombre || clienteManualNombre.trim();
    if (!nombreFinal) {
      toast.error('Selecciona un cliente o ingresa el nombre fiscal.');
      return;
    }

    const itemsValidos = items.filter((it) => it.nombre_item.trim() && it.cantidad > 0);
    if (itemsValidos.length === 0) {
      toast.error('Agrega al menos un artículo o servicio a la factura.');
      return;
    }

    try {
      const numFactura = `FAC-CRM-${Date.now().toString().slice(-6)}`;
      const esCredito = metodoPago === 'credito';
      const seqIndex = (facturasHistorial.length + 1).toString().padStart(8, '0');
      const ncfFinal = `${tipoNcf}${seqIndex}`;

      const nuevaFactura: CRMFacturaPrueba = {
        id: `fac-crm-${Date.now()}`,
        numero_factura: numFactura,
        ncf: ncfFinal,
        tipo_ncf: tipoNcf,
        cliente_id: clienteActivo?.id ?? null,
        cliente_nombre: nombreFinal,
        cliente_rnc: clienteActivo?.rnc_cedula || clienteManualRnc || undefined,
        subtotal,
        monto_impuesto: totalITBIS,
        monto_total: totalGeneral,
        metodo_pago: esCredito ? 'credito' : metodoPago,
        monto_credito: esCredito ? totalGeneral : 0,
        dias_credito: esCredito ? diasCredito : undefined,
        creado_en: new Date().toISOString(),
        detalle_ventas: itemsValidos.map((it) => ({
          producto_id: it.producto_id ?? null,
          nombre_item: it.nombre_item,
          cantidad: Number(it.cantidad) || 1,
          precio_unitario: Number(it.precio_unitario) || 0,
          porcentaje_impuesto: it.porcentaje_impuesto,
          subtotal: it.subtotal,
        })),
      };

      // Guardar exclusivamente en el historial local de prueba del CRM (sin tocar ventas del ERP)
      const actualizadas = [nuevaFactura, ...facturasHistorial];
      saveStoredCrmFacturas(actualizadas);
      setFacturasHistorial(actualizadas);

      toast.success(`¡Factura ${ncfFinal} emitida exitosamente en el CRM!`);

      // Guardar modal para previsualización inmediata y envío WhatsApp
      setFacturaEmitidaModal({
        numero_factura: numFactura,
        ncf: ncfFinal,
        tipo_ncf: tipoNcf,
        cliente_nombre: nombreFinal,
        cliente_rnc: clienteActivo?.rnc_cedula || clienteManualRnc,
        items: itemsValidos,
        subtotal,
        monto_impuesto: totalITBIS,
        monto_total: totalGeneral,
        metodo_pago: metodoPago,
        fecha: new Date().toLocaleDateString('es-DO'),
      });

      // Limpiar formulario
      setItems([{ nombre_item: '', cantidad: 1, precio_unitario: 0, porcentaje_impuesto: 18, subtotal: 0 }]);
      setClienteManualNombre('');
      setClienteManualRnc('');
      setClienteManualTelefono('');
      onClearPreload?.();
      onFacturaCompletada?.(nuevaFactura.id);
    } catch {
      toast.error('Ocurrió un error al procesar la factura');
    }
  };

  const handleWhatsAppFactura = (fac: NonNullable<typeof facturaEmitidaModal>) => {
    const itemsTexto = fac.items
      .map((it) => `• ${it.cantidad}x ${it.nombre_item} — RD$ ${it.subtotal.toLocaleString()}`)
      .join('\n');

    const mensaje = encodeURIComponent(
      `*FACTURA COMERCIAL FISCAL | KOBA CLOUD*\n` +
      `NCF: *${fac.ncf}* (${fac.tipo_ncf})\n` +
      `No. Factura: *${fac.numero_factura}*\n` +
      `Cliente: *${fac.cliente_nombre}*\n` +
      (fac.cliente_rnc ? `RNC: ${fac.cliente_rnc}\n` : '') +
      `Fecha: ${fac.fecha}\n` +
      `Condición: ${fac.metodo_pago === 'credito' ? `A Crédito (${diasCredito} días)` : 'Al Contado'}\n\n` +
      `*Detalle de Ítems:*\n${itemsTexto}\n\n` +
      `Subtotal: RD$ ${fac.subtotal.toLocaleString()}\n` +
      `ITBIS (18%): RD$ ${fac.monto_impuesto.toLocaleString()}\n` +
      `*Total Neto: RD$ ${fac.monto_total.toLocaleString()}*\n\n` +
      `Gracias por su preferencia. KOBA ERP CLOUD.`
    );

    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  // Filtrado de historial
  const historialFiltrado = facturasHistorial.filter((f) => {
    const esCred = f.metodo_pago === 'credito' || (Number(f.monto_credito) || 0) > 0;
    if (filtroHistorial === 'credito' && !esCred) return false;
    if (filtroHistorial === 'contado' && esCred) return false;
    if (searchHistorial.trim()) {
      const q = searchHistorial.toLowerCase();
      const ncfMatch = (f.ncf ?? '').toLowerCase().includes(q);
      const cliMatch = (f.cliente_nombre ?? '').toLowerCase().includes(q);
      const numMatch = f.numero_factura.toLowerCase().includes(q);
      if (!ncfMatch && !cliMatch && !numMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER                                                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2dd4bf] block">
            KOBA ERP CLOUD • Facturación Integrada B2B
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Facturador CRM
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Emite facturas fiscales (NCF) y ventas a crédito directamente desde tu embudo comercial.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('emitir')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'emitir'
                ? 'bg-[#0d2f27] text-[#2dd4bf] shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Emitir Factura
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-[#0d2f27] text-[#2dd4bf] shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Historial ({facturasHistorial.length})
          </button>
        </div>
      </div>

      {activeTab === 'historial' ? (
        /* ======================================================================= */
        /* HISTORIAL DE FACTURAS EMITIDAS DESDE EL CRM                             */
        /* ======================================================================= */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
            <div className="relative flex-1 w-full md:w-auto max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchHistorial}
                onChange={(e) => setSearchHistorial(e.target.value)}
                placeholder="Buscar por NCF, cliente o número de factura..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <button
                type="button"
                onClick={() => setFiltroHistorial('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filtroHistorial === 'todas'
                    ? 'bg-[#0d2f27] text-[#2dd4bf] font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Todas ({facturasHistorial.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroHistorial('credito')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filtroHistorial === 'credito'
                    ? 'bg-[#0d2f27] text-[#2dd4bf] font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                A Crédito (CxC)
              </button>
              <button
                type="button"
                onClick={() => setFiltroHistorial('contado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filtroHistorial === 'contado'
                    ? 'bg-[#0d2f27] text-[#2dd4bf] font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Al Contado
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historialFiltrado.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Receipt size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No hay facturas registradas en este filtro
                </h4>
              </div>
            ) : (
              historialFiltrado.map((fac) => {
                const esCredito = fac.metodo_pago === 'credito' || (Number(fac.monto_credito) || 0) > 0;
                return (
                  <div
                    key={fac.id}
                    className="bg-white dark:bg-slate-850 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 shadow-2xs flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {fac.ncf || fac.numero_factura}
                          </span>
                          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                            {fac.cliente_nombre || 'Cliente General'}
                          </h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border capitalize ${
                            esCredito
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {esCredito ? 'A Crédito (CxC)' : 'Pagada'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1 mb-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Subtotal:</span>
                          <span>RD$ {Number(fac.subtotal).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>ITBIS:</span>
                          <span>RD$ {Number(fac.monto_impuesto).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span>Total:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            RD$ {Number(fac.monto_total).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <p>Fecha: {new Date(fac.creado_en).toLocaleDateString('es-DO')}</p>
                        <p>Comprobante: {fac.tipo_ncf || 'B02 Consumidor Final'}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setFacturaEmitidaModal({
                            numero_factura: fac.numero_factura,
                            ncf: fac.ncf || 'B0200000001',
                            tipo_ncf: fac.tipo_ncf || 'B02',
                            cliente_nombre: fac.cliente_nombre || 'Cliente General',
                            items: (fac.detalle_ventas ?? []).map((it) => ({
                              producto_id: it.producto_id ?? undefined,
                              nombre_item: it.nombre_item,
                              cantidad: it.cantidad,
                              precio_unitario: it.precio_unitario,
                              porcentaje_impuesto: it.porcentaje_impuesto ?? 18,
                              subtotal: it.subtotal,
                            })),
                            subtotal: fac.subtotal,
                            monto_impuesto: fac.monto_impuesto,
                            monto_total: fac.monto_total,
                            metodo_pago: fac.metodo_pago,
                            fecha: new Date(fac.creado_en).toLocaleDateString('es-DO'),
                          });
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText size={12} />
                        <span>Ver Factura</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Imprimir copia"
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarFacturaPrueba(fac.id)}
                          className="p-1.5 rounded-lg border border-rose-200/80 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Eliminar factura de prueba"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ======================================================================= */
        /* FORMULARIO DE EMISIÓN DE FACTURA B2B                                    */
        /* ======================================================================= */
        <form onSubmit={handleEmitirFactura} className="space-y-6">
          {/* Banner precarga si existe */}
          {preloadData && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Facturación precargada desde el embudo comercial para{' '}
                  <strong>{preloadData.cliente_nombre || 'Cliente'}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={onClearPreload}
                className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold text-[11px] cursor-pointer"
              >
                Limpiar datos
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda (8 cols): Cliente, Ítems de inventario y Fiscal */}
            <div className="lg:col-span-8 space-y-5">
              {/* Card 1: Selección de Cliente CRM */}
              <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 size={14} className="text-[#2dd4bf]" />
                    <span>Datos del Cliente / Entidad Fiscal</span>
                  </h3>
                  {clienteActivo && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      ID: {clienteActivo.codigo}
                    </span>
                  )}
                </div>

                {/* Selector de Cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Seleccionar de la Cartera CRM
                    </label>
                    <select
                      value={clienteSeleccionadoId}
                      onChange={(e) => {
                        setClienteSeleccionadoId(e.target.value);
                        const match = clientes.find((c) => c.id === e.target.value);
                        if (match) {
                          setClienteManualNombre(match.nombre);
                          setClienteManualRnc(match.rnc_cedula ?? '');
                          setClienteManualTelefono(match.telefono ?? '');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#2dd4bf]"
                    >
                      <option value="">-- Cliente Casual / Ingreso Manual --</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.rnc_cedula ? `(${c.rnc_cedula})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Nombre Comercial / Razón Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={clienteManualNombre}
                      onChange={(e) => setClienteManualNombre(e.target.value)}
                      placeholder="Ej. Distribuidora del Cibao SRL"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      RNC / Cédula Fiscal
                    </label>
                    <input
                      type="text"
                      value={clienteManualRnc}
                      onChange={(e) => setClienteManualRnc(e.target.value)}
                      placeholder="131-89234-1"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Teléfono / WhatsApp de Facturación
                    </label>
                    <input
                      type="text"
                      value={clienteManualTelefono}
                      onChange={(e) => setClienteManualTelefono(e.target.value)}
                      placeholder="809-555-0000"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>
                </div>

                {/* Si el cliente tiene crédito disponible, mostrar badge */}
                {clienteActivo && (
                  <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                    <span>
                      Balance CxC actual:{' '}
                      <strong className={Number(clienteActivo.balance_actual) > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                        RD$ {Number(clienteActivo.balance_actual).toLocaleString()}
                      </strong>
                    </span>
                    <span>
                      Límite de Crédito:{' '}
                      <strong>RD$ {Number(clienteActivo.limite_credito).toLocaleString()}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Card 2: Buscador y Artículos de la Factura */}
              <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Store size={14} className="text-[#2dd4bf]" />
                    <span>Líneas de Facturación & Catálogo</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="text-xs font-bold text-[#0d2f27] dark:text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Agregar ítem manual</span>
                  </button>
                </div>

                {/* Buscador de inventario en tiempo real */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    placeholder="Escribe el nombre o SKU de un producto para agregarlo al facturador..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                  />
                  {productosSugeridos.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-20 divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto">
                      {productosSugeridos.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleAddItem(p)}
                          className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{p.nombre}</p>
                            <span className="text-[10px] text-slate-400">
                              Stock: {p.stock_actual} • SKU: {p.sku}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            RD$ {Number(p.precio_venta).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de Items */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          value={it.nombre_item}
                          onChange={(e) => handleItemChange(idx, 'nombre_item', e.target.value)}
                          placeholder="Descripción del ítem"
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
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={it.precio_unitario}
                          onChange={(e) => handleItemChange(idx, 'precio_unitario', Number(e.target.value))}
                          placeholder="Precio"
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-right"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          RD$ {it.subtotal.toLocaleString()}
                        </span>
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
            </div>

            {/* Columna Derecha (4 cols): Configuración Fiscal, Pago y Totales */}
            <div className="lg:col-span-4 space-y-5">
              {/* Card Fiscal & Pago */}
              <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <ShieldCheck size={14} className="text-[#2dd4bf]" />
                  <span>Comprobante Fiscal & Pago</span>
                </h3>

                {/* Tipo de NCF */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tipo de Comprobante Fiscal (DGII)
                  </label>
                  <select
                    value={tipoNcf}
                    onChange={(e) => setTipoNcf(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#2dd4bf]"
                  >
                    <option value="B01">B01 • Factura con Crédito Fiscal (Empresas)</option>
                    <option value="B02">B02 • Factura Consumidor Final</option>
                    <option value="B14">B14 • Régimen Especial de Tributación</option>
                    <option value="B15">B15 • Comprobante Gubernamental</option>
                  </select>
                </div>

                {/* Forma de Pago */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Condición de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMetodoPago('transferencia')}
                      className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                        metodoPago === 'transferencia'
                          ? 'bg-[#0d2f27] text-[#2dd4bf] border-[#0d2f27] font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Transferencia
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPago('credito')}
                      className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                        metodoPago === 'credito'
                          ? 'bg-[#0d2f27] text-[#2dd4bf] border-[#0d2f27] font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      A Crédito (CxC)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPago('tarjeta')}
                      className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                        metodoPago === 'tarjeta'
                          ? 'bg-[#0d2f27] text-[#2dd4bf] border-[#0d2f27] font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Tarjeta
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPago('efectivo')}
                      className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                        metodoPago === 'efectivo'
                          ? 'bg-[#0d2f27] text-[#2dd4bf] border-[#0d2f27] font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Efectivo
                    </button>
                  </div>
                </div>

                {/* Si es crédito, selector de días */}
                {metodoPago === 'credito' && (
                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-1.5">
                    <label className="block text-[10.5px] font-bold text-amber-800 dark:text-amber-400">
                      Plazo de Crédito Comercial
                    </label>
                    <select
                      value={diasCredito}
                      onChange={(e) => setDiasCredito(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800"
                    >
                      <option value="15">15 Días (Neto 15)</option>
                      <option value="30">30 Días (Neto 30)</option>
                      <option value="45">45 Días (Neto 45)</option>
                      <option value="60">60 Días (Neto 60)</option>
                    </select>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 block">
                      Se registrará en el módulo de Cuentas por Cobrar (CxC).
                    </span>
                  </div>
                )}
              </div>

              {/* Totales y Botón de Emisión */}
              <div className="bg-[#0d2f27] text-white rounded-2xl p-5 border border-[#1a4a3f] shadow-sm space-y-4">
                <div className="space-y-2 text-xs text-slate-300 pb-3 border-b border-[#1b5547]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>RD$ {subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ITBIS (18%):</span>
                    <span>RD$ {totalITBIS.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#1b5547]">
                    <span className="text-[#2dd4bf]">Total Neto:</span>
                    <span>RD$ {totalGeneral.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#144237] hover:bg-[#1b5547] text-[#2dd4bf] font-black text-xs flex items-center justify-center gap-2 border border-[#2dd4bf]/30 shadow-xs transition-all cursor-pointer"
                >
                  <Receipt size={16} className="text-[#2dd4bf]" />
                  <span>Emitir Factura Oficial</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FACTURA FISCAL EMITIDA (Imprimir y Enviar WhatsApp)                 */}
      {/* ========================================================================= */}
      {facturaEmitidaModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl text-slate-900 space-y-6 my-8 border border-slate-200">
            {/* Header Documento Fiscal */}
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
                  Factura Comercial
                </span>
                <span className="text-base font-black text-slate-900 block">
                  {facturaEmitidaModal.ncf}
                </span>
                <span className="text-[10px] text-slate-500">
                  {facturaEmitidaModal.numero_factura} • {facturaEmitidaModal.fecha}
                </span>
              </div>
            </div>

            {/* Datos Fiscales */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 text-xs">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                  Facturado A:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {facturaEmitidaModal.cliente_nombre}
                </p>
                {facturaEmitidaModal.cliente_rnc && (
                  <p className="text-slate-500 text-[11px]">RNC: {facturaEmitidaModal.cliente_rnc}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                  Condición Fiscal:
                </span>
                <p className="text-slate-700 font-semibold mt-0.5 capitalize">
                  {facturaEmitidaModal.metodo_pago === 'credito' ? 'Venta a Crédito (CxC)' : 'Contado'}
                </p>
                <p className="text-slate-500">NCF Tipo: {facturaEmitidaModal.tipo_ncf}</p>
              </div>
            </div>

            {/* Items */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="py-2">Descripción</th>
                    <th className="py-2 text-center">Cant.</th>
                    <th className="py-2 text-right">Precio</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facturaEmitidaModal.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium text-slate-800">{it.nombre_item}</td>
                      <td className="py-2 text-center text-slate-600">{it.cantidad}</td>
                      <td className="py-2 text-right text-slate-600">
                        RD$ {it.precio_unitario.toLocaleString()}
                      </td>
                      <td className="py-2 text-right font-bold text-slate-900">
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
                  <span>RD$ {facturaEmitidaModal.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ITBIS (18%):</span>
                  <span>RD$ {facturaEmitidaModal.monto_impuesto.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Neto:</span>
                  <span className="text-[#0d2f27]">
                    RD$ {facturaEmitidaModal.monto_total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setFacturaEmitidaModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppFactura(facturaEmitidaModal)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
