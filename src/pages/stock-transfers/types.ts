import type { TransferenciaUi, SucursalUi } from '@/services/transferencias.service';

export type { TransferenciaUi, SucursalUi };

export type TransferStatusFilter = 'all' | TransferenciaUi['estado'];

export const TRANSFER_STATUS_CONFIG: Record<
  TransferenciaUi['estado'],
  { label: string; badgeClass: string }
> = {
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'apple-badge-warning',
  },
  en_transito: {
    label: 'En tránsito',
    badgeClass: 'apple-badge-info',
  },
  recibida: {
    label: 'Recibida',
    badgeClass: 'apple-badge-success',
  },
  anulada: {
    label: 'Anulada',
    badgeClass: 'apple-badge-danger',
  },
};
