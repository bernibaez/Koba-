import React, { useState, lazy, Suspense } from 'react';

const SalesTrendChart = lazy(() => import('./charts/SalesTrendChart'));
const TopProductsChart = lazy(() => import('./charts/TopProductsChart'));
const PurchasesVsSalesChart = lazy(() => import('./charts/PurchasesVsSalesChart'));

function ChartFallback() {
  return <div className="h-64 animate-pulse rounded-lg bg-secondary" />;
}

export default function DashboardCharts() {
  const [salesPeriod, setSalesPeriod] = useState<'7d' | '30d'>('7d');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
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
        <Suspense fallback={<ChartFallback />}>
          <SalesTrendChart period={salesPeriod} />
        </Suspense>
      </div>

      <div className="card p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">Productos Más Vendidos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Por ingresos — hoy</p>
        </div>
        <Suspense fallback={<ChartFallback />}>
          <TopProductsChart />
        </Suspense>
      </div>

      <div className="lg:col-span-3 card p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">Compras vs Ventas — Mensual</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Comparativo de los últimos 7 meses en RD$</p>
        </div>
        <Suspense fallback={<ChartFallback />}>
          <PurchasesVsSalesChart />
        </Suspense>
      </div>
    </div>
  );
}
