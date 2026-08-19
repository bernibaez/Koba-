import React, { useEffect } from 'react';
import BusyOverlay, { type BusyVariant } from './BusyOverlay';

const SIZE: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  full: 'max-w-5xl',
};

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: keyof typeof SIZE;
  /** Clase extra del panel (card) */
  className?: string;
  /** No cerrar al hacer clic en el fondo */
  disableBackdropClose?: boolean;
  /** Bloquea cierre (p. ej. mientras guarda) */
  busy?: boolean;
  busyLabel?: string;
  busyVariant?: BusyVariant;
}

/** Panel de diálogo en el flujo de la página (sin overlay flotante). */
export default function ModalShell({
  open,
  onClose,
  children,
  size = 'lg',
  className = '',
  busy = false,
  busyLabel,
  busyVariant = 'saving',
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div className="dialog-inline-host" role="dialog" aria-modal="true">
      <div
        className={`
          relative w-full ${SIZE[size]} overflow-y-auto scrollbar-thin
          card modal-panel
          ${className}
        `}
      >
        {children}
        <BusyOverlay show={busy} label={busyLabel} variant={busyVariant} contained />
      </div>
    </div>
  );
}
