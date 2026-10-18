import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Flame,
  SunMedium,
  Snowflake,
  MessageSquare,
  Phone,
  Mail,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  Zap,
  MoreVertical,
  Trash2,
  Store,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import type { CRMLead, CRMLeadTemperatura, CRMCanalOrigen, CRMPrioridad, CRMLeadEtapa } from '@/types/crm';
import { guardarLead, cambiarTemperaturaLead, cambiarEtapaLead, eliminarLead, agregarActividad, generarRecordatoriosAutomaticos } from '@/services/crm.service';
import { toast } from '@/lib/toast';

interface CRMLeadsProspeccionProps {
  leads: CRMLead[];
  onRefresh: () => void;
  onNavigateToPipeline: () => void;
  onOpenCreateTaskForLead: (lead: CRMLead) => void;
}

export default function CRMLeadsProspeccion({
  leads,
  onRefresh,
  onNavigateToPipeline,
  onOpenCreateTaskForLead,
}: CRMLeadsProspeccionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTemperatura, setFilterTemperatura] = useState<string>('todas');
  const [filterCanal, setFilterCanal] = useState<string>('todos');
  const [filterVendedor, setFilterVendedor] = useState<string>('todos');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generandoAuto, setGenerandoAuto] = useState(false);

  // Quick WhatsApp Template Modal
  const [selectedLeadWhatsApp, setSelectedLeadWhatsApp] = useState<CRMLead | null>(null);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<number>(1);
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');

  // Form states
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState('');
  const [nuevaEmpresa, setNuevaEmpresa] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [nuevaTemperatura, setNuevaTemperatura] = useState<CRMLeadTemperatura>('caliente');
  const [nuevoCanal, setNuevoCanal] = useState<CRMCanalOrigen>('whatsapp');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<CRMPrioridad>('alta');
  const [nuevoVendedor, setNuevoVendedor] = useState('Carlos López');
  const [nuevasNotas, setNuevasNotas] = useState('');
  const [crearTareaAuto, setCrearTareaAuto] = useState(true);

  // Metrics
  const totalLeads = leads.length;
  const leadsCalientes = leads.filter((l) => l.temperatura === 'caliente' || l.probabilidad >= 70);
  const leadsTibios = leads.filter((l) => l.temperatura === 'tibio' || (l.probabilidad >= 30 && l.probabilidad < 70));
  const leadsFrios = leads.filter((l) => l.temperatura === 'frio' || l.probabilidad < 30);

  // Inactive leads (> 2 days without contact)
  const now = Date.now();
  const leadsSinContacto = leads.filter((l) => {
    if (l.etapa === 'ganado' || l.etapa === 'perdido') return false;
    const last = l.ultimo_contacto_en ? new Date(l.ultimo_contacto_en).getTime() : 0;
    const days = Math.floor((now - last) / 86400000);
    return days >= 2;
  });

  const vendedoresList = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.vendedor_asignado) s.add(l.vendedor_asignado);
    });
    return Array.from(s);
  }, [leads]);

  // Filtered leads
  const leadsFiltrados = useMemo(() => {
    return leads.filter((l) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mTitle = l.titulo.toLowerCase().includes(q);
        const mContact = l.contacto_nombre.toLowerCase().includes(q);
        const mEmpresa = (l.empresa_nombre || '').toLowerCase().includes(q);
        const mPhone = (l.telefono || '').toLowerCase().includes(q);
        if (!mTitle && !mContact && !mEmpresa && !mPhone) return false;
      }

      if (filterTemperatura !== 'todas') {
        const temp = l.temperatura || (l.probabilidad >= 70 ? 'caliente' : l.probabilidad >= 30 ? 'tibio' : 'frio');
        if (temp !== filterTemperatura) return false;
      }

      if (filterCanal !== 'todos' && l.canal_origen !== filterCanal) {
        return false;
      }

      if (filterVendedor !== 'todos' && l.vendedor_asignado !== filterVendedor) {
        return false;
      }

      return true;
    });
  }, [leads, searchTerm, filterTemperatura, filterCanal, filterVendedor]);

  const handleCrearLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoContacto.trim()) {
      toast.error('Por favor completa el título y el nombre del contacto');
      return;
    }

    setGuardando(true);
    try {
      const created = await guardarLead({
        titulo: nuevoTitulo.trim(),
        contacto_nombre: nuevoContacto.trim(),
        empresa_nombre: nuevaEmpresa.trim() || undefined,
        telefono: nuevoTelefono.trim() || undefined,
        correo: nuevoCorreo.trim() || undefined,
        valor_estimado: parseFloat(nuevoMonto) || 0,
        probabilidad: nuevaTemperatura === 'caliente' ? 80 : nuevaTemperatura === 'tibio' ? 50 : 20,
        etapa: 'nuevo',
        prioridad: nuevaPrioridad,
        temperatura: nuevaTemperatura,
        canal_origen: nuevoCanal,
        vendedor_asignado: nuevoVendedor,
        notas: nuevasNotas.trim() || undefined,
      });

      if (crearTareaAuto) {
        await agregarActividad({
          lead_id: created.id,
          lead_titulo: created.titulo,
          contacto_nombre: created.contacto_nombre,
          telefono: created.telefono,
          tipo: 'llamada',
          titulo: `Primer contacto con: ${created.contacto_nombre}`,
          descripcion: `Seguimiento inicial de prospección: ${created.titulo}. Presentar propuesta y registrar requerimientos.`,
          prioridad: 'alta',
          fecha_programada: new Date().toISOString().split('T')[0],
          hora_programada: '10:30 AM',
          completada: false,
          recordatorio_activo: true,
          usuario_nombre: nuevoVendedor,
        });
      }

      toast.success('Prospecto registrado exitosamente');
      setShowCreateModal(false);
      resetForm();
      onRefresh();
    } catch {
      toast.error('Error al guardar el prospecto');
    } finally {
      setGuardando(false);
    }
  };

  const resetForm = () => {
    setNuevoTitulo('');
    setNuevoContacto('');
    setNuevaEmpresa('');
    setNuevoTelefono('');
    setNuevoCorreo('');
    setNuevoMonto('');
    setNuevaTemperatura('caliente');
    setNuevoCanal('whatsapp');
    setNuevaPrioridad('alta');
    setNuevasNotas('');
    setCrearTareaAuto(true);
  };

  const handleChangeTemp = async (leadId: string, temp: CRMLeadTemperatura) => {
    await cambiarTemperaturaLead(leadId, temp);
    toast.success(`Calificación actualizada: ${temp.toUpperCase()}`);
    onRefresh();
  };

  const handleGenerarAutoRecordatorios = async () => {
    setGenerandoAuto(true);
    try {
      const res = await generarRecordatoriosAutomaticos();
      if (res.creadas > 0) {
        toast.success(`Se crearon ${res.creadas} recordatorios automáticos`);
      } else {
        toast.info('Todos los prospectos activos están al día');
      }
      onRefresh();
    } catch {
      toast.error('Error al generar recordatorios');
    } finally {
      setGenerandoAuto(false);
    }
  };

  const handleOpenWhatsAppModal = (lead: CRMLead) => {
    setSelectedLeadWhatsApp(lead);
    setPlantillaSeleccionada(1);
    updatePlantillaTexto(1, lead);
  };

  const updatePlantillaTexto = (id: number, lead: CRMLead) => {
    const nombre = lead.contacto_nombre.split(' ')[0] || lead.contacto_nombre;
    const empresa = lead.empresa_nombre || 'su empresa';
    const titulo = lead.titulo;

    if (id === 1) {
      setMensajePersonalizado(
        `Hola ${nombre}, un gusto saludarte. Te contacto de KOBA Cloud con relación a tu solicitud: "${titulo}". ¿Podemos coordinar unos minutos hoy para validar tus requerimientos?`
      );
    } else if (id === 2) {
      setMensajePersonalizado(
        `Hola ${nombre}, un placer saludarte. Te comparto nuestro catálogo comercial y condiciones para ${empresa}. Quedamos atentos para cualquier consulta.`
      );
    } else {
      setMensajePersonalizado(
        `Estimado(a) ${nombre}, ¿cómo estás? Te escribo para dar seguimiento a la propuesta comercial que revisamos para ${empresa}. ¿Pudieron evaluarla con el equipo?`
      );
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedLeadWhatsApp?.telefono) {
      toast.error('Este prospecto no tiene número de teléfono registrado');
      return;
    }
    const cleanTel = selectedLeadWhatsApp.telefono.replace(/\D/g, '');
    const finalTel = cleanTel.startsWith('1') ? cleanTel : `1${cleanTel}`;
    const url = `https://wa.me/${finalTel}?text=${encodeURIComponent(mensajePersonalizado)}`;
    window.open(url, '_blank');
    setSelectedLeadWhatsApp(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. CABECERA & TITULO (Minimalist) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              CRM • Prospección
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Leads & Prospectos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Califica el interés de compra, automatiza recordatorios y convierte contactos en ventas.
          </p>
        </div>

        {/* Acciones de Cabecera (Minimalist Buttons) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerarAutoRecordatorios}
            disabled={generandoAuto}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Analiza prospectos sin contacto y genera tareas inmediatas"
          >
            <Zap size={14} className={generandoAuto ? 'animate-spin text-emerald-600' : 'text-emerald-600'} />
            <span>{generandoAuto ? 'Analizando...' : 'Auto-recordatorios'}</span>
            {leadsSinContacto.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {leadsSinContacto.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onNavigateToPipeline}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <TrendingUp size={14} className="text-slate-500" />
            <span>Ver Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={2.5} className="text-[#2dd4bf]" />
            <span>Capturar Lead</span>
          </button>
        </div>
      </div>

      {/* 2. BENTO CARDS (Minimalist, Koba Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Prospectos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Prospectos
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Users size={14} />
            </span>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalLeads}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Valor: <span className="font-bold text-slate-800 dark:text-slate-200">RD$ {leads.reduce((a, c) => a + (c.valor_estimado || 0), 0).toLocaleString()}</span>
          </p>
        </div>

        {/* Leads Calientes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Alta Intención (Hot)
            </span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Flame size={14} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {leadsCalientes.length}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">
              Probabilidad &ge; 70%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Prioridad alta para cierre este mes
          </p>
        </div>

        {/* Sin Contacto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sin Contacto (&gt;2 días)
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <AlertCircle size={14} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {leadsSinContacto.length}
            </span>
            {leadsSinContacto.length > 0 && (
              <span className="text-[10.5px] font-semibold text-amber-600">
                Atención requerida
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Requieren llamada de seguimiento
          </p>
        </div>

        {/* Distribución */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Calificación de Cartera
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {Math.round(((leadsCalientes.length + leadsTibios.length) / Math.max(totalLeads, 1)) * 100)}% calificados
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex mt-3">
              <div
                className="bg-emerald-600 h-full"
                style={{ width: `${(leadsCalientes.length / Math.max(totalLeads, 1)) * 100}%` }}
                title={`Calientes: ${leadsCalientes.length}`}
              />
              <div
                className="bg-amber-400 h-full"
                style={{ width: `${(leadsTibios.length / Math.max(totalLeads, 1)) * 100}%` }}
                title={`Tibios: ${leadsTibios.length}`}
              />
              <div
                className="bg-slate-300 dark:bg-slate-700 h-full"
                style={{ width: `${(leadsFrios.length / Math.max(totalLeads, 1)) * 100}%` }}
                title={`Fríos: ${leadsFrios.length}`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              {leadsCalientes.length} Hot
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              {leadsTibios.length} Tibios
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              {leadsFrios.length} Fríos
            </span>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR DE BÚSQUEDA Y FILTRADO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 w-full md:w-auto max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, empresa, teléfono..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterTemperatura}
            onChange={(e) => setFilterTemperatura(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="todas">Todas las temperaturas</option>
            <option value="caliente">Caliente (Hot)</option>
            <option value="tibio">Tibio</option>
            <option value="frio">Frío</option>
          </select>

          <select
            value={filterCanal}
            onChange={(e) => setFilterCanal(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="todos">Todos los canales</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="web">Web</option>
            <option value="visita">Tienda</option>
            <option value="referido">Referido</option>
            <option value="telefono">Teléfono</option>
          </select>

          <select
            value={filterVendedor}
            onChange={(e) => setFilterVendedor(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="todos">Todos los vendedores</option>
            {vendedoresList.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. TABLA DE LEADS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Prospecto / Requerimiento</th>
                <th className="px-5 py-3.5">Contacto & Empresa</th>
                <th className="px-5 py-3.5">Temperatura</th>
                <th className="px-5 py-3.5">Canal</th>
                <th className="px-5 py-3.5">Valor Estimado</th>
                <th className="px-5 py-3.5">Último Contacto</th>
                <th className="px-5 py-3.5">Vendedor</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leadsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron prospectos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                leadsFiltrados.map((l) => {
                  const temp = l.temperatura || (l.probabilidad >= 70 ? 'caliente' : l.probabilidad >= 30 ? 'tibio' : 'frio');
                  const daysSince = l.ultimo_contacto_en
                    ? Math.floor((now - new Date(l.ultimo_contacto_en).getTime()) / 86400000)
                    : 3;

                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Titulo */}
                      <td className="px-5 py-4 max-w-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block text-xs group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {l.titulo}
                          </span>
                          {l.notas && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {l.notas}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Contacto & Empresa */}
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {l.contacto_nombre}
                        </span>
                        {l.empresa_nombre && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 size={11} className="text-slate-400" />
                            {l.empresa_nombre}
                          </span>
                        )}
                        {l.telefono && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {l.telefono}
                          </span>
                        )}
                      </td>

                      {/* Selector de Temperatura */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleChangeTemp(l.id, 'caliente')}
                            title="Caliente (Alta intención de compra)"
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              temp === 'caliente'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 ring-1 ring-emerald-500/40'
                                : 'text-slate-300 hover:text-emerald-600'
                            }`}
                          >
                            <Flame size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeTemp(l.id, 'tibio')}
                            title="Tibio"
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              temp === 'tibio'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 ring-1 ring-amber-500/40'
                                : 'text-slate-300 hover:text-amber-600'
                            }`}
                          >
                            <SunMedium size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeTemp(l.id, 'frio')}
                            title="Frío"
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              temp === 'frio'
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-400/40'
                                : 'text-slate-300 hover:text-slate-600'
                            }`}
                          >
                            <Snowflake size={14} />
                          </button>
                        </div>
                      </td>

                      {/* Canal de Origen */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {l.canal_origen === 'whatsapp' ? (
                            <>
                              <MessageSquare size={11} className="text-emerald-600" /> WhatsApp
                            </>
                          ) : l.canal_origen === 'web' ? (
                            <>
                              <Globe size={11} className="text-blue-500" /> Web
                            </>
                          ) : l.canal_origen === 'visita' ? (
                            <>
                              <Store size={11} className="text-slate-500" /> Tienda
                            </>
                          ) : l.canal_origen === 'referido' ? (
                            <>
                              <Users size={11} className="text-teal-600" /> Referido
                            </>
                          ) : (
                            <>
                              <Phone size={11} className="text-slate-500" /> Teléfono
                            </>
                          )}
                        </span>
                      </td>

                      {/* Monto */}
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                        RD$ {Number(l.valor_estimado).toLocaleString()}
                      </td>

                      {/* Último contacto */}
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10.5px] font-medium block ${
                            daysSince >= 3
                              ? 'text-rose-600 font-bold'
                              : daysSince >= 1
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {daysSince === 0
                            ? 'Hoy'
                            : daysSince === 1
                            ? 'Ayer'
                            : `Hace ${daysSince} días`}
                        </span>
                      </td>

                      {/* Vendedor */}
                      <td className="px-5 py-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap text-[11px]">
                        {l.vendedor_asignado || 'Admin'}
                      </td>

                      {/* Botones de Acción */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppModal(l)}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 transition-all cursor-pointer"
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenCreateTaskForLead(l)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                            title="Agendar tarea"
                          >
                            <Calendar size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={onNavigateToPipeline}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                            title="Ver en Pipeline"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL DE CAPTURA RÁPIDA DE LEAD */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Capturar Nuevo Lead</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registra los datos del prospecto y programa el primer seguimiento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCrearLead} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título de la Oportunidad / Requerimiento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cotización Mayorista para Restaurante"
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nombre del Contacto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Marcos Valenzuela"
                    value={nuevoContacto}
                    onChange={(e) => setNuevoContacto(e.target.value)}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Empresa / Negocio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Grupo Gastronómico"
                    value={nuevaEmpresa}
                    onChange={(e) => setNuevaEmpresa(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="809-555-0000"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={nuevoCorreo}
                    onChange={(e) => setNuevoCorreo(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Valor Estimado (RD$)
                  </label>
                  <input
                    type="number"
                    placeholder="85000"
                    value={nuevoMonto}
                    onChange={(e) => setNuevoMonto(e.target.value)}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Canal de Origen
                  </label>
                  <select
                    value={nuevoCanal}
                    onChange={(e) => setNuevoCanal(e.target.value as CRMCanalOrigen)}
                    className="input-field w-full cursor-pointer"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="web">Sitio Web</option>
                    <option value="visita">Tienda Presencial</option>
                    <option value="referido">Referido</option>
                    <option value="telefono">Llamada Telefónica</option>
                  </select>
                </div>
              </div>

              {/* Temperatura */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Calificación Inicial
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevaTemperatura('caliente')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-semibold flex items-center justify-center gap-1.5 ${
                      nuevaTemperatura === 'caliente'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-500'
                        : 'border-slate-200 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Flame size={14} className="text-emerald-600" />
                    <span>Caliente (Hot)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevaTemperatura('tibio')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-semibold flex items-center justify-center gap-1.5 ${
                      nuevaTemperatura === 'tibio'
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-500'
                        : 'border-slate-200 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <SunMedium size={14} className="text-amber-500" />
                    <span>Tibio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevaTemperatura('frio')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-semibold flex items-center justify-center gap-1.5 ${
                      nuevaTemperatura === 'frio'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-400'
                        : 'border-slate-200 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Snowflake size={14} className="text-slate-400" />
                    <span>Frío</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el requerimiento..."
                  value={nuevasNotas}
                  onChange={(e) => setNuevasNotas(e.target.value)}
                  className="input-field w-full py-2"
                />
              </div>

              {/* Checkbox */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chkAutoTask"
                  checked={crearTareaAuto}
                  onChange={(e) => setCrearTareaAuto(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="chkAutoTask" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Crear recordatorio de llamada inicial para hoy
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-white text-xs font-semibold shadow-2xs"
                >
                  {guardando ? 'Guardando...' : 'Capturar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DE WHATSAPP CON PLANTILLAS */}
      {selectedLeadWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-600" />
                  <span>Mensaje para: {selectedLeadWhatsApp.contacto_nombre}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecciona una plantilla o ajusta el texto antes de abrir el chat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadWhatsApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Plantilla:
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 1, label: 'Saludo Inicial & Presentación' },
                  { id: 2, label: 'Envío de Catálogo y Precios' },
                  { id: 3, label: 'Seguimiento de Propuesta' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlantillaSeleccionada(p.id);
                      updatePlantillaTexto(p.id, selectedLeadWhatsApp);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border font-medium transition-all cursor-pointer ${
                      plantillaSeleccionada === p.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Texto del mensaje:
                </label>
                <textarea
                  rows={4}
                  value={mensajePersonalizado}
                  onChange={(e) => setMensajePersonalizado(e.target.value)}
                  className="input-field w-full py-2 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedLeadWhatsApp(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-[#2dd4bf] text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 border border-[#2dd4bf]/20"
                >
                  <MessageSquare size={14} className="text-[#2dd4bf]" />
                  <span>Abrir WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
