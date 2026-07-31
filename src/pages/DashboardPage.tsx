import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardBentoGrid from './dashboard/DashboardBentoGrid';
import RecentTransactions from './dashboard/RecentTransactions';
import InventoryAlerts from './dashboard/InventoryAlerts';
import DashboardHeader from './dashboard/DashboardHeader';
import QuickActions from './dashboard/QuickActions';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header — fecha, hora, estado caja */}
        <DashboardHeader />

        {/* KPIs del día */}
        <DashboardBentoGrid />

        {/* Acciones rápidas */}
        <QuickActions />

        {/* Movimientos del día + Alertas de inventario */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <RecentTransactions />
          </div>
          <div>
            <InventoryAlerts />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
