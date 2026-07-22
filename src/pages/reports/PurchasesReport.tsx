import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingBag, Truck, Package, AlertTriangle } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, chartTooltipStyle } from './shared';

const monthlyPurchases = [
  { month: 'Ago', compras: 98000, ordenes: 28 },
  { month: 'Sep', compras: 110000, ordenes: 32 },
  { month: 'Oct', compras: 95000, ordenes: 26 },
  { month: 'Nov', compras: 118000, ordenes: 35 },
  { month: 'Dic', compras: 140000, ordenes: 41 },
  { month: 'Ene', compras: 125000, ordenes: 38 },
];

const purchaseRows = [
  ['OC-0142', '15/01/2024', 'Distribuidora Norte', 'Recibida', '38', formatRD(45200)],
  ['OC-0141', '14/01/2024', 'Alimentos del Caribe', 'Recibida', '22', formatRD(28100)],
  ['OC-0140', '12/01/2024', 'Bebidas RD S.A.', 'Parcial', '15', formatRD(18650)],
  ['OC-0139', '10/01/2024', 'Lácteos del Cibao', 'Pendiente', '40', formatRD(52000)],
  ['OC-0138', '08/01/2024', 'Carnes Selectas', 'Recibida', '12', formatRD(31400)],
  ['OC-0137', '05/01/2024', 'Distribuidora Norte', 'Cancelada', '8', formatRD(9200)],
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Recibida: 'badge-success',
    Parcial: 'badge-warning',
    Pendiente: 'badge-info',
    Cancelada: 'badge-danger',
  };
  return <span className={map[status] || 'badge-info'}>{status}</span>;
};

export default function PurchasesReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Compras del periodo" value="RD$ 125K" trend="-3.2% vs periodo anterior" trendPositive icon={<ShoppingBag size={16} className="text-warning" />} />
        <KpiCard label="Órdenes emitidas" value="38" trend="+4 vs mes anterior" icon={<Truck size={16} className="text-info" />} />
        <KpiCard label="Proveedores activos" value="12" trend="3 nuevos este mes" icon={<Package size={16} className="text-primary" />} />
        <KpiCard label="Pendientes de recibir" value="RD$ 52K" trend="2 órdenes abiertas" trendPositive={false} icon={<AlertTriangle size={16} className="text-danger" />} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-foreground mb-4">Compras mensuales</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyPurchases}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
            <Bar dataKey="compras" fill="var(--warning)" radius={[4, 4, 0, 0]} name="Compras" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Detalle de órdenes de compra</h3>
        <ReportTable
          headers={['Orden', 'Fecha', 'Proveedor', 'Estado', 'Ítems', 'Total']}
          rows={purchaseRows.map((r) => [r[0], r[1], r[2], statusBadge(String(r[3])), r[4], r[5]])}
        />
      </div>
    </div>
  );
}
