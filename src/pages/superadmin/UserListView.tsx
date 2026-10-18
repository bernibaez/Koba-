import React from 'react';
import {
  Search,
  Users,
  UserPlus,
  KeyRound,
  Layers,
  Crown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Empresa, Perfil } from '@/types/database';

interface UserListViewProps {
  usuarios: Perfil[];
  empresas: Empresa[];
  search: string;
  onSearchChange: (val: string) => void;
  filterEmpresa: string;
  onFilterEmpresaChange: (val: string) => void;
  onCreateUser: () => void;
  onResetPassword: (user: Perfil) => void;
  onConfigureModules: (user: Perfil) => void;
  onToggleSuperAdmin: (user: Perfil) => void;
  onToggleActivo: (user: Perfil) => void;
}

export default function UserListView({
  usuarios,
  empresas,
  search,
  onSearchChange,
  filterEmpresa,
  onFilterEmpresaChange,
  onCreateUser,
  onResetPassword,
  onConfigureModules,
  onToggleSuperAdmin,
  onToggleActivo,
}: UserListViewProps) {
  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Buscar usuario por nombre o correo..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-card border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterEmpresa}
            onChange={(e) => onFilterEmpresaChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-card border border-border/80 rounded-xl focus:outline-none text-foreground cursor-pointer max-w-[220px] truncate"
          >
            <option value="todos">Todas las empresas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          {/* Botón que reemplaza la página por el formulario */}
          <button
            type="button"
            onClick={onCreateUser}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-2xs transition cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Crear Usuario</span>
          </button>
        </div>
      </div>

      {/* Main Table: Clean & Minimalist */}
      <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/30 border-b border-border/60 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Usuario</th>
                <th className="px-4 py-3.5">Empresa Asignada</th>
                <th className="px-4 py-3.5">Rol en Negocio</th>
                <th className="px-4 py-3.5">Privilegio Global</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                        <Users size={20} />
                      </div>
                      <p className="font-semibold text-foreground text-sm">No se encontraron usuarios</p>
                      <p className="text-xs text-muted-foreground">
                        {search || filterEmpresa !== 'todos'
                          ? 'Prueba modificando los filtros de búsqueda.'
                          : 'Aún no hay usuarios dados de alta.'}
                      </p>
                      <button
                        type="button"
                        onClick={onCreateUser}
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition cursor-pointer"
                      >
                        <UserPlus size={14} />
                        Crear Primer Usuario
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                usuarios.map((usr) => {
                  const empAsociada = empresas.find((e) => e.id === usr.empresa_id);

                  return (
                    <tr key={usr.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Usuario */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-foreground text-sm">
                          {usr.nombre_completo}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {usr.correo}
                        </div>
                      </td>

                      {/* Empresa */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-foreground">
                          {empAsociada?.nombre || 'KOBA Flagship Store'}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {empAsociada?.codigo || 'default'}
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-[11px] font-medium capitalize">
                          {usr.rol}
                        </span>
                      </td>

                      {/* SuperAdmin Toggle */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => onToggleSuperAdmin(usr)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                            usr.es_superadmin
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                          }`}
                          title={
                            usr.es_superadmin
                              ? 'SuperAdmin: clic para revocar'
                              : 'Usuario estándar: clic para promover a SuperAdmin'
                          }
                        >
                          <Crown size={11} className={usr.es_superadmin ? 'text-amber-500' : ''} />
                          <span>{usr.es_superadmin ? 'SuperAdmin' : 'Estándar'}</span>
                        </button>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            usr.activo
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              usr.activo ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {usr.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Cambiar Clave */}
                          <button
                            type="button"
                            onClick={() => onResetPassword(usr)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground transition cursor-pointer"
                            title="Cambiar contraseña de este usuario"
                          >
                            <KeyRound size={12} className="text-amber-500" />
                            <span>Clave</span>
                          </button>

                          {/* Configurar Módulos: REEMPLAZA LA PÁGINA */}
                          <button
                            type="button"
                            onClick={() => onConfigureModules(usr)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition cursor-pointer"
                            title="Configurar módulos y accesos individuales"
                          >
                            <Layers size={12} />
                            <span>Módulos</span>
                          </button>

                          {/* Activar / Desactivar */}
                          <button
                            type="button"
                            onClick={() => onToggleActivo(usr)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              usr.activo
                                ? 'text-rose-600 hover:bg-rose-500/10'
                                : 'text-emerald-600 hover:bg-emerald-500/10'
                            }`}
                          >
                            {usr.activo ? 'Desactivar' : 'Activar'}
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
