'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const data = [
  { name: 'Arroz Selecto 5lb', ventas: 48200 },
  { name: 'Aceite Vegetal 1L', ventas: 41800 },
  { name: 'Pollo Entero/lb', ventas: 38400 },
  { name: 'Leche Evaporada', ventas: 32100 },
  { name: 'Azúcar Blanca 5lb', ventas: 28700 },
  { name: 'Huevos x12', ventas: 24500 },
  { name: 'Pan de Agua', ventas: 21300 },
  { name: 'Habichuelas Neg.', ventas: 18900 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-card-hover text-sm">
      <p className="font-medium text-foreground mb-1 text-xs">{label}</p>
      <p className="font-bold tabular-nums text-primary">
        RD$ {payload[0].value.toLocaleString('es-DO')}
      </p>
    </div>
  );
}

const COLORS = [
  'var(--primary)',
  '#22c55e',
  '#4ade80',
  '#86efac',
  '#bbf7d0',
  '#d1fae5',
  '#a7f3d0',
  '#6ee7b7',
];

export default function TopProductsChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        barSize={12}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="ventas" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-top-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}