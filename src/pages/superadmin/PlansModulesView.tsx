import React, { useState, useEffect } from 'react';
import {
  Layers,
  Save,
  RotateCcw,
  CheckCircle2,
  Lock,
  Filter,
  Receipt,
  Users,
  Store,
  Search,
  Eye,
  Edit2,
  X,
  Sparkles,
} from 'lucide-react';
import type { PlanEmpresa } from '@/types/database';
import {
  ALL_APP_MODULES,
  DEFAULT_PLAN_MODULES,
  DEFAULT_PLAN_LIMITES,
  type PlanLimites,
  type PlanInfo,
  DEFAULT_PLANS_INFO,
  obtenerInfoPlanes,
  guardarInfoPlanes,
  obtenerNombresModulosPersonalizados,
  actualizarDatosModulo,
} from '@/services/subscriptionModules.service';
import { toast } from '@/lib/toast';

interface PlansModulesViewProps {
  planModulesConfig: Record<PlanEmpresa, string[]>;
  planLimitesConfig: Record<PlanEmpresa, PlanLimites>;
  selectedPlan: PlanEmpresa;
  onSelectPlan: (plan: PlanEmpresa) => void;
  onToggleModuleInPlan: (moduleId: string) => void;
  onEnableAllModules: () => void;
  onDisableAllModules: () => void;
  onResetModulesToDefault: () => void;
  onSaveModulesConfig: () => void;
  savingModules: boolean;
  onUpdatePlanLimites: (limites: PlanLimites) => void;
  onResetLimitesToDefault: () => void;
  onSaveLimitesConfig: () => void;
  savingLimites: boolean;
  onSimulatePlan?: (plan: PlanEmpresa) => void;
}

