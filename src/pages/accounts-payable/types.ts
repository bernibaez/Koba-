import type { CuentaPagarUi, CxStatusUi, ProveedorOpcion } from '@/services/cxp.service';

export type { CuentaPagarUi, CxStatusUi, ProveedorOpcion };

export type CxPFilterStatus = 'all' | CxStatusUi;

export interface CxPMetrics {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  overdueCount: number;
  totalCount: number;
}

export const CXP_STATUS_CONFIG: Record<
  CxStatusUi,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: 'Pendiente',
    badgeClass: 'apple-badge-warning',
  },
  partial: {
    label: 'Parcial',
    badgeClass: 'apple-badge-info',
  },
  overdue: {
    label: 'Vencida',
    badgeClass: 'apple-badge-danger',
  },
  paid: {
    label: 'Pagada',
    badgeClass: 'apple-badge-success',
  },
};
