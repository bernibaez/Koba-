import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import type { PosReturn, ReturnStatusFilter } from './returns-history/types';
import {
  mapDevolucionToPosReturn,
  RETURN_METHOD_LABEL,
  RETURN_TYPE_LABEL,
  RETURN_STATUS_CONFIG,
} from './returns-history/types';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { logAuditEvent } from '@/lib/auditStore';
import { toast } from '@/lib/toast';
import { useDevoluciones } from '@/hooks/useDevoluciones';
import { useAuth } from '@/context/AuthContext';
import PrintableReturnReceipt from '@/components/printing/PrintableReturnReceipt';

import ReturnsHistoryHeader from './returns-history/components/ReturnsHistoryHeader';
import ReturnsHistoryMetrics from './returns-history/components/ReturnsHistoryMetrics';
import ReturnsHistoryToolbar from './returns-history/components/ReturnsHistoryToolbar';
import ReturnsHistoryTable from './returns-history/components/ReturnsHistoryTable';
import ReturnDetailDrawer from './returns-history/components/ReturnDetailDrawer';
import ReturnRejectModal from './returns-history/components/ReturnRejectModal';

export default function ReturnsHistoryPage() {
  const { user: authUser } = useAuth();
  const { devoluciones, loading, refetch, procesarEstado, procesando } = useDevoluciones({
    limite: 200,
  });

  const returns = useMemo(() => devoluciones.map(mapDevolucionToPosReturn), [devoluciones]);

  // Modals & Drawers
  const [selectedReturn, setSelectedReturn] = useState<PosReturn | null>(null);
  const [rejectingReturn, setRejectingReturn] = useState<PosReturn | null>(null);

  // Filters
  const [statusTab, setStatusTab] = useState<ReturnStatusFilter>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  const pendingReturns = useMemo(() => returns.filter((r) => r.status === 'pending'), [returns]);
  const pendingCount = pendingReturns.length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return returns.filter((r) => {
      if (statusTab !== 'all' && (r.status || 'approved') !== statusTab) return false;
      if (dateFilter && r.date !== dateFilter) return false;
      if (q) {
        const matchCode = r.code.toLowerCase().includes(q);
        const matchSale = r.saleCode.toLowerCase().includes(q);
        const matchCustomer = r.customer.toLowerCase().includes(q);
        const matchUser = r.user.toLowerCase().includes(q);
        const matchCashier = r.cashier.toLowerCase().includes(q);
        const matchProduct = r.products.some(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q))
        );
        if (!matchCode && !matchSale && !matchCustomer && !matchUser && !matchCashier && !matchProduct) {
          return false;
        }
      }
      return true;
    });
  }, [returns, statusTab, dateFilter, search]);

  const reviewerName = authUser?.name || authUser?.email || 'Administrador';

  const handleApproveReturn = async (r: PosReturn) => {
    try {
      await procesarEstado(r.id, 'aprobada');
      logAuditEvent({
        user: reviewerName,
        role: 'Administrador',
        action: 'Devolución',
        module: 'Devoluciones',
        details: `Devolución ${r.code} (Factura: ${r.saleCode}) por RD$ ${r.total.toLocaleString()} APROBADA`,
        before: { id: r.id, status: r.status },
        after: { id: r.id, status: 'approved', reviewedBy: reviewerName },
      });
      toast.success(`Devolución ${r.code} APROBADA exitosamente`);
      await refetch();
      if (selectedReturn?.id === r.id) {
        setSelectedReturn((prev) =>
          prev ? { ...prev, status: 'approved', reviewedBy: reviewerName } : null
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo aprobar la devolución');
    }
  };

  const handleConfirmRejection = async (r: PosReturn, reasonText: string) => {
    try {
      await procesarEstado(r.id, 'rechazada', reasonText);
      logAuditEvent({
        user: reviewerName,
        role: 'Administrador',
        action: 'Devolución',
        module: 'Devoluciones',
        details: `Devolución ${r.code} (Factura: ${r.saleCode}) por RD$ ${r.total.toLocaleString()} RECHAZADA. Motivo: ${reasonText}`,
        before: { id: r.id, status: r.status },
        after: {
          id: r.id,
          status: 'rejected',
          reviewedBy: reviewerName,
          rejectionReason: reasonText,
        },
      });
      toast.error(`Devolución ${r.code} RECHAZADA`);
      await refetch();
      if (selectedReturn?.id === r.id) {
        setSelectedReturn((prev) =>
          prev
            ? {
                ...prev,
                status: 'rejected',
                reviewedBy: reviewerName,
                rejectionReason: reasonText,
              }
            : null
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo rechazar la devolución');
      throw err;
    }
  };

  const handlePrint = (r: PosReturn) => {
    setSelectedReturn(r);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Historial de Devoluciones de Mercancía',
      filename: 'historial-devoluciones',
      headers: [
        'Código',
        'Venta Ref.',
        'Cliente',
        'Fecha',
        'Hora',
        'Usuario',
        'Estado',
        'Total',
        'Motivo',
        'Método',
        'Tipo',
      ],
      rows: filtered.map((r) => [
        r.code,
        r.saleCode,
        r.customer,
        r.date,
        r.time,
        r.user,
        r.status || 'approved',
        formatMoneyPdf(r.total),
        r.reason,
        RETURN_METHOD_LABEL[r.method] || r.method,
        RETURN_TYPE_LABEL[r.type] || r.type,
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Historial de Devoluciones de Mercancía',
      filename: 'historial-devoluciones',
      headers: [
        'Código',
        'Factura Original',
        'Cliente',
        'Fecha',
        'Hora',
        'Usuario',
        'Estado',
        'Productos Devueltos',
        'Total Reembolso',
        'Motivo',
        'Método Reembolso',
        'Tipo Devolución',
      ],
      rows: filtered.map((r) => [
        r.code,
        r.saleCode,
        r.customer,
        r.date,
        r.time,
        r.user,
        r.status || 'approved',
        r.products.map((p) => `${p.name} (Cant: ${p.qty})`).join('; '),
        r.total,
        r.reason,
        RETURN_METHOD_LABEL[r.method] || r.method,
        RETURN_TYPE_LABEL[r.type] || r.type,
      ]),
    });
  };

  const hasFilters = Boolean(search) || statusTab !== 'all' || Boolean(dateFilter);

  return (
    <AppLayout fullWidth>
      {/* COMPROBANTE OFICIAL PARA IMPRESIÓN (SOLO VISIBLE EN PRINT) */}
      {selectedReturn && (
        <div className="hidden print:block printable-document">
          <PrintableReturnReceipt
            data={{
              code: selectedReturn.code,
              originalInvoiceCode: selectedReturn.saleCode,
              date: selectedReturn.date,
              customerName: selectedReturn.customer,
              cashierName: selectedReturn.cashier,
              reason: selectedReturn.reason,
              items: (selectedReturn.items ?? selectedReturn.products ?? []).map((p) => ({
                name: p.name,
                qty: p.qty,
                price: p.price,
                subtotal: p.subtotal ?? p.qty * p.price,
              })),
              totalAmount: selectedReturn.total,
            }}
          />
        </div>
      )}

      {/* VISTA PRINCIPAL (OCULTA AL IMPRIMIR) */}
      <div className="print:hidden apple-scope space-y-4">
        {/* Header */}
        <ReturnsHistoryHeader
          pendingCount={pendingCount}
          onFilterPending={() => setStatusTab('pending')}
        />

        {/* Metrics */}
        <ReturnsHistoryMetrics returns={returns} />

        {/* Toolbar */}
        <ReturnsHistoryToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusTab}
          onStatusFilterChange={setStatusTab}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
          filteredCount={filtered.length}
        />

        {/* Table */}
        <ReturnsHistoryTable
          returns={filtered}
          isLoading={loading && returns.length === 0}
          onSelect={(r) => setSelectedReturn(r)}
          onApprove={handleApproveReturn}
          onReject={(r) => setRejectingReturn(r)}
          isProcessing={procesando}
          hasFilters={hasFilters}
          onClearFilters={() => {
            setSearch('');
            setStatusTab('all');
            setDateFilter('');
          }}
        />
      </div>

      {/* Drawer: Detalle y Aprobación de Devolución */}
      <ReturnDetailDrawer
        item={selectedReturn}
        isOpen={Boolean(selectedReturn)}
        onClose={() => setSelectedReturn(null)}
        onPrint={handlePrint}
        onApprove={handleApproveReturn}
        onReject={(r) => setRejectingReturn(r)}
        isProcessing={procesando}
      />

      {/* Modal: Rechazo de Devolución con Motivo */}
      <ReturnRejectModal
        item={rejectingReturn}
        isOpen={Boolean(rejectingReturn)}
        onClose={() => setRejectingReturn(null)}
        onConfirm={handleConfirmRejection}
      />
    </AppLayout>
  );
}
