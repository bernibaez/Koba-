import React, { useEffect, useState } from 'react';
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
import { obtenerTopProductosVendidos, type ProductoTopVenta } from '@/services/dashboard.service';

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
  const [data, setData] = useState<ProductoTopVenta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await obtenerTopProductosVendidos(8);
        if (alive) setData(rows);
      } catch {
        if (alive) setData([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <div className="h-60 animate-pulse rounded-lg bg-secondary" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
        Sin ventas registradas aún
      </div>
    );
  }

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
