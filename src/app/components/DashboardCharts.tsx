'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const SalesTrendChart = dynamic(() => import('./charts/SalesTrendChart'), { ssr: false });
const TopProductsChart = dynamic(() => import('./charts/TopProductsChart'), { ssr: false });
const PurchasesVsSalesChart = dynamic(() => import('./charts/PurchasesVsSalesChart'), { ssr: false });

export default function DashboardCharts() {
  const [salesPeriod, setSalesPeriod] = useState<'7d' | '30d'>('7d');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
      {/* Sales Trend - spans 2 cols */}
      <div className="lg:col-span-2 card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">Tendencia de Ventas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Ingresos diarios en RD$</p>
          </div>
          <div className="flex bg-secondary rounded-lg p-0.5">
            {(['7d', '30d'] as const).map((p) => (
              <button
                key={`period-${p}`}
                onClick={() => setSalesPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                  salesPeriod === p
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === '7d' ? 'Últimos 7 días' : 'Últimos 30 días'}
              </button>
            ))}
          </div>
        </div>
        <SalesTrendChart period={salesPeriod} />
      </div>

      {/* Top Products */}
      <div className="card p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">Productos Más Vendidos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Por ingresos — hoy</p>
        </div>
        <TopProductsChart />
      </div>

      {/* Purchases vs Sales */}
      <div className="lg:col-span-3 card p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">Compras vs Ventas — Mensual</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Comparativo de los últimos 7 meses en RD$</p>
        </div>
        <PurchasesVsSalesChart />
      </div>
    </div>
  );
}