import React, { useState } from 'react';
import { Eye, Printer, ExternalLink } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';

const transactions = [
  {
    id: 'txn-001',
    ref: 'F-2026-0842',
    customer: 'Rosa Martínez',
    cashier: 'Carlos Jiménez',
    items: 12,
    total: 'RD$ 4,820',
    method: 'Efectivo',
    status: 'paid' as const,
    time: '16:48',
  },
  {
    id: 'txn-002',
    ref: 'F-2026-0841',
    customer: 'Cliente Genérico',
    cashier: 'Ana Rodríguez',
    items: 5,
    total: 'RD$ 1,240',
    method: 'Tarjeta',
    status: 'paid' as const,
    time: '16:41',
  },
  {
    id: 'txn-003',
    ref: 'F-2026-0840',
    customer: 'Pedro Sánchez',
    cashier: 'Carlos Jiménez',
    items: 28,
    total: 'RD$ 12,600',
    method: 'Transferencia',
    status: 'paid' as const,
    time: '16:35',
  },
  {
    id: 'txn-004',
    ref: 'F-2026-0839',
    customer: 'María Torres',
    cashier: 'Luis Pérez',
    items: 3,
    total: 'RD$ 890',
    method: 'Efectivo',
    status: 'pending' as const,
    time: '16:22',
  },
  {
    id: 'txn-005',
    ref: 'F-2026-0838',
    customer: 'Supermercado Norte',
    cashier: 'Ana Rodríguez',
    items: 64,
    total: 'RD$ 38,400',
    method: 'Crédito',
    status: 'pending' as const,
    time: '16:10',
  },
  {
    id: 'txn-006',
    ref: 'F-2026-0837',
    customer: 'Josefa Guerrero',
    cashier: 'Luis Pérez',
    items: 9,
    total: 'RD$ 2,180',
    method: 'Efectivo',
    status: 'paid' as const,
    time: '15:58',
  },
  {
    id: 'txn-007',
    ref: 'F-2026-0836',
    customer: 'Cliente Genérico',
    cashier: 'Carlos Jiménez',
    items: 7,
    total: 'RD$ 1,640',
    method: 'Tarjeta',
    status: 'returned' as const,
    time: '15:44',
  },
  {
    id: 'txn-008',
    ref: 'F-2026-0835',
    customer: 'Fernando Díaz',
    cashier: 'Ana Rodríguez',
    items: 19,
    total: 'RD$ 7,920',
    method: 'Efectivo',
    status: 'paid' as const,
    time: '15:30',
  },
];

const statusMap = {
  paid: { variant: 'success' as const, label: 'Pagada' },
  pending: { variant: 'warning' as const, label: 'Pendiente' },
  returned: { variant: 'danger' as const, label: 'Devuelta' },
  draft: { variant: 'neutral' as const, label: 'Borrador' },
};

export default function RecentTransactions() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-foreground">Movimientos de Hoy</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Actualizando en tiempo real</p>
        </div>
        <Link to="/point-of-sale-pos" className="btn-primary text-xs py-1.5 px-3">
          + Nueva Venta
        </Link>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {['Referencia', 'Cliente', 'Cajero', 'Items', 'Total', 'Método', 'Estado', 'Hora', ''].map((col) => (
                <th
                  key={`col-txn-${col || 'actions'}`}
                  className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => {
              const s = statusMap[txn.status];
              return (
                <tr
                  key={txn.id}
                  onMouseEnter={() => setHoveredRow(txn.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs font-semibold text-primary">{txn.ref}</span>
                  </td>
                  <td className="px-4 py-2.5 text-foreground font-medium whitespace-nowrap text-sm">{txn.customer}</td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap text-xs">{txn.cashier}</td>
                  <td className="px-4 py-2.5 tabular-nums text-center text-foreground text-sm">{txn.items}</td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold text-foreground whitespace-nowrap text-sm">{txn.total}</td>
                  <td className="px-4 py-2.5">
                    <span className="badge-neutral text-xs">{txn.method}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge variant={s.variant} label={s.label} />
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground text-xs">{txn.time}</td>
                  <td className="px-4 py-2.5">
                    <div
                      className={`flex items-center gap-1 transition-opacity duration-150 ${
                        hoveredRow === txn.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <button
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Ver detalle de factura"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Imprimir factura"
                      >
                        <Printer size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Mostrando 8 de 318 movimientos hoy</p>
        <Link
          to="/sales"
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
        >
          Ver todos <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  );
}