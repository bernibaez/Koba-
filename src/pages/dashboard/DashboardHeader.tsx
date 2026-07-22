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
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Panel de Control</h1>
        <div className="flex items-center gap-2 mt-1">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground capitalize">{dateStr}</span>
          {timeStr && (
            <span className="text-sm font-mono tabular-nums text-muted-foreground">· {timeStr}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success-bg border border-success/20 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-success">Caja Abierta</span>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 btn-secondary text-xs"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>
    </div>
  );
}