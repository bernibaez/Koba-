import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { logAuditEvent } from '@/lib/auditStore';
import { toast } from '@/lib/toast';
import { useCxc } from '@/hooks/useCxc';
import { obtenerClientes } from '@/services/clientes.service';
import type { CuentaCobrarUi, Cliente, CxCFilterStatus } from './accounts-receivable/types';
import { CXC_STATUS_CONFIG } from './accounts-receivable/types';
import PrintableAccountStatement from '@/components/printing/PrintableAccountStatement';

import AccountsReceivableHeader from './accounts-receivable/components/AccountsReceivableHeader';
import AccountsReceivableMetrics from './accounts-receivable/components/AccountsReceivableMetrics';
import AccountsReceivableToolbar from './accounts-receivable/components/AccountsReceivableToolbar';
import AccountsReceivableTable from './accounts-receivable/components/AccountsReceivableTable';
import AccountsReceivableDrawer from './accounts-receivable/components/AccountsReceivableDrawer';
import AccountsReceivableFormModal from './accounts-receivable/components/AccountsReceivableFormModal';

export default function AccountsReceivablePage() {
  const { cuentas, loading, error, crear, registrarPago } = useCxc();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CxCFilterStatus>('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<CuentaCobrarUi | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    obtenerClientes({ limite: 200 })
      .then((r) => setClientes(r.datos))
      .catch(() => setClientes([]));
  }, []);

  // Sync selected account with live store data updates
  useEffect(() => {
    if (!selected) return;
    const fresh = cuentas.find((c) => c.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [cuentas, selected?.id]);

  // Global hotkey "N" to open new account modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if ((e.key === 'n' || e.key === 'N') && !isInput && !showModal && !selected) {
        e.preventDefault();
        setShowModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, selected]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return cuentas.filter((r) => {
      const matchSearch =
        !q ||
        r.code.toLowerCase().includes(q) ||
        r.invoice.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cuentas, search, statusFilter]);

  const handleRegisterPayment = async (params: {
    cuenta_id: string;
    monto: number;
    metodo_pago: string;
    nota: string;
  }) => {
    try {
      await registrarPago(params);
      if (selected) {
        logAuditEvent({
          user: 'Usuario',
          role: 'Sistema',
          action: 'Pago',
          module: 'Cuentas por Cobrar',
          details: `Cobro/Abono de RD$ ${params.monto.toLocaleString()} para ${selected.customer} (${selected.code})`,
          before: { balance: selected.balance },
          after: { paid: selected.paid + params.monto },
        });
      }
      toast.success(`Pago de RD$ ${params.monto.toLocaleString()} registrado con éxito`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar el pago');
      throw e;
    }
  };

  const handleCreate = async (params: {
    cliente_id: string;
    numero_factura: string | null;
    monto_total: number;
    fecha_emision: string;
    fecha_vencimiento: string;
  }) => {
    try {
      await crear(params);
      toast.success('Cuenta por cobrar registrada exitosamente');
      setShowModal(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
      throw e;
    }
  };

  const handlePrint = (cuenta: CuentaCobrarUi) => {
    setSelected(cuenta);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Cuentas por Cobrar (Clientes)',
      filename: 'cuentas-por-cobrar',
      headers: [
        'Código',
        'Factura',
        'Cliente',
        'Límite Crédito',
        'Emisión',
        'Vence',
        'Total',
        'Pagado',
        'Saldo Pendiente',
        'Estado',
      ],
      rows: filtered.map((r) => [
        r.code,
        r.invoice,
        r.customer,
        formatMoneyPdf(r.creditLimit),
        r.issueDate,
        r.dueDate,
        formatMoneyPdf(r.total),
        formatMoneyPdf(r.paid),
        formatMoneyPdf(r.balance),
        CXC_STATUS_CONFIG[r.status]?.label || r.status,
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Reporte de Cuentas por Cobrar (Clientes)',
      filename: 'cuentas-por-cobrar',
      headers: [
        'Código',
        'Factura',
        'Cliente',
        'Límite Crédito',
        'Emisión',
        'Vencimiento',
        'Monto Total',
        'Monto Pagado',
        'Saldo Pendiente',
        'Estado',
        'Días Mora',
      ],
      rows: filtered.map((r) => [
        r.code,
        r.invoice,
        r.customer,
        r.creditLimit,
        r.issueDate,
        r.dueDate,
        r.total,
        r.paid,
        r.balance,
        CXC_STATUS_CONFIG[r.status]?.label || r.status,
        r.daysOverdue,
      ]),
    });
  };

  const pendingCount = cuentas.filter((r) => r.status !== 'paid').length;
  const hasFilters = Boolean(search) || statusFilter !== 'all';

  return (
    <AppLayout fullWidth>
      {/* COMPROBANTE OFICIAL PARA IMPRESIÓN (SOLO VISIBLE EN PRINT) */}
      {selected && (
        <div className="hidden print:block printable-document">
          <PrintableAccountStatement
            type="receivable"
            code={selected.id}
            name={selected.customer}
            phone={clientes.find((c) => c.id === selected.customerId)?.telefono || undefined}
            invoiceCode={selected.invoice}
            totalAmount={selected.total}
            paidAmount={selected.paid}
            pendingBalance={selected.balance}
            dueDate={selected.dueDate}
            payments={selected.payments.map((p) => ({
              date: p.date,
              amount: p.amount,
              method: p.method,
              note: p.note,
            }))}
          />
        </div>
      )}

      {/* VISTA PRINCIPAL (OCULTA AL IMPRIMIR) */}
      <div className="print:hidden apple-scope space-y-4">
        {/* Header */}
        <AccountsReceivableHeader
          onNew={() => setShowModal(true)}
          pendingCount={pendingCount}
        />

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Metrics */}
        <AccountsReceivableMetrics cuentas={cuentas} />

        {/* Toolbar */}
        <AccountsReceivableToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
          filteredCount={filtered.length}
        />

        {/* Table */}
        <AccountsReceivableTable
          cuentas={filtered}
          isLoading={loading && cuentas.length === 0}
          onSelect={(c) => setSelected(c)}
          onQuickPay={(c) => setSelected(c)}
          onPrint={handlePrint}
          hasFilters={hasFilters}
          onClearFilters={() => {
            setSearch('');
            setStatusFilter('all');
          }}
        />
      </div>

      {/* Drawer: Estado de cuenta y abonos */}
      <AccountsReceivableDrawer
        cuenta={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onRegisterPayment={handleRegisterPayment}
        onPrint={handlePrint}
        clientes={clientes}
      />

      {/* Modal: Nueva Cuenta por Cobrar */}
      <AccountsReceivableFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        clientes={clientes}
      />
    </AppLayout>
  );
}
