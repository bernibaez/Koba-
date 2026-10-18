import React, { useState, useMemo } from 'react';
import {
  Award,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  MessageCircle,
  ExternalLink,
  Search,
  Sparkles,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Phone,
  Mail,
  Building2,
  Filter,
} from 'lucide-react';
import type { CRMSegmentoRFMCliente, CRMSegmentoRFMTipo } from '@/types/crm';
import { toast } from '@/lib/toast';

interface CRMSegmentacionRFMProps {
  clientesRFM: CRMSegmentoRFMCliente[];
  onOpenClienteExpediente: (clienteId: string) => void;
  onRefresh: () => void;
}

const SEGMENT_CONFIG: Record<
  CRMSegmentoRFMTipo,
  { label: string; badgeClass: string; icon: typeof Award; desc: string }
> = {
  campeon: {
    label: 'Campeones VIP',
    badgeClass: 'bg-[#0d2f27] text-[#2dd4bf] border-[#2dd4bf]/30',
    icon: Award,
    desc: 'Compran con alta frecuencia y montos elevados. Son tu activo más valioso.',
  },
  leal: {
    label: 'Clientes Leales',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: ShieldCheck,
    desc: 'Compradores regulares que responden bien a ofertas y catálogos periódicos.',
  },
  en_riesgo: {
    label: 'En Riesgo',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
    desc: 'Solían comprar frecuentemente pero llevan más de 45 días sin pedidos.',
  },
  prometedor: {
    label: 'Prometedores',
    badgeClass: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
    icon: TrendingUp,
    desc: 'Clientes nuevos con buen ticket promedio. Requieren seguimiento para recompra.',
  },
  dormido: {
    label: 'Dormidos',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    icon: Clock,
    desc: 'Inactivos por más de 75 días. Requieren una campaña de rescate con precios de liquidación.',
  },
};

