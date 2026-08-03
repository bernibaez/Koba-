import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';
import { ButtonSpinner } from './LoadingSkeleton';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  busyLabel?: string;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Eliminar',
  loading = false,
  busyLabel = 'Procesando…',
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      busy={loading}
      busyLabel={busyLabel}
      busyVariant="processing"
      footer={
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-danger flex items-center gap-2"
          >
            {loading ? (
              <>
                <ButtonSpinner />
                Procesando…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-danger-bg border border-danger/30 flex items-center justify-center flex-shrink-0 shadow-sm">
          <AlertTriangle size={24} className="text-danger" />
        </div>
        <p className="text-base font-medium text-foreground/80 leading-relaxed pt-0.5">{description}</p>
      </div>
    </Modal>
  );
}
