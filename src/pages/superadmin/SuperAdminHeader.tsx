import React from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  DollarSign,
  Plus,
  RefreshCw,
  Crown,
  Layers,
  UserPlus,
  Target,
} from 'lucide-react';
import type { SuperAdminTab } from './types';

interface SuperAdminHeaderProps {
  stats: {
    totalEmpresas: number;
    activas: number;
    totalUsuarios: number;
    planesCount: {
      free: number;
      starter: number;
      pro: number;
      enterprise: number;
    };
  };
  loading: boolean;
  activeTab: SuperAdminTab;
  onTabChange: (tab: SuperAdminTab) => void;
  onRefresh: () => void;
  onCreateTenant: () => void;
  onCreateUser: () => void;
}

export default function SuperAdminHeader({
  stats,
  loading,
  activeTab,
  onTabChange,
  onRefresh,
  onCreateTenant,
  onCreateUser,
}: SuperAdminHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Top Bar: Minimalist & Professional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <Crown size={12} />
              Kob Cloud • Super Admin
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Multi-Tenant Architecture
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panel de Super Administrador
          </h1>
          <p className="text-sm text-muted-foreground">
            Control centralizado de organizaciones, usuarios, suscripciones y cuotas del sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-secondary/60 text-foreground transition cursor-pointer disabled:opacity-50"
            title="Recargar datos de la plataforma"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('crm')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-secondary/60 text-foreground transition cursor-pointer ${
              activeTab === 'crm' ? 'border-primary/50 text-primary bg-primary/10' : ''
            }`}
            title="Ver CRM y pipeline comercial"
          >
            <Target size={14} className="text-primary" />
            <span>Ver CRM</span>
          </button>

          <button
            type="button"
            onClick={onCreateUser}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-secondary/60 text-foreground transition cursor-pointer"
          >
            <UserPlus size={14} className="text-primary" />
            <span>Nuevo Usuario</span>
          </button>

          <button
            type="button"
            onClick={onCreateTenant}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Registrar Negocio</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Clean Minimalist Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-border transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Empresas Registradas
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {stats.totalEmpresas}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {stats.activas} activas
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Organizaciones en el ERP</p>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-border transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Usuarios Globales
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {stats.totalUsuarios}
            </span>
            <span className="text-xs text-muted-foreground">cuentas</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">En todas las empresas del sistema</p>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-border transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Privacidad & RLS
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              100%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Blindado
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Sin acceso a ventas privadas de clientes</p>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-border transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Suscripciones Activas
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Crown size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums truncate">
              {stats.activas}
            </span>
            <span className="text-xs text-muted-foreground">de {stats.totalEmpresas} empresas</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Con suscripción y servicio al día</p>
        </div>
      </div>

      {/* Segmented Tab Navigation: Minimalist Pill Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-secondary/40 border border-border/60 rounded-xl max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => onTabChange('tenants')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'tenants'
              ? 'bg-card text-foreground shadow-xs font-bold border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Building2 size={14} className={activeTab === 'tenants' ? 'text-primary' : ''} />
          <span>Empresas & Negocios</span>
          <span className="px-1.5 py-0.2 rounded-full bg-secondary text-[10px] font-bold">
            {stats.totalEmpresas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('users')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-card text-foreground shadow-xs font-bold border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Users size={14} className={activeTab === 'users' ? 'text-primary' : ''} />
          <span>Usuarios Globales</span>
          <span className="px-1.5 py-0.2 rounded-full bg-secondary text-[10px] font-bold">
            {stats.totalUsuarios}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('subscriptions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'bg-card text-foreground shadow-xs font-bold border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Layers size={14} className={activeTab === 'subscriptions' ? 'text-primary' : ''} />
          <span>Suscripciones & Módulos</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('platform')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'platform'
              ? 'bg-card text-foreground shadow-xs font-bold border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <ShieldCheck size={14} className={activeTab === 'platform' ? 'text-primary' : ''} />
          <span>Arquitectura & RLS</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('crm')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'crm'
              ? 'bg-card text-foreground shadow-xs font-bold border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Target size={14} className={activeTab === 'crm' ? 'text-primary' : ''} />
          <span>CRM & Pipeline</span>
        </button>
      </div>
    </div>
  );
}