export default function CRMSegmentacionRFM({
  clientesRFM,
  onOpenClienteExpediente,
  onRefresh,
}: CRMSegmentacionRFMProps) {
  const [selectedSegment, setSelectedSegment] = useState<'todos' | CRMSegmentoRFMTipo>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Counts by segment
  const counts = useMemo(() => {
    const res: Record<string, number> = { todos: clientesRFM.length };
    clientesRFM.forEach((c) => {
      res[c.segmento] = (res[c.segmento] || 0) + 1;
    });
    return res;
  }, [clientesRFM]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clientesRFM.filter((c) => {
      const matchSegment = selectedSegment === 'todos' || c.segmento === selectedSegment;
      const matchSearch =
        searchTerm === '' ||
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.empresa && c.empresa.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSegment && matchSearch;
    });
  }, [clientesRFM, selectedSegment, searchTerm]);

  // WhatsApp 1-click trigger based on segment
  const handleWhatsAppReactivacion = (cliente: CRMSegmentoRFMCliente) => {
    if (!cliente.telefono) {
      toast.error('Este cliente no tiene teléfono registrado.');
      return;
    }

    let texto = '';
    if (cliente.segmento === 'en_riesgo') {
      texto = `Estimado/a ${cliente.nombre}, le saludamos de KOBA. Notamos que hace unos días no recibimos sus pedidos y queremos asegurarnos de que todo marche bien. Hemos preparado un descuento exclusivo del 10% en su próxima orden para apoyarle. ¿Le gustaría recibir nuestro catálogo actualizado?`;
    } else if (cliente.segmento === 'campeon') {
      texto = `Estimado/a ${cliente.nombre}, como parte de nuestro selecto grupo de clientes VIP en KOBA, nos complace asignarle condiciones comerciales preferenciales en nuestros nuevos lotes disponibles. ¿Podemos coordinar una breve llamada?`;
    } else if (cliente.segmento === 'prometedor') {
      texto = `Hola ${cliente.nombre}, un gusto saludarle de KOBA. Queremos agradecerle su preferencia reciente y consultarle si requiere reposición de inventario o asistencia con nuevos pedidos.`;
    } else {
      texto = `Hola ${cliente.nombre}, le saludamos desde KOBA para compartirle las ofertas especiales del mes disponibles para entrega inmediata.`;
    }

    const clean = cliente.telefono.replace(/\D/g, '');
    const num = clean.startsWith('1') ? clean : `1${clean}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER & EXPLANATION                                                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2dd4bf] block">
            KOBA ERP CLOUD • Inteligencia Comercial
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Segmentación de Cartera (Matriz RFM)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clasificación automática por Recencia (días), Frecuencia (compras) y Valor Monetario (facturación).
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={13} className="text-slate-400" />
          <span>Actualizar cálculo</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. BENTO CARDS OF 5 SEGMENTS                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {(['campeon', 'leal', 'en_riesgo', 'prometedor', 'dormido'] as CRMSegmentoRFMTipo[]).map((seg) => {
          const config = SEGMENT_CONFIG[seg];
          const Icon = config.icon;
          const isSelected = selectedSegment === seg;
          const count = counts[seg] || 0;

          return (
            <div
              key={seg}
              onClick={() => setSelectedSegment(isSelected ? 'todos' : seg)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-white dark:bg-slate-850 border-[#0d2f27] dark:border-[#2dd4bf] ring-2 ring-[#2dd4bf]/20 shadow-xs'
                  : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.badgeClass}`}>
                    <Icon size={14} />
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {count}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {config.label}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                  {config.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[9.5px] font-semibold text-slate-400">
                  {count > 0 ? `${Math.round((count / (clientesRFM.length || 1)) * 100)}% cartera` : '0%'}
                </span>
                <span className="text-[10px] font-bold text-[#2dd4bf]">
                  {isSelected ? 'Filtrado' : 'Ver'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. CONTROL & SEARCH BAR                                                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative flex-1 w-full md:w-auto max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente o empresa..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <button
            type="button"
            onClick={() => setSelectedSegment('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedSegment === 'todos'
                ? 'bg-[#0d2f27] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
            }`}
          >
            Todos ({clientesRFM.length})
          </button>

          {(['en_riesgo', 'campeon', 'leal', 'prometedor', 'dormido'] as CRMSegmentoRFMTipo[]).map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => setSelectedSegment(seg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedSegment === seg
                  ? 'bg-[#0d2f27] text-[#2dd4bf] font-bold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
              }`}
            >
              {SEGMENT_CONFIG[seg].label} ({counts[seg] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CLIENTS GRID / TABLE (Minimalist Cards)                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No hay clientes en este segmento
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Prueba cambiando los filtros o buscando otro término.
            </p>
          </div>
        ) : (
          filteredClients.map((c) => {
            const config = SEGMENT_CONFIG[c.segmento];
            const Icon = config.icon;

            return (
              <div
                key={c.cliente_id}
                className="bg-white dark:bg-slate-850 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 shadow-2xs flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {c.nombre}
                        </h4>
                        {c.empresa && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {c.empresa}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 shrink-0 ${config.badgeClass}`}
                    >
                      <Icon size={11} />
                      <span>{config.label}</span>
                    </span>
                  </div>

                  {/* RFM Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 mb-3 text-center border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                        Recencia
                      </span>
                      <p
                        className={`text-xs font-black mt-0.5 ${
                          c.recencia_dias > 45
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {c.recencia_dias}d
                      </p>
                    </div>

                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                        Compras
                      </span>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                        {c.frecuencia_compras}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                        Facturado
                      </span>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        RD$ {(c.monto_total / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>

                  {/* Suggested action */}
                  <div className="mb-3.5 p-2 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40">
                    <span className="text-[9.5px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block">
                      Acción recomendada
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                      {c.accion_sugerida}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenClienteExpediente(c.cliente_id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Ficha 360°</span>
                    <ExternalLink size={11} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppReactivacion(c)}
                    className="px-3 py-1.5 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-[#2dd4bf] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <MessageCircle size={13} className="text-[#2dd4bf]" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
