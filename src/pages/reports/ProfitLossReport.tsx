import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { KpiCard, chartTooltipStyle, formatRD } from './shared';

const salesData = [
  { month: 'Ago', ventas: 145000, compras: 98000, ganancias: 47000 },
  { month: 'Sep', ventas: 162000, compras: 110000, ganancias: 52000 },
  { month: 'Oct', ventas: 138000, compras: 95000, ganancias: 43000 },
  { month: 'Nov', ventas: 175000, compras: 118000, ganancias: 57000 },
  { month: 'Dic', ventas: 210000, compras: 140000, ganancias: 70000 },
  { month: 'Ene', ventas: 185000, compras: 125000, ganancias: 60000 },
];

const topProducts = [
  { name: 'Arroz Selecto 5lb', sold: 450, revenue: 126000 },
  { name: 'Aceite Vegetal 1L', sold: 320, revenue: 112000 },
  { name: 'Azúcar Blanca 2lb', sold: 280, revenue: 56000 },
  { name: 'Leche Entera 1L', sold: 260, revenue: 78000 },
  { name: 'Pollo Entero', sold: 180, revenue: 90000 },
];

const categoryData = [
  { name: 'Alimentos', value: 45, color: '#16a34a' },
  { name: 'Bebidas', value: 20, color: '#2563eb' },
  { name: 'Lácteos', value: 15, color: '#d97706' },
  { name: 'Carnes', value: 12, color: '#dc2626' },
  { name: 'Otros', value: 8, color: '#64748b' },
];

export default function ProfitLossReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ingresos" value="RD$ 185K" trend="+12.5% vs mes anterior" icon={<TrendingUp size={16} className="text-success" />} />
        <KpiCard label="Gastos" value="RD$ 125K" trend="+8.2% vs mes anterior" trendPositive={false} icon={<TrendingDown size={16} className="text-danger" />} />
        <KpiCard label="Ganancia neta" value="RD$ 60K" trend="+18.3% vs mes anterior" icon={<BarChart2 size={16} className="text-primary" />} />
        <KpiCard label="Margen" value="32.4%" trend="+2.1% vs mes anterior" icon={<TrendingUp size={16} className="text-info" />} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-foreground mb-4">Ventas vs Compras vs Ganancias (últimos 6 meses)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={salesData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
            <Bar dataKey="ventas" fill="var(--info)" radius={[4, 4, 0, 0]} name="Ventas" />
            <Bar dataKey="compras" fill="var(--warning)" radius={[4, 4, 0, 0]} name="Compras" />
            <Bar dataKey="ganancias" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Ganancias" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-foreground mb-4">Productos más vendidos</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <div className="h-1.5 bg-secondary rounded-full mt-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(p.sold / 450) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-foreground">{p.sold} uds</p>
                  <p className="text-xs text-muted-foreground">RD$ {(p.revenue / 1000).toFixed(0)}K</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-foreground mb-4">Ventas por categoría</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-muted-foreground">{c.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
