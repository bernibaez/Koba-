import React from 'react';
import AppLayout from '@/components/AppLayout';
import ProductManagementScreen from './components/ProductManagementScreen';

export default function ProductManagementPage() {
  return (
    <AppLayout currentPath="/product-management">
      <ProductManagementScreen />
    </AppLayout>
  );
}