import React from 'react';
import {
  Search,
  Building2,
  Gauge,
  UserPlus,
  Trash2,
  Plus,
  Receipt,
  Users,
  Store,
  ExternalLink,
} from 'lucide-react';
import type { Empresa, PlanEmpresa } from '@/types/database';
import type { ConsumosEmpresasMap } from './types';
import { obtenerLimitesEfectivosEmpresa } from '@/services/subscriptionModules.service';

interface TenantListViewProps {
  empresas: Empresa[];
  consumos: ConsumosEmpresasMap;
  search: string;
  onSearchChange: (val: string) => void;
  filterPlan: string;
  onFilterPlanChange: (val: string) => void;
  filterEstado: string;
  onFilterEstadoChange: (val: string) => void;
  onChangePlan: (empresaId: string, plan: PlanEmpresa) => void;
  onToggleEstado: (empresa: Empresa) => void;
  onDeleteEmpresa: (empresa: Empresa) => void;
  onConfigureQuotas: (empresa: Empresa) => void;
  onCreateUserForEmpresa: (empresa: Empresa) => void;
  onCreateTenant: () => void;
  onFilterUsersByEmpresa: (empresaId: string) => void;
}

export default function TenantListView({
  empresas,
  consumos,
  search,
  onSearchChange,
  filterPlan,
  onFilterPlanChange,
  filterEstado,
  onFilterEstadoChange,
  onChangePlan,
  onToggleEstado,
  onDeleteEmpresa,
  onConfigureQuotas,
  onCreateUserForEmpresa,
  onCreateTenant,
  onFilterUsersByEmpresa,
}: TenantListViewProps) {
  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, RNC o slug..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-card border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterPlan}
            onChange={(e) => onFilterPlanChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-card border border-border/80 rounded-xl focus:outline-none text-foreground cursor-pointer"
          >
            <option value="todos">Todos los planes</option>
            <option value="free">Plan Free</option>
            <option value="starter">Plan Starter</option>
            <option value="pro">Plan Pro</option>
            <option value="enterprise">Plan Enterprise</option>
          </select>

          <select
            value={filterEstado}
            onChange={(e) => onFilterEstadoChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-card border border-border/80 rounded-xl focus:outline-none text-foreground cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="trial">Trial</option>
            <option value="suspendido">Suspendidos</option>
          </select>

          <button
            type="button"
            onClick={onCreateTenant}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-2xs transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Negocio</span>
          </button>
        </div>
      </div>

      {/* Main Table: Clean & Minimalist */}
      <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/30 border-b border-border/60 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Organización</th>
                <th className="px-4 py-3.5">Plan Contratado</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5">Consumo & Cuotas</th>
                <th className="px-4 py-3.5">Contacto</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {empresas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                        <Building2 size={20} />
                      </div>
                      <p className="font-semibold text-foreground text-sm">No se encontraron empresas</p>
                      <p className="text-xs text-muted-foreground">
                        {search || filterPlan !== 'todos' || filterEstado !== 'todos'
                          ? 'Prueba modificando los filtros de búsqueda.'
                          : 'Aún no hay empresas registradas en Kob Cloud.'}
                      </p>
                      <button
                        type="button"
                        onClick={onCreateTenant}
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition cursor-pointer"
                      >
                        <Plus size={14} />
                        Registrar Primera Empresa
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                empresas.map((emp) => {
                  const consumo = consumos[emp.id];
                  const efectivos = obtenerLimitesEfectivosEmpresa(emp);
                  const isActivo = emp.estado === 'activo';
                  const isTrial = emp.estado === 'trial';

                  return (
                    <tr key={emp.id} className="hover:bg-secondary/20 transition-colors">
                      {/* 1. Nombre / RNC / Slug */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          {emp.nombre}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          <span className="font-mono bg-secondary/60 px-1.5 py-0.2 rounded text-[10px]">
                            {emp.codigo}
                          </span>
                          {emp.rnc ? (
                            <span>RNC: {emp.rnc}</span>
                          ) : (
                            <span className="italic opacity-60">Sin RNC</span>
                          )}
                        </div>
                      </td>

                      {/* 2. Plan */}
                      <td className="px-4 py-3.5">
                        <select
                          value={emp.plan}
                          onChange={(e) => onChangePlan(emp.id, e.target.value as PlanEmpresa)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border uppercase cursor-pointer transition ${
                            emp.plan === 'enterprise'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                              : emp.plan === 'pro'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : emp.plan === 'starter'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              : 'bg-secondary text-muted-foreground border-border'
                          }`}
                        >
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>

                      {/* 3. Estado */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                            isActivo
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : isTrial
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActivo
                                ? 'bg-emerald-500'
                                : isTrial
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {emp.estado}
                        </span>
                      </td>

                      {/* 4. Consumo y Cuotas (Minimalist Quota Indicators) */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1 min-w-[190px]">
                          {/* Facturas */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Receipt size={11} className="text-emerald-500" />
                              Facturas:
                            </span>
                            <span className="font-semibold tabular-nums text-foreground">
                              {consumo?.facturasMes.actual ?? 0} /{' '}
                              {efectivos.limite_facturas_mes === -1
                                ? '∞'
                                : efectivos.limite_facturas_mes}
                            </span>
                          </div>

                          {/* Mini Progress Bar for Invoices if limited */}
                          {efectivos.limite_facturas_mes !== -1 && (
                            <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  (consumo?.facturasMes.porcentaje ?? 0) >= 90
                                    ? 'bg-rose-500'
                                    : (consumo?.facturasMes.porcentaje ?? 0) >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, consumo?.facturasMes.porcentaje ?? 0)}%`,
                                }}
                              />
                            </div>
                          )}

                          {/* Sub metrics: Usuarios & Cajas */}
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                            <button
                              type="button"
                              onClick={() => onFilterUsersByEmpresa(emp.id)}
                              className="hover:text-primary transition flex items-center gap-1 cursor-pointer"
                              title="Ver usuarios de esta empresa"
                            >
                              <Users size={10} className="text-blue-500" />
                              <span>{consumo?.usuarios.actual ?? emp.total_usuarios ?? 1} usuarios</span>
                            </button>
                            <span className="flex items-center gap-1">
                              <Store size={10} className="text-amber-500" />
                              <span>{consumo?.cajas.actual ?? 1} cajas</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Contacto & Sucursales */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <div className="text-foreground truncate max-w-[160px]">
                          {emp.correo || '—'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {emp.telefono || 'Sin teléfono'} • {emp.total_sucursales ?? 1} suc.
                        </div>
                      </td>

                      {/* 6. Acciones */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Configurar Cuotas: REEMPLAZA LA PÁGINA */}
                          <button
                            type="button"
                            onClick={() => onConfigureQuotas(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground transition cursor-pointer"
                            title="Editar cuotas y límites de este negocio"
                          >
                            <Gauge size={12} className="text-primary" />
                            <span>Cuotas</span>
                          </button>

                          {/* Crear Usuario: REEMPLAZA LA PÁGINA */}
                          <button
                            type="button"
                            onClick={() => onCreateUserForEmpresa(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition cursor-pointer"
                            title="Dar de alta usuario para este negocio"
                          >
                            <UserPlus size={12} />
                            <span>+ Usuario</span>
                          </button>

                          {/* Suspender / Activar */}
                          <button
                            type="button"
                            onClick={() => onToggleEstado(emp)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              isActivo
                                ? 'text-amber-600 hover:bg-amber-500/10'
                                : 'text-emerald-600 hover:bg-emerald-500/10'
                            }`}
                            title={isActivo ? 'Suspender acceso a la empresa' : 'Activar empresa'}
                          >
                            {isActivo ? 'Suspender' : 'Activar'}
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => onDeleteEmpresa(emp)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Eliminar permanentemente esta empresa"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
