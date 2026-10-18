import React from 'react';
import { Search, X, Users, Truck, Tag } from 'lucide-react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import type { ContactsTab } from './types';

interface ContactsToolbarProps {
  tab: ContactsTab;
  onTabChange: (tab: ContactsTab) => void;
  search: string;
  onSearchChange: (search: string) => void;
  counts: {
    customers: number;
    suppliers: number;
    groups: number;
  };
}

export const ContactsToolbar: React.FC<ContactsToolbarProps> = ({
  tab,
  onTabChange,
  search,
  onSearchChange,
  counts,
}) => {
  const tabOptions: { id: ContactsTab; label: string; count?: number }[] = [
    { id: 'customers', label: `Clientes (${counts.customers})` },
    { id: 'suppliers', label: `Proveedores (${counts.suppliers})` },
    { id: 'groups', label: `Grupos (${counts.groups})` },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
      <div className="overflow-x-auto pb-1 sm:pb-0">
        <SegmentedControl
          options={tabOptions}
          value={tab}
          onChange={onTabChange}
          ariaLabel="Filtro de contactos"
        />
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink3)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            tab === 'customers'
              ? 'Buscar por nombre, teléfono, RNC/cédula...'
              : tab === 'suppliers'
                ? 'Buscar proveedor por nombre, teléfono...'
                : 'Buscar grupo de clientes...'
          }
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink3)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
