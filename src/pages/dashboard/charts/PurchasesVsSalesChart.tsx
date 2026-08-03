import React, { useEffect, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  obtenerComprasVsVentasMensual,
  type PuntoComprasVsVentas,
} from '@/services/dashboard.service';

const fmt = (v: number) => `${(v / 1000000).toFixed(2)}M`;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-card-hover text-sm min-w-44">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={`tt-pvc-${i}`} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground text-xs">{p.name}</span>
          </div>
          <span className="font-semibold tabular-nums text-xs">
            RD$ {p.value.toLocaleString('es-DO')}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PurchasesVsSalesChart() {
  const [data, setData] = useState<PuntoComprasVsVentas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await obtenerComprasVsVentasMensual(7);
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
    return <div className="h-56 animate-pulse rounded-lg bg-secondary" />;
  }

  const hasData = data.some((d) => d.compras > 0 || d.ventas > 0);
  if (!hasData) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
        Sin compras ni ventas registradas en el período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          formatter={(value) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
        />
        <Bar
          dataKey="compras"
          name="Compras"
          fill="var(--secondary-foreground)"
          radius={[4, 4, 0, 0]}
          opacity={0.6}
          barSize={24}
        />
        <Bar dataKey="ventas" name="Ventas" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={24} />
        <Line
          type="monotone"
          dataKey="ganancia"
          name="Ganancia"
          stroke="var(--warning)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: 'var(--warning)', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
