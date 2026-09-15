import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import BusyOverlay, { type BusyVariant } from './BusyOverlay';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
  /** Muestra overlay flotante "Guardando…" etc. */
  busy?: boolean;
  busyLabel?: string;
  busyVariant?: BusyVariant;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  footer,
  busy = false,
  busyLabel,
  busyVariant = 'saving',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 !z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-busy={busy}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 z-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizeClasses[size]} bg-card border border-border/80 rounded-2xl
          max-h-[90vh] flex flex-col modal-panel shadow-2xl z-10
        `}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-border/80 flex-shrink-0 bg-secondary/20">
          <div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm font-medium text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ml-4 flex-shrink-0 disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-border/80 flex-shrink-0 bg-secondary/20">{footer}</div>
        )}

        <BusyOverlay show={busy} label={busyLabel} variant={busyVariant} contained />
      </div>
    </div>
  );
}