export default function PlansModulesView({
  planModulesConfig,
  planLimitesConfig,
  selectedPlan,
  onSelectPlan,
  onToggleModuleInPlan,
  onEnableAllModules,
  onDisableAllModules,
  onResetModulesToDefault,
  onSaveModulesConfig,
  savingModules,
  onUpdatePlanLimites,
  onResetLimitesToDefault,
  onSaveLimitesConfig,
  savingLimites,
  onSimulatePlan,
}: PlansModulesViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'modules' | 'quotas'>('modules');
  const [filterCat, setFilterCat] = useState('todos');
  const [searchModule, setSearchModule] = useState('');

  // Estados para información editable de planes y nombres de módulos
  const [plansInfo, setPlansInfo] = useState<Record<PlanEmpresa, PlanInfo>>(obtenerInfoPlanes);
  const [modulesCustom, setModulesCustom] = useState(obtenerNombresModulosPersonalizados);
  const [editingPlanModal, setEditingPlanModal] = useState<PlanInfo | null>(null);
  const [editingModuleModal, setEditingModuleModal] = useState<{
    id: string;
    label: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setPlansInfo(obtenerInfoPlanes());
      setModulesCustom(obtenerNombresModulosPersonalizados());
    };
    window.addEventListener('koba_subscription_config_changed', handleSync);
    return () => window.removeEventListener('koba_subscription_config_changed', handleSync);
  }, []);

  const currentModules = planModulesConfig[selectedPlan] || [];
  const currentLimites = planLimitesConfig[selectedPlan] || DEFAULT_PLAN_LIMITES[selectedPlan];

  const filteredModules = ALL_APP_MODULES.filter((m) => {
    const customLabel = modulesCustom[m.id]?.label || m.label;
    const customDesc = modulesCustom[m.id]?.description || m.description;
    const matchCat = filterCat === 'todos' || m.group === filterCat;
    const matchSearch =
      !searchModule ||
      customLabel.toLowerCase().includes(searchModule.toLowerCase()) ||
      customDesc.toLowerCase().includes(searchModule.toLowerCase()) ||
      m.href.toLowerCase().includes(searchModule.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSaveEditingPlan = () => {
    if (!editingPlanModal) return;
    const updated = {
      ...plansInfo,
      [editingPlanModal.id]: { ...editingPlanModal },
    };
    setPlansInfo(updated);
    guardarInfoPlanes(updated);
    toast.success(`Datos del plan ${editingPlanModal.name} actualizados.`);
    setEditingPlanModal(null);
  };

  const handleSaveEditingModule = () => {
    if (!editingModuleModal) return;
    actualizarDatosModulo(editingModuleModal.id, {
      label: editingModuleModal.label.trim(),
      description: editingModuleModal.description.trim(),
    });
    setModulesCustom(obtenerNombresModulosPersonalizados());
    toast.success(`Módulo "${editingModuleModal.label}" actualizado.`);
    setEditingModuleModal(null);
  };

  const planKeys: PlanEmpresa[] = ['free', 'starter', 'pro', 'enterprise'];

  return (
    <div className="space-y-6">
      {/* 1. Selector de Planes (4 Clean Cards con edición de metadatos) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              1. Selecciona el Plan de Suscripción a Configurar
            </h2>
            <span className="text-xs text-muted-foreground">
              Haz clic en la tarjeta para seleccionar el plan, o en el lápiz para editar su nombre, precio y descripción.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const currentInfo = plansInfo[selectedPlan] || DEFAULT_PLANS_INFO[selectedPlan];
              setEditingPlanModal({ ...currentInfo });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition cursor-pointer self-start sm:self-auto shadow-2xs"
          >
            <Edit2 size={13} />
            <span>Editar Datos de {(plansInfo[selectedPlan]?.name || selectedPlan).toUpperCase()}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {planKeys.map((planId) => {
            const plan = plansInfo[planId] || DEFAULT_PLANS_INFO[planId];
            const isSelected = selectedPlan === planId;
            const enabledCount = (planModulesConfig[planId] || []).length;
            const totalCount = ALL_APP_MODULES.length;

            return (
              <div
                key={planId}
                onClick={() => onSelectPlan(planId)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all text-left relative group ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-2xs'
                    : 'border-border/70 bg-card hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-foreground truncate mr-2" title={plan.name}>
                    {plan.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlanModal({ ...plan });
                      }}
                      className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition opacity-70 group-hover:opacity-100"
                      title="Editar nombre, precio, etiqueta y descripción del plan"
                    >
                      <Edit2 size={12} />
                    </button>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                </div>

                <div className="text-base font-bold text-foreground tabular-nums">
                  {plan.price}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5" title={plan.desc}>
                  {plan.desc}
                </p>

                <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Módulos permitidos:</span>
                  <span className="font-bold text-foreground">
                    {enabledCount} / {totalCount}
                  </span>
                </div>
                <div className="w-full bg-secondary h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Sub-Tabs: Módulos vs Cuotas */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('modules')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'modules'
              ? 'bg-card text-foreground font-bold shadow-2xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers size={13} className={activeSubTab === 'modules' ? 'text-primary' : ''} />
          <span>Módulos del Plan {(plansInfo[selectedPlan]?.name || selectedPlan).toUpperCase()}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-bold">
            {currentModules.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('quotas')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'quotas'
              ? 'bg-card text-foreground font-bold shadow-2xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt size={13} className={activeSubTab === 'quotas' ? 'text-primary' : ''} />
          <span>Cuotas Operativas del Plan</span>
        </button>
      </div>

      {/* VIEW SUB-TAB: MÓDULOS */}
      {activeSubTab === 'modules' && (
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Catálogo de Módulos para</span>
                <span className="uppercase text-primary font-black px-2 py-0.5 rounded-md bg-primary/10 text-xs">
                  {plansInfo[selectedPlan]?.name || selectedPlan}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  ({currentModules.length} activos)
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Marca únicamente los módulos a los que tendrán acceso los usuarios asignados a este plan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onEnableAllModules}
                className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold hover:bg-secondary/60 transition cursor-pointer"
              >
                Activar Todos
              </button>
              <button
                type="button"
                onClick={onDisableAllModules}
                className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition cursor-pointer"
              >
                Mínimo
              </button>
              <button
                type="button"
                onClick={onResetModulesToDefault}
                className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex items-center gap-1 transition cursor-pointer"
                title="Restaurar a los módulos recomendados de fábrica"
              >
                <RotateCcw size={12} />
                <span>Recomendados</span>
              </button>
              <button
                type="button"
                onClick={onSaveModulesConfig}
                disabled={savingModules}
                className="px-3.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-2xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Save size={13} />
                <span>{savingModules ? 'Guardando...' : 'Guardar Plan'}</span>
              </button>
              {onSimulatePlan && (
                <button
                  type="button"
                  onClick={() => onSimulatePlan(selectedPlan)}
                  className="px-3.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Experimentar KOBA exactamente como lo vería un usuario con solo los módulos de este plan"
                >
                  <Eye size={13} />
                  <span>Probar este Plan</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar módulo por nombre o ruta..."
                value={searchModule}
                onChange={(e) => setSearchModule(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mr-1">
                <Filter size={10} /> Filtro:
              </span>
              {['todos', 'Principal', 'Operaciones', 'Inventario', 'CRM', 'Finanzas', 'Análisis', 'Configuración'].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCat(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      filterCat === cat
                        ? 'bg-foreground text-background font-bold shadow-2xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {filteredModules.map((mod) => {
              const isEnabled = currentModules.includes(mod.id);
              const isRecommended = mod.recommendedFor.includes(selectedPlan);
              const customName = modulesCustom[mod.id]?.label || mod.label;
              const customDesc = modulesCustom[mod.id]?.description || mod.description;

              return (
                <div
                  key={mod.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all group ${
                    isEnabled
                      ? 'border-border/80 bg-background shadow-2xs'
                      : 'border-border/50 bg-secondary/20 opacity-70 hover:opacity-90'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-foreground truncate" title={customName}>
                          {customName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingModuleModal({
                              id: mod.id,
                              label: customName,
                              description: customDesc,
                            });
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-secondary transition opacity-60 hover:opacity-100 shrink-0"
                          title="Personalizar nombre y descripción de este módulo"
                        >
                          <Edit2 size={11} />
                        </button>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground font-medium shrink-0">
                        {mod.group}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed" title={customDesc}>
                      {customDesc}
                    </p>
                    <span className="font-mono text-[9px] text-muted-foreground/70 block">
                      {mod.href}
                    </span>
                    {isRecommended && (
                      <span className="inline-block text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ Sugerido para {(plansInfo[selectedPlan]?.name || selectedPlan).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {isEnabled ? 'Habilitado' : 'Bloqueado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleModuleInPlan(mod.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isEnabled
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-secondary text-muted-foreground border border-border/60 hover:text-foreground'
                      }`}
                    >
                      {isEnabled ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Activo</span>
                        </>
                      ) : (
                        <>
                          <Lock size={12} />
                          <span>Inactivo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW SUB-TAB: CUOTAS */}
      {activeSubTab === 'quotas' && (
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Cuotas Base para</span>
                <span className="uppercase text-primary font-black px-2 py-0.5 rounded-md bg-primary/10 text-xs">
                  {plansInfo[selectedPlan]?.name || selectedPlan}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define el volumen mensual de facturas, usuarios y cajas incluidos por defecto en este plan
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetLimitesToDefault}
                className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex items-center gap-1 transition cursor-pointer"
                title="Restaurar cuotas base de fábrica"
              >
                <RotateCcw size={12} />
                <span>Predeterminados</span>
              </button>
              <button
                type="button"
                onClick={onSaveLimitesConfig}
                disabled={savingLimites}
                className="px-3.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-2xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Save size={13} />
                <span>{savingLimites ? 'Guardando...' : 'Guardar Cuotas'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Facturas por Mes */}
            <div className="p-4 rounded-xl border border-border/70 bg-background space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Facturas por Mes</h4>
                  <p className="text-[11px] text-muted-foreground">Emisiones mensuales permitidas</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePlanLimites({
                      ...currentLimites,
                      limite_facturas_mes: currentLimites.limite_facturas_mes === -1 ? 500 : -1,
                    })
                  }
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                    currentLimites.limite_facturas_mes === -1
                      ? 'bg-amber-500 text-white'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {currentLimites.limite_facturas_mes === -1 ? 'Ilimitado ✓' : 'Fijar Ilimitado'}
                </button>
              </div>

              <div>
                {currentLimites.limite_facturas_mes === -1 ? (
                  <div className="px-3 py-2 text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-center">
                    ∞ Facturas Ilimitadas
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={currentLimites.limite_facturas_mes}
                      onChange={(e) =>
                        onUpdatePlanLimites({
                          ...currentLimites,
                          limite_facturas_mes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      facturas/mes
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Usuarios Activos */}
            <div className="p-4 rounded-xl border border-border/70 bg-background space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Usuarios Simultáneos</h4>
                  <p className="text-[11px] text-muted-foreground">Cuentas activas en la empresa</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePlanLimites({
                      ...currentLimites,
                      limite_usuarios: currentLimites.limite_usuarios === -1 ? 5 : -1,
                    })
                  }
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                    currentLimites.limite_usuarios === -1
                      ? 'bg-amber-500 text-white'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {currentLimites.limite_usuarios === -1 ? 'Ilimitado ✓' : 'Fijar Ilimitado'}
                </button>
              </div>

              <div>
                {currentLimites.limite_usuarios === -1 ? (
                  <div className="px-3 py-2 text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-center">
                    ∞ Usuarios Ilimitados
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={currentLimites.limite_usuarios}
                      onChange={(e) =>
                        onUpdatePlanLimites({
                          ...currentLimites,
                          limite_usuarios: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      usuarios
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cajas Registradoras */}
            <div className="p-4 rounded-xl border border-border/70 bg-background space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Cajas Registradoras</h4>
                  <p className="text-[11px] text-muted-foreground">Terminales POS permitidas</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePlanLimites({
                      ...currentLimites,
                      limite_cajas: currentLimites.limite_cajas === -1 ? 2 : -1,
                    })
                  }
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                    currentLimites.limite_cajas === -1
                      ? 'bg-amber-500 text-white'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {currentLimites.limite_cajas === -1 ? 'Ilimitado ✓' : 'Fijar Ilimitado'}
                </button>
              </div>

              <div>
                {currentLimites.limite_cajas === -1 ? (
                  <div className="px-3 py-2 text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-center">
                    ∞ Cajas Ilimitadas
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={currentLimites.limite_cajas}
                      onChange={(e) =>
                        onUpdatePlanLimites({
                          ...currentLimites,
                          limite_cajas: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      cajas
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR METADATOS DEL PLAN */}
      {editingPlanModal && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Edit2 size={16} className="text-primary" />
                <span>Editar Plan: {editingPlanModal.id.toUpperCase()}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlanModal(null)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nombre Comercial del Plan</label>
                <input
                  type="text"
                  value={editingPlanModal.name}
                  onChange={(e) => setEditingPlanModal({ ...editingPlanModal, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="ej. Free (Gratis), Starter Comercio..."
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Tarifa / Precio visible</label>
                <input
                  type="text"
                  value={editingPlanModal.price}
                  onChange={(e) => setEditingPlanModal({ ...editingPlanModal, price: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="ej. $29 USD/m, RD$ 1,900 / mes..."
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Etiqueta / Badge</label>
                <input
                  type="text"
                  value={editingPlanModal.badge}
                  onChange={(e) => setEditingPlanModal({ ...editingPlanModal, badge: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="ej. Básico, Recomendado, Pequeño Negocio..."
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Descripción del Plan</label>
                <textarea
                  rows={2}
                  value={editingPlanModal.desc}
                  onChange={(e) => setEditingPlanModal({ ...editingPlanModal, desc: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Descripción resumida para el usuario..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => {
                  const defaults = DEFAULT_PLANS_INFO[editingPlanModal.id];
                  setEditingPlanModal({ ...defaults });
                }}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Restaurar Valores de Fábrica</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlanModal(null)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditingPlan}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-2xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR NOMBRE Y DESCRIPCIÓN DEL MÓDULO */}
      {editingModuleModal && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Edit2 size={16} className="text-primary" />
                <span>Personalizar Módulo</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingModuleModal(null)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nombre / Título del Módulo</label>
                <input
                  type="text"
                  value={editingModuleModal.label}
                  onChange={(e) =>
                    setEditingModuleModal({ ...editingModuleModal, label: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="ej. Caja Rápida, Facturación..."
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Descripción del Módulo</label>
                <textarea
                  rows={3}
                  value={editingModuleModal.description}
                  onChange={(e) =>
                    setEditingModuleModal({ ...editingModuleModal, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Explicación de funciones y características..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => {
                  const original = ALL_APP_MODULES.find((m) => m.id === editingModuleModal.id);
                  if (original) {
                    setEditingModuleModal({
                      id: original.id,
                      label: original.label,
                      description: original.description,
                    });
                  }
                }}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Nombre Original</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingModuleModal(null)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditingModule}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-2xs cursor-pointer"
                >
                  Guardar Nombre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
