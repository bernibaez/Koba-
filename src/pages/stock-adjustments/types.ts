import type { ProductItem } from '@/lib/productStore';
import type { StockAdjustmentItem } from '@/lib/stockAdjustmentStore';

export type { ProductItem, StockAdjustmentItem };

export type StockAdjustmentTypeFilter = 'all' | 'entrada' | 'salida' | 'perdida';

export const ADJUSTMENT_TYPE_CONFIG: Record<
  'entrada' | 'salida' | 'perdida',
  { label: string; badgeClass: string; icon: 'up' | 'down' | 'alert' }
> = {
  entrada: {
    label: 'Entrada (+)',
    badgeClass: 'apple-badge-success',
    icon: 'up',
  },
  salida: {
    label: 'Salida (-)',
    badgeClass: 'apple-badge-warning',
    icon: 'down',
  },
  perdida: {
    label: 'Pérdida / Daño',
    badgeClass: 'apple-badge-danger',
    icon: 'alert',
  },
};
