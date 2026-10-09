import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
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

      <div className="text-left sm:text-right flex-shrink-0">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {dateStr}
        </p>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums mt-0.5 tracking-tight">
          {timeStr}
        </p>
      </div>
    </div>
  );
}