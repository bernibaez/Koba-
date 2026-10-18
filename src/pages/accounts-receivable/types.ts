import type { CuentaCobrarUi, CxStatusUi } from '@/services/cxc.service';
import type { Cliente } from '@/types/database';

export type { CuentaCobrarUi, CxStatusUi, Cliente };

export type CxCFilterStatus = 'all' | CxStatusUi;

export interface CxCMetrics {
  totalPending: number;
  totalOverdue: number;
  totalCollected: number;
  overdueCount: number;
  totalCount: number;
}

export const CXC_STATUS_CONFIG: Record<
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
    label: 'Cobrada',
    badgeClass: 'apple-badge-success',
  },
};
