import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserPlus, CreditCard, Star, Clock, Package } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, chartTooltipStyle } from './shared';

const topCustomers = [
  { name: 'Distribuidora XYZ', compras: 8, total: 186400 },
  { name: 'Empresa ABC S.R.L.', compras: 12, total: 142800 },
  { name: 'Juan Pérez', compras: 15, total: 28400 },
  { name: 'Rosa Jiménez', compras: 9, total: 15200 },
  { name: 'Pedro Martínez', compras: 7, total: 12800 },
];

const customerRows = [
  ['CLI-001', 'Juan Pérez', 'Cédula', '001-1234567-8', '15', formatRD(28400), formatRD(0), '15/01/2024'],
  ['CLI-002', 'Empresa ABC S.R.L.', 'RNC', '131-45678-9', '12', formatRD(142800), formatRD(8500), '14/01/2024'],
  ['CLI-003', 'Rosa Jiménez', 'Cédula', '402-9876543-1', '9', formatRD(15200), formatRD(1003), '14/01/2024'],
  ['CLI-004', 'Distribuidora XYZ', 'RNC', '101-22334-5', '8', formatRD(186400), formatRD(0), '13/01/2024'],
  ['CLI-005', 'Pedro Martínez', 'Cédula', '001-5554433-2', '7', formatRD(12800), formatRD(0), '12/01/2024'],
  ['CLI-006', 'Carmen Reyes', 'Cédula', '402-1122334-5', '4', formatRD(6200), formatRD(0), '10/01/2024'],
];

const pendingBalanceRows = [
  ['CLI-002', 'Empresa ABC S.R.L.', 'FAC-002', '15/01/2024', formatRD(8500), '14 días'],
  ['CLI-003', 'Rosa Jiménez', 'FAC-003', '14/01/2024', formatRD(1003), '7 días'],
];

const lastPurchaseRows = [
  ['CLI-001', 'Juan Pérez', 'FAC-001', '15/01/2024', formatRD(2832), '8 ítems'],
  ['CLI-002', 'Empresa ABC S.R.L.', 'FAC-002', '14/01/2024', formatRD(21830), '25 ítems'],
  ['CLI-003', 'Rosa Jiménez', 'FAC-003', '14/01/2024', formatRD(1003), '4 ítems'],
  ['CLI-004', 'Distribuidora XYZ', 'FAC-004', '13/01/2024', formatRD(53100), '40 ítems'],
];

const topProductsBought = [
  { product: 'Arroz Selecto 5lb', clients: 42, qty: 186, total: 52920 },
  { product: 'Aceite Vegetal 1L', clients: 38, qty: 94, total: 20680 },
  { product: 'Leche Entera 1L', clients: 35, qty: 210, total: 13650 },
  { product: 'Azúcar Blanca 2lb', clients: 29, qty: 120, total: 11400 },
  { product: 'Refresco Cola 2L', clients: 24, qty: 88, total: 7480 },
];

export default function CustomersReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Clientes activos" value="248" trend="+18 nuevos este mes" icon={<Users size={16} className="text-info" />} />
        <KpiCard label="Nuevos en periodo" value="18" trend="+22% vs mes anterior" icon={<UserPlus size={16} className="text-primary" />} />
        <KpiCard label="CxC pendiente" value="RD$ 9.5K" trend="3 facturas a crédito" trendPositive={false} icon={<CreditCard size={16} className="text-warning" />} />
        <KpiCard label="Ticket promedio" value="RD$ 1,420" trend="Clientes frecuentes" icon={<Star size={16} className="text-success" />} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-foreground mb-4">Top clientes por facturación</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topCustomers} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
            <Bar dataKey="total" fill="var(--info)" radius={[0, 4, 4, 0]} name="Facturado" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Detalle de clientes</h3>
        <ReportTable
          headers={['Código', 'Cliente', 'Doc.', 'Identificación', 'Compras', 'Total periodo', 'Saldo', 'Última compra']}
          rows={customerRows}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={16} className="text-warning" />
          <h3 className="font-semibold text-foreground">Balance pendiente</h3>
        </div>
        <ReportTable
          headers={['Código', 'Cliente', 'Factura', 'Fecha', 'Saldo', 'Plazo']}
          rows={pendingBalanceRows}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-info" />
          <h3 className="font-semibold text-foreground">Última compra</h3>
        </div>
        <ReportTable
          headers={['Código', 'Cliente', 'Factura', 'Fecha', 'Monto', 'Ítems']}
          rows={lastPurchaseRows}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-primary" />
          <h3 className="font-semibold text-foreground">Productos más comprados</h3>
        </div>
        <div className="card p-5 mb-3">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProductsBought}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="product" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number, name: string) => (name === 'total' ? formatRD(v) : v)} contentStyle={chartTooltipStyle} />
              <Bar dataKey="qty" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ReportTable
          headers={['Producto', 'Clientes', 'Cantidad', 'Total']}
          rows={topProductsBought.map((p) => [p.product, p.clients, p.qty, formatRD(p.total)])}
        />
      </div>
    </div>
  );
}
