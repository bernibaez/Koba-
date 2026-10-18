import type { GastoUi, GastoStatusUi, CategoriaGastoUi } from '@/services/gastos.service';

export type { GastoUi, GastoStatusUi, CategoriaGastoUi };

export type ExpensesTab = 'list' | 'categories';
export type ExpenseStatusFilter = 'all' | GastoStatusUi;

export const EXPENSE_STATUS_CONFIG: Record<
  GastoStatusUi,
  { label: string; badgeClass: string }
> = {
  approved: {
    label: 'Aprobado',
    badgeClass: 'apple-badge-success',
  },
  pending: {
    label: 'Pendiente',
    badgeClass: 'apple-badge-warning',
  },
  rejected: {
    label: 'Rechazado',
    badgeClass: 'apple-badge-danger',
  },
};
