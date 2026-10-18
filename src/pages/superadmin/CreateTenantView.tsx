import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Layers,
  KeyRound,
  Check,
  RefreshCw,
  Receipt,
  Users,
  Store,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { FormEmpresaState } from './types';
import type { PlanEmpresa } from '@/types/database';
import { DEFAULT_PLAN_LIMITES } from '@/services/subscriptionModules.service';

interface CreateTenantViewProps {
  formData: FormEmpresaState;
  onChange: (data: FormEmpresaState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function CreateTenantView({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting,
}: CreateTenantViewProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Auto-slug generator
  const handleNombreChange = (val: string) => {
    const prevSuggestedSlug = formData.nombre
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!formData.codigo || formData.codigo === prevSuggestedSlug) {
      onChange({ ...formData, nombre: val, codigo: newSlug });
    } else {
      onChange({ ...formData, nombre: val });
    }
  };

  const handleSelectPlan = (plan: PlanEmpresa) => {
    const limits = DEFAULT_PLAN_LIMITES[plan];
    onChange({
      ...formData,
      plan,
      limite_usuarios: limits.limite_usuarios === -1 ? 50 : limits.limite_usuarios,
      limite_cajas: limits.limite_cajas === -1 ? 10 : limits.limite_cajas,
      limite_facturas_mes: limits.limite_facturas_mes,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Navigation Header with prominent Volver button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-secondary/60 text-foreground text-xs font-semibold transition group cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver a Empresas</span>
          </button>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">
              Super Admin / Empresas / Registrar Negocio
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Registrar Nuevo Negocio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary/60 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-nuevo-negocio"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Crear Negocio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form id="form-nuevo-negocio" onSubmit={onSubmit} className="space-y-5">
        {/* Card 1: Identificación Comercial */}
        <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50 text-foreground">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">1. Datos Comerciales de la Empresa</h2>
              <p className="text-xs text-muted-foreground">
                Información de identificación y datos fiscales del nuevo tenant
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Nombre Comercial *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Supermercado Bella Vista"
                value={formData.nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Slug / Identificador Único *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: bella-vista"
                value={formData.codigo}
                onChange={(e) =>
                  onChange({ ...formData, codigo: e.target.value.toLowerCase().trim() })
                }
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Identificador técnico en base de datos (sin espacios ni acentos).
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Razón Social
              </label>
              <input
                type="text"
                placeholder="Ej: Bella Vista Retail S.R.L."
                value={formData.razon_social}
                onChange={(e) => onChange({ ...formData, razon_social: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                RNC / Registro Fiscal
              </label>
              <input
                type="text"
                placeholder="Ej: 131-45678-9"
                value={formData.rnc}
                onChange={(e) => onChange({ ...formData, rnc: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Teléfono Comercial
              </label>
              <input
                type="tel"
                placeholder="Ej: 809-555-0100"
                value={formData.telefono}
                onChange={(e) => onChange({ ...formData, telefono: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Dirección Comercial
              </label>
              <input
                type="text"
                placeholder="Ej: Av. Principal #100, Santo Domingo"
                value={formData.direccion}
                onChange={(e) => onChange({ ...formData, direccion: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Plan de Suscripción & Cuotas */}
        <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50 text-foreground">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">2. Plan de Suscripción Inicial</h2>
              <p className="text-xs text-muted-foreground">
                Selecciona la categoría del plan y ajusta los límites operativos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'free' as PlanEmpresa, name: 'Free', price: 'Gratis', desc: '100 fac/mes, 1 caja' },
              { id: 'starter' as PlanEmpresa, name: 'Starter', price: '$29/mes', desc: '500 fac/mes, 2 cajas' },
              { id: 'pro' as PlanEmpresa, name: 'Pro', price: '$79/mes', desc: '2,500 fac/mes, 5 cajas' },
              { id: 'enterprise' as PlanEmpresa, name: 'Enterprise', price: '$199/mes', desc: 'Facturas ilimitadas' },
            ].map((p) => {
              const isSelected = formData.plan === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlan(p.id)}
                  className={`cursor-pointer rounded-xl p-3 border transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-2xs'
                      : 'border-border/70 bg-card hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">{p.name}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
                      }`}
                    >
                      {isSelected && <Check size={9} />}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-primary mt-0.5">{p.price}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{p.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Cuotas numéricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Receipt size={11} className="text-emerald-500" /> Facturas/Mes
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...formData,
                      limite_facturas_mes: formData.limite_facturas_mes === -1 ? 500 : -1,
                    })
                  }
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {formData.limite_facturas_mes === -1 ? 'Fijar' : 'Ilimitado'}
                </button>
              </div>
              {formData.limite_facturas_mes === -1 ? (
                <div className="px-3 py-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-600 rounded-xl text-center border border-emerald-500/20">
                  ∞ Ilimitado
                </div>
              ) : (
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={formData.limite_facturas_mes}
                  onChange={(e) =>
                    onChange({ ...formData, limite_facturas_mes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users size={11} className="text-blue-500" /> Usuarios
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={formData.limite_usuarios}
                onChange={(e) =>
                  onChange({ ...formData, limite_usuarios: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Store size={11} className="text-amber-500" /> Cajas POS
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.limite_cajas}
                onChange={(e) =>
                  onChange({ ...formData, limite_cajas: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 size={11} className="text-purple-500" /> Sucursales
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.limite_sucursales}
                onChange={(e) =>
                  onChange({ ...formData, limite_sucursales: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Cuenta Administradora del Negocio */}
        <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50 text-foreground">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <KeyRound size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">3. Usuario Administrador del Negocio</h2>
              <p className="text-xs text-muted-foreground">
                Credenciales con las que el dueño del negocio ingresará a administrar su empresa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Nombre del Dueño / Admin *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Roberto Gómez"
                value={formData.admin_nombre}
                onChange={(e) => onChange({ ...formData, admin_nombre: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Correo de Acceso *
              </label>
              <input
                type="email"
                required
                placeholder="admin@empresa.com"
                value={formData.admin_correo}
                onChange={(e) => onChange({ ...formData, admin_correo: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Contraseña Inicial *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formData.admin_password}
                  onChange={(e) => onChange({ ...formData, admin_password: e.target.value })}
                  className="w-full px-3.5 py-2 pr-9 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                ✓ Valor predeterminado: <code>admin123</code>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary/60 text-foreground text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Volver al Listado</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Creando Empresa y Administrador...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Crear Empresa y Administrador</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
