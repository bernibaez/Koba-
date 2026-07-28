import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';

export default function DashboardHeader() {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now?.getHours()?.toString()?.padStart(2, '0');
      const m = now?.getMinutes()?.toString()?.padStart(2, '0');
      const s = now?.getSeconds()?.toString()?.padStart(2, '0');
      setTimeStr(`${h}:${m}:${s}`);

      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const d = now?.getDate();
      const day = days?.[now?.getDay()];
      const mon = months?.[now?.getMonth()];
      const yr = now?.getFullYear();
      setDateStr(`${day}, ${d} de ${mon} de ${yr}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Panel de Control</h1>
        <div className="flex items-center gap-2.5 mt-2">
          <Calendar size={18} className="text-primary" />
          <span className="text-base font-semibold text-foreground/80 capitalize">{dateStr}</span>
          {timeStr && (
            <span className="text-base font-mono font-bold tabular-nums text-muted-foreground">· {timeStr}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2 bg-success-bg border border-success/30 rounded-xl shadow-sm">
          <span className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-bold text-success">Caja Abierta</span>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2.5 btn-secondary text-base"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin text-primary' : 'text-primary'} />
          <span>Actualizar</span>
        </button>
      </div>
    </div>
  );
}