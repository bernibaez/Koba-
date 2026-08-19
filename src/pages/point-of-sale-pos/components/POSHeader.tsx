import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  RotateCcw,
  XCircle,
  Briefcase,
  Scale,
  Undo2,
  Pause,
  PlusCircle,
  Calendar,
  Monitor,
  PlayCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canAccessRoute } from '@/lib/auth';

interface POSHeaderProps {
  cartCount: number;
  total: number;
  heldCount: number;
  awaitingDelete: boolean;
  cashLabel: string;
  cashierName: string;
  isRemoteAdmin: boolean;
  onClear: () => void;
  onHold: () => void;
  onExpense: () => void;
  onScale: () => void;
  onReturn: () => void;
  onCancelDelete: () => void;
  onSwitchCash: () => void;
  onOpenRegisterDetails?: () => void;
  onOpenCash?: () => void;
}

export default function POSHeader({
  cartCount,
  total,
  heldCount,
  awaitingDelete,
  cashLabel,
  cashierName,
  isRemoteAdmin,
  onClear,
  onHold,
  onExpense,
  onScale,
  onReturn,
  onCancelDelete,
  onSwitchCash,
  onOpenRegisterDetails,
  onOpenCash,
}: POSHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const canSettings = canAccessRoute(user?.role ?? 'Cajero', '/settings');
  const canHome = canAccessRoute(user?.role ?? 'Cajero', '/');
  const canSales = canAccessRoute(user?.role ?? 'Cajero', '/sales');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const datePart = d.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timePart = d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true });
      setTimeStr(`${datePart} ${timePart}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 mb-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {(canHome || canSales) && (
            <Link
              to={canHome ? '/' : '/sales'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-sm active:scale-95"
              title={canHome ? 'Ir al menú principal del sistema' : 'Ir a mis ventas'}
            >
              <Home size={16} />
              <span>{canHome ? 'Menú Principal' : 'Mis Ventas'}</span>
            </Link>
          )}

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:inline">
              Ubicación:
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              SUPERMERCADO {cashLabel}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">
            <Calendar size={14} />
            <span>{timeStr || '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={onClear}
            className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white transition-all shadow-xs active:scale-95 border border-slate-600"
            title="Venta Previa / Reajustar"
          >
            <RotateCcw size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onClear}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs active:scale-95 border border-red-500"
            title="Cancelar / Limpiar"
          >
            <XCircle size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onOpenRegisterDetails}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs active:scale-95 border border-emerald-500"
            title="Registrar detalles (Maleta)"
          >
            <Briefcase size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onScale}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs active:scale-95 border border-teal-500"
            title="Balanza (Pesados SKU: 200)"
          >
            <Scale size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onReturn}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs active:scale-95 border border-rose-500"
            title="Devolución"
          >
            <Undo2 size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onSwitchCash}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs active:scale-95 border border-indigo-500"
            title="Acceso Remoto / Entrar a una caja"
          >
            <Monitor size={18} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onHold}
            className="relative p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs active:scale-95 border border-purple-500"
            title="Suspender / Pausar Venta"
          >
            <Pause size={18} strokeWidth={2.3} />
            {heldCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-slate-950 text-[11px] rounded-full flex items-center justify-center font-black border-2 border-white dark:border-slate-900 shadow-xs">
                {heldCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCash && (
            <button
              type="button"
              onClick={onOpenCash}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm active:scale-95 border border-emerald-500"
              title="Iniciar o abrir turno de caja con fondo inicial"
            >
              <PlayCircle size={15} />
              <span className="hidden sm:inline">Iniciar Caja</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExpense}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-black hover:bg-slate-50 transition-all shadow-2xs"
          >
            <PlusCircle size={15} className="text-slate-900 dark:text-white" />
            <span className="hidden sm:inline">Agregar gasto</span>
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              title="Cuenta y sesión"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                {(user?.initials || user?.name || cashierName || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[100px] truncate">
                {user?.name?.split(' ')[0] || cashierName || 'Usuario'}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {user?.name || cashierName || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email || '—'}
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    {user?.role || 'Cajero'}
                  </span>
                </div>

                {canSettings && (
                  <>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User size={16} className="text-emerald-600" />
                      Mi Perfil
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings size={16} className="text-emerald-600" />
                      Configuración
                    </Link>
                  </>
                )}

                <div className="border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Users size={16} className="text-indigo-600" />
                    Cambiar usuario
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
