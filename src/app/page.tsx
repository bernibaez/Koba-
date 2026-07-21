import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardBentoGrid from './components/DashboardBentoGrid';
import DashboardCharts from './components/DashboardCharts';
import RecentTransactions from './components/RecentTransactions';
import InventoryAlerts from './components/InventoryAlerts';
import DashboardHeader from './components/DashboardHeader';

export default function DashboardPage() {
  return (
    <AppLayout currentPath="/">
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