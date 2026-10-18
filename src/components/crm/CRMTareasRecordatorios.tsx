import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Phone,
  MessageSquare,
  Users,
  Search,
  Filter,
  Zap,
  ChevronRight,
  MoreVertical,
  X,
  Building2,
  CalendarDays,
  FileText,
  CreditCard,
  RotateCcw,
  Sparkles,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import type { CRMActividad, CRMLead, CRMTipoActividad, CRMPrioridad } from '@/types/crm';
import {
  agregarActividad,
  toggleCompletarActividad,
  reprogramarActividad,
  eliminarActividad,
  generarRecordatoriosAutomaticos,
} from '@/services/crm.service';
import { toast } from '@/lib/toast';

interface CRMTareasRecordatoriosProps {
  actividades: CRMActividad[];
  leads: CRMLead[];
  onRefresh: () => void;
  onOpenLeadDetail?: (leadId: string) => void;
}

export default function CRMTareasRecordatorios({
  actividades,
  leads,
  onRefresh,
  onOpenLeadDetail,
}: CRMTareasRecordatoriosProps) {
  const [filterTab, setFilterTab] = useState<'todas' | 'hoy' | 'vencidas' | 'proximas' | 'completadas'>('todas');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [completingTask, setCompletingTask] = useState<CRMActividad | null>(null);
  const [resultadoNota, setResultadoNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [generandoAuto, setGenerandoAuto] = useState(false);

  // Form states
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [tipo, setTipo] = useState<CRMTipoActividad>('llamada');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<CRMPrioridad>('alta');
  const [fechaProgramada, setFechaProgramada] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [horaProgramada, setHoraProgramada] = useState<string>('10:00 AM');
  const [vendedorNombre, setVendedorNombre] = useState('Carlos López');

  const hoyStr = new Date().toISOString().split('T')[0];

  // Productivity Metrics
  const tareasVencidas = useMemo(() => {
    return actividades.filter((a) => !a.completada && a.fecha_programada && a.fecha_programada < hoyStr);
  }, [actividades, hoyStr]);

  const tareasParaHoy = useMemo(() => {
    return actividades.filter((a) => !a.completada && a.fecha_programada === hoyStr);
  }, [actividades, hoyStr]);

  const tareasProximas = useMemo(() => {
    return actividades.filter((a) => !a.completada && (!a.fecha_programada || a.fecha_programada > hoyStr));
  }, [actividades, hoyStr]);

  const tareasCompletadas = useMemo(() => {
    return actividades.filter((a) => a.completada);
  }, [actividades]);

  // Filtered task list
  const tareasFiltradas = useMemo(() => {
    return actividades.filter((a) => {
      if (filterTab === 'vencidas') {
        if (a.completada || !a.fecha_programada || a.fecha_programada >= hoyStr) return false;
      } else if (filterTab === 'hoy') {
        if (a.completada || a.fecha_programada !== hoyStr) return false;
      } else if (filterTab === 'proximas') {
        if (a.completada || (!a.fecha_programada || a.fecha_programada <= hoyStr)) return false;
      } else if (filterTab === 'completadas') {
        if (!a.completada) return false;
      }

      if (filterTipo !== 'todos' && a.tipo !== filterTipo) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mTit = a.titulo.toLowerCase().includes(q);
        const mDesc = (a.descripcion || '').toLowerCase().includes(q);
        const mLead = (a.lead_titulo || '').toLowerCase().includes(q);
        const mContact = (a.contacto_nombre || '').toLowerCase().includes(q);
        if (!mTit && !mDesc && !mLead && !mContact) return false;
      }

      return true;
    });
  }, [actividades, filterTab, filterTipo, searchTerm, hoyStr]);

  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error('Por favor escribe el asunto o título de la tarea');
      return;
    }

    setGuardando(true);
    try {
      const leadAsociado = leads.find((l) => l.id === selectedLeadId);

      await agregarActividad({
        lead_id: selectedLeadId || undefined,
        lead_titulo: leadAsociado?.titulo || undefined,
        contacto_nombre: leadAsociado?.contacto_nombre || undefined,
        telefono: leadAsociado?.telefono || undefined,
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        prioridad,
        fecha_programada: fechaProgramada,
        hora_programada: horaProgramada,
        completada: false,
        recordatorio_activo: true,
        usuario_nombre: vendedorNombre,
      });

      toast.success('Compromiso agendado exitosamente');
      setShowCreateModal(false);
      resetForm();
      onRefresh();
    } catch {
      toast.error('Error al guardar la tarea');
    } finally {
      setGuardando(false);
    }
  };

  const resetForm = () => {
    setSelectedLeadId('');
    setTipo('llamada');
    setTitulo('');
    setDescripcion('');
    setPrioridad('alta');
    setFechaProgramada(hoyStr);
    setHoraProgramada('10:00 AM');
  };

  const handleToggleCompletar = async (act: CRMActividad) => {
    if (!act.completada) {
      setCompletingTask(act);
      setResultadoNota('');
    } else {
      await toggleCompletarActividad(act.id);
      toast.info('Tarea reabierta');
      onRefresh();
    }
  };

  const handleGuardarResultadoNota = async () => {
    if (!completingTask) return;
    await toggleCompletarActividad(completingTask.id, resultadoNota.trim() || undefined);
    toast.success('Tarea completada y guardada en historial');
    setCompletingTask(null);
    onRefresh();
  };

  const handleReprogramar = async (actId: string, diasExtra: number) => {
    const nuevaFecha = new Date(Date.now() + diasExtra * 86400000).toISOString().split('T')[0];
    await reprogramarActividad(actId, nuevaFecha);
    toast.success(`Reprogramada para: ${nuevaFecha}`);
    onRefresh();
  };

  const handleEliminar = async (actId: string) => {
    await eliminarActividad(actId);
    toast.success('Tarea eliminada');
    onRefresh();
  };

  const handleAutoRecordatorios = async () => {
    setGenerandoAuto(true);
    try {
      const res = await generarRecordatoriosAutomaticos();
      if (res.creadas > 0) {
        toast.success(`Se generaron ${res.creadas} recordatorios automáticos`);
      } else {
        toast.info('No hay prospectos desatendidos pendientes');
      }
      onRefresh();
    } catch {
      toast.error('Error al generar recordatorios automáticos');
    } finally {
      setGenerandoAuto(false);
    }
  };

  const handleWhatsAppDirect = (telefono?: string, titulo?: string) => {
    if (!telefono) {
      toast.error('Esta tarea no tiene número de teléfono asociado');
      return;
    }
    const cleanTel = telefono.replace(/\D/g, '');
    const finalTel = cleanTel.startsWith('1') ? cleanTel : `1${cleanTel}`;
    const msg = encodeURIComponent(`Hola, te contacto de KOBA Cloud con relación a: "${titulo || 'nuestro seguimiento comercial'}". ¿Cómo estás?`);
    window.open(`https://wa.me/${finalTel}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. CABECERA & TITULO (Minimalist) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              CRM • Seguimiento
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Tareas & Recordatorios
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organiza llamadas, reuniones y seguimientos comerciales para acelerar el ciclo de ventas.
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoRecordatorios}
            disabled={generandoAuto}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Analiza leads sin actividad y crea recordatorios para hoy"
          >
            <Zap size={14} className={generandoAuto ? 'animate-spin text-emerald-600' : 'text-emerald-600'} />
            <span>{generandoAuto ? 'Analizando...' : 'Auto-recordatorios'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={2.5} className="text-[#2dd4bf]" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* 2. BENTO CARDS DE PRODUCTIVIDAD (Minimalist) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vencidas */}
        <div
          onClick={() => setFilterTab('vencidas')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs transition-all cursor-pointer ${
            filterTab === 'vencidas'
              ? 'border-rose-500 ring-1 ring-rose-500/30'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Vencidas
            </span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={14} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {tareasVencidas.length}
            </span>
            {tareasVencidas.length > 0 && (
              <span className="text-[10.5px] font-semibold text-rose-600">
                Acción inmediata
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Pendientes de días anteriores
          </p>
        </div>

        {/* Para Hoy */}
        <div
          onClick={() => setFilterTab('hoy')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs transition-all cursor-pointer ${
            filterTab === 'hoy'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Para Hoy
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Calendar size={14} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {tareasParaHoy.length}
            </span>
            <span className="text-[10.5px] font-semibold text-emerald-600">
              En agenda
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Compromisos para el día
          </p>
        </div>

        {/* Próximas */}
        <div
          onClick={() => setFilterTab('proximas')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs transition-all cursor-pointer ${
            filterTab === 'proximas'
              ? 'border-slate-400 ring-1 ring-slate-400/30'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Próximos Días
            </span>
            <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <Clock size={14} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {tareasProximas.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Seguimiento programado
          </p>
        </div>

        {/* Completadas */}
        <div
          onClick={() => setFilterTab('completadas')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs transition-all cursor-pointer ${
            filterTab === 'completadas'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completadas
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {tareasCompletadas.length}
            </span>
            <span className="text-[10.5px] font-semibold text-emerald-600">
              Resueltas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Historial de interacciones
          </p>
        </div>
      </div>

      {/* 3. TOOLBAR Y PESTAÑAS (Minimalist) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Pestañas de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <button
            type="button"
            onClick={() => setFilterTab('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'todas'
                ? 'bg-[#0d2f27] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
            }`}
          >
            Todas ({actividades.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('vencidas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'vencidas'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
            }`}
          >
            Vencidas ({tareasVencidas.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('hoy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'hoy'
                ? 'bg-[#0d2f27] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
            }`}
          >
            Para Hoy ({tareasParaHoy.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('proximas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'proximas'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
            }`}
          >
            Próximas ({tareasProximas.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('completadas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'completadas'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
            }`}
          >
            Completadas ({tareasCompletadas.length})
          </button>
        </div>

        {/* Búsqueda y Tipo */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar compromiso..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="todos">Todos los tipos</option>
            <option value="llamada">Llamadas</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="reunion">Reuniones</option>
            <option value="tarea">Tareas</option>
            <option value="nota">Notas</option>
          </select>
        </div>
      </div>

      {/* 4. LISTA DE TAREAS */}
      <div className="space-y-2.5">
        {tareasFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400">
            No hay tareas en esta sección.
          </div>
        ) : (
          tareasFiltradas.map((act) => {
            const isVencida = !act.completada && act.fecha_programada && act.fecha_programada < hoyStr;
            const isHoy = !act.completada && act.fecha_programada === hoyStr;

            return (
              <div
                key={act.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 ${
                  act.completada
                    ? 'opacity-70 border-slate-200/80 dark:border-slate-800 bg-slate-50/40'
                    : isVencida
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/10 hover:border-rose-300'
                    : isHoy
                    ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 hover:border-emerald-300'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* Checkbox y Contenido */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleCompletar(act)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                      act.completada
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isVencida
                        ? 'border-rose-400 hover:border-rose-600 bg-white dark:bg-slate-800'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-500 bg-white dark:bg-slate-800'
                    }`}
                    title={act.completada ? 'Reabrir tarea' : 'Completar tarea'}
                  >
                    {act.completada && <CheckCircle2 size={13} />}
                  </button>

                  <div
                    className={`p-1.5 rounded-lg text-slate-600 dark:text-slate-300 flex-shrink-0 ${
                      act.tipo === 'llamada'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700'
                        : act.tipo === 'whatsapp'
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700'
                        : act.tipo === 'reunion'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    {act.tipo === 'llamada' ? (
                      <Phone size={13} />
                    ) : act.tipo === 'whatsapp' ? (
                      <MessageSquare size={13} />
                    ) : act.tipo === 'reunion' ? (
                      <Users size={13} />
                    ) : act.tipo === 'cobro' ? (
                      <CreditCard size={13} />
                    ) : (
                      <FileText size={13} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-bold text-xs text-slate-900 dark:text-white ${
                          act.completada ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {act.titulo}
                      </span>

                      <span
                        className={`text-[9.5px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                          act.prioridad === 'urgente'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : act.prioridad === 'alta'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {act.prioridad || 'Normal'}
                      </span>

                      {isVencida && (
                        <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-600 text-white">
                          Vencida
                        </span>
                      )}
                      {isHoy && (
                        <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-700 text-white">
                          Hoy
                        </span>
                      )}
                    </div>

                    {act.descripcion && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {act.descripcion}
                      </p>
                    )}

                    {act.resultado_nota && (
                      <div className="mt-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 text-[11px] text-slate-700 dark:text-slate-300">
                        <strong>Resultado:</strong> {act.resultado_nota}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      {act.contacto_nombre && (
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                          {act.contacto_nombre}
                        </span>
                      )}
                      {act.lead_titulo && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate max-w-xs">
                          {act.lead_titulo}
                        </span>
                      )}
                      {act.fecha_programada && (
                        <span>
                          {act.fecha_programada} {act.hora_programada && `a las ${act.hora_programada}`}
                        </span>
                      )}
                      <span>• Asignado a: {act.usuario_nombre}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {act.telefono && !act.completada && (
                    <button
                      type="button"
                      onClick={() => handleWhatsAppDirect(act.telefono, act.titulo)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200/80 transition-colors cursor-pointer"
                    >
                      <MessageSquare size={12} />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  )}

                  {!act.completada && (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleReprogramar(act.id, 1)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10.5px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        +1 Día
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReprogramar(act.id, 3)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10.5px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        +3 Días
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleEliminar(act.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL PARA COMPLETAR CON RESULTADO */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Completar Compromiso</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {completingTask.titulo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Resultado de la llamada o reunión:
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Se acordó enviar cotización formal el viernes..."
                value={resultadoNota}
                onChange={(e) => setResultadoNota(e.target.value)}
                className="input-field w-full py-2 leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarResultadoNota}
                  className="px-4 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-white text-xs font-semibold shadow-2xs"
                >
                  Completar Tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL PARA CREAR NUEVA TAREA */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Nuevo Compromiso</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Programa una llamada, reunión o tarea de seguimiento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCrearTarea} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Vincular a Prospecto (Opcional)
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="input-field w-full cursor-pointer"
                >
                  <option value="">-- Sin vincular a prospecto --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.titulo} ({l.contacto_nombre})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tipo de Actividad
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'llamada', label: 'Llamada' },
                    { id: 'whatsapp', label: 'WhatsApp' },
                    { id: 'reunion', label: 'Reunión' },
                    { id: 'tarea', label: 'Tarea' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipo(t.id as any)}
                      className={`p-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        tipo === t.id
                          ? 'bg-[#0d2f27] text-white border-[#0d2f27]'
                          : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Asunto / Título *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Llamada para acordar despacho..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Fecha Programada *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaProgramada}
                    onChange={(e) => setFechaProgramada(e.target.value)}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Hora
                  </label>
                  <input
                    type="text"
                    placeholder="10:30 AM"
                    value={horaProgramada}
                    onChange={(e) => setHoraProgramada(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as CRMPrioridad)}
                    className="input-field w-full cursor-pointer"
                  >
                    <option value="urgente">Urgente</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Asignado a
                  </label>
                  <input
                    type="text"
                    value={vendedorNombre}
                    onChange={(e) => setVendedorNombre(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas de Preparación
                </label>
                <textarea
                  rows={2}
                  placeholder="Puntos a tratar..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="input-field w-full py-2"
                />
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
                  {guardando ? 'Guardando...' : 'Programar Compromiso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
