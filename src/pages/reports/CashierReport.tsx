import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Banknote, CreditCard, ArrowLeftRight, Wallet } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, chartTooltipStyle } from './shared';

const cashByHour = [
  { hour: '08h', monto: 4200 },
  { hour: '10h', monto: 8800 },
  { hour: '12h', monto: 15200 },
  { hour: '14h', monto: 11400 },
  { hour: '16h', monto: 18600 },
  { hour: '18h', monto: 22100 },
  { hour: '20h', monto: 9800 },
];

const cashierSessions = [
  ['CJ-001', 'Caja #1', 'Roberto Díaz', '08:00', '16:05', formatRD(48200), formatRD(48150), formatRD(-50)],
  ['CJ-002', 'Caja #2', 'Luisa Fernández', '08:00', '16:00', formatRD(35600), formatRD(35600), formatRD(0)],
  ['CJ-003', 'Caja #1', 'Miguel Torres', '16:00', '22:10', formatRD(52800), formatRD(52920), formatRD(120)],
];

const movementRows = [
  ['08:05', 'Apertura', 'Fondo inicial', formatRD(5000), '—'],
  ['10:42', 'Venta', 'FAC-0841 · Efectivo', formatRD(1240), formatRD(18420)],
  ['11:15', 'Retiro', 'Retiro a bóveda', formatRD(-10000), formatRD(8420)],
  ['14:30', 'Venta', 'FAC-0862 · Tarjeta', formatRD(0), formatRD(8420)],
  ['15:50', 'Ingreso', 'Cambio recibido', formatRD(2000), formatRD(10420)],
  ['16:05', 'Cierre', 'Arqueo de caja', formatRD(48150), '—'],
];

const diffBadge = (v: string) => {
  if (v.includes('-')) return <span className="badge-danger">{v}</span>;
  if (v === formatRD(0)) return <span className="badge-success">{v}</span>;
  return <span className="badge-warning">{v}</span>;
};

export default function CashierReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Efectivo declarado" value="RD$ 136.7K" trend="3 sesiones" icon={<Banknote size={16} className="text-success" />} />
        <KpiCard label="Ventas en tarjeta" value="RD$ 62.4K" trend="28% del día" icon={<CreditCard size={16} className="text-info" />} />
        <KpiCard label="Diferencia de arqueo" value="RD$ +70" trend="Dentro de tolerancia" icon={<ArrowLeftRight size={16} className="text-warning" />} />
        <KpiCard label="Fondo de caja" value="RD$ 5,000" trend="Por caja abierta" icon={<Wallet size={16} className="text-primary" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-foreground mb-4">Flujo de efectivo por hora</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
              <Bar dataKey="monto" fill="var(--success)" radius={[4, 4, 0, 0]} name="Efectivo" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Resumen de arqueo</h3>
          {[
            { label: 'Ventas efectivo', value: formatRD(87400) },
            { label: 'Ventas tarjeta', value: formatRD(62400) },
            { label: 'Transferencias', value: formatRD(18200) },
            { label: 'Retiros a bóveda', value: formatRD(-28000) },
            { label: 'Efectivo esperado', value: formatRD(136670) },
            { label: 'Efectivo contado', value: formatRD(136740) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold text-foreground">{row.value}</span>
            </div>
          ))}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Diferencia</span>
            <span className="text-sm font-bold text-success">+ RD$ 70</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Sesiones de caja</h3>
        <ReportTable
          headers={['Sesión', 'Caja', 'Cajero', 'Apertura', 'Cierre', 'Esperado', 'Contado', 'Dif.']}
          rows={cashierSessions.map((r) => [...r.slice(0, 7), diffBadge(String(r[7]))])}
        />
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Movimientos — Caja #1 (sesión CJ-001)</h3>
        <ReportTable
          headers={['Hora', 'Tipo', 'Detalle', 'Monto', 'Saldo caja']}
          rows={movementRows}
        />
      </div>
    </div>
  );
}
