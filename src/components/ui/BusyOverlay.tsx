import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export type BusyVariant = 'saving' | 'processing' | 'deleting' | 'success' | 'loading';

const LABELS: Record<BusyVariant, string> = {
  saving: 'Guardando…',
  processing: 'Procesando…',
  deleting: 'Eliminando…',
  success: '¡Listo!',
  loading: 'Cargando…',
};

interface BusyOverlayProps {
  show: boolean;
  /** Texto personalizado; si no se pasa, usa el de la variante */
  label?: string;
  variant?: BusyVariant;
  /** true = cubre el modal padre (absolute). false = pantalla completa */
  contained?: boolean;
  className?: string;
}

/**
 * Overlay flotante animado para estados de guardado/proceso dentro de modales.
 */
export default function BusyOverlay({
  show,
  label,
  variant = 'saving',
  contained = true,
  className = '',
}: BusyOverlayProps) {
  if (!show) return null;

  const text = label ?? LABELS[variant];
  const isSuccess = variant === 'success';

  return (
    <div
      className={`
        ${contained ? 'absolute inset-0 rounded-2xl' : 'fixed inset-0 z-[80]'}
        z-[60] flex items-center justify-center
        bg-background/55 backdrop-blur-[2px]
        busy-overlay-in
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-busy={!isSuccess}
    >
      <div className="busy-float pointer-events-none flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-border/80 bg-card/95 shadow-floating">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary/15 loader-ping" />
          {isSuccess ? (
            <CheckCircle2 className="relative h-7 w-7 text-success busy-success-pop" strokeWidth={2.25} />
          ) : (
            <Loader2 className="relative h-7 w-7 text-primary animate-spin" strokeWidth={2.25} />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground tracking-tight">{text}</p>
          {!isSuccess && (
            <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <span className="busy-dot" />
              <span className="busy-dot busy-dot-delay-1" />
              <span className="busy-dot busy-dot-delay-2" />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
