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

/**
 * Contenedor animado reutilizable para modales ad-hoc (sin header fijo).
 * Añade backdrop + panel con animación y overlay flotante de "Guardando…".
 */
export default function ModalShell({
  open,
  onClose,
  children,
  size = 'lg',
  className = '',
  disableBackdropClose = false,
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 modal-backdrop"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        if (disableBackdropClose || busy) return;
        onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`
          relative w-full ${SIZE[size]} max-h-[90vh] overflow-y-auto scrollbar-thin
          card shadow-floating modal-panel
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <BusyOverlay show={busy} label={busyLabel} variant={busyVariant} contained />
      </div>
    </div>
  );
}
