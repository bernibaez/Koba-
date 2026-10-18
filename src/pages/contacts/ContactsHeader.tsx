import React from 'react';
import { Plus, Download, Briefcase, Users, Truck, Tag } from 'lucide-react';
import type { ContactsTab } from './types';

interface ContactsHeaderProps {
  tab: ContactsTab;
  onOpenCreate: () => void;
  onExportPdf: () => void;
  onNavigateCrm: () => void;
}

export const ContactsHeader: React.FC<ContactsHeaderProps> = ({
  tab,
  onOpenCreate,
  onExportPdf,
  onNavigateCrm,
}) => {
  const getTabLabel = () => {
    switch (tab) {
      case 'customers':
        return 'Cliente';
      case 'suppliers':
        return 'Proveedor';
      case 'groups':
        return 'Grupo';
    }
  };

  const getTabIcon = () => {
    switch (tab) {
      case 'customers':
        return <Users className="w-3.5 h-3.5" />;
      case 'suppliers':
        return <Truck className="w-3.5 h-3.5" />;
      case 'groups':
        return <Tag className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface2)] text-[var(--ink2)] border border-[var(--border)]">
            {getTabIcon()}
            Directorio & Relaciones
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
          Contactos & Directorio
        </h1>
        <p className="text-xs text-[var(--ink2)] mt-0.5">
          Gestiona clientes, proveedores y tarifas especiales de precios.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onNavigateCrm}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
        >
          <Briefcase className="w-3.5 h-3.5 text-purple-500" />
          <span>CRM Ventas</span>
        </button>

        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[var(--ink2)]" />
          <span>PDF</span>
        </button>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo {getTabLabel()}</span>
        </button>
      </div>
    </div>
  );
};
