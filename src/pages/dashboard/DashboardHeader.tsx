import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Zap } from 'lucide-react';

interface DashboardHeaderProps {
  onRefresh?: () => void;
}

export default function DashboardHeader({ onRefresh }: DashboardHeaderProps) {
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
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Resumen del día
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Panel de Control
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Calendar size={13} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground capitalize">{dateStr}</span>
          {timeStr && (
            <span className="text-sm font-mono font-semibold tabular-nums text-muted-foreground/70">
              · {timeStr}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success-bg border border-success/30 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-bold text-success">Caja Abierta</span>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 btn-secondary text-sm py-1.5 px-3"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-primary' : 'text-primary'} />
          <span>Actualizar</span>
        </button>
      </div>
    </div>
  );
}