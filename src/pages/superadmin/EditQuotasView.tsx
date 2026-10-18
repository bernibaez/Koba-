import React from 'react';
import {
  ArrowLeft,
  Gauge,
  Receipt,
  Users,
  Store,
  Building2,
  Check,
  RefreshCw,
  Crown,
} from 'lucide-react';
import type { Empresa } from '@/types/database';
import type { FormLimitesEmpresaState, ConsumoEmpresaData } from './types';

interface EditQuotasViewProps {
  empresa: Empresa;
  consumo?: ConsumoEmpresaData;
  formData: FormLimitesEmpresaState;
  onChange: (data: FormLimitesEmpresaState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function EditQuotasView({
  empresa,
  consumo,
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting,
}: EditQuotasViewProps) {
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
            <span>Volver a Empresas</span>
          </button>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <span>Super Admin / Empresas / Cuotas</span>
              <span>•</span>
              <span className="font-bold text-primary uppercase">Plan {empresa.plan}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Cuotas y Límites: {empresa.nombre}
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
            form="form-cuotas-empresa"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Guardar Cuotas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form id="form-cuotas-empresa" onSubmit={onSubmit} className="space-y-5">
        <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50 text-foreground">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Gauge size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Ajuste de Capacidad Operativa</h2>
              <p className="text-xs text-muted-foreground">
                Define el volumen mensual y recursos máximos autorizados para esta organización
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Facturas al Mes */}
            <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Facturas y Ventas al Mes</h3>
                    <p className="text-[10px] text-muted-foreground">Tope mensual de comprobantes emitidos</p>
                  </div>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-primary select-none">
                  <input
                    type="checkbox"
                    checked={formData.facturasIlimitadas}
                    onChange={(e) =>
                      onChange({ ...formData, facturasIlimitadas: e.target.checked })
                    }
                    className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                  />
                  <span>Ilimitado</span>
                </label>
              </div>

              {formData.facturasIlimitadas ? (
                <div className="px-3.5 py-2 text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-center">
                  ∞ Facturación y Ventas Ilimitadas
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={formData.limite_facturas_mes}
                    onChange={(e) =>
                      onChange({ ...formData, limite_facturas_mes: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    facturas / mes
                  </span>
                </div>
              )}

              <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                <span>Consumo del mes en curso:</span>
                <span className="font-semibold text-foreground">
                  {consumo?.facturasMes.actual ?? 0} transacciones registradas
                </span>
              </div>
            </div>

            {/* Usuarios y Cajas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Usuarios */}
              <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                      <Users size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Límite de Usuarios</h3>
                      <p className="text-[10px] text-muted-foreground">Total de cuentas activas</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-primary select-none">
                    <input
                      type="checkbox"
                      checked={formData.usuariosIlimitados}
                      onChange={(e) =>
                        onChange({ ...formData, usuariosIlimitados: e.target.checked })
                      }
                      className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                    />
                    <span>Ilimitado</span>
                  </label>
                </div>

                {formData.usuariosIlimitados ? (
                  <div className="px-3.5 py-2 text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-xl text-center">
                    ∞ Cuentas Ilimitadas
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      required
                      value={formData.limite_usuarios}
                      onChange={(e) =>
                        onChange({ ...formData, limite_usuarios: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      usuarios
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                  <span>Cuentas actuales:</span>
                  <span className="font-semibold text-foreground">
                    {consumo?.usuarios.actual ?? empresa.total_usuarios ?? 1} creados
                  </span>
                </div>
              </div>

              {/* Cajas */}
              <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                      <Store size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Cajas Registradoras</h3>
                      <p className="text-[10px] text-muted-foreground">Puntos de venta simultáneos</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-primary select-none">
                    <input
                      type="checkbox"
                      checked={formData.cajasIlimitadas}
                      onChange={(e) =>
                        onChange({ ...formData, cajasIlimitadas: e.target.checked })
                      }
                      className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                    />
                    <span>Ilimitado</span>
                  </label>
                </div>

                {formData.cajasIlimitadas ? (
                  <div className="px-3.5 py-2 text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-center">
                    ∞ Cajas Ilimitadas
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={formData.limite_cajas}
                      onChange={(e) =>
                        onChange({ ...formData, limite_cajas: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      terminales
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                  <span>Cajas actuales:</span>
                  <span className="font-semibold text-foreground">
                    {consumo?.cajas.actual ?? 1} registradas
                  </span>
                </div>
              </div>
            </div>

            {/* Sucursales */}
            <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                  <Building2 size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Sucursales y Almacenes</h3>
                  <p className="text-[10px] text-muted-foreground">Locales físicos autorizados</p>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={formData.limite_sucursales}
                  onChange={(e) =>
                    onChange({ ...formData, limite_sucursales: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  sucursales
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                <span>Sucursales activas:</span>
                <span className="font-semibold text-foreground">
                  {empresa.total_sucursales ?? 1} locales registrados
                </span>
              </div>
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
            <span>Volver a Empresas</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Guardando Cuotas...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Guardar Cuotas del Negocio</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
