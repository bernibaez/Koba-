import type { CompraLista } from '@/services/compras.service';

export type PurchaseStatus = 'received' | 'pending' | 'partial' | 'voided' | 'anulada';

export interface Purchase {
  id: string;
  code: string;
  supplier: string;
  supplierId?: string | null;
  date: string;
  items: number;
  itemsCount?: number;
  subtotal: number;
  tax: number;
  total: number;
  status: PurchaseStatus;
  paymentMethod?: string;
  payment?: string;
  rawPurchase?: CompraLista;
}

export type PurchasesTab = 'purchases' | 'returns';
export type PurchasesPeriod = 'all' | 'today' | '7d' | 'month' | 'custom';

export function mapPurchaseStatus(estado?: string | null): PurchaseStatus {
  if (!estado) return 'pending';
  const e = estado.toLowerCase();
  if (e === 'recibida' || e === 'received') return 'received';
  if (e === 'parcial' || e === 'partial') return 'partial';
  if (e === 'anulada' || e === 'cancelled' || e === 'voided') return 'voided';
  return 'pending';
}

export function fromCompraListaToPurchase(c: CompraLista): Purchase {
  return {
    id: c.id,
    code: c.codigo,
    supplier: c.proveedor || 'Proveedor general',
    supplierId: c.proveedor_id,
    date: c.fecha,
    items: Number(c.items || 0),
    itemsCount: Number(c.items || 0),
    subtotal: Number(c.subtotal || 0),
    tax: Number(c.impuesto || 0),
    total: Number(c.total || 0),
    status: mapPurchaseStatus(c.estado),
    paymentMethod: c.metodo_pago || 'Transferencia',
    payment: c.metodo_pago || 'Transferencia',
    rawPurchase: c,
  };
}

export function calculatePeriodDates(period: PurchasesPeriod): { from: string; to: string } {
  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().slice(0, 10);
  const todayStr = formatYMD(now);

  switch (period) {
    case 'today':
      return { from: todayStr, to: todayStr };
    case '7d': {
      const past = new Date(now.getTime() - 7 * 86400000);
      return { from: formatYMD(past), to: todayStr };
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: formatYMD(startOfMonth), to: todayStr };
    }
    case 'all':
    case 'custom':
    default:
      return { from: '', to: '' };
  }
}
