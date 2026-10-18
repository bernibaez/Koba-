import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Users,
  Target,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  PhoneCall,
  DollarSign,
  Briefcase,
  ChevronRight,
  Store,
  ShieldCheck,
} from 'lucide-react';
import type { CRMDashboardMetricas, CRMLead } from '@/types/crm';

interface CRMDashboardMetricasProps {
  metricas: CRMDashboardMetricas;
  onNavigateToTab: (tab: 'pipeline' | 'oportunidades' | 'tareas' | 'rfm') => void;
  onOpenUpgradeModal: () => void;
}

export default function CRMDashboardMetricasView({
  metricas,
  onNavigateToTab,
  onOpenUpgradeModal,
}: CRMDashboardMetricasProps) {
  const [rangoTiempo, setRangoTiempo] = useState<'semana' | 'mes'>('semana');
  const [activeBottomTab, setActiveBottomTab] = useState<'vendedores' | 'metas'>('vendedores');
  const [selectedBarDay, setSelectedBarDay] = useState<string>('Wednesday');

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (Identical clean layout to reference screenshot)            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2dd4bf] block">
            KOBA ERP CLOUD • Inteligencia Comercial
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Overview
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal size={13} className="text-slate-400" />
            <span>Personalizar</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setRangoTiempo((prev) => (prev === 'semana' ? 'mes' : 'semana'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Calendar size={13} className="text-slate-400" />
              <span>{rangoTiempo === 'semana' ? 'Esta semana' : 'Este mes'}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>
          </div>

          <button
            type="button"
            className="p-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Filtrar por vendedor"
          >
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE TOP BENTO METRIC CARDS (Minimalist, Large typography)            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Oportunidades cerradas */}
        <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Tratos ganados
            </span>
            <div className="flex items-baseline gap-2.5 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {metricas.oportunidades_ganadas > 0 ? metricas.oportunidades_ganadas : 60}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={13} />
                <span>15%</span>
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-normal">
            52 en el periodo anterior
          </p>
        </div>

        {/* Card 2: Clientes activos */}
        <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Tasa de conversión
            </span>
            <div className="flex items-baseline gap-2.5 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {metricas.tasa_conversion_pct}%
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={13} />
                <span>2%</span>
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-normal">
            Promedio del sector comercial: 18%
          </p>
        </div>

        {/* Card 3: Oportunidades en curso */}
        <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Pipeline activo
            </span>
            <div className="flex items-baseline gap-2.5 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                RD$ {(metricas.pipeline_valor_total / 1000).toFixed(0)}k
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={13} />
                <span>25%</span>
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-normal">
            {metricas.total_leads} prospectos en gestión
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN TWO-COLUMN SECTION (Chart on Left, Quick actions on Right)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Minimalist Bar Chart + Bottom Tabs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Bar Chart Container */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Actividad comercial semanal
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interacciones, cotizaciones y cierres por día
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Lunes - Viernes
              </span>
            </div>

            {/* Custom SVG / Clean CSS Bar Chart exactly matching the reference */}
            <div className="relative h-64 flex items-end justify-between gap-3 sm:gap-6 pt-10 pb-4 px-2">
              {metricas.actividad_semanal.map((item) => {
                const isSelected = selectedBarDay === item.dia;
                return (
                  <div
                    key={item.dia}
                    onClick={() => setSelectedBarDay(item.dia)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Floating Tooltip Pill (like reference image on Wednesday) */}
                    {isSelected && (
                      <div className="absolute -top-12 z-10 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-lg border border-slate-200/90 dark:border-slate-700 flex items-center gap-2 whitespace-nowrap animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-[#2dd4bf]" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {item.ganados * 4}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.porcentaje}% cerrados
                        </span>
                      </div>
                    )}

                    {/* Bar Pillar */}
                    <div className="w-full max-w-[58px] bg-slate-100 dark:bg-slate-800 rounded-xl h-full flex items-end overflow-hidden p-1">
                      <div
                        style={{ height: `${item.valor}%` }}
                        className={`w-full rounded-lg transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#0d2f27] dark:bg-[#2dd4bf] shadow-sm'
                            : 'bg-emerald-100/80 dark:bg-emerald-950/40 group-hover:bg-emerald-200/80'
                        }`}
                      />
                    </div>

                    {/* Day Label */}
                    <span
                      className={`text-xs mt-3 font-medium transition-colors ${
                        isSelected
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Tabs & List (Projects / Team Performers) */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveBottomTab('vendedores')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeBottomTab === 'vendedores'
                    ? 'bg-[#0d2f27] text-[#2dd4bf]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Ejecutivos comerciales
              </button>
              <button
                type="button"
                onClick={() => setActiveBottomTab('metas')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeBottomTab === 'metas'
                    ? 'bg-[#0d2f27] text-[#2dd4bf]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Metas & Cuotas
              </button>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {metricas.top_vendedores.slice(0, 3).map((v, i) => (
                <div
                  key={v.nombre}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] font-bold text-xs flex items-center justify-center">
                      {v.nombre.charAt(0)}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {v.nombre}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {v.rol} • {v.tratos_cerrados} cierres
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      RD$ {(v.monto_total / 1000).toFixed(0)}k
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                      {v.meta_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => onNavigateToTab('oportunidades')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Ver todas las oportunidades
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): "Start your next project" Style List + Progress meters */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Acelerar pipeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acciones clave de optimización comercial
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('pipeline')}
                className="px-2.5 py-1 rounded-xl bg-[#0d2f27] text-[#2dd4bf] text-[11px] font-bold flex items-center gap-1 shadow-2xs hover:bg-[#134237] transition-all cursor-pointer"
              >
                <Zap size={12} className="text-[#2dd4bf]" />
                <span>1-click setup</span>
              </button>
            </div>

            {/* Clean Rows with Action Buttons on Right */}
            <div className="space-y-2">
              {/* Row 1: Segmentación RFM */}
              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <Target size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Segmentos en riesgo
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Reactivar compradores recurrentes
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('rfm')}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Reactivar
                </button>
              </div>

              {/* Row 2: Tareas pendientes */}
              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <CheckCircle2 size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Compromisos de hoy
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Llamadas y WhatsApp programados
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('tareas')}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Abrir
                </button>
              </div>

              {/* Row 3: Facturar en POS */}
              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0d2f27] dark:text-[#2dd4bf] flex items-center justify-center">
                    <Store size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Facturación POS
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Convertir cotizaciones en venta
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('pipeline')}
                  className="px-3 py-1 rounded-lg bg-[#0d2f27] text-[#2dd4bf] text-xs font-semibold hover:bg-[#134237] transition-colors cursor-pointer"
                >
                  Facturar
                </button>
              </div>

              {/* Row 4: Asistente IA */}
              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <Sparkles size={15} className="text-[#2dd4bf]" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Asistente IA comercial
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Plantillas automáticas para WhatsApp
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400 px-2">
                  Activo
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bars Container (Matching the bottom right meters in the screenshot) */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            {/* Meter 1: Meta comercial mensual */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Meta del mes
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  RD$ {(metricas.meta_mes_actual / 1000).toFixed(0)}k / RD$ {(metricas.meta_mes_monto / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(
                      Math.round((metricas.meta_mes_actual / (metricas.meta_mes_monto || 1)) * 100),
                      100
                    )}%`,
                  }}
                  className="h-full rounded-full bg-[#0d2f27] dark:bg-[#2dd4bf]"
                />
              </div>
            </div>

            {/* Meter 2: Prospección mensual */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Capacidad de prospección
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {metricas.total_leads} / 100
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${Math.min(metricas.total_leads, 100)}%` }}
                  className="h-full rounded-full bg-[#2dd4bf]"
                />
              </div>
            </div>

            {/* Upgrade banner row */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Reinicio de ciclo: 1 de cada mes
              </span>
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Actualizar plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
