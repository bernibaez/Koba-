import React, { useState, useMemo } from 'react';
import {
  Users,
  DollarSign,
  Phone,
  Mail,
  Building2,
  Calendar,
  MessageCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Sparkles,
  Filter,
  Search,
  LayoutGrid,
  ListFilter,
  Eye,
  FileText,
  User,
  ChevronRight,
  ExternalLink,
  Tag,
  AlertCircle,
  Percent,
  Store,
  X,
} from 'lucide-react';
import type { CRMLead, CRMLeadEtapa, CRMPrioridad, CRMCanalOrigen } from '@/types/crm';
import { cambiarEtapaLead, eliminarLead, guardarLead } from '@/services/crm.service';
import { toast } from '@/lib/toast';
import ModalShell from '@/components/ui/ModalShell';

interface CRMKanbanProps {
  leads: CRMLead[];
  onRefresh: () => void;
  onOpenLeadDetail?: (lead: CRMLead) => void;
  onConvertToSale?: (lead: CRMLead) => void;
}

const ETAPAS: {
  id: CRMLeadEtapa;
  label: string;
  color: string;
  accent: string;
  badgeBg: string;
  probabilidadDefault: number;
}[] = [
  {
    id: 'nuevo',
    label: 'Nuevo Prospecto',
    color: 'from-blue-500 to-indigo-500',
    accent: 'border-t-blue-500',
    badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    probabilidadDefault: 20,
  },
  {
    id: 'contactado',
    label: 'Contactado / Calificado',
    color: 'from-sky-500 to-cyan-500',
    accent: 'border-t-sky-500',
    badgeBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    probabilidadDefault: 40,
  },
  {
    id: 'propuesta',
    label: 'Cotización / Propuesta',
    color: 'from-amber-500 to-orange-500',
    accent: 'border-t-amber-500',
    badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    probabilidadDefault: 60,
  },
  {
    id: 'negociacion',
    label: 'En Negociación',
    color: 'from-purple-500 to-pink-500',
    accent: 'border-t-purple-500',
    badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    probabilidadDefault: 80,
  },
  {
    id: 'ganado',
    label: 'Ganado / Cerrado',
    color: 'from-emerald-500 to-teal-500',
    accent: 'border-t-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    probabilidadDefault: 100,
  },
];

