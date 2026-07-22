import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardBentoGrid from './dashboard/DashboardBentoGrid';
import DashboardCharts from './dashboard/DashboardCharts';
import RecentTransactions from './dashboard/RecentTransactions';
import InventoryAlerts from './dashboard/InventoryAlerts';
import DashboardHeader from './dashboard/DashboardHeader';

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardHeader />
      <DashboardBentoGrid />
      <DashboardCharts />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2">
          <RecentTransactions />
        </div>
        <div>
          <InventoryAlerts />
        </div>
      </div>
    </AppLayout>
  );
}
