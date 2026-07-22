import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { ShoppingCart, Receipt, CreditCard, BarChart2 } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, chartTooltipStyle } from './shared';

const dailySales = [
  { day: 'Lun', ventas: 28400, tickets: 92 },
  { day: 'Mar', ventas: 32100, tickets: 108 },
  { day: 'Mié', ventas: 29800, tickets: 95 },
  { day: 'Jue', ventas: 35600, tickets: 118 },
  { day: 'Vie', ventas: 41200, tickets: 142 },
  { day: 'Sáb', ventas: 48500, tickets: 168 },
  { day: 'Dom', ventas: 22300, tickets: 74 },
];

const paymentMethods = [
  { name: 'Efectivo', value: 38, color: '#16a34a' },
  { name: 'Tarjeta', value: 32, color: '#2563eb' },
  { name: 'Transferencia', value: 18, color: '#d97706' },
  { name: 'Crédito', value: 8, color: '#dc2626' },
  { name: 'Cheque', value: 4, color: '#64748b' },
];

const salesRows = [
  ['FAC-001', '15/01/2024', 'Juan Pérez', '8', 'Efectivo', 'Roberto Díaz', formatRD(2832)],
  ['FAC-002', '15/01/2024', 'Empresa ABC S.R.L.', '25', 'Transferencia', 'Luisa Fernández', formatRD(21830)],
  ['FAC-003', '14/01/2024', 'Rosa Jiménez', '4', 'Crédito', 'Roberto Díaz', formatRD(1003)],
  ['FAC-004', '14/01/2024', 'Distribuidora XYZ', '40', 'Cheque', 'Luisa Fernández', formatRD(53100)],
  ['FAC-006', '13/01/2024', 'Pedro Martínez', '12', 'Tarjeta', 'Roberto Díaz', formatRD(3776)],
  ['FAC-007', '13/01/2024', 'Carmen Reyes', '6', 'Efectivo', 'Miguel Torres', formatRD(2140)],
];

export default function SalesReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ventas del periodo" value="RD$ 238K" trend="+14.2% vs periodo anterior" icon={<ShoppingCart size={16} className="text-info" />} />
        <KpiCard label="Tickets / facturas" value="797" trend="+9.1% vs periodo anterior" icon={<Receipt size={16} className="text-primary" />} />
        <KpiCard label="Ticket promedio" value="RD$ 298" trend="+4.8% vs periodo anterior" icon={<BarChart2 size={16} className="text-success" />} />
        <KpiCard label="ITBIS cobrado" value="RD$ 38.2K" trend="18% de ventas" trendPositive icon={<CreditCard size={16} className="text-warning" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-foreground mb-4">Ventas diarias</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
              <Bar dataKey="ventas" fill="var(--info)" radius={[4, 4, 0, 0]} name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-foreground mb-4">Métodos de pago</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={2}>
                {paymentMethods.map((e) => (
                  <Cell key={e.name} fill={e.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {paymentMethods.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                  <span className="text-muted-foreground">{m.name}</span>
                </div>
                <span className="font-semibold text-foreground">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Detalle de ventas</h3>
        <ReportTable
          headers={['Factura', 'Fecha', 'Cliente', 'Ítems', 'Pago', 'Agente', 'Total']}
          rows={salesRows}
        />
      </div>
    </div>
  );
}
