import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Check,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import type { PlanEmpresa } from '@/types/database';
import {
  obtenerPlanSimulado,
  establecerPlanSimulado,
  esModoSimulacionPlan,
} from '@/services/subscriptionModules.service';
import { useAuth } from '@/context/AuthContext';
import { actualizarPlanEmpresa } from '@/services/empresas.service';
import { toast } from '@/lib/toast';

interface PlanSelectorModalProps {
  open: boolean;
  onClose: () => void;
}

// Icono estilizado de árbol/brote extraído directamente del diseño en Stitch
function KobaBrandTreeIcon({ className = 'w-9 h-9 text-emerald-700' }: { className?: string }) {
  return (
    <div className={`inline-flex shrink-0 ${className}`}>
      <svg
        aria-hidden="true"
        className="w-full h-full stroke-[1.6]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 40 40"
      >
        <path d="M20 36V18" strokeLinecap="round" />
        <path d="M12 28C14 26 18 24 20 24C22 24 26 26 28 28" strokeLinecap="round" />
        <circle cx="20" cy="12" r="3" />
        <circle cx="11" cy="20" r="3" />
        <circle cx="29" cy="20" r="3" />
      </svg>
    </div>
  );
}

export default function PlanSelectorModal({ open, onClose }: PlanSelectorModalProps) {
  const { user } = useAuth();
  const [tabType, setTabType] = useState<'individual' | 'team'>('individual');
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual');
  const [savingPlan, setSavingPlan] = useState<PlanEmpresa | null>(null);

  const planActual: PlanEmpresa =
    obtenerPlanSimulado() || user?.empresaPlan || 'free';
  const isSimulating = esModoSimulacionPlan();

  useEffect(() => {
    if (open) {
      setSavingPlan(null);
    }
  }, [open]);

  const handleSelectPlan = async (plan: PlanEmpresa) => {
    setSavingPlan(plan);
    try {
      if (user?.isSuperAdmin) {
        // En modo SuperAdmin, simular el plan para experimentar la plataforma como dicho cliente
        establecerPlanSimulado(plan);
        toast.success(
          `Modo Simulación activo: Ahora estás navegando con los permisos del plan ${plan.toUpperCase()}.`
        );
      } else {
        // En cuenta de empresa, actualizar el plan activo de la organización
        if (user?.empresaId) {
          await actualizarPlanEmpresa(user.empresaId, plan);
        }
        window.dispatchEvent(new Event('koba_subscription_config_changed'));
        toast.success(`Plan de suscripción actualizado con éxito a: ${plan.toUpperCase()}`);
      }
      onClose();
    } catch (err) {
      console.error('Error al actualizar plan:', err);
      toast.error('No se pudo aplicar el plan seleccionado');
    } finally {
      setSavingPlan(null);
    }
  };

  const handleQuitarSimulacion = () => {
    establecerPlanSimulado(null);
    toast.info('Simulación desactivada. Vista completa de SuperAdmin restaurada.');
    onClose();
  };

  const handleContactSales = () => {
    if (user?.isSuperAdmin) {
      handleSelectPlan('enterprise');
      return;
    }
    const mensaje = encodeURIComponent(
      'Hola equipo de KOBA Cloud, deseo información y asesoría comercial para contratar el plan Enterprise con facturación personalizada.'
    );
    window.open(`https://wa.me/18290000000?text=${mensaje}`, '_blank');
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      size="5xl"
      className="p-0 overflow-hidden bg-[#F8F8F7] dark:bg-neutral-900 border border-[#E6E6E4] dark:border-neutral-800 rounded-3xl shadow-2xl max-h-[92vh]"
    >
      <div className="relative w-full max-w-[1240px] mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between selection:bg-neutral-200 dark:selection:bg-neutral-700">
        {/* Botón flotante para cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal de planes"
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition cursor-pointer z-20 shadow-xs"
        >
          <X size={18} />
        </button>

        {/* Banner de SuperAdmin / Simulación activa */}
        {isSimulating && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
              <ShieldCheck size={16} />
              <span>
                <strong>Modo Simulación activo:</strong> Estás previsualizando KOBA Cloud como usuario del plan{' '}
                <strong className="uppercase">{planActual}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuitarSimulacion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition cursor-pointer shadow-xs"
            >
              <RotateCcw size={13} />
              <span>Restaurar Vista SuperAdmin</span>
            </button>
          </div>
        )}

        {/* BEGIN: PlanTypeSelector (Segmented control) */}
        <header className="mb-8 w-full flex justify-center">
          <nav
            className="inline-flex p-1 bg-[#ECECE9] dark:bg-neutral-800 rounded-xl border border-[#E0E0DC] dark:border-neutral-700"
            data-purpose="plan-segment-tabs"
          >
            <button
              type="button"
              onClick={() => setTabType('individual')}
              aria-pressed={tabType === 'individual'}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none cursor-pointer ${
                tabType === 'individual'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Uso individual
            </button>
            <button
              type="button"
              onClick={() => setTabType('team')}
              aria-pressed={tabType === 'team'}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none cursor-pointer ${
                tabType === 'team'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Team y Enterprise
            </button>
          </nav>
        </header>
        {/* END: PlanTypeSelector */}

        {/* VISTA 1: USO INDIVIDUAL (Exacto al diseño de Stitch) */}
        {tabType === 'individual' ? (
          <section
            aria-label="Planes de suscripción de uso individual"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch"
          >
            {/* ================= CARD 1: FREE ================= */}
            <article
              className={`bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full border transition-all duration-200 ${
                planActual === 'free'
                  ? 'border-emerald-500/70 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-[#E6E6E4] dark:border-neutral-800 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Plan Icon */}
                <div className="mb-6 inline-flex text-emerald-700 dark:text-emerald-500">
                  <KobaBrandTreeIcon className="w-9 h-9" />
                </div>

                {/* Plan Title & Subtitle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                      Free
                    </h2>
                    {planActual === 'free' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500 text-white">
                        Actual
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    7 módulos
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 min-h-[40px]">
                  Caja rápida, ventas básicas y catálogo indispensable
                </p>

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    0 $
                  </span>
                  <div className="flex flex-col text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                    <span>USD /mes</span>
                    <span>gratis para siempre</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-7">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('free')}
                    disabled={savingPlan === 'free'}
                    className={`w-full py-2.5 px-4 text-sm font-semibold rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 ${
                      planActual === 'free'
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 cursor-default'
                        : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600 hover:border-emerald-500'
                    }`}
                  >
                    {savingPlan === 'free'
                      ? 'Aplicando…'
                      : planActual === 'free'
                      ? '✓ Plan Activo'
                      : user?.isSuperAdmin
                      ? 'Simular Plan Free'
                      : 'Usar Plan Free'}
                  </button>
                  <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-2.5">
                    Sin tarjeta de crédito requerida
                  </p>
                </div>

                {/* Feature Divider */}
                <hr className="border-t border-neutral-100 dark:border-neutral-800 my-6" />

                {/* Feature List */}
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 mb-3.5">
                  Módulos incluidos:
                </p>
                <ul className="space-y-3.5 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Dashboard &amp; Métricas en tiempo real</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Punto de Venta (POS) ágil</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Ventas &amp; Cotizaciones comerciales</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Productos &amp; Catálogo básico</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Cajas Registradoras operativas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Contactos &amp; Directorio de clientes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Cierre de Caja &amp; Arqueo diario</span>
                  </li>
                </ul>
              </div>
            </article>

            {/* ================= CARD 2: PRO (Popular) ================= */}
            <article
              className={`bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full border transition-all duration-200 relative ${
                planActual === 'pro'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                  : 'border-emerald-200 dark:border-emerald-900/50 shadow-md hover:shadow-xl'
              }`}
            >
              <div>
                {/* Header: Icon & Billing toggle pill */}
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex text-emerald-700 dark:text-emerald-500">
                    <KobaBrandTreeIcon className="w-9 h-9" />
                  </div>

                  {/* Billing cycle frequency toggle pill */}
                  <div className="inline-flex items-center text-xs bg-[#ECECE9]/90 dark:bg-neutral-800 p-0.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('mensual')}
                      className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                        billingCycle === 'mensual'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                      }`}
                    >
                      Mensual
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('anual')}
                      className={`px-2 py-0.5 rounded transition cursor-pointer ${
                        billingCycle === 'anual'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                      }`}
                    >
                      Anual <span className="text-emerald-700 dark:text-emerald-400 font-bold">· -20%</span>
                    </button>
                  </div>
                </div>

                {/* Plan Title & Subtitle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                      Pro
                    </h2>
                    {planActual === 'pro' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500 text-white">
                        Actual
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                    20 módulos · Popular
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 min-h-[40px]">
                  CRM, CxC, CxP, stock multi-sucursal y facturación
                </p>

                {/* Price with monthly or annual label */}
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {billingCycle === 'anual' ? '63 $' : '79 $'}
                  </span>
                  <div className="flex flex-col text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                    <span>USD /mes</span>
                    <span>
                      {billingCycle === 'anual'
                        ? 'facturado anualmente (756 $/año)'
                        : 'facturado mensualmente'}
                    </span>
                  </div>
                </div>

                {/* Action Button & Cancel Notice */}
                <div className="mt-7">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('pro')}
                    disabled={savingPlan === 'pro'}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-600"
                  >
                    {savingPlan === 'pro'
                      ? 'Aplicando…'
                      : planActual === 'pro'
                      ? '✓ Plan Activo'
                      : user?.isSuperAdmin
                      ? 'Simular Plan Pro'
                      : 'Comenzar con Pro'}
                  </button>
                  <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-2.5">
                    Sin compromiso · Cancela cuando quieras
                  </p>
                </div>

                {/* Feature Divider */}
                <hr className="border-t border-neutral-100 dark:border-neutral-800 my-6" />

                {/* Feature Section Header */}
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 mb-3.5">
                  Todo lo de Free y además:
                </p>

                {/* Feature List */}
                <ul className="space-y-3.5 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Gestión de Clientes (CRM) avanzada</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Cuentas por Cobrar (CxC) con recordatorios</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Cuentas por Pagar (CxP) y proveedores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Control de Stock Multi-sucursal</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Facturación Electrónica Automática</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Reportes Financieros Avanzados y P&amp;G</span>
                  </li>
                </ul>
              </div>
            </article>

            {/* ================= CARD 3: ENTERPRISE ================= */}
            <article
              className={`bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full border transition-all duration-200 ${
                planActual === 'enterprise'
                  ? 'border-emerald-500/70 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-[#E6E6E4] dark:border-neutral-800 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Plan Icon */}
                <div className="mb-6 inline-flex text-emerald-700 dark:text-emerald-500">
                  <KobaBrandTreeIcon className="w-9 h-9" />
                </div>

                {/* Plan Title & Subtitle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                      Enterprise
                    </h2>
                    {planActual === 'enterprise' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500 text-white">
                        Actual
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    21 módulos
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 min-h-[40px]">
                  Auditoría integral, integración API sin límites y soporte prioritario
                </p>

                {/* Price with 'Desde' prefix */}
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {billingCycle === 'anual' ? 'Desde 159 $' : 'Desde 199 $'}
                  </span>
                  <div className="flex flex-col text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                    <span>USD /mes</span>
                    <span>facturado mensualmente</span>
                  </div>
                </div>

                {/* Action Button & Cancel Notice */}
                <div className="mt-7">
                  <button
                    type="button"
                    onClick={handleContactSales}
                    disabled={savingPlan === 'enterprise'}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-600"
                  >
                    {user?.isSuperAdmin ? 'Simular Enterprise' : 'Contactar Ventas'}
                  </button>
                  <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-2.5">
                    Sin compromiso · Facturación flexible
                  </p>
                </div>

                {/* Feature Divider */}
                <hr className="border-t border-neutral-100 dark:border-neutral-800 my-6" />

                {/* Feature Section Header */}
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 mb-3.5">
                  Todo lo incluido en Pro, más:
                </p>

                {/* Feature List */}
                <ul className="space-y-3.5 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Auditoría Forense &amp; Logs de sistema</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Acceso Completo API REST &amp; Webhooks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Arquitectura Multi-empresa y roles a medida</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Soporte Dedicado 24/7 SLA 99.9%</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Onboarding y migración asistida personalizada</span>
                  </li>
                </ul>
              </div>
            </article>
          </section>
        ) : (
          /* VISTA 2: TEAM Y ENTERPRISE (Organizaciones y Multi-sucursal) */
          <section
            aria-label="Planes corporativos Team y Enterprise"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch"
          >
            {/* Starter Team */}
            <article
              className={`bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full border transition-all duration-200 ${
                planActual === 'starter'
                  ? 'border-emerald-500/70 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-[#E6E6E4] dark:border-neutral-800 hover:shadow-lg'
              }`}
            >
              <div>
                <div className="mb-6 inline-flex text-emerald-700 dark:text-emerald-500">
                  <KobaBrandTreeIcon className="w-9 h-9" />
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Starter Team
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    13 módulos
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 min-h-[40px]">
                  Compras, combos y control de gastos para pequeños comercios
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    29 $
                  </span>
                  <div className="flex flex-col text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                    <span>USD /mes</span>
                    <span>hasta 5 usuarios y 2 sucursales</span>
                  </div>
                </div>

                <div className="mt-7">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('starter')}
                    disabled={savingPlan === 'starter'}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {savingPlan === 'starter'
                      ? 'Aplicando…'
                      : planActual === 'starter'
                      ? '✓ Plan Activo'
                      : user?.isSuperAdmin
                      ? 'Simular Starter'
                      : 'Elegir Starter'}
                  </button>
                  <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-2.5">
                    Facturación mensual o anual
                  </p>
                </div>

                <hr className="border-t border-neutral-100 dark:border-neutral-800 my-6" />

                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 mb-3.5">
                  Capacidades del equipo:
                </p>
                <ul className="space-y-3.5 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Hasta 5 usuarios y roles de cajero/supervisor</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>2 sucursales y 2 terminales POS operativas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Hasta 500 facturas emitidas por mes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Control de Gastos y Compras a proveedores</span>
                  </li>
                </ul>
              </div>
            </article>

            {/* Pro Business */}
            <article
              className={`bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full border transition-all duration-200 relative ${
                planActual === 'pro'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                  : 'border-emerald-200 dark:border-emerald-900/50 shadow-md hover:shadow-xl'
              }`}
            >
              <div>
                <div className="mb-6 inline-flex text-emerald-700 dark:text-emerald-500">
                  <KobaBrandTreeIcon className="w-9 h-9" />
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Pro Business
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                    20 módulos · Ideal Empresas
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 min-h-[40px]">
                  CRM, CxC, CxP, multi-sucursal y finanzas consolidadas
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    79 $
                  </span>
                  <div className="flex flex-col text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                    <span>USD /mes</span>
                    <span>hasta 15 usuarios y 5 sucursales</span>
                  </div>
                </div>

                <div className="mt-7">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('pro')}
                    disabled={savingPlan === 'pro'}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {savingPlan === 'pro'
                      ? 'Aplicando…'
                      : planActual === 'pro'
                      ? '✓ Plan Activo'
                      : user?.isSuperAdmin
                      ? 'Simular Pro'
                      : 'Comenzar con Pro'}
                  </button>
                  <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-2.5">
                    Cancela o ajusta sucursales cuando quieras
                  </p>
                </div>

                <hr className="border-t border-neutral-100 dark:border-neutral-800 my-6" />

                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 mb-3.5">
                  Capacidades del equipo:
                </p>
                <ul className="space-y-3.5 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Hasta 15 usuarios activos con control de permisos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Hasta 5 sucursales con traspasos de inventario</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Hasta 2,500 facturas mensuales y 5 cajas activas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>CRM avanzado y cuentas de cobro/pago automatizadas</span>
                  </li>
                </ul>
              </div>
            </article>

            {/* Enterprise Corporativo */}
            <article
              className={`bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full border transition-all duration-200 ${
                planActual === 'enterprise'
                  ? 'border-emerald-500/70 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-[#E6E6E4] dark:border-neutral-800 hover:shadow-lg'
              }`}
            >
              <div>
                <div className="mb-6 inline-flex text-emerald-700 dark:text-emerald-500">
                  <KobaBrandTreeIcon className="w-9 h-9" />
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Enterprise Corp
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    21 módulos · Ilimitado
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 min-h-[40px]">
                  Auditoría integral, multi-empresa, API REST y soporte VIP
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Desde 199 $
                  </span>
                  <div className="flex flex-col text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                    <span>USD /mes</span>
                    <span>usuarios y sucursales ilimitadas</span>
                  </div>
                </div>

                <div className="mt-7">
                  <button
                    type="button"
                    onClick={handleContactSales}
                    disabled={savingPlan === 'enterprise'}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {user?.isSuperAdmin ? 'Simular Enterprise' : 'Hablar con un Asesor'}
                  </button>
                  <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-2.5">
                    Acuerdo SLA 99.9% y contrato flexible
                  </p>
                </div>

                <hr className="border-t border-neutral-100 dark:border-neutral-800 my-6" />

                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 mb-3.5">
                  Capacidades del equipo:
                </p>
                <ul className="space-y-3.5 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Usuarios y cajas ilimitadas sin costo por asiento</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Auditoría Forense completa y trazabilidad de acciones</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>API REST y Webhooks para integrar con sistemas externos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                    <span>Gerente de cuenta dedicado y migración guiada</span>
                  </li>
                </ul>
              </div>
            </article>
          </section>
        )}

        {/* BEGIN: LegalFooter */}
        <footer className="mt-10 pt-4 text-center text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <p>
            * Se aplican términos y condiciones de servicio. Los planes y precios de KOBA Cloud están
            sujetos a cambios según la contratación.
          </p>
        </footer>
        {/* END: LegalFooter */}
      </div>
    </ModalShell>
  );
}
