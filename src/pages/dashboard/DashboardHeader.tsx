import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Sparkles, ArrowUpRight, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  obtenerPlanSimulado,
  obtenerModulosActivosUsuario,
  esModoSimulacionPlan,
} from '@/services/subscriptionModules.service';

interface DashboardHeaderProps {
  onRefresh?: () => void;
}

export default function DashboardHeader({ onRefresh }: DashboardHeaderProps) {
  const { user } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [greeting, setGreeting] = useState('Buenas tardes');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour < 12) {
        setGreeting('Buenos días');
      } else if (hour < 19) {
        setGreeting('Buenas tardes');
      } else {
        setGreeting('Buenas noches');
      }

      // Formato hora estilo: "11:51 a. m."
      const timeFormatted = now.toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setTimeStr(timeFormatted);

      // Formato fecha estilo: "Jueves, 8 de Octubre de 2026"
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const months = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ];
      const dayName = days[now.getDay()];
      const dayNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();

      setDateStr(`${dayName}, ${dayNum} de ${monthName} de ${year}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const userName = user?.name || user?.username || 'Admin';

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            BIENVENIDO DE NUEVO
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {greeting}, {userName}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Aquí tienes un resumen de lo que está pasando en tu negocio hoy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tarjeta Minimalista CRM Independiente */}
          <Link
            to="/crm"
            className="group flex items-center gap-3 p-2.5 px-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-purple-500/40 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Briefcase size={18} strokeWidth={2.2} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  KOBA CRM
                </span>
                <ArrowUpRight size={12} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                Pipeline & Ventas
              </p>
            </div>
          </Link>

          {/* Tarjeta Minimalista Planes & Módulos — Navegación a página independiente */}
          {(() => {
            const planSimulado = obtenerPlanSimulado();
            const planActual = (planSimulado || user?.empresaPlan || 'free').toUpperCase();
            const modulosActivos = obtenerModulosActivosUsuario(user);
            const isSimulating = esModoSimulacionPlan();

            return (
              <Link
                to="/planes"
                className={`group flex items-center gap-3 p-2.5 px-3.5 rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer ${
                  isSimulating
                    ? 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-amber-500/40 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                }`}
                title="Ver planes de suscripción y módulos de KOBA Cloud"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                  isSimulating
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  <Sparkles size={18} strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {isSimulating ? `Simulando Plan ${planActual}` : `Plan ${planActual}`}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                    {modulosActivos.length} {modulosActivos.length === 1 ? 'módulo activo' : 'módulos activos'}
                  </p>
                </div>
              </Link>
            );
          })()}

          {/* Reloj y Fecha */}
          <div className="hidden sm:block text-right pl-3 border-l border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {dateStr}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
              {timeStr}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}