import React from 'react';
import AppLayout from '@/components/AppLayout';
import POSTerminal from './components/POSTerminal';

export default function POSPage() {
  return (
    <AppLayout currentPath="/point-of-sale-pos">
      <POSTerminal />
    </AppLayout>
  );
}