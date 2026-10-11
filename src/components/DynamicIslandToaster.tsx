import React, { useEffect, useState } from 'react';
import {
  Check,
  AlertTriangle,
  X,
  Info,
  Loader2,
} from 'lucide-react';
import { subscribeToasts, dismissToast, type ToastItem } from '../lib/toast';

export const DynamicIslandToaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToasts((updated) => {
      setToasts(updated);
    });
  }, []);

  if (toasts.length === 0) return null;

  const currentToast = toasts[toasts.length - 1];
  if (!currentToast) return null;

  const hasDesc = Boolean(currentToast.description);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none flex justify-center pt-3 px-4"
      aria-live="polite"
    >
      <div
        key={currentToast.id}
        onClick={() => dismissToast(currentToast.id)}
        className={`pointer-events-auto cursor-pointer select-none relative group overflow-hidden
          bg-black text-white
          border border-white/15 border-t-white/30
          shadow-[0_20px_45px_-8px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)]
          backdrop-blur-2xl
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${hasDesc ? 'rounded-[26px] py-3 px-4 min-w-[320px] max-w-[440px]' : 'rounded-full py-2 px-3.5 min-w-[200px] max-w-[380px]'}
          ${currentToast.exiting ? 'animate-island-exit' : 'animate-island-enter'}
        `}
      >
        {/* Reflejo de cristal curvado superior característico de hardware Apple */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

        <div className="flex items-center gap-2.5">
          {/* Badge de estado lateral con animación elástica */}
          <div className="flex-shrink-0">
            {currentToast.type === 'success' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.45)] animate-island-pop">
                <Check className="w-3.5 h-3.5 stroke-[2.8]" />
              </div>
            )}
            {currentToast.type === 'error' && (
              <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.45)] animate-island-pop">
                <X className="w-3.5 h-3.5 stroke-[2.8]" />
              </div>
            )}
            {currentToast.type === 'warning' && (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.45)] animate-island-pop">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.8]" />
              </div>
            )}
            {currentToast.type === 'info' && (
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.45)] animate-island-pop">
                <Info className="w-3.5 h-3.5 stroke-[2.8]" />
              </div>
            )}
            {currentToast.type === 'loading' && (
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.45)]">
                <Loader2 className="w-3.5 h-3.5 stroke-[2.8] animate-spin" />
              </div>
            )}
          </div>

          {/* Contenido textual principal */}
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-[13px] font-semibold text-white tracking-[-0.01em] leading-tight truncate">
              {currentToast.title}
            </p>
            {hasDesc && (
              <p className="text-[12px] text-neutral-400 mt-1 leading-snug line-clamp-2">
                {currentToast.description}
              </p>
            )}
          </div>

          {/* Indicador derecho estilo Live Activity de Dynamic Island */}
          <div className="flex-shrink-0 flex items-center gap-1 pl-1">
            {currentToast.type === 'loading' ? (
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 rounded-full bg-sky-400/80 animate-pulse" />
                <span className="w-1 h-4 rounded-full bg-sky-400 animate-pulse delay-75" />
                <span className="w-1 h-2 rounded-full bg-sky-400/60 animate-pulse delay-150" />
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                {/* Micro indicador vivo de actividad */}
                <span className={`w-2 h-2 rounded-full transition-opacity group-hover:opacity-0 ${
                  currentToast.type === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                  currentToast.type === 'error' ? 'bg-red-400 shadow-[0_0_8px_#f87171]' :
                  currentToast.type === 'warning' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' :
                  'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                }`} />
                {/* Botón X que aparece suavemente en hover */}
                <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-white/20 text-neutral-400 hover:text-white">
                  <X className="w-3 h-3" />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicIslandToaster;
