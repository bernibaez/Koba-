import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  BarChart2,
  Workflow,
  Users,
  ExternalLink,
  RefreshCw,
  Sparkles,
  TrendingUp,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import CRMKanban from '@/components/crm/CRMKanban';
import CRMLeadsProspeccion from '@/components/crm/CRMLeadsProspeccion';
import CRMDashboardMetricasView from '@/components/crm/CRMDashboardMetricas';
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
} from '@/types/crm';

type CRMSubTab = 'overview' | 'kanban' | 'leads';

export default function SuperAdminCRMView() {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<CRMSubTab>('overview');
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [actividades, setActividades] = useState<CRMActividad[]>([]);
  const [rfmClientes, setRfmClientes] = useState<CRMSegmentoRFMCliente[]>([]);
  const [metricas, setMetricas] = useState<CRMDashboardMetricas | null>(null);
  const [loading, setLoading] = useState(true);

  const { clientes } = useClientes('');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [l, a] = await Promise.all([obtenerLeads(), obtenerActividades()]);
      setLeads(l);
      setActividades(a);
      const rfm = await obtenerSegmentacionRFM(clientes);
      setRfmClientes(rfm);
      const m = await obtenerMetricasCRM(l, a, rfm);
      setMetricas(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, [clientes.length]);

  return (
    <div className="space-y-6">
      {/* Top Banner for CRM in SuperAdmin Dashboard */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-card to-card border border-emerald-500/20 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <Target size={12} />
                Módulo Comercial SuperAdmin
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Gestión de Clientes & Oportunidades
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              CRM & Pipeline de Ventas
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supervisa el embudo de ventas, conversiones comerciales, leads y negociaciones activas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={cargarDatos}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-secondary/60 text-foreground transition cursor-pointer disabled:opacity-50"
              title="Recargar métricas y leads del CRM"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Recargar</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/crm')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95 cursor-pointer"
              title="Abrir el CRM en vista completa y detallada"
            >
              <span>Abrir CRM Pantalla Completa</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={() => setSubTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              subTab === 'overview'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <BarChart2 size={13} />
            <span>Métricas & Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              subTab === 'kanban'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <Workflow size={13} />
            <span>Pipeline Kanban</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-bold">
              {leads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('leads')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              subTab === 'leads'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <Users size={13} />
            <span>Leads & Prospección</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Content */}
      {subTab === 'overview' && metricas && (
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-2xs">
          <CRMDashboardMetricasView
            metricas={metricas}
            onNavigateToTab={(tab) => {
              if (tab === 'pipeline') setSubTab('kanban');
              else if (tab === 'oportunidades') setSubTab('leads');
            }}
            onOpenUpgradeModal={() => navigate('/crm')}
          />
        </div>
      )}

      {subTab === 'kanban' && (
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-2xs overflow-hidden">
          <CRMKanban
            leads={leads}
            onRefresh={cargarDatos}
            onOpenLeadDetail={() => navigate('/crm')}
            onConvertToSale={() => navigate('/crm')}
          />
        </div>
      )}

      {subTab === 'leads' && (
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-2xs overflow-hidden">
          <CRMLeadsProspeccion
            leads={leads}
            onRefresh={cargarDatos}
            onNavigateToPipeline={() => setSubTab('kanban')}
            onOpenCreateTaskForLead={() => navigate('/crm')}
          />
        </div>
      )}
    </div>
  );
}
