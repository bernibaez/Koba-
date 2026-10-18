import type { VentaConDetalle } from '@/services/ventas.service';

export type SaleStatus = 'draft' | 'completed' | 'voided';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'pending';

export interface SaleItem {
  name: string;
  quantity: number;
  amount: number;
}

export interface Sale {
  id: string;
  ncf: string;
  kind: string;
  date: string;
  client: string;
  cashier: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  itbis: number;
  total: number;
  grossProfit: number;
  status: SaleStatus;
  items: SaleItem[];
  rawSale?: VentaConDetalle;
}

export type SaleAction = 'print' | 'edit' | 'return' | 'void' | 'delete';

export function mapKindFromTipoNcf(tipoNcf?: string | null, numeroFactura?: string): string {
  if (numeroFactura?.startsWith('BOR-')) return 'Borrador';
  switch (tipoNcf) {
    case 'B01':
      return 'Crédito fiscal';
    case 'B02':
      return 'Factura simple';
    case 'B14':
      return 'Régimen especial';
    case 'B15':
      return 'Gubernamental';
    case 'B04':
      return 'Nota de crédito';
    default:
      return 'Factura simple';
  }
}

export function mapPaymentMethod(metodo?: string | null): PaymentMethod {
  switch (metodo) {
    case 'efectivo':
      return 'cash';
    case 'tarjeta':
      return 'card';
    case 'transferencia':
      return 'transfer';
    case 'credito':
    case 'pendiente':
      return 'pending';
    default:
      return 'cash';
  }
}

export function mapSaleStatus(estado?: string | null, numeroFactura?: string): SaleStatus {
  if (numeroFactura?.startsWith('BOR-') || estado === 'pendiente' || estado === 'draft') {
    return 'draft';
  }
  if (estado === 'anulada' || estado === 'cancelled' || estado === 'voided') {
    return 'voided';
  }
  return 'completed';
}

export function fromVentaConDetalleToSale(v: VentaConDetalle): Sale {
  const status = mapSaleStatus(v.estado, v.numero_factura);
  const total = Number(v.monto_total || 0);
  const costo = Number(v.costo_total || 0);
  const grossProfit = total - costo;

  return {
    id: v.id,
    ncf: v.ncf || v.numero_factura,
    kind: mapKindFromTipoNcf(v.tipo_ncf, v.numero_factura),
    date: v.creado_en,
    client: v.cliente_nombre || 'Cliente general',
    cashier: v.cajero_nombre || 'Cajero',
    paymentMethod: mapPaymentMethod(v.metodo_pago),
    subtotal: Number(v.subtotal || 0),
    itbis: Number(v.monto_impuesto || 0),
    total,
    grossProfit,
    status,
    items: (v.detalle_ventas || []).map((d) => ({
      name: d.nombre_item,
      quantity: Number(d.cantidad || 0),
      amount: Number(d.subtotal || 0),
    })),
    rawSale: v,
  };
}

export type SalesTab = 'sales' | 'quotes' | 'returns';
export type SalesPeriod = 'all' | 'today' | '7d' | 'month' | 'custom';

export function calculatePeriodDates(period: SalesPeriod): { from: string; to: string } {
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
