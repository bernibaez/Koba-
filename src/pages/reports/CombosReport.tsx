import React, { useState } from 'react';
import {
  Boxes,
  TrendingUp,
  Sparkles,
  Download,
  PackageCheck,
  DollarSign,
  PieChart as PieIcon,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { getCombos, getComboSalesHistory, Combo, ComboSaleRecord } from '@/lib/comboStore';
import { exportTableToPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

const COLOR_PALETTE = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

export default function CombosReport() {
  const combos = getCombos();
  const salesHistory = getComboSalesHistory();

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  const formatCurrency = (val: number) => `RD$ ${val.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

  // Filter history by date if needed
  const filteredSales = salesHistory.filter((s) => {
    if (dateFilter === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      return s.date === today;
    }
    return true;
  });

  // Calculate totals
  const totalCombosSold = filteredSales.reduce((acc, s) => acc + s.qty, 0);
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + s.profitGenerated, 0);
  const totalSavingsGiven = filteredSales.reduce((acc, s) => acc + s.savingsGiven, 0);

  // Group sales per combo for top selling chart
  const salesByComboMap: Record<string, { name: string; code: string; qty: number; revenue: number; profit: number; savings: number }> = {};

  combos.forEach((c) => {
    salesByComboMap[c.id] = {
      name: c.name,
      code: c.code,
      qty: c.salesCount || 0,
      revenue: (c.salesCount || 0) * c.price,
      profit: (c.salesCount || 0) * (c.price - c.items.reduce((s, i) => s + i.costPrice * i.quantity, 0)),
      savings: (c.salesCount || 0) * c.savingsAmount,
    };
  });

  filteredSales.forEach((s) => {
    if (!salesByComboMap[s.comboId]) {
      salesByComboMap[s.comboId] = {
        name: s.comboName,
        code: s.comboCode,
        qty: s.qty,
        revenue: s.totalAmount,
        profit: s.profitGenerated,
        savings: s.savingsGiven,
      };
    }
  });

  const chartData = Object.values(salesByComboMap).sort((a, b) => b.qty - a.qty);

  // Calculate consumed products by combos
  const consumedProductsMap: Record<string, { name: string; qty: number }> = {};
  combos.forEach((combo) => {
    const totalComboSold = combo.salesCount || 0;
    combo.items.forEach((item) => {
      if (!consumedProductsMap[item.name]) {
        consumedProductsMap[item.name] = { name: item.name, qty: 0 };
      }
      consumedProductsMap[item.name].qty += item.quantity * totalComboSold;
    });
  });

  const consumedProductsList = Object.values(consumedProductsMap).sort((a, b) => b.qty - a.qty);

  const handleExportPDF = () => {
    exportTableToPdf({
      title: 'Informe de Rendimiento y Análisis de Combos',
      subtitle: 'MarketERP - Desglose de ventas, ahorros y consumo de productos',
      filename: 'reporte-combos-marketerp.pdf',
      landscape: true,
      headers: [
        'Código Combo',
        'Nombre del Combo',
        'Unidades Vendidas',
        'Ingreso Total (RD$)',
        'Ganancia Neta (RD$)',
        'Ahorro Otorgado (RD$)',
      ],
      rows: chartData.map((d) => [
        d.code,
        d.name,
        d.qty,
        formatCurrency(d.revenue),
        formatCurrency(d.profit),
        formatCurrency(d.savings),
      ]),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Boxes className="text-primary" size={24} /> Estadísticas y Reporte de Combos
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analítica en tiempo real de los combos más vendidos, margen de ganancia y consumo de inventario.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="input-field text-xs font-bold py-2"
          >
            <option value="all">Todo el Historial</option>
            <option value="today">Ventas de Hoy</option>
          </select>

          <button
            type="button"
            onClick={handleExportPDF}
            className="btn-primary text-xs font-bold flex items-center gap-1.5 px-4 py-2"
          >
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block">
            Combos Vendidos
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-foreground">{totalCombosSold} unds</span>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <Boxes size={20} />
            </div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block">
            Ventas Totales por Combos
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-primary">{formatCurrency(totalRevenue)}</span>
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block">
            Ganancia Neta Generada
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalProfit)}
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block">
            Ahorro Otorgado a Clientes
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(totalSavingsGiven)}
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Sparkles size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Combos más vendidos */}
        <div className="lg:col-span-2 bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <BarChart2 size={18} className="text-primary" /> Combos Más Vendidos (Unidades)
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">Ranking por demanda</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="code" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} unidades`, 'Vendidos']}
                  labelFormatter={(label: any) => `Combo ${label}`}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', border: 'none' }}
                />
                <Bar dataKey="qty" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown of Products Consumed via Combos */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <PackageCheck size={18} className="text-primary" /> Productos Consumidos por Combos
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto max-h-64 scrollbar-thin space-y-2">
            {consumedProductsList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No se han registrado consumos aún</p>
            ) : (
              consumedProductsList.map((item, idx) => (
                <div
                  key={item.name}
                  className="p-3 bg-secondary/30 rounded-xl border border-border/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-extrabold text-foreground">{item.name}</span>
                  </div>
                  <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {item.qty} unds
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Combos Table */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border/80 bg-secondary/30">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
            Detalle de Ventas por Combo
          </h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground font-black uppercase">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Nombre Combo</th>
                <th className="p-3 text-center">Unds Vendidas</th>
                <th className="p-3 text-right">Venta Total</th>
                <th className="p-3 text-right">Ganancia Neta</th>
                <th className="p-3 text-right">Ahorro Clientes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {chartData.map((row) => (
                <tr key={row.code} className="hover:bg-secondary/20">
                  <td className="p-3 font-mono font-bold text-muted-foreground">{row.code}</td>
                  <td className="p-3 font-extrabold text-foreground">{row.name}</td>
                  <td className="p-3 text-center font-bold text-primary">{row.qty} unds</td>
                  <td className="p-3 text-right font-black">{formatCurrency(row.revenue)}</td>
                  <td className="p-3 text-right font-black text-emerald-600">{formatCurrency(row.profit)}</td>
                  <td className="p-3 text-right font-extrabold text-amber-600">{formatCurrency(row.savings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
