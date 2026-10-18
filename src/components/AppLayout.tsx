import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Eye, RotateCcw } from 'lucide-react';
import {
  esModoSimulacionPlan,
  obtenerPlanSimulado,
  establecerPlanSimulado,
  obtenerModulosActivosUsuario,
} from '@/services/subscriptionModules.service';
import { useAuth } from '@/context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function AppLayout({ children, fullWidth = false }: AppLayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [subVersion, setSubVersion] = useState(0);

  useEffect(() => {
    const handleSubChanged = () => setSubVersion((v) => v + 1);
    window.addEventListener('koba_subscription_config_changed', handleSubChanged);
    return () => window.removeEventListener('koba_subscription_config_changed', handleSubChanged);
  }, []);

  const isSimulating = esModoSimulacionPlan();
  const planSimulado = obtenerPlanSimulado();
  const modulosCount = obtenerModulosActivosUsuario(user).length;

  const handleExitSimulation = () => {
    establecerPlanSimulado(null);
    navigate('/superadmin');
  };

  const isPosPage = pathname.includes('point-of-sale') || pathname.includes('pos');
  const isCrmPage = pathname === '/crm' || pathname.startsWith('/crm');

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  if (isPosPage || isCrmPage) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 print:h-auto print:w-auto print:overflow-visible print:bg-white flex flex-col">
        {isSimulating && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-1.5 text-xs font-semibold flex items-center justify-between z-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-amber-500" />
              <span>
                Simulando <strong>Plan {planSimulado?.toUpperCase()}</strong> ({modulosCount} módulos activos)
              </span>
            </div>
            <button
              type="button"
              onClick={handleExitSimulation}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition shadow-xs cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Restaurar SuperAdmin</span>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible print:bg-white">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden fade-in print:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="print:hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          currentPath={pathname}
        />
      </div>

      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300 print:overflow-visible print:h-auto print:m-0 print:p-0"
        style={{ marginLeft: 0 }}
      >
        {isSimulating && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-1.5 text-xs font-semibold flex items-center justify-between z-50 print:hidden flex-shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-amber-500" />
              <span>
                Modo Simulación Activo: Viendo KOBA como usuario del <strong>Plan {planSimulado?.toUpperCase()}</strong> ({modulosCount} módulos permitidos)
              </span>
            </div>
            <button
              type="button"
              onClick={handleExitSimulation}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition shadow-xs cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Restaurar Vista SuperAdmin</span>
            </button>
          </div>
        )}

        <div className="print:hidden">
          <Topbar
            onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
            onToggleMobileSidebar={() => setMobileSidebarOpen((p) => !p)}
            darkMode={darkMode}
            onToggleDark={toggleDark}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>

        <main className={`flex-1 overflow-y-auto scrollbar-thin print:overflow-visible print:h-auto print:p-0 print:m-0 ${
          fullWidth || pathname === '/product-management' || pathname.startsWith('/product')
            ? 'bg-[var(--bg,#fbfbfd)]'
            : ''
        }`}>
          <div
            key={pathname}
            className={
              fullWidth || pathname === '/product-management' || pathname.startsWith('/product')
                ? 'w-full min-h-full px-5 sm:px-8 lg:px-10 py-6 sm:py-8 page-enter print:max-w-none print:p-0 print:m-0 bg-[var(--bg,#fbfbfd)]'
                : 'max-w-[1700px] mx-auto px-5 sm:px-6 lg:px-8 xl:px-10 py-8 page-enter print:max-w-none print:p-0 print:m-0'
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
