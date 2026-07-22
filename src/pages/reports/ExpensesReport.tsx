import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { DollarSign, Receipt, Tag, TrendingUp } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, chartTooltipStyle } from './shared';

const expenseByCategory = [
  { name: 'Servicios', value: 18500, color: '#2563eb' },
  { name: 'Nómina extra', value: 12000, color: '#16a34a' },
  { name: 'Mantenimiento', value: 8500, color: '#d97706' },
  { name: 'Transporte', value: 6200, color: '#dc2626' },
  { name: 'Publicidad', value: 5000, color: '#7c3aed' },
  { name: 'Otros', value: 3800, color: '#64748b' },
];

const weeklyExpenses = [
  { week: 'Sem 1', monto: 14200 },
  { week: 'Sem 2', monto: 11800 },
  { week: 'Sem 3', monto: 16500 },
  { week: 'Sem 4', monto: 11500 },
];

const expenseRows = [
  ['GAS-001', '15/01/2024', 'Servicios', 'Pago de electricidad enero', 'Admin General', formatRD(8500), 'Aprobado'],
  ['GAS-002', '14/01/2024', 'Mantenimiento', 'Reparación de refrigerador', 'Carlos López', formatRD(3200), 'Aprobado'],
  ['GAS-003', '14/01/2024', 'Transporte', 'Combustible para entregas', 'Pedro Sánchez', formatRD(1800), 'Pendiente'],
  ['GAS-004', '13/01/2024', 'Limpieza', 'Productos de limpieza mensual', 'María García', formatRD(2400), 'Aprobado'],
  ['GAS-005', '12/01/2024', 'Publicidad', 'Anuncios en redes sociales', 'Admin General', formatRD(5000), 'Aprobado'],
];

const statusBadge = (s: string) => (
  <span className={s === 'Aprobado' ? 'badge-success' : 'badge-warning'}>{s}</span>
);

export default function ExpensesReport() {
  const total = expenseByCategory.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Gastos del periodo" value={formatRD(total)} trend="+8.2% vs periodo anterior" trendPositive={false} icon={<DollarSign size={16} className="text-danger" />} />
        <KpiCard label="Gastos aprobados" value="RD$ 52.2K" trend="12 comprobantes" icon={<Receipt size={16} className="text-success" />} />
        <KpiCard label="Pendientes" value="RD$ 1.8K" trend="1 por aprobar" trendPositive={false} icon={<Tag size={16} className="text-warning" />} />
        <KpiCard label="Promedio semanal" value="RD$ 13.5K" trend="Dentro de presupuesto" icon={<TrendingUp size={16} className="text-info" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-foreground mb-4">Gastos por categoría</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                  {expenseByCategory.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {expenseByCategory.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                    <span className="text-muted-foreground">{c.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatRD(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-foreground mb-4">Gastos semanales</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
              <Bar dataKey="monto" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Detalle de gastos</h3>
        <ReportTable
          headers={['Código', 'Fecha', 'Categoría', 'Descripción', 'Responsable', 'Monto', 'Estado']}
          rows={expenseRows.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], statusBadge(String(r[6]))])}
        />
      </div>
    </div>
  );
}
