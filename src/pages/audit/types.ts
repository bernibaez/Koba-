import type { AuditLog, AuditActionType } from '@/lib/auditStore';

export type { AuditLog, AuditActionType };

export const ACTION_BADGE_MAP: Record<AuditActionType, string> = {
  Venta: 'apple-badge-success',
  Devolución: 'apple-badge-warning',
  'Edición de producto': 'apple-badge-info',
  'Cambio de precio': 'apple-badge-warning',
  Eliminación: 'apple-badge-danger',
  'Cierre de caja': 'apple-badge-neutral',
  'Apertura de caja': 'apple-badge-success',
  'Inicio de caja': 'apple-badge-success',
  Compra: 'apple-badge-info',
  Pago: 'apple-badge-success',
};

export const ACTION_TYPES: AuditActionType[] = [
  'Venta',
  'Devolución',
  'Edición de producto',
  'Cambio de precio',
  'Eliminación',
  'Cierre de caja',
  'Apertura de caja',
  'Inicio de caja',
  'Compra',
  'Pago',
];
