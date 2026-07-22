import React, { useState } from 'react';
import { Menu, Search, Bell, Sun, Moon, ChevronDown, X, Settings, LogOut, User, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface TopbarProps {
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  sidebarCollapsed: boolean;
}

interface AppNotification {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  title: string;
  time: string;
  href: string;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    type: 'warning',
    title: '8 productos con stock bajo',
    time: 'hace 5 min',
    href: '/product-management',
  },
  {
    id: 'notif-002',
    type: 'danger',
    title: '3 productos próximos a vencer',
    time: 'hace 12 min',
    href: '/product-management',
  },
  {
    id: 'notif-003',
    type: 'success',
    title: 'Compra #C-0142 recibida',
    time: 'hace 1 hora',
    href: '/purchases',
  },
  {
    id: 'notif-004',
    type: 'info',
    title: 'Backup automático completado',
    time: 'hace 3 horas',
    href: '/settings',
  },
  {
    id: 'notif-005',
    type: 'warning',
    title: 'Caja cerrada sin cuadre',
    time: 'ayer',
    href: '/reports',
  },
];

export default function Topbar({
  onToggleSidebar,
  onToggleMobileSidebar,
  darkMode,
  onToggleDark,
  sidebarCollapsed,
}: TopbarProps) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.length;

  const notifDot: Record<string, string> = {
    warning: 'bg-warning',
    danger: 'bg-danger',
    success: 'bg-success',
    info: 'bg-info',
  };

  const handleNotificationClick = (notification: AppNotification) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setNotifOpen(false);
    navigate(notification.href);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setNotifOpen(false);
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-3 flex-shrink-0 z-20 relative">
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <Menu size={18} />
      </button>

      <button
        onClick={onToggleMobileSidebar}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

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

      <div className="flex items-center gap-1">
        <button
          onClick={onToggleDark}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((p) => !p);
              setProfileOpen(false);
            }}
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
                {unreadCount > 0 ? (
                  <span className="badge-danger">{unreadCount} nuevas</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin pendientes</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors cursor-pointer bg-primary/5 text-left"
                    >
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notifDot[n.type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-border">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="w-full text-center text-sm text-primary font-medium hover:underline py-1"
                  >
                    Limpiar todas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((p) => !p);
              setNotifOpen(false);
            }}
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
                { icon: <User size={15} />, label: 'Mi Perfil', href: '/settings' },
                { icon: <Settings size={15} />, label: 'Configuración', href: '/settings' },
                { icon: <HelpCircle size={15} />, label: 'Ayuda', href: '/reports' },
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
