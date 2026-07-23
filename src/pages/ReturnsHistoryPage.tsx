import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, Download, RotateCcw } from 'lucide-react';
import { getPosReturns, type PosReturn } from '@/lib/posStore';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';

const methodLabel: Record<PosReturn['method'], string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  credit_note: 'Nota de crédito',
  exchange: 'Cambio',
};

const typeLabel: Record<PosReturn['type'], string> = {
  partial: 'Parcial',
  full: 'Total',
};

export default function ReturnsHistoryPage() {
  const [returns] = useState<PosReturn[]>(() => getPosReturns());
  const [date, setDate] = useState('');
  const [user, setUser] = useState('');
  const [customer, setCustomer] = useState('');
  const [cashier, setCashier] = useState('');
  const [product, setProduct] = useState('');

  const filtered = useMemo(() => {
    const q = product.toLowerCase().trim();
    return returns.filter((r) => {
      if (date && r.date !== date) return false;
      if (user && !r.user.toLowerCase().includes(user.toLowerCase())) return false;
      if (customer && !r.customer.toLowerCase().includes(customer.toLowerCase())) return false;
      if (cashier && !r.cashier.toLowerCase().includes(cashier.toLowerCase())) return false;
      if (q) {
        const matchProduct = r.products.some(
          (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
        );
        if (!matchProduct) return false;
      }
      return true;
    });
  }, [returns, date, user, customer, cashier, product]);

  const totalAmount = filtered.reduce((s, r) => s + r.total, 0);

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Historial de Devoluciones',
      filename: 'historial-devoluciones',
      headers: [
        'Código', 'Venta', 'Cliente', 'Fecha', 'Hora', 'Usuario', 'Cajero',
        'Productos', 'Total', 'Motivo', 'Método', 'Tipo',
      ],
      rows: filtered.map((r) => [
        r.code,
        r.saleCode,
        r.customer,
        r.date,
        r.time,
        r.user,
        r.cashier,
        r.products.map((p) => `${p.name} x${p.qty}`).join(', '),
        formatMoneyPdf(r.total),
        r.reason,
        methodLabel[r.method],
        typeLabel[r.type],
      ]),
      landscape: true,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Historial de Devoluciones</h1>
            <p className="text-sm text-muted-foreground mt-1">Consulta devoluciones registradas en el POS</p>
          </div>
          <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-2 w-fit">
            <Download size={16} />
            Exportar PDF
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Devoluciones</p>
            <p className="text-2xl font-bold text-foreground mt-1">{filtered.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Monto total</p>
            <p className="text-2xl font-bold text-danger mt-1">
              RD$ {totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Registradas</p>
            <p className="text-2xl font-bold text-info mt-1">{returns.length}</p>
          </div>
        </div>

        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fecha</label>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Usuario</label>
              <input className="input-field" placeholder="Usuario..." value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente</label>
              <input className="input-field" placeholder="Cliente..." value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cajero</label>
              <input className="input-field" placeholder="Cajero..." value={cashier} onChange={(e) => setCashier(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Producto</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="input-field pl-9"
                  placeholder="Buscar producto..."
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Venta</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Hora</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Cajero</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">Productos</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Motivo</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Método</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                      <RotateCcw size={28} className="mx-auto mb-2 opacity-40" />
                      No hay devoluciones con estos filtros
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}
                    >
                      <td className="px-4 py-3 font-mono text-danger font-medium">{r.code}</td>
                      <td className="px-4 py-3 font-mono text-primary">{r.saleCode}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{r.customer}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.date}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{r.time}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{r.user}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{r.cashier}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell max-w-[200px] truncate">
                        {r.products.map((p) => `${p.name} x${p.qty}`).join(', ')}
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground">
                        RD$ {r.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.reason}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="badge-info">{methodLabel[r.method]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={r.type === 'full' ? 'badge-warning' : 'badge-success'}>
                          {typeLabel[r.type]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
