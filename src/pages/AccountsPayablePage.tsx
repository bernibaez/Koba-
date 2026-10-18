import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { logAuditEvent } from '@/lib/auditStore';
import { toast } from '@/lib/toast';
import { useCxp } from '@/hooks/useCxp';
import type { CuentaPagarUi, CxPFilterStatus } from './accounts-payable/types';
import { CXP_STATUS_CONFIG } from './accounts-payable/types';
import PrintableAccountStatement from '@/components/printing/PrintableAccountStatement';

import AccountsPayableHeader from './accounts-payable/components/AccountsPayableHeader';
import AccountsPayableMetrics from './accounts-payable/components/AccountsPayableMetrics';
import AccountsPayableToolbar from './accounts-payable/components/AccountsPayableToolbar';
import AccountsPayableTable from './accounts-payable/components/AccountsPayableTable';
import AccountsPayableDrawer from './accounts-payable/components/AccountsPayableDrawer';
import AccountsPayableFormModal from './accounts-payable/components/AccountsPayableFormModal';

export default function AccountsPayablePage() {
  const { cuentas, proveedores, loading, error, crear, registrarPago } = useCxp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CxPFilterStatus>('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<CuentaPagarUi | null>(null);

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
    return cuentas.filter((p) => {
      const matchSearch =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.purchase.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
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
          module: 'Cuentas por Pagar',
          details: `Pago de RD$ ${params.monto.toLocaleString()} a ${selected.supplier} (${selected.code})`,
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
    proveedor_id: string;
    monto_total: number;
    fecha_emision: string;
    fecha_vencimiento: string;
  }) => {
    try {
      await crear(params);
      toast.success('Cuenta por pagar registrada exitosamente');
      setShowModal(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
      throw e;
    }
  };

  const handlePrint = (cuenta: CuentaPagarUi) => {
    setSelected(cuenta);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Cuentas por Pagar (Proveedores)',
      filename: 'cuentas-por-pagar',
      headers: [
        'Código',
        'Compra',
        'Proveedor',
        'Emisión',
        'Vence',
        'Total',
        'Pagado',
        'Saldo Pendiente',
        'Estado',
      ],
      rows: filtered.map((p) => [
        p.code,
        p.purchase,
        p.supplier,
        p.issueDate,
        p.dueDate,
        formatMoneyPdf(p.total),
        formatMoneyPdf(p.paid),
        formatMoneyPdf(p.balance),
        CXP_STATUS_CONFIG[p.status]?.label || p.status,
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Reporte de Cuentas por Pagar (Proveedores)',
      filename: 'cuentas-por-pagar',
      headers: [
        'Código',
        'Compra Ref',
        'Proveedor',
        'Emisión',
        'Vencimiento',
        'Monto Total',
        'Monto Pagado',
        'Saldo Pendiente',
        'Estado',
        'Días Mora',
      ],
      rows: filtered.map((p) => [
        p.code,
        p.purchase,
        p.supplier,
        p.issueDate,
        p.dueDate,
        p.total,
        p.paid,
        p.balance,
        CXP_STATUS_CONFIG[p.status]?.label || p.status,
        p.daysOverdue,
      ]),
    });
  };

  const pendingCount = cuentas.filter((p) => p.status !== 'paid').length;
  const hasFilters = Boolean(search) || statusFilter !== 'all';

  return (
    <AppLayout fullWidth>
      {/* COMPROBANTE OFICIAL PARA IMPRESIÓN (SOLO VISIBLE EN PRINT) */}
      {selected && (
        <div className="hidden print:block printable-document">
          <PrintableAccountStatement
            type="payable"
            code={selected.id}
            name={selected.supplier}
            invoiceCode={selected.purchase}
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
        <AccountsPayableHeader
          onNew={() => setShowModal(true)}
          pendingCount={pendingCount}
        />

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Metrics */}
        <AccountsPayableMetrics cuentas={cuentas} />

        {/* Toolbar */}
        <AccountsPayableToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
          filteredCount={filtered.length}
        />

        {/* Table */}
        <AccountsPayableTable
          cuentas={filtered}
          isLoading={loading && cuentas.length === 0}
          onSelect={(p) => setSelected(p)}
          onQuickPay={(p) => setSelected(p)}
          onPrint={handlePrint}
          hasFilters={hasFilters}
          onClearFilters={() => {
            setSearch('');
            setStatusFilter('all');
          }}
        />
      </div>

      {/* Drawer: Estado de cuenta y pagos a proveedor */}
      <AccountsPayableDrawer
        cuenta={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onRegisterPayment={handleRegisterPayment}
        onPrint={handlePrint}
      />

      {/* Modal: Nueva Cuenta por Pagar */}
      <AccountsPayableFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        proveedores={proveedores}
      />
    </AppLayout>
  );
}
