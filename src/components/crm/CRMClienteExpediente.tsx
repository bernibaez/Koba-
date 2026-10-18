import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShoppingBag,
  ShoppingCart,
  Star,
  Phone,
  Mail,
  MapPin,
  Tag,
  Clock,
  FileText,
  Send,
  Users,
  MessageCircle,
  Paperclip,
  Info,
  Calendar,
  User,
  Trash2,
} from 'lucide-react';
import type { CRMActividad, CRMTipoActividad } from '@/types/crm';
import {
  agregarActividad,
  obtenerActividades,
  toggleCompletarActividad,
  eliminarActividad,
} from '@/services/crm.service';
import { toast } from '@/lib/toast';

interface CRMClienteExpedienteProps {
  cliente: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    credit: number;
    purchases: number;
    balance: number;
    status: 'active' | 'inactive';
    group: string;
  };
  onClose: () => void;
  onCrearCotizacion?: () => void;
  onNuevaVenta?: () => void;
}

export default function CRMClienteExpediente({
  cliente,
  onClose,
  onCrearCotizacion,
  onNuevaVenta,
}: CRMClienteExpedienteProps) {
  const [actividades, setActividades] = useState<CRMActividad[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoActividad, setTipoActividad] = useState<CRMTipoActividad>('nota');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [filterActTipo, setFilterActTipo] = useState<string>('todas');
  const [copiadoCampo, setCopiadoCampo] = useState<string | null>(null);

  useEffect(() => {
    void cargarActividades();
  }, [cliente.id]);

  const cargarActividades = async () => {
    const list = await obtenerActividades({ cliente_id: cliente.id });
    setActividades(list);
  };

  const handleAgregarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNota.trim()) return;

    setGuardandoNota(true);
    try {
      const tipoLabels: Partial<Record<CRMTipoActividad, string>> = {
        nota: 'Nota registrada',
        llamada: 'Llamada realizada',
        reunion: 'Reunión coordinada',
        whatsapp: 'Mensaje de WhatsApp',
      };

      await agregarActividad({
        cliente_id: cliente.id,
        tipo: tipoActividad,
        titulo: tipoLabels[tipoActividad] || 'Interacción con cliente',
        descripcion: nuevaNota.trim(),
        completada: true,
        usuario_nombre: 'Admin / Vendedor',
      });
      setNuevaNota('');
      toast.success('Actividad registrada en la bitácora');
      await cargarActividades();
    } catch {
      toast.error('Error al guardar actividad');
    } finally {
      setGuardandoNota(false);
    }
  };

  const handleToggleActividad = async (id: string) => {
    await toggleCompletarActividad(id);
    await cargarActividades();
  };

  const handleEliminarActividad = async (id: string) => {
    await eliminarActividad(id);
    toast.success('Actividad eliminada');
    await cargarActividades();
  };

  const handleWhatsApp = (mensajePersonalizado?: string) => {
    const telefono = cliente.phone?.replace(/\D/g, '') || '';
    if (!telefono) {
      toast.error('Este cliente no tiene teléfono registrado');
      return;
    }
    const num = telefono.startsWith('1') ? telefono : `1${telefono}`;
    const texto = encodeURIComponent(
      mensajePersonalizado ||
        `Hola ${cliente.name}, le saludamos de KOBA. ¿En qué podemos servirle hoy?`
    );
    window.open(`https://wa.me/${num}?text=${texto}`, '_blank');
  };

  const copiarTexto = (texto: string, campo: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiadoCampo(campo);
    toast.success(`${campo} copiado al portapapeles`);
    setTimeout(() => setCopiadoCampo(null), 2000);
  };

  // Clasificación inteligente del cliente
  const getCategoriaCliente = () => {
    if (cliente.balance > 0 && cliente.balance >= (cliente.credit || 1) * 0.9) {
      return {
        tag: 'Límite Alto',
        color:
          'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400',
      };
    }
    if ((cliente.credit && cliente.credit > 50000) || cliente.purchases > 10) {
      return {
        tag: 'Cliente VIP',
        color:
          'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400',
      };
    }
    return {
      tag: 'Cliente Recurrente',
      color:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400',
    };
  };

  const categoria = getCategoriaCliente();

  // Nivel de fidelización
  const nivelFidelizacion =
    cliente.purchases > 10
      ? 'Nivel Oro (VIP)'
      : cliente.purchases > 3
        ? 'Nivel Plata'
        : 'Nivel Estándar';

  const porcentajeCredito =
    cliente.credit > 0
      ? Math.min(Math.round((cliente.balance / cliente.credit) * 100), 100)
      : 0;

  const disponibleCredito = Math.max(0, cliente.credit - cliente.balance);

  const balanceNumber = Number(cliente.balance || 0);
  const balanceInt = Math.floor(balanceNumber);
  const balanceDec = (balanceNumber % 1).toFixed(2).split('.')[1] || '00';

  const actividadesFiltradas = actividades.filter((a) => {
    if (filterActTipo === 'todas') return true;
    if (filterActTipo === 'notas') return a.tipo === 'nota';
    if (filterActTipo === 'llamadas') return a.tipo === 'llamada';
    if (filterActTipo === 'whatsapp') return a.tipo === 'whatsapp';
    if (filterActTipo === 'reuniones') return a.tipo === 'reunion';
    return a.tipo === filterActTipo;
  });

  const primerNombre = cliente.name.trim().split(' ')[0] || cliente.name;

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100">
      {/* 1. TOP BREADCRUMB BAR & CONNECTION STATUS */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Volver a Clientes</span>
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Detalles de Cuenta
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 bg-white dark:bg-slate-850 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Conectado</span>
        </div>
      </div>

      {/* 2. PROFILE HERO CARD */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Avatar + Main Info */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-[#5252e0] text-white font-bold text-2xl flex items-center justify-center shadow-sm shadow-indigo-500/20">
                {cliente.name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {cliente.name}
                </h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${categoria.color}`}
                >
                  {categoria.tag}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  <span>{cliente.status === 'active' ? 'Cuenta Activa' : 'Cuenta Inactiva'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Tipo:{' '}
                  <strong className="text-slate-800 dark:text-slate-200 uppercase font-semibold">
                    {cliente.group || 'FISCAL'}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span>ID:</span>
                  <code className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                    {cliente.id.slice(0, 8)}
                  </code>
                  <button
                    type="button"
                    onClick={() => copiarTexto(cliente.id, 'ID')}
                    className="p-1 hover:text-indigo-600 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                    title="Copiar ID"
                  >
                    <Copy size={13} />
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleWhatsApp()}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-850 hover:bg-emerald-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <MessageCircle size={15} className="text-[#25D366]" />
              <span>WhatsApp</span>
            </button>

            {onCrearCotizacion && (
              <button
                type="button"
                onClick={onCrearCotizacion}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <FileText size={15} className="text-slate-500 dark:text-slate-400" />
                <span>Nueva Cotización</span>
              </button>
            )}

            {onNuevaVenta && (
              <button
                type="button"
                onClick={onNuevaVenta}
                className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <ShoppingCart size={15} className="text-white" />
                <span>Facturar en POS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ROW OF 4 FINANCIAL & ENGAGEMENT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Pendiente (CxC) */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                SALDO PENDIENTE (CXC)
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                RD$ {balanceInt.toLocaleString()}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-lg font-semibold ml-0.5">
                .{balanceDec}
              </span>
            </div>
          </div>
          <div className="mt-3">
            {balanceNumber === 0 ? (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Sin deudas pendientes</span>
              </p>
            ) : (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Facturas pendientes por saldar</span>
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Límite de Crédito */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                LÍMITE DE CRÉDITO
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">
              RD$ {Number(cliente.credit || 0).toLocaleString()}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>Uso: {porcentajeCredito}%</span>
            <span>
              Disp:{' '}
              <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                RD$ {disponibleCredito.toLocaleString()}
              </strong>
            </span>
          </div>
        </div>

        {/* Card 3: Historial de Compras */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                HISTORIAL DE COMPRAS
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {cliente.purchases || 0}
              </span>
              <span className="text-slate-700 dark:text-slate-300 text-lg font-medium">
                Facturas
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
            Actividad recurrente registrada
          </div>
        </div>

        {/* Card 4: Nivel de Fidelización */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                NIVEL DE FIDELIZACIÓN
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <Star size={16} className="fill-amber-500 text-amber-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-3 tracking-tight">
              {nivelFidelizacion}
            </p>
          </div>
          <div className="mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
            Recomendado para condiciones especiales
          </div>
        </div>
      </div>

      {/* 4. MAIN SPLIT: CONTACT & WHATSAPP TEMPLATES (LEFT) + BITÁCORA (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card: Ficha del Contacto */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                FICHA DEL CONTACTO
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                Información verificada
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Teléfono */}
              <div className="rounded-2xl bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
                      TELÉFONO
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {cliente.phone || '829-987-8357'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copiarTexto(cliente.phone || '829-987-8357', 'Teléfono')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 cursor-pointer"
                >
                  {copiadoCampo === 'Teléfono' ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>

              {/* Correo Electrónico */}
              <div className="rounded-2xl bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Mail size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
                      CORREO ELECTRÓNICO
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block max-w-[190px] sm:max-w-xs">
                      {cliente.email || 'kobacloudexpo@gmail.com'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copiarTexto(cliente.email || 'kobacloudexpo@gmail.com', 'Correo electrónico')
                  }
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 cursor-pointer"
                >
                  {copiadoCampo === 'Correo electrónico' ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>

              {/* Dirección */}
              <div className="rounded-2xl bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
                    <MapPin size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
                      DIRECCIÓN
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">
                      {cliente.address || 'Calle 13, Santo Domingo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Plantillas de WhatsApp */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={15} className="text-[#25D366]" />
              <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                PLANTILLAS DE WHATSAPP
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comunícate con mensajes comerciales pre-aprobados en un solo clic.
            </p>

            <div className="space-y-2 pt-1">
              {/* Template 1: Ofertas y Promociones */}
              <button
                type="button"
                onClick={() =>
                  handleWhatsApp(
                    `Hola ${cliente.name}, le saludamos de KOBA. Tenemos nuevas promociones y descuentos especiales del día en nuestro catálogo. ¿Le gustaría que le enviemos los detalles?`
                  )
                }
                className="w-full text-left p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50/70 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Tag
                    size={15}
                    className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Ofertas y Promociones
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      Notificar catálogo y descuentos del día
                    </p>
                  </div>
                </div>
                <Send
                  size={14}
                  className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 ml-2"
                />
              </button>

              {/* Template 2: Recordatorio Amistoso de Saldo */}
              <button
                type="button"
                onClick={() =>
                  handleWhatsApp(
                    `Estimado/a ${cliente.name}, le compartimos un recordatorio amistoso sobre su balance de cuenta pendiente en KOBA por valor de RD$ ${cliente.balance.toLocaleString()}. Quedamos a su disposición para cualquier consulta.`
                  )
                }
                className="w-full text-left p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50/70 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Clock
                    size={15}
                    className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Recordatorio Amistoso de Saldo
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      Estado de cuenta: RD$ {cliente.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Send
                  size={14}
                  className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 ml-2"
                />
              </button>

              {/* Template 3: Seguimiento de Cotización */}
              <button
                type="button"
                onClick={() =>
                  handleWhatsApp(
                    `Hola ${cliente.name}, le contactamos de KOBA para dar seguimiento a su cotización y verificar si requiere algún ajuste o soporte técnico.`
                  )
                }
                className="w-full text-left p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50/70 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <FileText
                    size={15}
                    className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Seguimiento de Cotización
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      Revisión de propuesta comercial
                    </p>
                  </div>
                </div>
                <Send
                  size={14}
                  className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 ml-2"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Bitácora de Interacciones (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                BITÁCORA DE INTERACCIONES
              </span>
              <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {actividades.length} actividades registradas
              </span>
            </div>

            {/* Form Composer */}
            <form onSubmit={handleAgregarNota} className="space-y-3">
              {/* Type Switcher Pills */}
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                {(['nota', 'llamada', 'reunion', 'whatsapp'] as CRMTipoActividad[]).map((t) => {
                  const Icon =
                    t === 'nota'
                      ? FileText
                      : t === 'llamada'
                        ? Phone
                        : t === 'reunion'
                          ? Users
                          : MessageCircle;
                  const label =
                    t === 'nota'
                      ? 'Nota'
                      : t === 'llamada'
                        ? 'Llamada'
                        : t === 'reunion'
                          ? 'Reunión'
                          : 'WhatsApp';
                  const active = tipoActividad === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoActividad(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon size={13} className={active ? 'text-slate-900 dark:text-white' : 'text-slate-400'} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Textarea Box with Action Bar */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 focus-within:border-indigo-400 dark:focus-within:border-indigo-600 transition-all">
                <textarea
                  required
                  rows={3}
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder={`Detalla lo conversado en la ${
                    tipoActividad === 'nota'
                      ? 'nota'
                      : tipoActividad === 'llamada'
                        ? 'llamada'
                        : tipoActividad === 'reunion'
                          ? 'reunión'
                          : 'conversación de WhatsApp'
                  } con ${primerNombre}...`}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 resize-none outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                    <button
                      type="button"
                      title="Adjuntar archivo o comprobante"
                      onClick={() => toast.info('Adjuntar archivo estará disponible próximamente')}
                      className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Paperclip size={16} />
                    </button>
                    <button
                      type="button"
                      title="Programar recordatorio"
                      onClick={() => toast.info('Recordatorio configurado para seguimiento')}
                      className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Clock size={16} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={guardandoNota}
                    className="px-4 py-2 rounded-xl bg-[#5252e0] hover:bg-[#4343d3] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{guardandoNota ? 'Registrando...' : 'Registrar interacción'}</span>
                    <Check size={14} />
                  </button>
                </div>
              </div>
            </form>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 pt-2 text-xs flex-wrap">
              <span className="text-slate-400 dark:text-slate-500 font-medium mr-1">Filtrar:</span>
              {[
                { id: 'todas', label: 'Todas' },
                { id: 'notas', label: 'Notas' },
                { id: 'llamadas', label: 'Llamadas' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'reuniones', label: 'Reuniones' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterActTipo(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterActTipo === f.id
                      ? 'bg-[#0f172a] dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Empty State or Activity Timeline */}
            {actividadesFiltradas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center my-2">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                  <Info size={18} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Sin actividades en este filtro
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1 leading-relaxed">
                  No hay notas o llamadas registradas recientemente. Comienza redactando una nota
                  arriba para mantener trazabilidad.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {actividadesFiltradas.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex items-start gap-3 shadow-2xs"
                  >
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0">
                      {act.tipo === 'llamada' ? (
                        <Phone size={14} />
                      ) : act.tipo === 'whatsapp' ? (
                        <MessageCircle size={14} className="text-[#25D366]" />
                      ) : act.tipo === 'reunion' ? (
                        <Calendar size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {act.titulo}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(act.creado_en).toLocaleDateString('es-DO', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEliminarActividad(act.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                            title="Eliminar actividad"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                        {act.descripcion}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
                        <User size={11} className="text-slate-400" />
                        <span>{act.usuario_nombre}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
