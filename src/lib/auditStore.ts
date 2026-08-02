/** Persistence and tracking for System Audit Trail (Auditoría de Acciones) */

export type AuditActionType =
  | 'Venta'
  | 'Devolución'
  | 'Edición de producto'
  | 'Cambio de precio'
  | 'Eliminación'
  | 'Cierre de caja'
  | 'Apertura de caja'
  | 'Inicio de caja'
  | 'Compra'
  | 'Pago';

export type AuditLog = {
  id: string;
  user: string;
  role: string;
  timestamp: string; // ISO String
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  action: AuditActionType;
  module: string;
  details: string;
  before?: Record<string, unknown> | string | null;
  after?: Record<string, unknown> | string | null;
  ip: string;
};

const STORAGE_KEY = 'marketerp_audit_logs';

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    user: 'Admin General',
    role: 'Administrador',
    timestamp: '2026-07-26T10:15:30Z',
    date: '2026-07-26',
    time: '10:15:30',
    action: 'Venta',
    module: 'Punto de Venta (POS)',
    details: 'Venta procesada FAC-1201 por RD$ 2,832.00',
    before: null,
    after: { invoice: 'FAC-1201', total: 2832, payment: 'Efectivo' },
    ip: '192.168.1.100',
  },
  {
    id: 'log-2',
    user: 'María García',
    role: 'Cajero',
    timestamp: '2026-07-26T11:20:00Z',
    date: '2026-07-26',
    time: '11:20:00',
    action: 'Devolución',
    module: 'Devoluciones',
    details: 'Devolución registrada DEV-001 para la factura FAC-1201',
    before: { status: 'Completa' },
    after: { status: 'Devuelto', refundAmount: 450 },
    ip: '192.168.1.102',
  },
  {
    id: 'log-3',
    user: 'Admin General',
    role: 'Administrador',
    timestamp: '2026-07-26T12:05:10Z',
    date: '2026-07-26',
    time: '12:05:10',
    action: 'Cambio de precio',
    module: 'Gestión de Productos',
    details: 'Actualización de precio de venta en producto Arroz Selecto 5lb',
    before: { salePrice: 280.00 },
    after: { salePrice: 285.00 },
    ip: '192.168.1.100',
  },
  {
    id: 'log-4',
    user: 'María García',
    role: 'Cajero',
    timestamp: '2026-07-25T18:30:00Z',
    date: '2026-07-25',
    time: '18:30:00',
    action: 'Cierre de caja',
    module: 'Caja',
    details: 'Cierre de caja efectuado CC-001 por RD$ 48,250.50',
    before: { status: 'Abierta' },
    after: { status: 'Cerrada', difference: 0 },
    ip: '192.168.1.102',
  },
];

export function getAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw) as AuditLog[];
  } catch {
    return INITIAL_LOGS;
  }
}

export function logAuditEvent(params: {
  user: string;
  role: string;
  action: AuditActionType;
  module: string;
  details: string;
  before?: Record<string, unknown> | string | null;
  after?: Record<string, unknown> | string | null;
  ip?: string;
}) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString('es-DO', { hour12: false });
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user: params.user,
    role: params.role,
    timestamp: now.toISOString(),
    date,
    time,
    action: params.action,
    module: params.module,
    details: params.details,
    before: params.before ?? null,
    after: params.after ?? null,
    ip: params.ip || '127.0.0.1 (Local)',
  };

  const logs = getAuditLogs();
  const updated = [newLog, ...logs];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 500))); // Keep last 500 logs
  } catch {
    // Fail-safe
  }
  return newLog;
}
