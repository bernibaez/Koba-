import React, { useState } from 'react';
import { Menu, Search, Bell, Sun, Moon, ChevronDown, X, Settings, LogOut, User, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopbarProps {
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  sidebarCollapsed: boolean;
}

const notifications = [
  { id: 'notif-001', type: 'warning', title: '8 productos con stock bajo', time: 'hace 5 min', read: false },
  { id: 'notif-002', type: 'danger', title: '3 productos próximos a vencer', time: 'hace 12 min', read: false },
  { id: 'notif-003', type: 'success', title: 'Compra #C-0142 recibida', time: 'hace 1 hora', read: false },
  { id: 'notif-004', type: 'info', title: 'Backup automático completado', time: 'hace 3 horas', read: true },
  { id: 'notif-005', type: 'warning', title: 'Caja cerrada sin cuadre', time: 'ayer', read: true },
];

export default function Topbar({
  onToggleSidebar,
  onToggleMobileSidebar,
  darkMode,
  onToggleDark,
  sidebarCollapsed,
}: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const notifColor: Record<string, string> = {
    warning: 'text-warning',
    danger: 'text-danger',
    success: 'text-success',
    info: 'text-info',
  };

  const notifDot: Record<string, string> = {
    warning: 'bg-warning',
    danger: 'bg-danger',
    success: 'bg-success',
    info: 'bg-info',
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-3 flex-shrink-0 z-20 relative">
      {/* Sidebar toggle desktop */}
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <Menu size={18} />
      </button>

      {/* Mobile toggle */}
      <button
        onClick={onToggleMobileSidebar}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar productos, ventas, clientes..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="input-field pl-9 pr-8 h-9 text-sm"
        />
        {searchValue && (
          <button
            onClick={() => setSearchValue('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((p) => !p); setProfileOpen(false); }}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-xs rounded-full flex items-center justify-center font-semibold leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-card-hover z-50 fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm text-foreground">Notificaciones</span>
                <span className="badge-danger">{unreadCount} nuevas</span>
              </div>
              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-border' : notifDot[n.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-border">
                <button className="w-full text-center text-sm text-primary font-medium hover:underline py-1">
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen((p) => !p); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              A
            </div>
            <span className="hidden sm:block text-sm font-medium text-foreground">Admin</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-card-hover z-50 fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Admin General</p>
                <p className="text-xs text-muted-foreground truncate">admin@marketerp.do</p>
              </div>
              {[
                { icon: <User size={15} />, label: 'Mi Perfil', href: '/profile' },
                { icon: <Settings size={15} />, label: 'Configuración', href: '/settings' },
                { icon: <HelpCircle size={15} />, label: 'Ayuda', href: '/help' },
              ].map((item) => (
                <Link
                  key={`profile-${item.label}`}
                  to={item.href}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-border">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-bg transition-colors">
                  <LogOut size={15} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}