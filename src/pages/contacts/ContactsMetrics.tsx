import React from 'react';
import MetricStat from '@/components/ui/MetricStat';
import type { ContactsTab, Customer, Supplier, CustomerGroup } from './types';

interface ContactsMetricsProps {
  tab: ContactsTab;
  customers: Customer[];
  suppliers: Supplier[];
  groups: CustomerGroup[];
}

export const ContactsMetrics: React.FC<ContactsMetricsProps> = ({
  tab,
  customers,
  suppliers,
  groups,
}) => {
  if (tab === 'customers') {
    const total = customers.length;
    const activos = customers.filter((c) => c.status === 'active').length;
    const credito = customers.reduce((s, c) => s + c.credit, 0);
    const saldo = customers.reduce((s, c) => s + c.balance, 0);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
        <MetricStat
          label="Total Clientes"
          value={String(total)}
          secondaryText={`${activos} activos`}
        />
        <MetricStat
          label="Clientes Activos"
          value={String(activos)}
          secondaryText={`${total > 0 ? Math.round((activos / total) * 100) : 0}% de cartera`}
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
        <MetricStat
          label="Línea de Crédito"
          value={credito.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          prefix="RD$"
          secondaryText="Crédito aprobado"
        />
        <MetricStat
          label="Saldo por Cobrar"
          value={saldo.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          prefix="RD$"
          secondaryText={saldo > 0 ? 'Con facturas pendientes' : 'Al día'}
          highlightWarn={saldo > 0}
        />
      </div>
    );
  }

  if (tab === 'suppliers') {
    const total = suppliers.length;
    const activos = suppliers.filter((s) => s.status === 'active').length;
    const balance = suppliers.reduce((s, p) => s + p.balance, 0);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
        <MetricStat
          label="Total Proveedores"
          value={String(total)}
          secondaryText={`${activos} activos`}
        />
        <MetricStat
          label="Proveedores Activos"
          value={String(activos)}
          secondaryText="Habilitados para compras"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
        <MetricStat
          label="Órdenes Registradas"
          value={String(suppliers.reduce((s, p) => s + p.purchases, 0))}
          secondaryText="Historial de compras"
        />
        <MetricStat
          label="Balance Pendiente"
          value={balance.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          prefix="RD$"
          secondaryText="Cuentas por pagar"
          highlightWarn={balance > 0}
        />
      </div>
    );
  }

  const totalGrupos = groups.length;
  const clientesAsignados = groups.reduce((s, g) => s + (g.clientes_count ?? 0), 0);
  const maxDescuento = Math.max(0, ...groups.map((g) => g.porcentaje_descuento || 0));
  const avgDescuento =
    totalGrupos > 0
      ? (groups.reduce((s, g) => s + (g.porcentaje_descuento || 0), 0) / totalGrupos).toFixed(1)
      : '0';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      <MetricStat
        label="Categorías / Grupos"
        value={String(totalGrupos)}
        secondaryText="Listas de precios"
      />
      <MetricStat
        label="Clientes Asignados"
        value={String(clientesAsignados)}
        secondaryText="En grupos activos"
        valueColor="text-emerald-600 dark:text-emerald-400"
      />
      <MetricStat
        label="Mayor Descuento"
        value={`${maxDescuento}%`}
        secondaryText="Tarifa preferencial"
      />
      <MetricStat
        label="Promedio Descuento"
        value={`${avgDescuento}%`}
        secondaryText="Media en grupos"
      />
    </div>
  );
};