export default function CRMKanban({ leads, onRefresh, onOpenLeadDetail, onConvertToSale }: CRMKanbanProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendedor, setFilterVendedor] = useState<string>('todos');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('todas');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<CRMLeadEtapa | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLeadModal, setSelectedLeadModal] = useState<CRMLead | null>(null);

  // Form states
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState('');
  const [nuevaEmpresa, setNuevaEmpresa] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [nuevaEtapa, setNuevaEtapa] = useState<CRMLeadEtapa>('nuevo');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<CRMPrioridad>('media');
  const [nuevoCanal, setNuevoCanal] = useState<CRMCanalOrigen>('whatsapp');
  const [nuevoVendedor, setNuevoVendedor] = useState('Carlos López');
  const [nuevasNotas, setNuevasNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Sellers list
  const vendedoresList = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.vendedor_asignado) set.add(l.vendedor_asignado);
    });
    return Array.from(set);
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filterVendedor !== 'todos' && l.vendedor_asignado !== filterVendedor) return false;
      if (filterPrioridad !== 'todas' && l.prioridad !== filterPrioridad) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = l.titulo.toLowerCase().includes(query);
        const matchesContact = l.contacto_nombre.toLowerCase().includes(query);
        const matchesCompany = (l.empresa_nombre || '').toLowerCase().includes(query);
        const matchesPhone = (l.telefono || '').includes(query);
        if (!matchesTitle && !matchesContact && !matchesCompany && !matchesPhone) return false;
      }
      return true;
    });
  }, [leads, filterVendedor, filterPrioridad, searchTerm]);

  // Totales
  const totalPipeline = useMemo(() => {
    return filteredLeads
      .filter((l) => l.etapa !== 'perdido' && l.etapa !== 'ganado')
      .reduce((s, l) => s + (l.valor_estimado || 0), 0);
  }, [filteredLeads]);

  const ganadosTotal = useMemo(() => {
    return filteredLeads
      .filter((l) => l.etapa === 'ganado')
      .reduce((s, l) => s + (l.valor_estimado || 0), 0);
  }, [filteredLeads]);

  const tasaConversion = useMemo(() => {
    const totalCerrados = filteredLeads.filter((l) => l.etapa === 'ganado' || l.etapa === 'perdido').length;
    const totalGanados = filteredLeads.filter((l) => l.etapa === 'ganado').length;
    if (totalCerrados === 0) return filteredLeads.length > 0 ? 35 : 0;
    return Math.round((totalGanados / totalCerrados) * 100);
  }, [filteredLeads]);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, etapaId: CRMLeadEtapa) => {
    e.preventDefault();
    if (dragOverCol !== etapaId) {
      setDragOverCol(etapaId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, destinoEtapa: CRMLeadEtapa) => {
    e.preventDefault();
    setDragOverCol(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    try {
      await cambiarEtapaLead(leadId, destinoEtapa);
      const etapaLabel = ETAPAS.find((et) => et.id === destinoEtapa)?.label ?? destinoEtapa;
      toast.success(`Oportunidad movida a "${etapaLabel}"`);
      onRefresh();
    } catch {
      toast.error('Error al actualizar etapa de la oportunidad');
    } finally {
      setDraggedLeadId(null);
    }
  };

  const handleCrearLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoContacto.trim()) {
      toast.error('Completa el título y nombre del contacto');
      return;
    }
    setGuardando(true);
    try {
      await guardarLead({
        titulo: nuevoTitulo.trim(),
        contacto_nombre: nuevoContacto.trim(),
        empresa_nombre: nuevaEmpresa.trim() || undefined,
        telefono: nuevoTelefono.trim() || undefined,
        correo: nuevoCorreo.trim() || undefined,
        etapa: nuevaEtapa,
        valor_estimado: parseFloat(nuevoMonto) || 0,
        probabilidad:
          nuevaEtapa === 'ganado'
            ? 100
            : ETAPAS.find((et) => et.id === nuevaEtapa)?.probabilidadDefault || 30,
        prioridad: nuevaPrioridad,
        canal_origen: nuevoCanal,
        vendedor_asignado: nuevoVendedor,
        notas: nuevasNotas.trim() || undefined,
        fecha_cierre_esperada: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      });
      toast.success('¡Oportunidad creada exitosamente en el Pipeline!');
      setShowCreateModal(false);
      // Reset
      setNuevoTitulo('');
      setNuevoContacto('');
      setNuevaEmpresa('');
      setNuevoTelefono('');
      setNuevoCorreo('');
      setNuevoMonto('');
      setNuevasNotas('');
      onRefresh();
    } catch {
      toast.error('Error al crear oportunidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEtapaDirecto = async (leadId: string, etapaDestino: CRMLeadEtapa) => {
    try {
      await cambiarEtapaLead(leadId, etapaDestino);
      toast.success(`Etapa actualizada a: ${ETAPAS.find((e) => e.id === etapaDestino)?.label}`);
      if (selectedLeadModal && selectedLeadModal.id === leadId) {
        setSelectedLeadModal({
          ...selectedLeadModal,
          etapa: etapaDestino,
          probabilidad: etapaDestino === 'ganado' ? 100 : ETAPAS.find((e) => e.id === etapaDestino)?.probabilidadDefault || 30,
        });
      }
      onRefresh();
    } catch {
      toast.error('Error al cambiar etapa');
    }
  };

  const handleEliminar = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar esta oportunidad del pipeline comercial?')) {
      await eliminarLead(id);
      toast.success('Oportunidad eliminada');
      if (selectedLeadModal?.id === id) {
        setSelectedLeadModal(null);
      }
      onRefresh();
    }
  };

  const handleWhatsApp = (tel?: string, e?: React.MouseEvent, customText?: string) => {
    if (e) e.stopPropagation();
    if (!tel) {
      toast.error('Este prospecto no tiene número telefónico registrado');
      return;
    }
    const cleanTel = tel.replace(/\D/g, '');
    const finalTel = cleanTel.startsWith('1') ? cleanTel : `1${cleanTel}`;
    const defaultMsg = customText
      ? encodeURIComponent(customText)
      : encodeURIComponent('Hola, le escribo desde KOBA sobre su cotización / requerimiento comercial.');
    window.open(`https://wa.me/${finalTel}?text=${defaultMsg}`, '_blank');
  };

  const [filterFecha, setFilterFecha] = useState<string>('mes');

  const openCreateForStage = (etapaId: CRMLeadEtapa) => {
    setNuevaEtapa(etapaId);
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER (Matches Screenshot) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs">
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block leading-tight">
              CRM • KOBA CLOUD
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Pipeline de Ventas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gestiona tus oportunidades y convierte más clientes en ventas.
            </p>
          </div>
        </div>

        {/* Right: Filters & Action Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter Dropdown */}
          <div className="relative">
            <select
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs hover:border-emerald-500/40 cursor-pointer focus:outline-none"
            >
              <option value="mes">Este mes</option>
              <option value="semana">Esta semana</option>
              <option value="trimestre">Este trimestre</option>
              <option value="ano">Este año</option>
            </select>
          </div>

          {/* Vendedor Filter Dropdown */}
          <div className="relative">
            <select
              value={filterVendedor}
              onChange={(e) => setFilterVendedor(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs hover:border-emerald-500/40 cursor-pointer focus:outline-none"
            >
              <option value="todos">Todos los vendedores</option>
              {vendedoresList.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Prioridad Filter Dropdown */}
          <div className="relative">
            <select
              value={filterPrioridad}
              onChange={(e) => setFilterPrioridad(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs hover:border-emerald-500/40 cursor-pointer focus:outline-none"
            >
              <option value="todas">Todas las prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              setNuevaEtapa('nuevo');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} strokeWidth={2.5} className="text-[#2dd4bf]" />
            <span>Nueva Oportunidad</span>
          </button>
        </div>
      </div>

      {/* 2. THE 4 BENTO KPI CARDS (Matching Screenshot Exactly) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: PIPELINE ACTIVO */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0d2f27] text-[#2dd4bf] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <TrendingUp size={16} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                PIPELINE ACTIVO
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
              ↑ 12%
            </span>
          </div>

          <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white mt-3 tracking-tight">
            RD$ {totalPipeline.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
            {filteredLeads.filter((l) => l.etapa !== 'perdido' && l.etapa !== 'ganado').length} tratos en negociación abierta
          </p>
        </div>

        {/* Card 2: VENTAS GANADAS */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <DollarSign size={16} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                VENTAS GANADAS
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
              ↑ 25%
            </span>
          </div>

          <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white mt-3 tracking-tight">
            RD$ {ganadosTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
            {filteredLeads.filter((l) => l.etapa === 'ganado').length} convertidos • {filteredLeads.filter((l) => l.etapa === 'ganado').length} listas para POS
          </p>
        </div>

        {/* Card 3: TASA DE CIERRE COMERCIAL */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0d2f27] text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Percent size={16} strokeWidth={2.3} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  TASA DE CIERRE
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                ↑ 0%
              </span>
            </div>

            <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white mt-3 tracking-tight">
              {tasaConversion}%
            </p>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#10b981] transition-all duration-500"
              style={{ width: `${Math.min(tasaConversion, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: TOTAL PROSPECTOS */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <TrendingUp size={16} strokeWidth={2.3} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  TOTAL PROSPECTOS
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                ↑ 18%
              </span>
            </div>

            <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white mt-3 tracking-tight">
              {filteredLeads.length} leads
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Ticket Promedio: RD${' '}
              {filteredLeads.length > 0
                ? Math.round(
                    filteredLeads.reduce((s, l) => s + (l.valor_estimado || 0), 0) / filteredLeads.length
                  ).toLocaleString()
                : '0'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Optimiza tiempos de seguimiento comercial
            </p>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH & VIEW MODES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-transparent">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-emerald-500/50"
            placeholder="Buscar por cliente, empresa, trato o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* View Toggles & New Deal Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Toggles */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#0d2f27] text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Vista Tablero"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#0d2f27] text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Vista Lista"
            >
              <ListFilter size={14} />
            </button>
          </div>

          {/* New Deal Button */}
          <button
            type="button"
            onClick={() => {
              setNuevaEtapa('nuevo');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={2.5} className="text-[#2dd4bf]" />
            <span>Nueva Oportunidad</span>
          </button>
        </div>
      </div>

      {/* 4. KANBAN BOARD COLUMNS (Exact 5 columns from Screenshot) */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start select-none">
          {ETAPAS.map((etapa) => {
            const leadsEtapa = filteredLeads.filter((l) => l.etapa === etapa.id);
            const subtotalEtapa = leadsEtapa.reduce((s, l) => s + (l.valor_estimado || 0), 0);
            const isTarget = dragOverCol === etapa.id;

            return (
              <div
                key={etapa.id}
                onDragOver={(e) => handleDragOver(e, etapa.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, etapa.id)}
                className={`rounded-2xl border transition-all duration-200 p-3 flex flex-col min-h-[580px] ${
                  isTarget
                    ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                    : 'bg-slate-100/70 dark:bg-slate-900/50 border-slate-200/90 dark:border-slate-800'
                }`}
              >
                {/* Column Header */}
                <div className={`border-t-4 ${etapa.accent} bg-white dark:bg-slate-850 rounded-xl p-3 shadow-2xs border border-slate-200/70 dark:border-slate-800 mb-3`}>
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 truncate">
                      {etapa.label}
                    </h4>
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10.5px] font-black flex items-center justify-center border border-slate-200/80 dark:border-slate-700">
                      {leadsEtapa.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                    <span className="text-slate-900 dark:text-white font-black text-xs">
                      RD$ {subtotalEtapa.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-0.5">
                  {leadsEtapa.length === 0 ? (
                    <div className="h-44 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400 transition-colors">
                      <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-purple-500 mb-2 bg-white dark:bg-slate-850 shadow-2xs">
                        <FileText size={18} />
                      </div>
                      <span className="font-semibold text-slate-500">Arrastra oportunidades aquí</span>
                    </div>
                  ) : (
                    leadsEtapa.map((lead) => {
                      const isDragging = draggedLeadId === lead.id;

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => {
                            if (onOpenLeadDetail) {
                              onOpenLeadDetail(lead);
                            } else {
                              setSelectedLeadModal(lead);
                            }
                          }}
                          className={`bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-purple-500/50 hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group relative ${
                            isDragging ? 'opacity-40 scale-95 border-dashed border-purple-500' : ''
                          }`}
                        >
                          {/* Priority Tag & Right Icons (WhatsApp, Delete, More) */}
                          <div className="flex items-center justify-between gap-1 mb-2.5">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                                lead.prioridad === 'urgente'
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900'
                                  : lead.prioridad === 'alta'
                                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900'
                                    : lead.prioridad === 'media'
                                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  lead.prioridad === 'urgente'
                                    ? 'bg-rose-500 animate-pulse'
                                    : lead.prioridad === 'alta'
                                      ? 'bg-amber-500'
                                      : lead.prioridad === 'media'
                                        ? 'bg-blue-500'
                                        : 'bg-slate-400'
                                }`}
                              />
                              {lead.prioridad}
                            </span>

                            <div className="flex items-center gap-1 text-slate-400">
                              {lead.telefono && (
                                <button
                                  type="button"
                                  onClick={(e) => handleWhatsApp(lead.telefono, e)}
                                  title="Enviar WhatsApp"
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                >
                                  <MessageCircle size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleEliminar(lead.id, e)}
                                title="Eliminar"
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLeadModal(lead);
                                }}
                                title="Más opciones"
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              >
                                <MoreVertical size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Deal Title */}
                          <h5 className="font-extrabold text-[13px] text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {lead.titulo}
                          </h5>

                          {/* Contact & Company */}
                          <div className="space-y-1 mb-3 text-[11px] text-slate-600 dark:text-slate-400">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                              <User size={12} className="text-[#0d2f27] dark:text-[#2dd4bf] flex-shrink-0" />
                              {lead.contacto_nombre}
                            </p>
                            {lead.empresa_nombre && (
                              <p className="truncate flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                                <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                                {lead.empresa_nombre}
                              </p>
                            )}
                          </div>

                          {/* Probability Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>Probabilidad</span>
                              <span className="font-black text-slate-700 dark:text-slate-300">
                                {lead.probabilidad || 30}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  lead.etapa === 'ganado'
                                    ? 'bg-emerald-500'
                                    : lead.probabilidad >= 70
                                      ? 'bg-emerald-600'
                                      : lead.probabilidad >= 40
                                        ? 'bg-amber-500'
                                        : 'bg-slate-400'
                                }`}
                                style={{ width: `${lead.probabilidad || 30}%` }}
                              />
                            </div>
                          </div>

                          {/* Bottom Row: VALOR RD$ and Seller Pill Badge */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">
                                VALOR
                              </span>
                              <span className="font-black text-[13px] text-emerald-600 dark:text-emerald-400 leading-tight">
                                RD$ {lead.valor_estimado.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[85px]">
                              {lead.vendedor_asignado?.split(' ')[0] || 'Ventas'}
                            </span>
                          </div>

                          {/* Quick Convert Button if Won Stage */}
                          {lead.etapa === 'ganado' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConvertToSale?.(lead);
                              }}
                              className="mt-3 w-full py-2 px-3 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-[#2dd4bf] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#2dd4bf]/20 shadow-2xs transition-all cursor-pointer"
                            >
                              <Store size={13} className="text-[#2dd4bf]" />
                              <span>Facturar en POS</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* + Agregar oportunidad button at bottom of column (Matches Screenshot) */}
                <button
                  type="button"
                  onClick={() => openCreateForStage(etapa.id)}
                  className="w-full mt-2.5 py-2 flex items-center justify-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus size={14} className="text-slate-400" />
                  <span>Agregar oportunidad</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* 4. VIEW MODE B: SPREADSHEET / DATA TABLE */
        <div className="card overflow-hidden border-border bg-white dark:bg-slate-900 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                  <th className="py-3 px-4">Oportunidad / Trato</th>
                  <th className="py-3 px-4">Contacto & Empresa</th>
                  <th className="py-3 px-4">Etapa Comercial</th>
                  <th className="py-3 px-4 text-right">Monto Estimado</th>
                  <th className="py-3 px-4 text-center">Probabilidad</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4 text-center">Prioridad</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                      No se encontraron oportunidades con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const etapaInfo = ETAPAS.find((e) => e.id === lead.etapa) || ETAPAS[0];

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLeadModal(lead)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-extrabold text-foreground">
                          <p className="line-clamp-1 group-hover:text-purple-600 transition-colors">{lead.titulo}</p>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Origen: {lead.canal_origen}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-foreground truncate">{lead.contacto_nombre}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{lead.empresa_nombre || 'Sin empresa'}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border ${etapaInfo.badgeBg}`}>
                            {etapaInfo.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                          RD$ {lead.valor_estimado.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 font-bold">
                            <span>{lead.probabilidad || 30}%</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-muted-foreground">
                          {lead.vendedor_asignado || 'Ventas'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md ${
                              lead.prioridad === 'urgente'
                                ? 'bg-rose-500/10 text-rose-600'
                                : lead.prioridad === 'alta'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {lead.prioridad}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {lead.telefono && (
                              <button
                                type="button"
                                onClick={(e) => handleWhatsApp(lead.telefono, e)}
                                title="WhatsApp"
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                <MessageCircle size={14} />
                              </button>
                            )}

                            {lead.etapa === 'ganado' && (
                              <button
                                type="button"
                                onClick={() => onConvertToSale?.(lead)}
                                title="Facturar"
                                className="px-2 py-1 rounded-md bg-emerald-600 text-white font-bold text-[10px]"
                              >
                                POS
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleEliminar(lead.id, e)}
                              title="Eliminar"
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 size={14} />
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
      )}

      {/* 5. MODAL: DETALLE COMPLETO DE LA OPORTUNIDAD */}
      {selectedLeadModal && (
        <ModalShell open={Boolean(selectedLeadModal)} onClose={() => setSelectedLeadModal(null)} size="lg">
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Oportunidad #{selectedLeadModal.id}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Canal: {selectedLeadModal.canal_origen}
                  </span>
                </div>
                <h3 className="text-xl font-black text-foreground">
                  {selectedLeadModal.titulo}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Valor Estimado
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  RD$ {selectedLeadModal.valor_estimado.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stepper de Etapas Comerciales */}
            <div>
              <p className="text-[11px] font-black uppercase text-muted-foreground mb-2">
                Avanzar en el Embudo Comercial
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {ETAPAS.map((et) => {
                  const isCurrent = selectedLeadModal.etapa === et.id;
                  return (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => handleCambiarEtapaDirecto(selectedLeadModal.id, et.id)}
                      className={`p-2 rounded-xl text-center text-xs font-bold transition-all border cursor-pointer ${
                        isCurrent
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-secondary/40 hover:bg-secondary border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-black">{et.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Información del Prospecto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-secondary/30 p-4 rounded-2xl border border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Contacto Comercial
                </span>
                <p className="font-extrabold text-foreground text-sm mt-0.5">
                  {selectedLeadModal.contacto_nombre}
                </p>
                {selectedLeadModal.empresa_nombre && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Building2 size={12} className="text-slate-400" />
                    <span>{selectedLeadModal.empresa_nombre}</span>
                  </p>
                )}
                {selectedLeadModal.correo && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Mail size={12} className="text-slate-400" />
                    <span>{selectedLeadModal.correo}</span>
                  </p>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Vendedor Asignado
                </span>
                <p className="font-extrabold text-foreground text-sm mt-0.5 flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  <span>{selectedLeadModal.vendedor_asignado || 'Sin asignar'}</span>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {selectedLeadModal.telefono && (
                    <button
                      type="button"
                      onClick={(e) => handleWhatsApp(selectedLeadModal.telefono, e)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </button>
                  )}
                  {selectedLeadModal.etapa === 'ganado' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLeadModal(null);
                        onConvertToSale?.(selectedLeadModal);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>Facturar en POS</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notas del Lead */}
            {selectedLeadModal.notas && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-border">
                <span className="text-[10px] uppercase font-black text-muted-foreground block mb-1">
                  Notas / Requerimientos del Prospecto
                </span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedLeadModal.notas}
                </p>
              </div>
            )}

            {/* Footer Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => handleEliminar(selectedLeadModal.id)}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 size={13} />
                <span>Eliminar oportunidad</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLeadModal(null)}
                className="btn-secondary text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* 6. MODAL: CREAR NUEVA OPORTUNIDAD */}
      <ModalShell open={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <div className="space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="text-lg font-black text-foreground">
              Nueva Oportunidad Comercial (Lead)
            </h3>
            <p className="text-xs text-muted-foreground">
              Registra un prospecto o negocio en curso para darle seguimiento en el embudo
            </p>
          </div>

          <form onSubmit={handleCrearLead} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                Título del Trato o Requerimiento *
              </label>
              <input
                required
                placeholder="Ej: Suministro mensual de carnes para restaurante"
                className="input-field text-sm"
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                  Nombre del Contacto *
                </label>
                <input
                  required
                  placeholder="Ej: Lic. Marcos Valenzuela"
                  className="input-field text-sm"
                  value={nuevoContacto}
                  onChange={(e) => setNuevoContacto(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                  Empresa / Negocio
                </label>
                <input
                  placeholder="Ej: Grupo Gastronómico El Faro"
                  className="input-field text-sm"
                  value={nuevaEmpresa}
                  onChange={(e) => setNuevaEmpresa(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                  Teléfono / WhatsApp
                </label>
                <input
                  placeholder="809-555-0101"
                  className="input-field text-sm"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="input-field text-sm"
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                  Monto Estimado RD$
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="input-field text-sm"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                  Etapa Inicial
                </label>
                <select
                  className="input-field text-xs py-2"
                  value={nuevaEtapa}
                  onChange={(e) => setNuevaEtapa(e.target.value as CRMLeadEtapa)}
                >
                  {ETAPAS.map((et) => (
                    <option key={et.id} value={et.id}>
                      {et.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                  Prioridad
                </label>
                <select
                  className="input-field text-xs py-2"
                  value={nuevaPrioridad}
                  onChange={(e) => setNuevaPrioridad(e.target.value as CRMPrioridad)}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                  Canal de Origen
                </label>
                <select
                  className="input-field text-xs py-2"
                  value={nuevoCanal}
                  onChange={(e) => setNuevoCanal(e.target.value as CRMCanalOrigen)}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="visita">Visita en tienda</option>
                  <option value="referido">Referido</option>
                  <option value="web">Página Web</option>
                  <option value="telefono">Llamada Telefónica</option>
                  <option value="redes">Redes Sociales</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                Vendedor Asignado
              </label>
              <select
                className="input-field text-xs py-2"
                value={nuevoVendedor}
                onChange={(e) => setNuevoVendedor(e.target.value)}
              >
                <option value="Admin General">Admin General</option>
                <option value="Carlos López">Carlos López</option>
                <option value="Ventas Tienda">Ventas Tienda</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                Notas y Requerimientos Adicionales
              </label>
              <textarea
                rows={3}
                placeholder="Detalles sobre los productos de interés, fecha de cierre, etc."
                className="input-field text-sm"
                value={nuevasNotas}
                onChange={(e) => setNuevasNotas(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="btn-primary text-xs font-bold"
              >
                {guardando ? 'Guardando...' : 'Crear Oportunidad'}
              </button>
            </div>
          </form>
        </div>
      </ModalShell>
    </div>
  );
}
