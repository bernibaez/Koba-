import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardBentoGrid from './dashboard/DashboardBentoGrid';
import SalesWeeklyChart from './dashboard/SalesWeeklyChart';
import QuickActions from './dashboard/QuickActions';
import RecentTransactions from './dashboard/RecentTransactions';
import RecentActivity from './dashboard/RecentActivity';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-5 max-w-[1600px] mx-auto pb-6">
        {/* Header — saludo, fecha, hora */}
        <DashboardHeader />

        {/* 4 KPIs Bento Cards */}
        <DashboardBentoGrid />

        {/* Fila intermedia: Gráfico de ventas 7 días + Acciones rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 xl:col-span-7">
            <SalesWeeklyChart />
          </div>
          <div className="lg:col-span-5 xl:col-span-5">
            <QuickActions />
          </div>
        </div>

        {/* Fila inferior: Transacciones recientes + Actividad reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 xl:col-span-7">
            <RecentTransactions />
          </div>
          <div className="lg:col-span-5 xl:col-span-5">
            <RecentActivity />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
