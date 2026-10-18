import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import {
  Home,
  LayoutGrid,
  Users,
  Target,
  CheckSquare,
  Calendar,
  ShoppingCart,
  Package,
  BarChart2,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  TrendingUp,
  Plus,
  Phone,
  Mail,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Filter,
  Sparkles,
  Store,
  Menu,
  X,
  Workflow,
  FileText,
  AlertCircle,
  Briefcase,
  Flame,
  CalendarDays,
  MessageSquare,
  Award,
  SlidersHorizontal,
  Receipt,
} from 'lucide-react';
import CRMKanban from '@/components/crm/CRMKanban';
import CRMClienteExpediente from '@/components/crm/CRMClienteExpediente';
import CRMLeadsProspeccion from '@/components/crm/CRMLeadsProspeccion';
import CRMTareasRecordatorios from '@/components/crm/CRMTareasRecordatorios';
import CRMDashboardMetricasView from '@/components/crm/CRMDashboardMetricas';
import CRMSegmentacionRFM from '@/components/crm/CRMSegmentacionRFM';
import CRMCotizaciones from '@/components/crm/CRMCotizaciones';
import CRMFacturador from '@/components/crm/CRMFacturador';
import {
  obtenerLeads,
  obtenerActividades,
  obtenerSegmentacionRFM,
  obtenerMetricasCRM,
} from '@/services/crm.service';
import { useClientes } from '@/hooks/useClientes';
import type {
  CRMLead,
  CRMActividad,
  CRMSegmentoRFMCliente,
  CRMDashboardMetricas,
  CRMFacturaPreload,
} from '@/types/crm';
import { toast } from '@/lib/toast';

type CrmTab = 'dashboard' | 'pipeline' | 'oportunidades' | 'cotizaciones' | 'facturacion' | 'rfm' | 'contactos' | 'tareas' | 'calendario';

