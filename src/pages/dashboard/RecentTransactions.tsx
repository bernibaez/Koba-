import React from 'react';
import { Eye, Printer, ExternalLink } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { useVentas } from '@/hooks/useVentas';

export default function RecentTransactions() {
  const { ventas, loading } = useVentas({ pagina: 1, limite: 8 });

  const transactions = ventas.map((v) => {
    const d = new Date(v.creado_en);
    return {
      id: v.id,
      ref: v.numero_factura,
      customer: 'Cliente',
      cashier: 'Cajero',
      items: 0,
      total: `RD$ ${Number(v.monto_total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      method:
        v.metodo_pago === 'efectivo'
          ? 'Efectivo'
          : v.metodo_pago === 'tarjeta'
            ? 'Tarjeta'
            : v.metodo_pago === 'transferencia'
              ? 'Transferencia'
              : v.metodo_pago === 'credito'
                ? 'Crédito'
                : 'Mixto',
      status: (v.estado === 'completada' ? 'paid' : 'pending') as 'paid' | 'pending',
      time: d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
    };
  });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-bold text-foreground">Transacciones recientes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Desde Supabase · ventas reales</p>
        </div>
        <Link
          to="/sales"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          Ver todas <ExternalLink size={12} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left py-2.5 px-4 text-muted-foreground font-semibold">Factura</th>
              <th className="text-left py-2.5 px-4 text-muted-foreground font-semibold">Método</th>
              <th className="text-right py-2.5 px-4 text-muted-foreground font-semibold">Total</th>
              <th className="text-center py-2.5 px-4 text-muted-foreground font-semibold">Estado</th>
              <th className="text-right py-2.5 px-4 text-muted-foreground font-semibold">Hora</th>
              <th className="text-center py-2.5 px-4" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No hay ventas registradas aún
                </td>
              </tr>
            )}
            {transactions.map((txn) => (
              <tr key={txn.id} className="border-b border-border/60 hover:bg-secondary/30">
                <td className="py-3 px-4 font-semibold text-foreground">{txn.ref}</td>
                <td className="py-3 px-4 text-muted-foreground">{txn.method}</td>
                <td className="py-3 px-4 text-right font-bold tabular-nums">{txn.total}</td>
                <td className="py-3 px-4 text-center">
                  <StatusBadge
                    variant={txn.status === 'paid' ? 'success' : 'warning'}
                    label={txn.status === 'paid' ? 'Pagada' : 'Pendiente'}
                  />
                </td>
                <td className="py-3 px-4 text-right text-muted-foreground">{txn.time}</td>
                <td className="py-3 px-4 text-center">
                  <div className="inline-flex gap-1">
                    <button type="button" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                      <Eye size={14} />
                    </button>
                    <button type="button" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                      <Printer size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
