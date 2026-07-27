import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, DollarSign, Download, FileSpreadsheet, Calendar, CreditCard, ShoppingBag, Users } from 'lucide-react';
import { KpiCard, chartTooltipStyle, formatRD } from './shared';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';

type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function ProfitLossReport() {
  const [period, setPeriod] = useState<PeriodPreset>('month');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-26');

  // Dynamic values depending on selected period
  const periodData = {
    today: {
      ventas: 48250.50,
      costo: 32100.00,
      gananciaBruta: 16150.50,
      itbis: 7360.25,
      gananciaNeta: 13950.25,
      qtySold: 184,
      prodsSold: 32,
      customers: 28,
    },
    yesterday: {
      ventas: 52100.00,
      costo: 34800.00,
      gananciaBruta: 17300.00,
      itbis: 7950.00,
      gananciaNeta: 14850.00,
      qtySold: 210,
      prodsSold: 38,
      customers: 34,
    },
    week: {
      ventas: 245800.00,
      costo: 164200.00,
      gananciaBruta: 81600.00,
      itbis: 37500.00,
      gananciaNeta: 71200.00,
      qtySold: 980,
      prodsSold: 64,
      customers: 142,
    },
    month: {
      ventas: 985000.00,
      costo: 658000.00,
      gananciaBruta: 327000.00,
      itbis: 150200.00,
      gananciaNeta: 284500.00,
      qtySold: 4120,
      prodsSold: 125,
      customers: 560,
    },
    custom: {
      ventas: 680000.00,
      costo: 452000.00,
      gananciaBruta: 228000.00,
      itbis: 103800.00,
      gananciaNeta: 198200.00,
      qtySold: 2890,
      prodsSold: 95,
      customers: 380,
    },
  }[period];

  const chartData = [
    { name: 'Ventas Total', monto: periodData.ventas, fill: 'var(--info)' },
    { name: 'Costo Total', monto: periodData.costo, fill: 'var(--danger)' },
    { name: 'ITBIS (18%)', monto: periodData.itbis, fill: 'var(--warning)' },
    { name: 'Ganancia Bruta', monto: periodData.gananciaBruta, fill: 'var(--primary)' },
    { name: 'Ganancia Neta', monto: periodData.gananciaNeta, fill: 'var(--success)' },
  ];

  const paymentMethodsData = [
    { name: 'Efectivo', value: Math.round(periodData.ventas * 0.45), color: '#16a34a' },
    { name: 'Tarjeta', value: Math.round(periodData.ventas * 0.32), color: '#2563eb' },
    { name: 'Transferencia', value: Math.round(periodData.ventas * 0.18), color: '#d97706' },
    { name: 'Crédito', value: Math.round(periodData.ventas * 0.05), color: '#dc2626' },
  ];

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Ganancias y Pérdidas (P&L)',
      subtitle: `Periodo: ${period.toUpperCase()} (${startDate} al ${endDate})`,
      filename: 'ganancias-y-perdidas',
      headers: ['Métrica / Indicador', 'Monto (RD$) / Valor'],
      rows: [
        ['Ventas Totales', formatMoneyPdf(periodData.ventas)],
        ['Costo de Ventas', formatMoneyPdf(periodData.costo)],
        ['Ganancia Bruta', formatMoneyPdf(periodData.gananciaBruta)],
        ['ITBIS Transparentado (18%)', formatMoneyPdf(periodData.itbis)],
        ['Ganancia Neta Estimada', formatMoneyPdf(periodData.gananciaNeta)],
        ['Cantidad Unidades Vendidas', `${periodData.qtySold} uds`],
        ['Productos Distintos Vendidos', `${periodData.prodsSold} productos`],
        ['Clientes Atendidos', `${periodData.customers} clientes`],
      ],
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Reporte de Ganancias y Pérdidas (P&L)',
      filename: 'ganancias-y-perdidas',
      headers: ['Métrica / Indicador', 'Valor'],
      rows: [
        ['Ventas Totales', periodData.ventas],
        ['Costo de Ventas', periodData.costo],
        ['Ganancia Bruta', periodData.gananciaBruta],
        ['ITBIS Transparentado', periodData.itbis],
        ['Ganancia Neta', periodData.gananciaNeta],
        ['Cantidad Unidades Vendidas', periodData.qtySold],
        ['Productos Vendidos', periodData.prodsSold],
        ['Clientes Atendidos', periodData.customers],
      ],
    });
  };

  return (
    <div className="space-y-5">
      {/* Date Preset Selector */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl flex-wrap">
          {[
            { id: 'today' as PeriodPreset, label: 'Hoy' },
            { id: 'yesterday' as PeriodPreset, label: 'Ayer' },
            { id: 'week' as PeriodPreset, label: 'Esta Semana' },
            { id: 'month' as PeriodPreset, label: 'Este Mes' },
            { id: 'custom' as PeriodPreset, label: 'Personalizado' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Desde:</span>
            <input type="date" className="input-field py-1 text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="text-muted-foreground">Hasta:</span>
            <input type="date" className="input-field py-1 text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={handleExportPdf} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
            <Download size={14} /> PDF
          </button>
          <button type="button" onClick={handleExportExcel} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
            <FileSpreadsheet size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Primary Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Ventas Totales" value={`RD$ ${(periodData.ventas / 1000).toFixed(1)}K`} trend="Facturado" icon={<TrendingUp size={16} className="text-info" />} />
        <KpiCard label="Costo Total" value={`RD$ ${(periodData.costo / 1000).toFixed(1)}K`} trend="Costo de inventario" trendPositive={false} icon={<TrendingDown size={16} className="text-danger" />} />
        <KpiCard label="Ganancia Bruta" value={`RD$ ${(periodData.gananciaBruta / 1000).toFixed(1)}K`} trend="Ventas - Costo" icon={<BarChart2 size={16} className="text-primary" />} />
        <KpiCard label="ITBIS (18%)" value={`RD$ ${(periodData.itbis / 1000).toFixed(1)}K`} trend="Impuestos" icon={<DollarSign size={16} className="text-warning" />} />
        <KpiCard label="Ganancia Neta" value={`RD$ ${(periodData.gananciaNeta / 1000).toFixed(1)}K`} trend="Resultado Neto" icon={<TrendingUp size={16} className="text-success" />} />
      </div>

      {/* Operational Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center font-bold">
            <ShoppingBag size={18} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cantidad Vendida</p>
            <p className="text-lg font-bold text-foreground">{periodData.qtySold.toLocaleString()} uds</p>
          </div>
        </div>
        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <BarChart2 size={18} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Productos Vendidos</p>
            <p className="text-lg font-bold text-foreground">{periodData.prodsSold} ítems</p>
          </div>
        </div>
        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Clientes Atendidos</p>
            <p className="text-lg font-bold text-foreground">{periodData.customers} personas</p>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Desglose Financiero de Ganancias y Pérdidas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
              <Bar dataKey="monto" radius={[6, 6, 0, 0]} name="Monto (RD$)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Ventas por Método de Pago</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={paymentMethodsData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value" paddingAngle={3}>
                {paymentMethodsData.map((e) => (
                  <Cell key={e.name} fill={e.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 text-xs">
            {paymentMethodsData.map((m) => (
              <div key={m.name} className="flex items-center justify-between border-b border-border/50 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                  <span className="text-muted-foreground">{m.name}</span>
                </div>
                <span className="font-bold text-foreground">RD$ {m.value.toLocaleString('es-DO')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