export default function CRMPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CrmTab>('dashboard');
  const [crmGroupOpen, setCrmGroupOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [actividades, setActividades] = useState<CRMActividad[]>([]);
  const [rfmClientes, setRfmClientes] = useState<CRMSegmentoRFMCliente[]>([]);
  const [metricasDashboard, setMetricasDashboard] = useState<CRMDashboardMetricas | null>(null);
  const [selectedClienteExpediente, setSelectedClienteExpediente] = useState<any | null>(null);
  const [facturaPreload, setFacturaPreload] = useState<CRMFacturaPreload | null>(null);

  // Filter state for Clientes tab
  const [searchCliente, setSearchCliente] = useState('');
  const [filterClienteTipo, setFilterClienteTipo] = useState<'todos' | 'cxc' | 'vip' | 'activos'>('todos');
  const { clientes } = useClientes(searchCliente);

  useEffect(() => {
    void cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const [l, a] = await Promise.all([obtenerLeads(), obtenerActividades()]);
    setLeads(l);
    setActividades(a);
    const rfm = await obtenerSegmentacionRFM(clientes);
    setRfmClientes(rfm);
    const m = await obtenerMetricasCRM(l, a, rfm);
    setMetricasDashboard(m);
  };

  useEffect(() => {
    if (clientes.length > 0 && leads.length > 0) {
      void (async () => {
        const rfm = await obtenerSegmentacionRFM(clientes);
        setRfmClientes(rfm);
        const m = await obtenerMetricasCRM(leads, actividades, rfm);
        setMetricasDashboard(m);
      })();
    }
  }, [clientes.length, leads.length]);

  const hoyStr = new Date().toISOString().split('T')[0];

  const tareasPendientesCount = useMemo(() => {
    return actividades.filter((a) => !a.completada).length;
  }, [actividades]);

  const tareasAlertaCount = useMemo(() => {
    return actividades.filter((a) => !a.completada && a.fecha_programada && a.fecha_programada <= hoyStr).length;
  }, [actividades, hoyStr]);

  const clientesFiltrados = clientes.filter((c) => {
    const bal = Number(c.balance_actual) || 0;
    const cred = Number(c.limite_credito) || 0;
    if (filterClienteTipo === 'cxc') return bal > 0;
    if (filterClienteTipo === 'vip') return cred >= 50000 || c.tipo_cliente === 'fiscal';
    if (filterClienteTipo === 'activos') return c.activo;
    return true;
  });

  return (
    <AppLayout>
      <div className="h-screen w-screen flex overflow-hidden bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        {/* MOBILE SIDEBAR BACKDROP */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ========================================================================= */}
        {/* 1. DEDICATED CRM LEFT SIDEBAR (Minimalist, Koba Cloud Brand)               */}
        {/* ========================================================================= */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Top Brand & Official Logo */}
          <div>
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('/')}
                title="Volver al inicio de KOBA Cloud"
              >
                {/* Official KOBA Logo Image */}
                <img
                  src="/assets/images/koba_official_logo.png"
                  alt="KOBA ERP CLOUD"
                  className="h-8 max-w-[175px] object-contain"
                  onError={(e) => {
                    // Fallback squircle icon
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Close Mobile Drawer */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
              {/* Inicio -> Back to ERP Dashboard */}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
              >
                <Home size={16} className="text-slate-400" />
                <span>Inicio</span>
              </button>

              {/* CRM Collapsible Group */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setCrmGroupOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid size={16} className="text-emerald-700 dark:text-emerald-400" />
                    <span>CRM</span>
                  </div>
                  {crmGroupOpen ? (
                    <ChevronUp size={14} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={14} className="text-slate-400" />
                  )}
                </button>

                {/* Submenu links */}
                {crmGroupOpen && (
                  <div className="mt-1 space-y-1 pl-2">
                    {/* 1. Overview / Dashboard (Matching Screenshot) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClienteExpediente(null);
                        setTab('dashboard');
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        tab === 'dashboard' && !selectedClienteExpediente
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs'
                          : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <BarChart2 size={15} />
                      <span className="flex-1">Overview</span>
                    </button>

                    {/* 2. Pipeline */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClienteExpediente(null);
                        setTab('pipeline');
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        tab === 'pipeline' && !selectedClienteExpediente
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs'
                          : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Workflow size={15} />
                      <span className="flex-1">Pipeline</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-[#0d2f27] dark:text-[#2dd4bf]">
                        {leads.length}
                      </span>
                    </button>

                    {/* 3. Oportunidades / Leads Prospección */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClienteExpediente(null);
                        setTab('oportunidades');
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        tab === 'oportunidades'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs'
                          : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Target size={15} />
                      <span className="flex-1">Oportunidades</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-[#0d2f27] dark:text-[#2dd4bf]">
                        {leads.filter((l) => l.temperatura === 'caliente' || l.probabilidad >= 70).length} Hot
                      </span>
                    </button>

                    {/* 4. Cotizaciones & Propuestas (Fase 4) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClienteExpediente(null);
                        setTab('cotizaciones');
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        tab === 'cotizaciones'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs'
                          : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <FileText size={15} />
                      <span className="flex-1">Cotizaciones</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Propuestas
                      </span>
                    </button>

                    {/* 5. Facturador CRM (Propio Facturador B2B) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClienteExpediente(null);
                        setTab('facturacion');
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        tab === 'facturacion'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs'
                          : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Receipt size={15} />
                      <span className="flex-1">Facturador CRM</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#0d2f27] text-[#2dd4bf]">
                        B2B
                      </span>
                    </button>

                    {/* 6. Segmentación RFM (Fase 3) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClienteExpediente(null);
                        setTab('rfm');
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        tab === 'rfm'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs'
                          : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Award size={15} />
                      <span className="flex-1">Segmentos RFM</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {rfmClientes.filter((c) => c.segmento === 'en_riesgo').length} Alert
                      </span>
                    </button>

                    {/* 5. Contactos */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClienteExpediente(null);
                        setTab('contactos');
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        tab === 'contactos' || selectedClienteExpediente
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs'
                          : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Users size={15} />
                      <span className="flex-1">Contactos</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {clientes.length}
                      </span>
                    </button>

                    {/* Tareas & Recordatorios */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClienteExpediente(null);
                        setTab('tareas');
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        tab === 'tareas'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs'
                          : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <CheckSquare size={15} />
                      <span className="flex-1">Tareas</span>
                      {tareasAlertaCount > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {tareasAlertaCount}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {tareasPendientesCount}
                        </span>
                      )}
                    </button>

                    {/* Calendario */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClienteExpediente(null);
                        setTab('calendario');
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        tab === 'calendario'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs'
                          : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Calendar size={15} />
                      <span className="flex-1">Calendario</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Other System Sections */}
              <div className="pt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => navigate('/sales')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart size={16} className="text-slate-400" />
                    <span>Ventas</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/product-management')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Package size={16} className="text-slate-400" />
                    <span>Inventario</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/reports')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart2 size={16} className="text-slate-400" />
                    <span>Reportes</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
                >
                  <Settings size={16} className="text-slate-400" />
                  <span>Configuración</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Bottom Promo Card (Koba Deep Pine + Mint, Minimalist) */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3.5 rounded-2xl bg-[#0d2f27] text-white shadow-xs border border-[#1a4a3f] space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#144237] text-[#2dd4bf] flex items-center justify-center">
                  <Sparkles size={13} />
                </span>
                <h4 className="text-xs font-bold text-white leading-tight">
                  KOBA Cloud Suite
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Plataforma ERP, POS & CRM unificada para tu empresa.
              </p>
              <button
                type="button"
                onClick={() => navigate('/planes')}
                className="w-full py-2 px-3 rounded-xl bg-[#144237] hover:bg-[#1b5547] text-[#2dd4bf] font-semibold text-xs transition-all cursor-pointer text-center border border-[#2dd4bf]/20"
              >
                Ver planes
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* 2. MAIN APPLICATION CONTENT AREA                                          */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* TOPBAR (Ultra-Minimalist) */}
          <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0 z-20 shadow-2xs">
            {/* Left: Mobile hamburger & Global Search */}
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu size={18} />
              </button>

              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Buscar clientes, empresas, oportunidades..."
                  className="w-full pl-9 pr-14 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 shadow-2xs pointer-events-none">
                  ⌘ K
                </span>
              </div>
            </div>

            {/* Right: Quick POS link, Notifications & User Avatar */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedClienteExpediente(null);
                  setTab('facturacion');
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0d2f27] hover:bg-[#134237] text-white transition-colors cursor-pointer shadow-2xs"
                title="Abrir facturador CRM B2B"
              >
                <Receipt size={14} className="text-[#2dd4bf]" />
                <span>Facturador CRM</span>
              </button>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => {
                  setTab('tareas');
                  if (tareasAlertaCount > 0) {
                    toast.info(`Tienes ${tareasAlertaCount} tareas pendientes en agenda.`);
                  }
                }}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Compromisos y recordatorios"
              >
                <Bell size={17} />
                {tareasAlertaCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* User Avatar & Info */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-[#0d2f27] text-[#2dd4bf] font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                  KC
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                    Koba Cloud
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 block leading-tight">
                    Administrador
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* VIEWPORT BODY */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
            <div className="max-w-[1750px] mx-auto space-y-6">
              {selectedClienteExpediente ? (
                <CRMClienteExpediente
                  cliente={selectedClienteExpediente}
                  onClose={() => setSelectedClienteExpediente(null)}
                  onCrearCotizacion={() => {
                    setSelectedClienteExpediente(null);
                    setTab('cotizaciones');
                  }}
                  onNuevaVenta={() => {
                    setFacturaPreload({
                      cliente_id: selectedClienteExpediente.id,
                      cliente_nombre: selectedClienteExpediente.name,
                      telefono: selectedClienteExpediente.phone,
                    });
                    setSelectedClienteExpediente(null);
                    setTab('facturacion');
                  }}
                />
              ) : (
                <>
                  {/* TAB 0: OVERVIEW / DASHBOARD DE MÉTRICAS (Fase 3, Layout exacto de la referencia) */}
                  {tab === 'dashboard' && metricasDashboard && (
                    <CRMDashboardMetricasView
                      metricas={metricasDashboard}
                      onNavigateToTab={(target) => {
                        setSelectedClienteExpediente(null);
                        setTab(target);
                      }}
                      onOpenUpgradeModal={() => navigate('/planes')}
                    />
                  )}

                  {/* TAB 1: PIPELINE DE VENTAS */}
                  {tab === 'pipeline' && (
                    <CRMKanban
                      leads={leads}
                      onRefresh={cargarDatos}
                      onConvertToSale={(lead) => {
                        setFacturaPreload({
                          cliente_nombre: lead.contacto_nombre,
                          telefono: lead.telefono,
                          lead_id: lead.id,
                          monto_total: lead.valor_estimado,
                        });
                        setTab('facturacion');
                      }}
                    />
                  )}

                  {/* TAB 2: CONTACTOS / CLIENTES 360° */}
                  {tab === 'contactos' && (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                            CRM • Directorio
                          </span>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Contactos & Clientes 360°
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Directorio comercial con historial crediticio, transaccional y compras POS.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/contacts')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-white text-xs font-semibold shadow-2xs cursor-pointer"
                        >
                          <Plus size={14} className="text-[#2dd4bf]" />
                          <span>Nuevo Contacto</span>
                        </button>
                      </div>

                      {/* Control Bar */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
                        <div className="relative flex-1 w-full md:w-auto max-w-md">
                          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            className="input-field pl-9 text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                            placeholder="Buscar cliente por nombre o RNC..."
                            value={searchCliente}
                            onChange={(e) => setSearchCliente(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                          <button
                            type="button"
                            onClick={() => setFilterClienteTipo('todos')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              filterClienteTipo === 'todos'
                                ? 'bg-[#0d2f27] text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
                            }`}
                          >
                            Todos ({clientes.length})
                          </button>

                          <button
                            type="button"
                            onClick={() => setFilterClienteTipo('cxc')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              filterClienteTipo === 'cxc'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
                            }`}
                          >
                            Con Deuda CxC
                          </button>

                          <button
                            type="button"
                            onClick={() => setFilterClienteTipo('vip')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              filterClienteTipo === 'vip'
                                ? 'bg-emerald-700 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
                            }`}
                          >
                            Clientes VIP
                          </button>

                          <button
                            type="button"
                            onClick={() => setFilterClienteTipo('activos')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              filterClienteTipo === 'activos'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
                            }`}
                          >
                            Activos
                          </button>
                        </div>
                      </div>

                      {/* Client Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clientesFiltrados.map((c) => {
                          const balance = Number(c.balance_actual) || 0;
                          const credito = Number(c.limite_credito) || 0;
                          const pctUso = credito > 0 ? Math.min(Math.round((balance / credito) * 100), 100) : 0;

                          return (
                            <div
                              key={c.id}
                              onClick={() =>
                                setSelectedClienteExpediente({
                                  id: c.id,
                                  name: c.nombre,
                                  phone: c.telefono ?? '',
                                  email: c.correo ?? '',
                                  address: c.direccion ?? '',
                                  credit: credito,
                                  purchases: 0,
                                  balance: balance,
                                  status: c.activo ? 'active' : 'inactive',
                                  group: c.tipo_cliente,
                                })
                              }
                              className="bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-3 mb-2.5">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                      {c.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                        {c.nombre}
                                      </h3>
                                      <span className="text-[10px] text-slate-400 block truncate">
                                        {c.tipo_cliente || 'Cliente Final'}
                                      </span>
                                    </div>
                                  </div>

                                  <span
                                    className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                                      c.activo
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {c.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>

                                <div className="space-y-1 text-[11px] text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                                  <p className="truncate flex items-center gap-1.5">
                                    <Phone size={11} className="text-slate-400" />
                                    <span>{c.telefono || 'Sin teléfono'}</span>
                                  </p>
                                  <p className="truncate flex items-center gap-1.5">
                                    <Mail size={11} className="text-slate-400" />
                                    <span>{c.correo || 'Sin correo registrado'}</span>
                                  </p>
                                </div>

                                {credito > 0 && (
                                  <div className="mt-2.5">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                                      <span>Límite Crédito</span>
                                      <span>RD$ {credito.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          pctUso > 80 ? 'bg-rose-500' : 'bg-emerald-600'
                                        }`}
                                        style={{ width: `${pctUso}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">
                                    Saldo CxC
                                  </span>
                                  <span
                                    className={`font-bold text-xs ${
                                      balance > 0 ? 'text-amber-600' : 'text-emerald-600'
                                    }`}
                                  >
                                    RD$ {balance.toLocaleString()}
                                  </span>
                                </div>

                                <span className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors">
                                  Ver ficha
                                  <ChevronRight size={13} />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: OPORTUNIDADES / MÓDULO DE LEADS & PROSPECCIÓN */}
                  {tab === 'oportunidades' && (
                    <CRMLeadsProspeccion
                      leads={leads}
                      onRefresh={cargarDatos}
                      onNavigateToPipeline={() => setTab('pipeline')}
                      onOpenCreateTaskForLead={() => {
                        setSelectedClienteExpediente(null);
                        setTab('tareas');
                      }}
                    />
                  )}

                  {/* TAB: COTIZACIONES & PROPUESTAS FORMALES (Fase 4) */}
                  {tab === 'cotizaciones' && (
                    <CRMCotizaciones
                      onRefreshStats={cargarDatos}
                      onNavigateToPOS={() => {
                        setTab('facturacion');
                      }}
                    />
                  )}

                  {/* TAB: FACTURADOR CRM B2B DEDICADO */}
                  {tab === 'facturacion' && (
                    <CRMFacturador
                      clientes={clientes}
                      preloadData={facturaPreload}
                      onClearPreload={() => setFacturaPreload(null)}
                      onFacturaCompletada={() => {
                        cargarDatos();
                      }}
                    />
                  )}

                  {/* TAB: SEGMENTACIÓN RFM (Fase 3: VIP, En Riesgo, Leales, Dormidos) */}
                  {tab === 'rfm' && (
                    <CRMSegmentacionRFM
                      clientesRFM={rfmClientes}
                      onRefresh={cargarDatos}
                      onOpenClienteExpediente={(clienteId) => {
                        const match = clientes.find((c) => c.id === clienteId);
                        if (match) {
                          setSelectedClienteExpediente({
                            id: match.id,
                            name: match.nombre,
                            phone: match.telefono ?? '',
                            email: match.correo ?? '',
                            address: match.direccion ?? '',
                            credit: Number(match.limite_credito) || 0,
                            purchases: 0,
                            balance: Number(match.balance_actual) || 0,
                            status: match.activo ? 'active' : 'inactive',
                            group: match.tipo_cliente,
                          });
                        } else {
                          toast.info('Cargando expediente 360°...');
                        }
                      }}
                    />
                  )}

                  {/* TAB 4: TAREAS Y RECORDATORIOS AUTOMÁTICOS */}
                  {tab === 'tareas' && (
                    <CRMTareasRecordatorios
                      actividades={actividades}
                      leads={leads}
                      onRefresh={cargarDatos}
                      onOpenLeadDetail={() => setTab('pipeline')}
                    />
                  )}

                  {/* TAB 5: CALENDARIO DE SEGUIMIENTO */}
                  {tab === 'calendario' && (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                            CRM • Agenda
                          </span>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Calendario Comercial
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Planificación semanal de llamadas, visitas y reuniones.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setTab('tareas')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d2f27] hover:bg-[#134237] text-white text-xs font-semibold shadow-2xs cursor-pointer"
                        >
                          <Plus size={14} className="text-[#2dd4bf]" />
                          <span>Agendar Cita</span>
                        </button>
                      </div>

                      {/* Interactive Calendar Days Grid (Minimalist) */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={16} className="text-emerald-700" />
                            <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                              Semana Activa
                            </h3>
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                            {actividades.filter((a) => !a.completada).length} compromisos pendientes
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          {[-1, 0, 1, 2, 3].map((offset) => {
                            const date = new Date(Date.now() + offset * 86400000);
                            const dateStr = date.toISOString().split('T')[0];
                            const isToday = offset === 0;
                            const dayName = date.toLocaleDateString('es-DO', { weekday: 'short' });
                            const dayNum = date.getDate();

                            const dayTasks = actividades.filter((a) => a.fecha_programada === dateStr);

                            return (
                              <div
                                key={offset}
                                className={`rounded-2xl border p-3.5 flex flex-col justify-between min-h-[280px] transition-all ${
                                  isToday
                                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/10 shadow-2xs'
                                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
                                    <div>
                                      <span className="text-[10px] font-bold uppercase text-slate-400 block capitalize">
                                        {dayName}
                                      </span>
                                      <span className="text-base font-black text-slate-900 dark:text-white">
                                        {dayNum}
                                      </span>
                                    </div>
                                    {isToday && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#0d2f27] text-[#2dd4bf] uppercase">
                                        Hoy
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-1.5">
                                    {dayTasks.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic text-center py-6">
                                        Sin citas
                                      </p>
                                    ) : (
                                      dayTasks.map((t) => (
                                        <div
                                          key={t.id}
                                          className={`p-2 rounded-xl border text-xs space-y-0.5 ${
                                            t.completada
                                              ? 'border-slate-200 bg-slate-50 text-slate-400'
                                              : t.prioridad === 'urgente'
                                              ? 'border-rose-200 bg-rose-50/40 text-rose-800'
                                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9.5px] font-bold text-slate-400">
                                              {t.hora_programada || '10:00 AM'}
                                            </span>
                                            <span className="text-slate-400">
                                              {t.tipo === 'llamada' ? (
                                                <Phone size={10} />
                                              ) : t.tipo === 'whatsapp' ? (
                                                <MessageSquare size={10} />
                                              ) : (
                                                <Users size={10} />
                                              )}
                                            </span>
                                          </div>
                                          <p className="font-semibold text-[11.5px] line-clamp-2 leading-tight">
                                            {t.titulo}
                                          </p>
                                          {t.contacto_nombre && (
                                            <span className="text-[10px] text-slate-400 block truncate">
                                              {t.contacto_nombre}
                                            </span>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setTab('tareas')}
                                  className="w-full mt-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Plus size={11} className="text-slate-400" />
                                  <span>Agendar</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
