import React, { useState } from 'react';
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
} from 'lucide-react';
import { exportTableToPdf } from '@/lib/exportPdf';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useAgentes } from '@/hooks/useAgentes';
import { useRoles } from '@/hooks/useRoles';
import { ROL_DB_A_UI, ROL_UI_A_DB } from '@/services/auth.service';
import type { AgenteComercial, Rol, RolDb } from '@/types/database';
import type { UserRole } from '@/lib/auth';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/services/clienteSupabase';

type Tab = 'users' | 'roles' | 'agents';

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
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

  const { usuarios, loading, crear, alternarActivo } = useUsuarios(search);
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
<<<<<<< HEAD
    error: rolesError,
=======
    crear: crearRol,
    actualizar: actualizarRol,
>>>>>>> c7ac6d074dca84bd6fc392ffa15cb2ed64c4b6de
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
    setEditingAgent(null);
    setEditingRole(null);
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditAgent = (agent: AgenteComercial) => {
    setEditingAgent(agent);
    setFormNombre(agent.nombre);
    setFormCorreo(agent.correo ?? '');
    setFormTelefono(agent.telefono ?? '');
    setFormComision(String(agent.porcentaje_comision ?? 0));
    setShowModal(true);
  };

  const openEditRole = (role: Rol) => {
    setEditingRole(role);
    setFormNombre(role.nombre);
    setFormDescRol(role.descripcion ?? '');
    setFormCodigoRol(role.codigo);
    setShowModal(true);
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
      setShowModal(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: Rol) => {
    if (!confirm(`¿Estás seguro de eliminar el rol "${role.nombre}"?`)) return;
    try {
      await eliminarRol(role.id);
      toast.success(`Rol "${role.nombre}" eliminado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar el rol');
    }
  };

  const tabs = [
    { id: 'users' as Tab, label: 'Usuarios', icon: <Users size={16} /> },
    { id: 'roles' as Tab, label: 'Roles', icon: <Shield size={16} /> },
    { id: 'agents' as Tab, label: 'Agentes Comerciales', icon: <UserCheck size={16} /> },
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
    if (!formNombre.trim() || !formCorreo.trim() || !formPassword) {
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
      setShowModal(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear usuario');
    } finally {
      setSaving(false);
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
      setShowModal(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar agente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administra usuarios, roles y agentes comerciales
              {!isSupabaseConfigured() && ' (modo local — configura Supabase para altas reales)'}
            </p>
          </div>
          <button
            onClick={openNewModal}
            className="btn-primary flex items-center gap-2 w-fit"
          >
            <Plus size={16} /> Nuevo {tab === 'users' ? 'Usuario' : tab === 'roles' ? 'Rol' : 'Agente'}
          </button>
        </div>

        <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-field pl-9"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Filter size={16} />
              Filtrar
            </button>
            <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-2">
              <Download size={16} />
              Exportar PDF
            </button>
          </div>
        </div>

        {tab === 'users' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuario</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Rol</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Teléfono</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        Cargando usuarios…
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    usuarios.map((user, i) => (
                      <tr
                        key={user.id}
                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-secondary/10'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                              {user.nombre_completo.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{user.nombre_completo}</p>
                              <p className="text-xs text-muted-foreground">{user.correo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="badge-info">{ROL_DB_A_UI[user.rol] ?? user.rol}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {user.telefono ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={user.activo ? 'badge-success' : 'badge-danger'}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                              <Eye size={14} />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors">
                              <Trash2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              onClick={async () => {
                                try {
                                  await alternarActivo(user.id, !user.activo);
                                  toast.success(user.activo ? 'Usuario desactivado' : 'Usuario activado');
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : 'Error');
                                }
                              }}
                            >
                              {user.activo ? (
                                <ToggleRight size={14} className="text-success" />
                              ) : (
                                <ToggleLeft size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {usuarios.length} usuario{usuarios.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        )}

        {tab === 'roles' && (
          <div className="space-y-4">
            <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Matriz de Permisos de Acceso</p>
                  <p className="text-xs text-muted-foreground">Configura los accesos y permisos por módulo para todos los usuarios y roles del sistema.</p>
                </div>
              </div>
              <Link
                to="/settings?section=permissions"
                className="btn-primary text-xs flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sliders size={14} />
                <span>Configurar Permisos de Accesos</span>
              </Link>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Rol</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Descripción</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Permisos</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Usuarios</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRoles && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Cargando roles…
                      </td>
                    </tr>
                  )}
                  {!loadingRoles && rolesError && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-danger text-sm">
                        {rolesError}
                      </td>
                    </tr>
                  )}
                  {!loadingRoles && !rolesError && roles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No hay roles en Supabase. Ejecuta la migración 008 o ve a Configuración → Permisos.
                      </td>
                    </tr>
                  )}
                  {!loadingRoles &&
                    !rolesError &&
                    roles.map((role, i) => {
                    const activeUsersCount = usuarios.filter((u) => u.rol === role.codigo).length;
                    const permissionsCount = countPermissions(role.permisos);
                    return (
                      <tr
                        key={role.id}
                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-secondary/10'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {role.nombre}
                          <span className="block text-[11px] text-muted-foreground font-normal">{role.codigo}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{role.descripcion || '—'}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="badge-info">{permissionsCount} permisos</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{activeUsersCount} usuarios</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
<<<<<<< HEAD
                              title="Editar permisos en Configuración"
                              onClick={() => {
                                window.location.href = '/settings';
                              }}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
=======
                              onClick={() => openEditRole(role)}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              title="Editar rol"
>>>>>>> c7ac6d074dca84bd6fc392ffa15cb2ed64c4b6de
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
<<<<<<< HEAD
                              disabled={role.codigo === 'admin'}
                              onClick={() => {
                                if (role.codigo === 'admin') return;
                                if (!confirm(`¿Eliminar rol "${role.nombre}"?`)) return;
                                void eliminarRol(role.id)
                                  .then(() => toast.success('Rol eliminado'))
                                  .catch((e) =>
                                    toast.error(e instanceof Error ? e.message : 'No se pudo eliminar')
                                  );
                              }}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors disabled:opacity-30"
=======
                              onClick={() => void handleDeleteRole(role)}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors"
                              title="Eliminar rol"
>>>>>>> c7ac6d074dca84bd6fc392ffa15cb2ed64c4b6de
                            >
                              <Trash2 size={14} />
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

        {tab === 'agents' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Agente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Teléfono</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Comisión %</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAgentes && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Cargando agentes…
                      </td>
                    </tr>
                  )}
                  {!loadingAgentes && agentes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No hay agentes en Supabase. Crea el primero con “Nuevo Agente”.
                      </td>
                    </tr>
                  )}
                  {!loadingAgentes &&
                    agentes.map((agent, i) => (
                      <tr
                        key={agent.id}
                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-secondary/10'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                              {agent.nombre.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{agent.nombre}</p>
                              <p className="text-xs text-muted-foreground">{agent.correo || 'Sin correo'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {agent.telefono || '—'}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-success font-semibold">
                          {Number(agent.porcentaje_comision).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              void alternarActivoAgente(agent.id, !agent.activo).then(() =>
                                toast.success(agent.activo ? 'Agente desactivado' : 'Agente activado')
                              )
                            }
                            className="inline-flex items-center gap-1"
                            title={agent.activo ? 'Desactivar' : 'Activar'}
                          >
                            {agent.activo ? (
                              <ToggleRight size={22} className="text-success" />
                            ) : (
                              <ToggleLeft size={22} className="text-muted-foreground" />
                            )}
                            <span className={agent.activo ? 'badge-success' : 'badge-danger'}>
                              {agent.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditAgent(agent)}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Edit2 size={14} />
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
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 fade-in"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div className="card p-6 w-full max-w-md mx-4 slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {tab === 'users'
                ? 'Nuevo Usuario'
                : tab === 'roles'
                  ? editingRole
                    ? 'Editar Rol'
                    : 'Nuevo Rol'
                  : editingAgent
                    ? 'Editar Agente'
                    : 'Nuevo Agente'}
            </h2>
            <div className="space-y-3">
              <input
                className="input-field"
                placeholder={tab === 'roles' ? 'Nombre del rol (ej: Cajero Nocturno)' : 'Nombre completo'}
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
              {tab !== 'roles' && (
                <input
                  className="input-field"
                  placeholder="Correo electrónico"
                  type="email"
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                />
              )}
              {tab !== 'roles' && (
                <input
                  className="input-field"
                  placeholder="Teléfono"
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)}
                />
              )}
              {tab === 'agents' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Comisión (%)
                  </label>
                  <input
                    className="input-field"
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
<<<<<<< HEAD
                <select
                  className="input-field"
                  value={formRol}
                  onChange={(e) => setFormRol(e.target.value as UserRole)}
                >
                  {(roles.length > 0
                    ? roles.map((r) => ({
                        value: (ROL_DB_A_UI[r.codigo as RolDb] ?? r.nombre) as UserRole,
                        label: r.nombre,
                      }))
                    : ([
                        'Administrador',
                        'Cajero',
                        'Vendedor',
                        'Almacenista',
                        'Contador',
                      ] as UserRole[]).map((r) => ({ value: r, label: r }))
                  ).map((r) => (
                    <option key={r.label} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
=======
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Rol del usuario
                  </label>
                  <select
                    className="input-field"
                    value={formRol}
                    onChange={(e) => setFormRol(e.target.value as UserRole)}
                  >
                    {roles.length > 0
                      ? roles.map((r) => (
                          <option key={r.id} value={(ROL_DB_A_UI[r.codigo as keyof typeof ROL_DB_A_UI] || r.nombre) as UserRole}>
                            {r.nombre} ({r.codigo})
                          </option>
                        ))
                      : ['Administrador', 'Cajero', 'Vendedor', 'Almacenista', 'Contador'].map((r) => (
                          <option key={r} value={r as UserRole}>
                            {r}
                          </option>
                        ))}
                  </select>
                </div>
>>>>>>> c7ac6d074dca84bd6fc392ffa15cb2ed64c4b6de
              )}
              {tab === 'users' && (
                <input
                  className="input-field"
                  placeholder="Contraseña"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
              )}
              {tab === 'roles' && (
<<<<<<< HEAD
                <p className="text-sm text-muted-foreground">
                  Los permisos de cada rol se editan en <strong>Configuración → Permisos</strong> (Supabase).
                </p>
=======
                <>
                  <input
                    className="input-field font-mono text-xs"
                    placeholder="Código identificador (ej: cajero_nocturno - opcional)"
                    disabled={!!editingRole}
                    value={formCodigoRol}
                    onChange={(e) => setFormCodigoRol(e.target.value)}
                  />
                  <textarea
                    className="input-field"
                    placeholder="Descripción de funciones y nivel de acceso del rol"
                    rows={3}
                    value={formDescRol}
                    onChange={(e) => setFormDescRol(e.target.value)}
                  />
                </>
>>>>>>> c7ac6d074dca84bd6fc392ffa15cb2ed64c4b6de
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="btn-secondary flex-1"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary flex-1"
                disabled={saving}
                onClick={() => {
                  if (tab === 'users') void handleCreateUser();
                  else if (tab === 'agents') void handleSaveAgent();
                  else if (tab === 'roles') void handleSaveRole();
                }}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
