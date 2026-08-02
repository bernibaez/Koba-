import React, { useEffect, useState } from 'react';
import { Banknote, CreditCard, ArrowLeftRight, Wallet } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, ReportLoading, ReportError, type ReportPeriodProps } from './shared';
import { informeCaja, type InformeCaja } from '@/services/informes.service';

const diffBadge = (v: string) => {
  const n = Number(String(v).replace(/[^\d.-]/g, '') || 0);
  if (n < 0) return <span className="badge-danger">{v}</span>;
  if (n === 0) return <span className="badge-success">{v}</span>;
  return <span className="badge-warning">{v}</span>;
};

export default function CashierReport({ dateFrom, dateTo }: ReportPeriodProps) {
  const [data, setData] = useState<InformeCaja | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    informeCaja({ desde: dateFrom, hasta: dateTo })
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Error al cargar caja');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [dateFrom, dateTo]);

  if (loading) return <ReportLoading />;
  if (error) return <ReportError error={error} />;
  if (!data) return <ReportError error="Sin datos" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Efectivo declarado" value={formatRD(data.efectivo)} trend={`${data.sessions.length} sesiones`} icon={<Banknote size={16} className="text-success" />} />
        <KpiCard label="Ventas en tarjeta" value={formatRD(data.tarjeta)} trend="Cierres del periodo" icon={<CreditCard size={16} className="text-info" />} />
        <KpiCard label="Diferencia de arqueo" value={formatRD(data.diferencia)} trend="Suma de diferencias" icon={<ArrowLeftRight size={16} className="text-warning" />} />
        <KpiCard label="Fondo de caja" value={formatRD(data.fondo)} trend="Aperturas" icon={<Wallet size={16} className="text-primary" />} />
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-foreground">Resumen de arqueo</h3>
        {[
          { label: 'Efectivo (cierres)', value: formatRD(data.efectivo) },
          { label: 'Tarjeta (cierres)', value: formatRD(data.tarjeta) },
          { label: 'Fondo apertura', value: formatRD(data.fondo) },
          { label: 'Diferencia total', value: formatRD(data.diferencia) },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Sesiones de caja</h3>
        <ReportTable
          headers={['Sesión', 'Apertura', 'Caja', 'Ventas', 'Efectivo', 'Esperado', 'Contado', 'Dif.']}
          rows={data.sessions.map((r) => [...r.slice(0, 7), diffBadge(String(r[7]))])}
        />
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Movimientos (ventas del periodo)</h3>
        <ReportTable
          headers={['Hora', 'Tipo', 'Detalle', 'Efectivo', 'Total']}
          rows={data.movements}
        />
      </div>
    </div>
  );
}
