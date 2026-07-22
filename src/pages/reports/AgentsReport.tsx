import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserCheck, Target, Trophy, Percent } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, chartTooltipStyle } from './shared';

const agentSales = [
  { name: 'Roberto Díaz', ventas: 86500, meta: 80000, tickets: 142 },
  { name: 'Luisa Fernández', ventas: 74200, meta: 75000, tickets: 98 },
  { name: 'Miguel Torres', ventas: 52800, meta: 60000, tickets: 86 },
  { name: 'Ana Castillo', ventas: 41300, meta: 50000, tickets: 64 },
];

const agentRows = agentSales.map((a) => {
  const pct = Math.round((a.ventas / a.meta) * 100);
  const commission = a.ventas * 0.025;
  return [
    a.name,
    a.tickets.toString(),
    formatRD(a.ventas),
    formatRD(a.meta),
    <span key={a.name} className={pct >= 100 ? 'badge-success' : pct >= 80 ? 'badge-warning' : 'badge-danger'}>
      {pct}%
    </span>,
    formatRD(commission),
  ];
});

export default function AgentsReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Agentes activos" value="4" trend="Equipo comercial" icon={<UserCheck size={16} className="text-primary" />} />
        <KpiCard label="Ventas del equipo" value="RD$ 255K" trend="+11% vs periodo anterior" icon={<Trophy size={16} className="text-success" />} />
        <KpiCard label="Meta del equipo" value="RD$ 265K" trend="96% cumplida" icon={<Target size={16} className="text-info" />} />
        <KpiCard label="Comisiones estimadas" value="RD$ 6.4K" trend="2.5% sobre ventas" icon={<Percent size={16} className="text-warning" />} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-foreground mb-4">Ventas vs meta por agente</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={agentSales} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
            <Bar dataKey="ventas" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Ventas" />
            <Bar dataKey="meta" fill="var(--muted)" radius={[4, 4, 0, 0]} name="Meta" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Rendimiento de agentes</h3>
        <ReportTable
          headers={['Agente', 'Tickets', 'Ventas', 'Meta', 'Cumplimiento', 'Comisión']}
          rows={agentRows}
        />
      </div>
    </div>
  );
}
