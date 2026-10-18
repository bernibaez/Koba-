import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import {
  Users,
  UserCheck,
  Shield,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Download,
  Eye,
  Sliders,
  AlertTriangle,
  X,
  CheckCircle,
  Lightbulb,
  Lock,
  Mail,
  Phone,
  Percent,
} from 'lucide-react';
import { exportTableToPdf } from '@/lib/exportPdf';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useAgentes } from '@/hooks/useAgentes';
import { useRoles } from '@/hooks/useRoles';
import { ROL_DB_A_UI, ROL_UI_A_DB } from '@/services/auth.service';
import type { AgenteComercial, Perfil, Rol, RolDb } from '@/types/database';
import type { UserRole } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { isSupabaseConfigured } from '@/services/clienteSupabase';
import { isMissingRolesTableError } from '@/services/roles.service';
import { InlineLoader, TableRowSkeleton } from '@/components/ui/LoadingSkeleton';
import ModalShell from '@/components/ui/ModalShell';
import MetricStat from '@/components/ui/MetricStat';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { verificarLimiteUsuarios } from '@/services/subscriptionModules.service';

type Tab = 'users' | 'roles' | 'agents';

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Perfil | null>(null);
  const [viewingUser, setViewingUser] = useState<Perfil | null>(null);
  const [viewingAgent, setViewingAgent] = useState<AgenteComercial | null>(null);
  const [editingAgent, setEditingAgent] = useState<AgenteComercial | null>(null);
  const [editingRole, setEditingRole] = useState<Rol | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formComision, setFormComision] = useState('5');
  const [formRol, setFormRol] = useState<UserRole>('Cajero');
  const [formDescRol, setFormDescRol] = useState('');
  const [formCodigoRol, setFormCodigoRol] = useState('');
  const [saving, setSaving] = useState(false);
  const [limiteUsuariosInfo, setLimiteUsuariosInfo] = useState<{ actual: number; limite: number } | null>(null);

  const { usuarios, loading, crear, actualizar, alternarActivo, eliminar } = useUsuarios(search);

  useEffect(() => {
    verificarLimiteUsuarios()
      .then((res) => setLimiteUsuariosInfo({ actual: res.actual, limite: res.limite }))
      .catch(() => {});
  }, [usuarios.length]);

  const {
    agentes,
    loading: loadingAgentes,
    crear: crearAgente,
    actualizar: actualizarAgente,
    alternarActivo: alternarActivoAgente,
    eliminar: eliminarAgente,
  } = useAgentes(search);

  const {
    roles,
    loading: loadingRoles,
    error: rolesError,
    crear: crearRol,
    actualizar: actualizarRol,
    eliminar: eliminarRol,
  } = useRoles(search);

  const countPermissions = (permisos: Record<string, Record<string, boolean>> | null | undefined): number => {
    if (!permisos) return 0;
    let count = 0;
    for (const mod in permisos) {
      const actions = permisos[mod];
      for (const act in actions) {
        if (actions[act]) count++;
      }
    }
    return count;
  };

  const resetForm = () => {
    setFormNombre('');
    setFormCorreo('');
    setFormTelefono('');
    setFormPassword('');
    setFormComision('5');
    setFormDescRol('');
    setFormCodigoRol('');
    setFormRol('Cajero');
    setEditingUser(null);
    setEditingAgent(null);
    setEditingRole(null);
  };

  const openNewModal = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditUser = (user: Perfil) => {
    setEditingUser(user);
    setFormNombre(user.nombre_completo);
    setFormCorreo(user.correo);
    setFormTelefono(user.telefono ?? '');
    setFormPassword('');
    setFormRol((ROL_DB_A_UI[user.rol] as UserRole) || 'Cajero');
    setShowForm(true);
  };

  const openEditAgent = (agent: AgenteComercial) => {
    setEditingAgent(agent);
    setFormNombre(agent.nombre);
    setFormCorreo(agent.correo ?? '');
    setFormTelefono(agent.telefono ?? '');
    setFormComision(String(agent.porcentaje_comision ?? 0));
    setShowForm(true);
  };

  const openEditRole = (role: Rol) => {
    setEditingRole(role);
    setFormNombre(role.nombre);
    setFormDescRol(role.descripcion ?? '');
    setFormCodigoRol(role.codigo);
    setShowForm(true);
  };

  const handleSaveRole = async () => {
    if (!formNombre.trim()) {
      toast.error('Ingresa el nombre del rol');
      return;
    }
    setSaving(true);
    try {
      if (editingRole) {
        await actualizarRol(editingRole.id, {
          nombre: formNombre.trim(),
          descripcion: formDescRol.trim() || null,
        });
        toast.success(`Rol "${formNombre.trim()}" actualizado correctamente`);
      } else {
        const codigo = formCodigoRol.trim()
          ? formCodigoRol.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
          : formNombre.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        await crearRol({
          codigo,
          nombre: formNombre.trim(),
          descripcion: formDescRol.trim() || null,
          permisos: {},
        });
        toast.success(`Rol "${formNombre.trim()}" creado exitosamente`);
      }
      setShowForm(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: Rol) => {
    if (role.codigo === 'admin') {
      toast.error('No se puede eliminar el rol Administrador');
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar el rol "${role.nombre}"?`)) return;
    try {
      await eliminarRol(role.id);
      toast.success(`Rol "${role.nombre}" eliminado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar el rol');
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'users', label: `Usuarios (${usuarios.length})` },
    { id: 'roles', label: `Roles (${roles.length})` },
    { id: 'agents', label: `Agentes (${agentes.length})` },
  ];

  const handleExportPdf = () => {
    if (tab === 'users') {
      exportTableToPdf({
        title: 'Usuarios del Sistema',
        filename: 'usuarios',
        headers: ['Nombre', 'Email', 'Teléfono', 'Rol', 'Estado'],
        rows: usuarios.map((u) => [
          u.nombre_completo,
          u.correo,
          u.telefono ?? '',
          ROL_DB_A_UI[u.rol] ?? u.rol,
          u.activo ? 'Activo' : 'Inactivo',
        ]),
      });
      return;
    }
    if (tab === 'roles') {
      exportTableToPdf({
        title: 'Roles y Permisos',
        filename: 'roles',
        headers: ['Rol', 'Código', 'Permisos', 'Usuarios', 'Descripción'],
        rows: roles.map((r) => [
          r.nombre,
          r.codigo,
          countPermissions(r.permisos),
          usuarios.filter((u) => u.rol === r.codigo).length,
          r.descripcion ?? '',
        ]),
      });
      return;
    }
    exportTableToPdf({
      title: 'Agentes Comerciales',
      filename: 'agentes',
      headers: ['Nombre', 'Email', 'Teléfono', 'Comisión %', 'Estado'],
      rows: agentes.map((a) => [
        a.nombre,
        a.correo ?? '',
        a.telefono ?? '',
        `${Number(a.porcentaje_comision).toFixed(2)}%`,
        a.activo ? 'Activo' : 'Inactivo',
      ]),
    });
  };

  const handleCreateUser = async () => {
    if (!formNombre.trim()) {
      toast.error('Ingresa el nombre completo');
      return;
    }
    if (editingUser) {
      setSaving(true);
      try {
        await actualizar(editingUser.id, {
          nombre_completo: formNombre.trim(),
          telefono: formTelefono.trim() || null,
          rol: ROL_UI_A_DB[formRol] as RolDb,
        });
        toast.success('Usuario actualizado');
        setShowForm(false);
        resetForm();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al actualizar usuario');
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!formCorreo.trim() || !formPassword) {
      toast.error('Completa nombre, correo y contraseña');
      return;
    }
    setSaving(true);
    try {
      await crear({
        correo: formCorreo.trim(),
        password: formPassword,
        nombre_completo: formNombre.trim(),
        rol: ROL_UI_A_DB[formRol] as RolDb,
        telefono: formTelefono.trim() || null,
      });
      toast.success('Usuario creado');
      setShowForm(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: Perfil) => {
    if (!confirm(`¿Desactivar / eliminar al usuario "${user.nombre_completo}"?`)) return;
    try {
      await eliminar(user.id);
      toast.success(`Usuario "${user.nombre_completo}" eliminado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar el usuario');
    }
  };

  const handleSaveAgent = async () => {
    if (!formNombre.trim()) {
      toast.error('Escribe el nombre del agente');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: formNombre.trim(),
        correo: formCorreo.trim() || null,
        telefono: formTelefono.trim() || null,
        porcentaje_comision: Number(formComision) || 0,
      };
      if (editingAgent) {
        await actualizarAgente(editingAgent.id, payload);
        toast.success('Agente actualizado en Supabase');
      } else {
        await crearAgente(payload);
        toast.success('Agente creado en Supabase');
      }
      setShowForm(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar agente');
    } finally {
      setSaving(false);
    }
  };

  const activeUsersCount = usuarios.filter((u) => u.activo).length;

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {!(viewingUser || viewingAgent) && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface2)] text-[var(--ink2)] border border-[var(--border)]">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    Seguridad & Control de Accesos
                  </span>
                  {limiteUsuariosInfo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Cuota: {usuarios.length} /{' '}
                      {limiteUsuariosInfo.limite === -1 ? '∞ Ilimitado' : `${limiteUsuariosInfo.limite}`}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                  Usuarios, Roles & Agentes
                </h1>
                <p className="text-xs text-[var(--ink2)] mt-0.5">
                  Gestiona credenciales de acceso, niveles jerárquicos y comisiones de vendedores.
                  {!isSupabaseConfigured() && ' (modo local)'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--ink2)]" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (showForm) {
                      setShowForm(false);
                      resetForm();
                    } else {
                      openNewModal();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>
                    {showForm
                      ? 'Cerrar Formulario'
                      : `Nuevo ${tab === 'users' ? 'Usuario' : tab === 'roles' ? 'Rol' : 'Agente'}`}
                  </span>
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
              <MetricStat
                label="Total Usuarios"
                value={String(usuarios.length)}
                secondaryText={`${activeUsersCount} activos en la plataforma`}
              />
              <MetricStat
                label="Usuarios Activos"
                value={String(activeUsersCount)}
                secondaryText={`${usuarios.length > 0 ? Math.round((activeUsersCount / usuarios.length) * 100) : 0}% de operatividad`}
                valueColor="text-emerald-600 dark:text-emerald-400"
              />
              <MetricStat
                label="Roles Configurados"
                value={String(roles.length)}
                secondaryText="Perfiles de permisos"
              />
              <MetricStat
                label="Agentes Comerciales"
                value={String(agentes.length)}
                secondaryText={`${agentes.filter((a) => a.activo).length} habilitados para ventas`}
                valueColor="text-indigo-600 dark:text-indigo-400"
              />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
              <div className="overflow-x-auto pb-1 sm:pb-0">
                <SegmentedControl
                  options={tabs}
                  value={tab}
                  onChange={setTab}
                  ariaLabel="Secciones de usuarios"
                />
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink3)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo, teléfono..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink3)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Inline Form */}
            {showForm && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[var(--primary)]" />
                    <h2 className="text-sm font-bold text-[var(--ink)]">
                      {tab === 'users'
                        ? editingUser
                          ? 'Editar Usuario'
                          : 'Nuevo Usuario'
                        : tab === 'roles'
                          ? editingRole
                            ? 'Editar Rol'
                            : 'Nuevo Rol'
                          : editingAgent
                            ? 'Editar Agente'
                            : 'Nuevo Agente'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      {tab === 'roles' ? 'Nombre del Rol' : 'Nombre Completo'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      placeholder={tab === 'roles' ? 'Ej: Cajero Nocturno' : 'Ej: Juan Pérez'}
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                    />
                  </div>

                  {tab !== 'roles' && (
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                        Correo Electrónico <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-60"
                        placeholder="correo@ejemplo.com"
                        type="email"
                        value={formCorreo}
                        onChange={(e) => setFormCorreo(e.target.value)}
                        disabled={tab === 'users' && !!editingUser}
                      />
                    </div>
                  )}

                  {tab !== 'roles' && (
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        placeholder="(809) 000-0000"
                        value={formTelefono}
                        onChange={(e) => setFormTelefono(e.target.value)}
                      />
                    </div>
                  )}

                  {tab === 'agents' && (
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                        Porcentaje de Comisión (%)
                      </label>
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={formComision}
                        onChange={(e) => setFormComision(e.target.value)}
                      />
                    </div>
                  )}

                  {tab === 'users' && (
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                        Rol Asignado
                      </label>
                      <select
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                        value={formRol}
                        onChange={(e) => setFormRol(e.target.value as UserRole)}
                      >
                        {roles.length > 0
                          ? roles.map((r) => (
                              <option
                                key={r.id}
                                value={(ROL_DB_A_UI[r.codigo as RolDb] || r.nombre) as UserRole}
                              >
                                {r.nombre} ({r.codigo})
                              </option>
                            ))
                          : (
                              ['Administrador', 'Cajero', 'Vendedor', 'Almacenista', 'Contador'] as UserRole[]
                            ).map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                      </select>
                    </div>
                  )}

                  {tab === 'users' && !editingUser && (
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                        Contraseña de Acceso <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        placeholder="••••••••"
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                      />
                    </div>
                  )}

                  {tab === 'roles' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                          Código Identificador
                        </label>
                        <input
                          className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono text-xs disabled:opacity-60"
                          placeholder="ej: cajero_nocturno (opcional)"
                          disabled={!!editingRole}
                          value={formCodigoRol}
                          onChange={(e) => setFormCodigoRol(e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                          Descripción del Rol
                        </label>
                        <textarea
                          className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                          placeholder="Descripción de funciones y nivel de acceso..."
                          rows={2}
                          value={formDescRol}
                          onChange={(e) => setFormDescRol(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                    disabled={saving}
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs"
                    disabled={saving}
                    onClick={() => {
                      if (tab === 'users') void handleCreateUser();
                      else if (tab === 'agents') void handleSaveAgent();
                      else if (tab === 'roles') void handleSaveRole();
                    }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{saving ? 'Guardando…' : 'Guardar Información'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            {tab === 'users' && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface2)]/50 text-[var(--ink2)] font-medium">
                        <th className="py-2.5 px-3.5">Usuario</th>
                        <th className="py-2.5 px-3 hidden md:table-cell">Rol</th>
                        <th className="py-2.5 px-3 hidden lg:table-cell">Teléfono</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                        <th className="py-2.5 px-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                      {loading && (
                        <>
                          <InlineLoader colSpan={5} message="Cargando usuarios…" />
                          <TableRowSkeleton cols={5} />
                          <TableRowSkeleton cols={5} />
                        </>
                      )}
                      {!loading &&
                        usuarios.map((user) => (
                          <tr key={user.id} className="hover:bg-[var(--surface2)]/40 transition-colors">
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                                  {user.nombre_completo.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-xs text-[var(--ink)] truncate max-w-[200px]">
                                    {user.nombre_completo}
                                  </p>
                                  <p className="text-[11px] text-[var(--ink3)] truncate max-w-[200px]">
                                    {user.correo}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 hidden md:table-cell">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {ROL_DB_A_UI[user.rol] ?? user.rol}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 hidden lg:table-cell text-[11px] text-[var(--ink2)]">
                              {user.telefono ?? '—'}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                  user.activo
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                }`}
                              >
                                {user.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setViewingUser(user)}
                                  className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                                  title="Ver usuario"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditUser(user)}
                                  className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                                  title="Editar usuario"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteUser(user)}
                                  className="p-1 rounded-md text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await alternarActivo(user.id, !user.activo);
                                      toast.success(
                                        user.activo ? 'Usuario desactivado' : 'Usuario activado'
                                      );
                                    } catch (e) {
                                      toast.error(e instanceof Error ? e.message : 'Error');
                                    }
                                  }}
                                  className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                                  title={user.activo ? 'Desactivar acceso' : 'Habilitar acceso'}
                                >
                                  {user.activo ? (
                                    <ToggleRight className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <ToggleLeft className="w-4 h-4 text-[var(--ink3)]" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="py-2.5 px-3.5 border-t border-[var(--border)] bg-[var(--surface2)]/30 flex items-center justify-between text-[11px] text-[var(--ink2)]">
                  <span>Mostrando {usuarios.length} usuario{usuarios.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            )}

            {/* Roles Table */}
            {tab === 'roles' && (
              <div className="space-y-4">
                {rolesError && isMissingRolesTableError(rolesError) && (
                  <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-200 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-100">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Sincronización remota pendiente — Tabla "roles" en Supabase</span>
                    </div>
                    <p>{rolesError}</p>
                    <p className="font-medium flex items-center gap-1.5 pt-1">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        Abre tu panel de Supabase → <strong>SQL Editor</strong>, pega el contenido de{' '}
                        <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">
                          supabase/migrations/008_crear_tabla_roles.sql
                        </code>{' '}
                        y pulsa <strong>Run</strong>.
                      </span>
                    </p>
                  </div>
                )}

                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-[var(--ink)]">
                        Matriz de Permisos & Seguridad
                      </p>
                      <p className="text-[11px] text-[var(--ink2)]">
                        Configura los módulos autorizados y acciones por rol.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/settings?section=permissions"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configurar Permisos de Accesos</span>
                  </Link>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--surface2)]/50 text-[var(--ink2)] font-medium">
                          <th className="py-2.5 px-3.5">Rol</th>
                          <th className="py-2.5 px-3">Descripción</th>
                          <th className="py-2.5 px-3 text-center hidden md:table-cell">Permisos Activos</th>
                          <th className="py-2.5 px-3 text-center hidden md:table-cell">Usuarios con Rol</th>
                          <th className="py-2.5 px-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                        {loadingRoles && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-xs text-[var(--ink3)]">
                              Cargando roles…
                            </td>
                          </tr>
                        )}
                        {!loadingRoles && roles.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-xs text-[var(--ink3)]">
                              No hay roles en Supabase. Crea el primero con "Nuevo Rol".
                            </td>
                          </tr>
                        )}
                        {!loadingRoles &&
                          roles.map((role) => {
                            const userCount = usuarios.filter((u) => u.rol === role.codigo).length;
                            const permissionsCount = countPermissions(role.permisos);

                            return (
                              <tr key={role.id} className="hover:bg-[var(--surface2)]/40 transition-colors">
                                <td className="py-2.5 px-3.5">
                                  <p className="font-semibold text-xs text-[var(--ink)]">{role.nombre}</p>
                                  <span className="font-mono text-[10px] text-[var(--ink3)]">{role.codigo}</span>
                                </td>
                                <td className="py-2.5 px-3 text-[11px] text-[var(--ink2)] max-w-xs truncate">
                                  {role.descripcion || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-center hidden md:table-cell">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    {permissionsCount} acciones
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center hidden md:table-cell text-[11px] text-[var(--ink2)]">
                                  {userCount} usuarios
                                </td>
                                <td className="py-2.5 px-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openEditRole(role)}
                                      className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                                      title="Editar rol"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={role.codigo === 'admin'}
                                      onClick={() => void handleDeleteRole(role)}
                                      className="p-1 rounded-md text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-30"
                                      title="Eliminar rol"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Agents Table */}
            {tab === 'agents' && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface2)]/50 text-[var(--ink2)] font-medium">
                        <th className="py-2.5 px-3.5">Agente Comercial</th>
                        <th className="py-2.5 px-3 hidden md:table-cell">Teléfono</th>
                        <th className="py-2.5 px-3 text-center hidden lg:table-cell">Comisión</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                        <th className="py-2.5 px-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                      {loadingAgentes && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-[var(--ink3)]">
                            Cargando agentes…
                          </td>
                        </tr>
                      )}
                      {!loadingAgentes && agentes.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-[var(--ink3)]">
                            No hay agentes registrados. Pulsa "Nuevo Agente" para añadir uno.
                          </td>
                        </tr>
                      )}
                      {!loadingAgentes &&
                        agentes.map((agent) => (
                          <tr key={agent.id} className="hover:bg-[var(--surface2)]/40 transition-colors">
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                  {agent.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-xs text-[var(--ink)] truncate max-w-[200px]">
                                    {agent.nombre}
                                  </p>
                                  <p className="text-[11px] text-[var(--ink3)] truncate max-w-[200px]">
                                    {agent.correo || 'Sin correo registrado'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 hidden md:table-cell text-[11px] text-[var(--ink2)]">
                              {agent.telefono || '—'}
                            </td>

                            <td className="py-2.5 px-3 text-center hidden lg:table-cell font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {Number(agent.porcentaje_comision).toFixed(2)}%
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  void alternarActivoAgente(agent.id, !agent.activo).then(() =>
                                    toast.success(agent.activo ? 'Agente desactivado' : 'Agente activado')
                                  )
                                }
                                className="inline-flex items-center gap-1.5 cursor-pointer"
                                title={agent.activo ? 'Desactivar agente' : 'Habilitar agente'}
                              >
                                {agent.activo ? (
                                  <ToggleRight className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-[var(--ink3)]" />
                                )}
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                    agent.activo
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                      : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                  }`}
                                >
                                  {agent.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </button>
                            </td>

                            <td className="py-2.5 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setViewingAgent(agent)}
                                  className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                                  title="Ver agente"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditAgent(agent)}
                                  className="p-1 rounded-md text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                                  title="Editar agente"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!confirm(`¿Eliminar agente "${agent.nombre}"?`)) return;
                                    void eliminarAgente(agent.id)
                                      .then(() => toast.success('Agente eliminado'))
                                      .catch((e) =>
                                        toast.error(e instanceof Error ? e.message : 'No se pudo eliminar')
                                      );
                                  }}
                                  className="p-1 rounded-md text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Eliminar agente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="py-2.5 px-3.5 border-t border-[var(--border)] bg-[var(--surface2)]/30 flex items-center justify-between text-[11px] text-[var(--ink2)]">
                  <span>Mostrando {agentes.length} agente{agentes.length === 1 ? '' : 's'} comerciales</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      <ModalShell open={!!viewingUser} onClose={() => setViewingUser(null)} size="md" className="p-5">
        {viewingUser && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Ficha Informativa de Usuario
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-base">
                  {viewingUser.nombre_completo.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-[var(--ink)]">{viewingUser.nombre_completo}</p>
                  <p className="text-[11px] text-[var(--ink2)]">{viewingUser.correo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[var(--surface2)]/50 rounded-xl p-3 border border-[var(--border)]">
                <div>
                  <span className="text-[10px] text-[var(--ink3)] block">Teléfono</span>
                  <span className="font-medium text-[var(--ink)]">{viewingUser.telefono || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink3)] block">Rol</span>
                  <span className="font-medium text-[var(--ink)]">
                    {ROL_DB_A_UI[viewingUser.rol] ?? viewingUser.rol}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink3)] block">Estado</span>
                  <span
                    className={`font-semibold ${
                      viewingUser.activo ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {viewingUser.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink3)] block">Código Acceso PIN</span>
                  <span className="font-mono text-[var(--ink)]">{viewingUser.codigo_acceso || '—'}</span>
                </div>
                {viewingUser.creado_en && (
                  <div className="col-span-2 pt-1 border-t border-[var(--border)]">
                    <span className="text-[10px] text-[var(--ink3)] block">Fecha de Registro</span>
                    <span className="text-[var(--ink2)]">
                      {new Date(viewingUser.creado_en).toLocaleString('es-DO')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => setViewingUser(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </ModalShell>

      {/* Agent Details Modal */}
      <ModalShell open={!!viewingAgent} onClose={() => setViewingAgent(null)} size="md" className="p-5">
        {viewingAgent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                Ficha de Agente Comercial
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-sm text-[var(--ink)]">{viewingAgent.nombre}</p>
              <div className="grid grid-cols-2 gap-3 bg-[var(--surface2)]/50 rounded-xl p-3 border border-[var(--border)]">
                <div>
                  <span className="text-[10px] text-[var(--ink3)] block">Correo</span>
                  <span className="font-medium text-[var(--ink)]">{viewingAgent.correo || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink3)] block">Teléfono</span>
                  <span className="font-medium text-[var(--ink)]">{viewingAgent.telefono || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink3)] block">Comisión</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {viewingAgent.porcentaje_comision ?? 0}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink3)] block">Estado</span>
                  <span
                    className={`font-semibold ${
                      viewingAgent.activo ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {viewingAgent.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                onClick={() => setViewingAgent(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => {
                  setViewingAgent(null);
                  openEditAgent(viewingAgent);
                }}
              >
                Editar Agente
              </button>
            </div>
          </div>
        )}
      </ModalShell>
    </AppLayout>
  );
}
