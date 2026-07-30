import React, { useState } from 'react';
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
} from 'lucide-react';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { useUsuarios } from '@/hooks/useUsuarios';
import { ROL_DB_A_UI, ROL_UI_A_DB } from '@/services/auth.service';
import type { RolDb } from '@/types/database';
import type { UserRole } from '@/lib/auth';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/services/clienteSupabase';

interface Role {
  id: number;
  name: string;
  permissions: number;
  users: number;
  description: string;
}
interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  sales: number;
  commission: number;
  status: 'active' | 'inactive';
}

const mockRoles: Role[] = [
  { id: 1, name: 'Administrador', permissions: 48, users: 1, description: 'Acceso total al sistema' },
  { id: 2, name: 'Cajero', permissions: 12, users: 3, description: 'Acceso al POS y ventas' },
  { id: 3, name: 'Vendedor', permissions: 8, users: 5, description: 'Gestión de ventas y clientes' },
  { id: 4, name: 'Almacenista', permissions: 10, users: 2, description: 'Gestión de inventario' },
  { id: 5, name: 'Contador', permissions: 15, users: 1, description: 'Acceso a informes y finanzas' },
];

const mockAgents: Agent[] = [
  { id: 1, name: 'Roberto Díaz', email: 'roberto@marketerp.do', phone: '809-555-0010', sales: 145, commission: 8500, status: 'active' },
  { id: 2, name: 'Luisa Fernández', email: 'luisa@marketerp.do', phone: '809-555-0011', sales: 98, commission: 5200, status: 'active' },
  { id: 3, name: 'Miguel Torres', email: 'miguel@marketerp.do', phone: '809-555-0012', sales: 67, commission: 3100, status: 'inactive' },
];

type Tab = 'users' | 'roles' | 'agents';

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRol, setFormRol] = useState<UserRole>('Cajero');
  const [saving, setSaving] = useState(false);

  const { usuarios, loading, crear, alternarActivo } = useUsuarios(search);

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
        headers: ['Rol', 'Permisos', 'Usuarios', 'Descripción'],
        rows: mockRoles.map((r) => [r.name, r.permissions, r.users, r.description]),
      });
      return;
    }
    exportTableToPdf({
      title: 'Agentes Comerciales',
      filename: 'agentes',
      headers: ['Nombre', 'Email', 'Teléfono', 'Ventas', 'Comisión', 'Estado'],
      rows: mockAgents.map((a) => [
        a.name,
        a.email,
        a.phone,
        a.sales,
        formatMoneyPdf(a.commission),
        a.status === 'active' ? 'Activo' : 'Inactivo',
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
      setFormNombre('');
      setFormCorreo('');
      setFormTelefono('');
      setFormPassword('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear usuario');
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
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-fit">
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
                  {mockRoles.map((role, i) => (
                    <tr
                      key={role.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                        i % 2 === 0 ? '' : 'bg-secondary/10'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{role.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{role.description}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="badge-info">{role.permissions} permisos</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{role.users} usuarios</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors">
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

        {tab === 'agents' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Agente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Teléfono</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Ventas</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Comisión</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAgents.map((agent, i) => (
                    <tr
                      key={agent.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                        i % 2 === 0 ? '' : 'bg-secondary/10'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{agent.phone}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-semibold text-foreground">{agent.sales}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-success font-semibold">
                        RD$ {agent.commission.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={agent.status === 'active' ? 'badge-success' : 'badge-danger'}>
                          {agent.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors">
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
          onClick={() => setShowModal(false)}
        >
          <div className="card p-6 w-full max-w-md mx-4 slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {tab === 'users' ? 'Nuevo Usuario' : tab === 'roles' ? 'Nuevo Rol' : 'Nuevo Agente'}
            </h2>
            <div className="space-y-3">
              <input
                className="input-field"
                placeholder="Nombre completo"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
              <input
                className="input-field"
                placeholder="Correo electrónico"
                type="email"
                value={formCorreo}
                onChange={(e) => setFormCorreo(e.target.value)}
              />
              {tab !== 'roles' && (
                <input
                  className="input-field"
                  placeholder="Teléfono"
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)}
                />
              )}
              {tab === 'users' && (
                <select
                  className="input-field"
                  value={formRol}
                  onChange={(e) => setFormRol(e.target.value as UserRole)}
                >
                  {mockRoles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
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
              {tab === 'roles' && <textarea className="input-field" placeholder="Descripción del rol" rows={3} />}
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className="btn-primary flex-1"
                disabled={saving}
                onClick={() => {
                  if (tab === 'users') void handleCreateUser();
                  else setShowModal(false);
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
