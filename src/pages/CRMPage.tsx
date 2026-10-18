import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import {
  LayoutGrid,
  BarChart2,
  Workflow,
  Target,
  FileText,
  Receipt,
  Award,
  Users,
  CheckSquare,
  Calendar,
  Plus,
  Search,
  X,
  Phone,
  Mail,
  CalendarDays,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import CRMKanban from '@/components/crm/CRMKanban';
import CRMClienteExpediente from '@/components/crm/CRMClienteExpediente';
import CRMLeadsProspeccion from '@/components/crm/CRMLeadsProspeccion';
import CRMTareasRecordatorios from '@/components/crm/CRMTareasRecordatorios';
import CRMDashboardMetricasView from '@/components/crm/CRMDashboardMetricas';
import CRMSegmentacionRFM from '@/components/crm/CRMSegmentacionRFM';
import CRMCotizaciones from '@/components/crm/CRMCotizaciones';
import CRMFacturador from '@/components/crm/CRMFacturador';
import SegmentedControl from '@/components/ui/SegmentedControl';
import MetricStat from '@/components/ui/MetricStat';
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

type CrmTab =
  | 'dashboard'
  | 'pipeline'
  | 'oportunidades'
  | 'cotizaciones'
  | 'facturacion'
  | 'rfm'
  | 'contactos'
  | 'tareas'
  | 'calendario';

export default function CRMPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CrmTab>('dashboard');

  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [actividades, setActividades] = useState<CRMActividad[]>([]);
  const [rfmClientes, setRfmClientes] = useState<CRMSegmentoRFMCliente[]>([]);
  const [metricasDashboard, setMetricasDashboard] = useState<CRMDashboardMetricas | null>(null);
  const [selectedClienteExpediente, setSelectedClienteExpediente] = useState<{
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
  } | null>(null);
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
    return actividades.filter(
      (a) => !a.completada && a.fecha_programada && a.fecha_programada <= hoyStr
    ).length;
  }, [actividades, hoyStr]);

  const hotLeadsCount = useMemo(() => {
    return leads.filter((l) => l.temperatura === 'caliente' || l.probabilidad >= 70).length;
  }, [leads]);

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const bal = Number(c.balance_actual) || 0;
      const cred = Number(c.limite_credito) || 0;
      if (filterClienteTipo === 'cxc') return bal > 0;
      if (filterClienteTipo === 'vip') return cred >= 50000 || c.tipo_cliente === 'fiscal';
      if (filterClienteTipo === 'activos') return c.activo;
      return true;
    });
  }, [clientes, filterClienteTipo]);

  const tabs: { id: CrmTab; label: string; count?: number; icon?: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Overview', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'pipeline', label: `Pipeline (${leads.length})`, icon: <Workflow className="w-3.5 h-3.5" /> },
    { id: 'oportunidades', label: `Oportunidades (${hotLeadsCount} Hot)`, icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'facturacion', label: 'Facturador B2B', icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'rfm', label: 'Segmentos RFM', icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'contactos', label: `Contactos (${clientes.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'tareas', label: `Tareas (${tareasPendientesCount})`, icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { id: 'calendario', label: 'Calendario', icon: <Calendar className="w-3.5 h-3.5" /> },
  ];

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface2)] text-[var(--ink2)] border border-[var(--border)]">
                    <LayoutGrid className="w-3.5 h-3.5 text-emerald-500" />
                    Ventas & Crecimiento B2B
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                  CRM Comercial & Oportunidades
                </h1>
                <p className="text-xs text-[var(--ink2)] mt-0.5">
                  Gestiona prospectos, ciclo de ventas, cotizaciones formales y fidelización RFM.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClienteExpediente(null);
                    setTab('facturacion');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Facturador B2B</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedClienteExpediente(null);
                    setTab('cotizaciones');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Nueva Cotización</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedClienteExpediente(null);
                    setTab('oportunidades');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Lead</span>
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
              <MetricStat
                label="Leads en Pipeline"
                value={String(leads.length)}
                secondaryText={`${hotLeadsCount} de alta probabilidad`}
              />
              <MetricStat
                label="Valor Estimado"
                value={leads.reduce((s, l) => s + (l.valor_estimado || 0), 0).toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                prefix="RD$"
                secondaryText="En negociación activa"
                valueColor="text-emerald-600 dark:text-emerald-400"
              />
              <MetricStat
                label="Tareas Pendientes"
                value={String(tareasPendientesCount)}
                secondaryText={tareasAlertaCount > 0 ? `${tareasAlertaCount} para hoy o vencidas` : 'Agenda al día'}
                highlightWarn={tareasAlertaCount > 0}
              />
              <MetricStat
                label="Clientes Cartera"
                value={String(clientes.length)}
                secondaryText={`${rfmClientes.filter((c) => c.segmento === 'campeon' || c.segmento === 'leal').length} clientes VIP/Leales`}
                valueColor="text-purple-600 dark:text-purple-400"
              />
            </div>

            {/* Navigation Tabs */}
            <div className="bg-[var(--surface)] p-2 rounded-xl border border-[var(--border)] overflow-x-auto">
              <SegmentedControl
                options={tabs}
                value={tab}
                onChange={(t) => {
                  setSelectedClienteExpediente(null);
                  setTab(t);
                }}
                ariaLabel="Secciones del CRM"
              />
            </div>

            {/* Tab Views */}
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

            {tab === 'cotizaciones' && (
              <CRMCotizaciones
                onRefreshStats={cargarDatos}
                onNavigateToPOS={() => {
                  setTab('facturacion');
                }}
              />
            )}

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

            {tab === 'contactos' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink3)]" />
                    <input
                      className="w-full pl-9 pr-8 py-1.5 text-xs bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                      placeholder="Buscar cliente por nombre o RNC..."
                      value={searchCliente}
                      onChange={(e) => setSearchCliente(e.target.value)}
                    />
                    {searchCliente && (
                      <button
                        type="button"
                        onClick={() => setSearchCliente('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink3)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {(
                      [
                        { id: 'todos', label: `Todos (${clientes.length})` },
                        { id: 'cxc', label: 'Con Deuda CxC' },
                        { id: 'vip', label: 'Clientes VIP' },
                        { id: 'activos', label: 'Activos' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilterClienteTipo(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          filterClienteTipo === f.id
                            ? 'bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] shadow-xs'
                            : 'bg-[var(--surface2)] text-[var(--ink2)] hover:text-[var(--ink)] border border-[var(--border)]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clientesFiltrados.map((c) => {
                    const balance = Number(c.balance_actual) || 0;
                    const credito = Number(c.limite_credito) || 0;
                    const pctUso =
                      credito > 0 ? Math.min(Math.round((balance / credito) * 100), 100) : 0;

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
                        className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/50 rounded-xl p-4 transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0">
                                {c.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-xs text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors truncate">
                                  {c.nombre}
                                </h3>
                                <span className="text-[10px] text-[var(--ink3)] block truncate">
                                  {c.tipo_cliente || 'Consumidor Final'}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                                c.activo
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                              }`}
                            >
                              {c.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px] text-[var(--ink2)] mt-2 bg-[var(--surface2)]/60 p-2 rounded-lg border border-[var(--border)]">
                            <p className="truncate flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[var(--ink3)]" />
                              <span>{c.telefono || 'Sin teléfono'}</span>
                            </p>
                            <p className="truncate flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[var(--ink3)]" />
                              <span>{c.correo || 'Sin correo registrado'}</span>
                            </p>
                          </div>

                          {credito > 0 && (
                            <div className="mt-2.5">
                              <div className="flex justify-between text-[10px] text-[var(--ink3)] font-medium mb-1">
                                <span>Línea Crédito</span>
                                <span>RD$ {credito.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-[var(--surface2)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pctUso > 80 ? 'bg-rose-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${pctUso}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-[var(--ink3)] block leading-none">
                              Saldo CxC
                            </span>
                            <span
                              className={`font-bold text-xs ${
                                balance > 0
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              RD$ {balance.toLocaleString()}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[var(--primary)] font-medium text-xs">
                            Expediente →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'tareas' && (
              <CRMTareasRecordatorios
                actividades={actividades}
                leads={leads}
                onRefresh={cargarDatos}
                onOpenLeadDetail={() => setTab('pipeline')}
              />
            )}

            {tab === 'calendario' && (
              <div className="space-y-4">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-xs text-[var(--ink)]">
                        Semana Activa de Seguimiento
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-[var(--ink2)]">
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
                          className={`rounded-xl border p-3 flex flex-col justify-between min-h-[260px] transition-all ${
                            isToday
                              ? 'border-emerald-500/50 bg-emerald-500/5 shadow-xs'
                              : 'border-[var(--border)] bg-[var(--surface2)]/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2.5">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-[var(--ink3)] block capitalize">
                                  {dayName}
                                </span>
                                <span className="text-base font-bold text-[var(--ink)]">
                                  {dayNum}
                                </span>
                              </div>
                              {isToday && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
                                  Hoy
                                </span>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              {dayTasks.length === 0 ? (
                                <p className="text-[11px] text-[var(--ink3)] italic text-center py-6">
                                  Sin citas programadas
                                </p>
                              ) : (
                                dayTasks.map((t) => (
                                  <div
                                    key={t.id}
                                    className={`p-2 rounded-lg border text-xs space-y-0.5 ${
                                      t.completada
                                        ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink3)]'
                                        : t.prioridad === 'urgente'
                                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono text-[var(--ink3)]">
                                        {t.hora_programada || '10:00 AM'}
                                      </span>
                                      <span className="text-[var(--ink3)]">
                                        {t.tipo === 'llamada' ? (
                                          <Phone className="w-3 h-3" />
                                        ) : t.tipo === 'whatsapp' ? (
                                          <MessageSquare className="w-3 h-3" />
                                        ) : (
                                          <Users className="w-3 h-3" />
                                        )}
                                      </span>
                                    </div>
                                    <p className="font-semibold text-xs line-clamp-2 leading-tight">
                                      {t.titulo}
                                    </p>
                                    {t.contacto_nombre && (
                                      <span className="text-[10px] text-[var(--ink3)] block truncate">
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
                            className="w-full mt-2.5 py-1.5 rounded-lg text-[10.5px] font-medium text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-[var(--ink3)]" />
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
    </AppLayout>
  );
}
