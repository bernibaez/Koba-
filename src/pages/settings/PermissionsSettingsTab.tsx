import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Search,
  RotateCcw,
  Save,
  Check,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Info,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/types/roles';
import {
  PERMISSION_ACTIONS,
  PERMISSION_GROUPS,
  PERMISSION_MODULES,
  ROLE_META,
  type PermissionAction,
  type PermissionsMatrix,
} from '@/lib/permissionsCatalog';
import {
  countEnabled,
  countModuleEnabled,
  getPermissionsLoadError,
  getPermissionsMatrix,
  loadPermissionsMatrix,
  resetPermissionsMatrix,
  savePermissionsMatrix,
} from '@/lib/permissionsStore';
import { isSupabaseConfigured } from '@/services/clienteSupabase';
import { isMissingRolesTableError } from '@/services/roles.service';

const ROLES: UserRole[] = ['Administrador', 'Cajero', 'Vendedor', 'Almacenista', 'Contador'];

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
        disabled:opacity-40 disabled:cursor-not-allowed
        ${checked ? 'bg-primary' : 'bg-muted'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

export default function PermissionsSettingsTab() {
  const [matrix, setMatrix] = useState<PermissionsMatrix>(() => getPermissionsMatrix());
  const [selectedRole, setSelectedRole] = useState<UserRole>('Cajero');
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    // Limpia caché local antigua de permisos simulados
    try {
      localStorage.removeItem('marketerp_permissions_matrix');
      localStorage.removeItem('market_erp_local_roles');
    } catch {
      /* ignore */
    }
    loadPermissionsMatrix(true)
      .then((m) => {
        if (alive) setMatrix(m);
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'No se pudieron cargar permisos';
        if (alive) setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const isAdminLocked = selectedRole === 'Administrador';
  const roleMap = matrix[selectedRole];

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PERMISSION_MODULES;
    return PERMISSION_MODULES.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.group.toLowerCase().includes(q)
    );
  }, [search]);

  const enabledCount = countEnabled(roleMap);
  const totalPossible = PERMISSION_MODULES.reduce((s, m) => s + m.actions.length, 0);
  const modulesWithAccess = PERMISSION_MODULES.filter((m) => roleMap[m.id]?.ver).length;
  const coverage = Math.round((enabledCount / totalPossible) * 100);

  const setAction = useCallback(
    (moduleId: string, action: PermissionAction, value: boolean) => {
      if (isAdminLocked) return;
      setMatrix((prev) => ({
        ...prev,
        [selectedRole]: {
          ...prev[selectedRole],
          [moduleId]: {
            ...prev[selectedRole][moduleId],
            [action]: value,
          },
        },
      }));
      setDirty(true);
    },
    [isAdminLocked, selectedRole]
  );

  const toggleModuleAccess = (moduleId: string, actions: PermissionAction[], enable: boolean) => {
    if (isAdminLocked) return;
    setMatrix((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [moduleId]: Object.fromEntries(actions.map((a) => [a, enable])),
      },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePermissionsMatrix(matrix);
      setDirty(false);
      setSavedFlash(true);
      toast.success(
        isSupabaseConfigured()
          ? 'Permisos guardados en Supabase. El menú reflejará estos cambios.'
          : 'Accesos actualizados localmente.'
      );
      setTimeout(() => setSavedFlash(false), 1800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron guardar los permisos');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const defaults = await resetPermissionsMatrix();
      setMatrix(defaults);
      setDirty(false);
      toast.info(
        isSupabaseConfigured()
          ? 'Permisos restaurados y sincronizados con Supabase'
          : 'Permisos restaurados a valores por defecto'
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron restaurar los permisos');
    }
  };

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  if (loading) {
    return (
      <div className="card p-12 text-center text-sm text-muted-foreground">
        Cargando permisos desde Supabase…
      </div>
    );
  }

  const loadErr = loadError || getPermissionsLoadError();
  const isMissingRolesTable = loadErr ? isMissingRolesTableError(loadErr) : false;

  return (
    <div className="space-y-4">
      {(isMissingRolesTable || (loadErr && !isMissingRolesTable)) && (
        <div className="card border-amber-500/40 bg-amber-500/10 p-4 space-y-2 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <span>Sincronización remota pendiente — Tabla "roles" en Supabase</span>
          </div>
          <p>
            {loadErr}
          </p>
          <p className="font-medium">
            💡 <strong>Instrucciones:</strong> Abre tu panel de Supabase → <strong>SQL Editor</strong>, abre o pega el contenido del archivo <code className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">supabase/migrations/008_crear_tabla_roles.sql</code> y haz clic en <strong>Run</strong>.
          </p>
        </div>
      )}

      <div className="card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Permisos de acceso</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">
              Configura a qué módulos puede entrar cada rol. La acción <strong>Ver</strong> controla
              el menú y las rutas; el resto define qué puede hacer dentro del módulo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button type="button" onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
              <RotateCcw size={15} />
              Restaurar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving || isAdminLocked}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {savedFlash ? <Check size={15} /> : <Save size={15} />}
              {saving ? 'Guardando…' : savedFlash ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>

        {dirty && !isAdminLocked && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
            <Info size={15} className="mt-0.5 flex-shrink-0" />
            Cambios sin guardar en <strong className="mx-1">{selectedRole}</strong>.
          </div>
        )}

        {/* Role chips */}
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => {
            const meta = ROLE_META[role];
            const active = selectedRole === role;
            const accessCount = PERMISSION_MODULES.filter((m) => matrix[role][m.id]?.ver).length;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`
                  inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all
                  ${
                    active
                      ? `${meta.accent} bg-card shadow-sm ring-1 ring-primary/15`
                      : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }
                `}
              >
                {role === 'Administrador' ? <Lock size={13} /> : <Unlock size={13} />}
                {role}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${meta.color}`}>
                  {accessCount} áreas
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ROLE_META[selectedRole].color}`}
            >
              <Shield size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground">{selectedRole}</p>
              <p className="text-xs text-muted-foreground">
                Acceso a {modulesWithAccess} módulos · {coverage}% de acciones
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-field pl-9 text-sm"
              placeholder="Buscar módulo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${coverage}%` }}
          />
        </div>

        {isAdminLocked && (
          <div className="flex items-start gap-2 rounded-xl bg-secondary/70 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles size={14} className="mt-0.5 text-primary flex-shrink-0" />
            El Administrador siempre entra a todas las áreas; no se puede restringir.
          </div>
        )}

        <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_repeat(6,minmax(0,0.5fr))] gap-1 px-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <span>Área / pantalla</span>
          {PERMISSION_ACTIONS.map((a) => (
            <span key={a.id} className="text-center">
              {a.short}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {PERMISSION_GROUPS.map((group) => {
            const modules = filteredModules.filter((m) => m.group === group);
            if (modules.length === 0) return null;
            const collapsed = !!collapsedGroups[group];

            return (
              <div key={group} className="rounded-2xl border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }))
                  }
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <span className="text-sm font-bold text-foreground">{group}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {modules.length}
                    {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                  </span>
                </button>

                {!collapsed && (
                  <div className="divide-y divide-border bg-card">
                    {modules.map((mod) => {
                      const enabledInMod = countModuleEnabled(roleMap, mod.id);
                      const allOn = enabledInMod === mod.actions.length;
                      const canEnter = !!roleMap[mod.id]?.ver;

                      return (
                        <div key={mod.id} className="px-3 py-3 hover:bg-secondary/15 transition-colors">
                          <div className="md:grid md:grid-cols-[minmax(0,1.5fr)_repeat(6,minmax(0,0.5fr))] md:gap-1 md:items-center">
                            <div className="flex items-start justify-between gap-2 mb-2 md:mb-0">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm text-foreground">{mod.label}</p>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                      canEnter
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-secondary text-muted-foreground'
                                    }`}
                                  >
                                    {canEnter ? 'Puede entrar' : 'Sin acceso'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                              </div>
                              {!isAdminLocked && (
                                <button
                                  type="button"
                                  onClick={() => toggleModuleAccess(mod.id, mod.actions, !allOn)}
                                  className="text-[11px] font-bold text-primary hover:underline flex-shrink-0 md:hidden"
                                >
                                  {allOn ? 'Quitar' : 'Dar acceso'}
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 md:hidden">
                              {PERMISSION_ACTIONS.map((action) => {
                                if (!mod.actions.includes(action.id)) return null;
                                const on = !!roleMap[mod.id]?.[action.id];
                                return (
                                  <button
                                    key={action.id}
                                    type="button"
                                    disabled={isAdminLocked}
                                    onClick={() => setAction(mod.id, action.id, !on)}
                                    className={`
                                      px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all
                                      ${
                                        on
                                          ? 'bg-primary/15 border-primary/30 text-primary'
                                          : 'bg-card border-border text-muted-foreground'
                                      }
                                      disabled:opacity-50
                                    `}
                                  >
                                    {action.label}
                                  </button>
                                );
                              })}
                            </div>

                            {PERMISSION_ACTIONS.map((action) => {
                              if (!mod.actions.includes(action.id)) {
                                return (
                                  <div key={action.id} className="hidden md:flex justify-center">
                                    <span className="text-muted-foreground/25 text-xs">—</span>
                                  </div>
                                );
                              }
                              const on = !!roleMap[mod.id]?.[action.id];
                              return (
                                <div key={action.id} className="hidden md:flex justify-center">
                                  <Toggle
                                    checked={on}
                                    disabled={isAdminLocked}
                                    label={`${mod.label} · ${action.label}`}
                                    onChange={() => setAction(mod.id, action.id, !on)}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {!isAdminLocked && (
                            <div className="hidden md:flex justify-end mt-1">
                              <button
                                type="button"
                                onClick={() => toggleModuleAccess(mod.id, mod.actions, !allOn)}
                                className="text-[11px] font-bold text-primary hover:underline"
                              >
                                {allOn ? 'Quitar acceso al área' : 'Dar acceso completo'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredModules.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay módulos que coincidan con “{search}”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
