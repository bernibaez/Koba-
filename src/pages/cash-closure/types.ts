import type { CashClosure } from '@/lib/cashClosureStore';

export type { CashClosure };

export type CashClosurePeriod = 'all' | 'today' | '7d' | 'month' | 'custom';

export type CashDifferenceType = 'exact' | 'surplus' | 'deficit';

export function getDifferenceType(diff: number): CashDifferenceType {
  if (Math.abs(diff) < 0.01) return 'exact';
  return diff > 0 ? 'surplus' : 'deficit';
}

export function calculateClosurePeriodDates(period: CashClosurePeriod): { from: string; to: string } {
  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().slice(0, 10);
  const todayStr = formatYMD(now);

  switch (period) {
    case 'today':
      return { from: todayStr, to: todayStr };
    case '7d': {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 7);
      return { from: formatYMD(d7), to: todayStr };
    }
    case 'month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: formatYMD(firstDay), to: todayStr };
    }
    case 'all':
    case 'custom':
    default:
      return { from: '', to: '' };
  }
}
