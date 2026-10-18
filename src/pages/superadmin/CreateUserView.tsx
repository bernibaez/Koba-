import React, { useState } from 'react';
import {
  ArrowLeft,
  UserPlus,
  Building2,
  KeyRound,
  Crown,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { Empresa, RolDb } from '@/types/database';
import type { FormUsuarioState } from './types';

interface CreateUserViewProps {
  formData: FormUsuarioState;
  empresas: Empresa[];
  onChange: (data: FormUsuarioState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function CreateUserView({
  formData,
  empresas,
  onChange,
  onSubmit,
  onCancel,
  submitting,
}: CreateUserViewProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-secondary/60 text-foreground text-xs font-semibold transition group cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver a Usuarios</span>
          </button>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">
              Super Admin / Usuarios / Nuevo Usuario
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Crear Nuevo Usuario
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
            form="form-crear-usuario"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Crear Usuario</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form id="form-crear-usuario" onSubmit={onSubmit} className="space-y-5">
        <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50 text-foreground">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Información del Usuario</h2>
              <p className="text-xs text-muted-foreground">
                Asigna la organización correspondiente y los roles de acceso
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Empresa Asignada */}
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Empresa / Tenant Asignado *
              </label>
              <select
                required
                value={formData.empresa_id}
                onChange={(e) => onChange({ ...formData, empresa_id: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="">Selecciona una empresa...</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} — Plan {emp.plan.toUpperCase()} ({emp.codigo})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                El usuario solo podrá ver los datos de esta empresa debido a la separación por Row Level Security.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre Completo */}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Méndez"
                  value={formData.nombre_completo}
                  onChange={(e) => onChange({ ...formData, nombre_completo: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Correo Electrónico (Login) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="laura@empresa.com"
                  value={formData.correo}
                  onChange={(e) => onChange({ ...formData, correo: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>

              {/* Contraseña Inicial */}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Contraseña Inicial *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => onChange({ ...formData, password: e.target.value })}
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
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  ✓ Por defecto: <code>123456</code>
                </p>
              </div>

              {/* Rol Interno */}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Rol en el Negocio *
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => onChange({ ...formData, rol: e.target.value as RolDb })}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="admin">Administrador (Control total del negocio)</option>
                  <option value="cajero">Cajero (POS y apertura/cierre de caja)</option>
                  <option value="vendedor">Vendedor (Ventas y cotizaciones)</option>
                  <option value="almacen">Almacenista (Control de inventarios y stock)</option>
                  <option value="contable">Contador (Finanzas, cuentas y balances)</option>
                </select>
              </div>

              {/* Teléfono Opcional */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Teléfono / Móvil (Opcional)
                </label>
                <input
                  type="tel"
                  placeholder="809-555-0199"
                  value={formData.telefono}
                  onChange={(e) => onChange({ ...formData, telefono: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Checkbox Privilegio SuperAdmin Global */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 mt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.es_superadmin}
                  onChange={(e) => onChange({ ...formData, es_superadmin: e.target.checked })}
                  className="mt-0.5 rounded border-border text-amber-600 focus:ring-amber-500/20 w-4 h-4 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Crown size={13} className="text-amber-500" />
                    <span>Conceder Privilegios de Super Administrador Global</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Esta cuenta tendrá acceso irrestricto a este panel de control de Kob Cloud, pudiendo ver, crear y modificar todas las empresas, planes y usuarios del sistema.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary/60 text-foreground text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Volver a Usuarios</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Creando Usuario...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Crear Usuario</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
