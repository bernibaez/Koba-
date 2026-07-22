import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data7d = [
  { day: 'Lun 14', ventas: 62400, meta: 70000 },
  { day: 'Mar 15', ventas: 78900, meta: 70000 },
  { day: 'Mié 16', ventas: 54200, meta: 70000 },
  { day: 'Jue 17', ventas: 91300, meta: 70000 },
  { day: 'Vie 18', ventas: 103800, meta: 70000 },
  { day: 'Sáb 19', ventas: 128400, meta: 70000 },
  { day: 'Dom 20', ventas: 87420, meta: 70000 },
];

const data30d = [
  { day: '21 Jun', ventas: 58200, meta: 65000 },
  { day: '23 Jun', ventas: 71400, meta: 65000 },
  { day: '25 Jun', ventas: 63800, meta: 65000 },
  { day: '27 Jun', ventas: 88200, meta: 65000 },
  { day: '29 Jun', ventas: 54100, meta: 65000 },
  { day: '01 Jul', ventas: 79600, meta: 70000 },
  { day: '03 Jul', ventas: 92300, meta: 70000 },
  { day: '05 Jul', ventas: 67800, meta: 70000 },
  { day: '07 Jul', ventas: 84500, meta: 70000 },
  { day: '09 Jul', ventas: 110200, meta: 70000 },
  { day: '11 Jul', ventas: 73400, meta: 70000 },
  { day: '13 Jul', ventas: 95700, meta: 70000 },
  { day: '15 Jul', ventas: 88100, meta: 70000 },
  { day: '17 Jul', ventas: 61200, meta: 70000 },
  { day: '19 Jul', ventas: 87420, meta: 70000 },
];

const formatDOP = (v: number) => `RD$ ${(v / 1000).toFixed(0)}k`;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-card-hover text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={`tt-sales-${i}`} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums text-foreground">
            RD$ {p.value.toLocaleString('es-DO')}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SalesTrendChart({ period }: { period: '7d' | '30d' }) {
  const data = period === '7d' ? data7d : data30d;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradMeta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.12} />
            <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          interval={period === '30d' ? 2 : 0}
        />
        <YAxis
          tickFormatter={formatDOP}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="meta"
          name="Meta"
          stroke="var(--muted-foreground)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="url(#gradMeta)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="ventas"
          name="Ventas"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#gradVentas)"
          dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}