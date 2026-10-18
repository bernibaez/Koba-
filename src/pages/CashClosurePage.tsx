import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import type { CashClosure } from '@/lib/cashClosureStore';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from '@/lib/toast';
import { obtenerRegistrosCierreCaja } from '@/services/cierresCaja.service';
import PosCashOpenModal from '@/pages/point-of-sale-pos/components/PosCashOpenModal';
import PosCashCloseModal from '@/pages/point-of-sale-pos/components/PosCashCloseModal';
import PrintableCashClosure from '@/components/printing/PrintableCashClosure';

import CashClosureHeader from './cash-closure/components/CashClosureHeader';
import CashClosureMetrics from './cash-closure/components/CashClosureMetrics';
import CashClosureToolbar from './cash-closure/components/CashClosureToolbar';
import CashClosureTable from './cash-closure/components/CashClosureTable';
import CashClosureDrawer from './cash-closure/components/CashClosureDrawer';
import type { CashClosurePeriod } from './cash-closure/types';
import { calculateClosurePeriodDates } from './cash-closure/types';

export default function CashClosurePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrador';

  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [viewingClosure, setViewingClosure] = useState<CashClosure | null>(null);

  // Filters
  const [period, setPeriod] = useState<CashClosurePeriod>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const fetchClosures = async () => {
    setLoading(true);
    try {
      const rows = await obtenerRegistrosCierreCaja();
      setClosures(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar cierres de caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchClosures();
  }, []);

  const handlePeriodChange = (newPeriod: CashClosurePeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      const { from, to } = calculateClosurePeriodDates(newPeriod);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const handleCustomDateChange = (from: string, to: string) => {
    setPeriod('custom');
    setDateFrom(from);
    setDateTo(to);
  };

  const handleClearFilters = () => {
    setPeriod('all');
    setDateFrom('');
    setDateTo('');
    setSearchUser('');
  };

  const hasFilters = period !== 'all' || Boolean(searchUser) || Boolean(dateFrom) || Boolean(dateTo);

  const filteredClosures = useMemo(() => {
    return closures.filter((c) => {
      // Role scoping: non-admins only see their own closures
      if (!isAdmin) {
        const uid = user?.id ?? '';
        const uname = (user?.username ?? '').toLowerCase();
        const matchesUser =
          (c.userId && uid && c.userId === uid) ||
          (c.username && uname && c.username.toLowerCase() === uname);
        if (!matchesUser) return false;
      }

      // Search by cashier user / username
      if (searchUser) {
        const query = searchUser.toLowerCase().trim();
        const matchesName = (c.userName || '').toLowerCase().includes(query);
        const matchesUname = (c.username || '').toLowerCase().includes(query);
        const matchesCode = (c.code || '').toLowerCase().includes(query);
        const matchesRegister = (c.cashRegisterLabel || '').toLowerCase().includes(query);
        if (!matchesName && !matchesUname && !matchesCode && !matchesRegister) {
          return false;
        }
      }

      // Date filtering
      if (dateFrom && c.date < dateFrom) return false;
      if (dateTo && c.date > dateTo) return false;

      return true;
    });
  }, [closures, isAdmin, user, searchUser, dateFrom, dateTo]);

  // Bulk Export Handlers
  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Cierres de Caja Diarios',
      subtitle: !isAdmin ? `Usuario: ${user?.name}` : 'Todos los usuarios',
      filename: 'cierres-de-caja',
      headers: [
        'Código',
        'Fecha',
        'Apertura',
        'Cierre',
        'Caja',
        'Usuario',
        'Vendido',
        'Efectivo Esperado',
        'Contado',
        'Diferencia',
      ],
      rows: filteredClosures.map((c) => [
        c.code,
        c.date,
        c.openedAt.split(' ')[1] || c.openedAt,
        c.closedAt.split(' ')[1] || c.closedAt,
        c.cashRegisterLabel || `Caja #${c.cashRegisterId}`,
        c.userName,
        formatMoneyPdf(c.totalSales),
        formatMoneyPdf(c.expectedCash),
        formatMoneyPdf(c.countedCash),
        formatMoneyPdf(c.difference),
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Reporte de Cierres de Caja Diarios',
      filename: 'cierres-de-caja',
      headers: [
        'Código',
        'Fecha',
        'Apertura',
        'Cierre',
        'Caja',
        'Usuario',
        'Total Vendido',
        'Fondo Inicial',
        'Total Efectivo',
        'Efectivo Esperado',
        'Efectivo Contado',
        'Diferencia',
        'Total Tarjetas',
        'Total Transferencias',
        'Total Crédito',
      ],
      rows: filteredClosures.map((c) => [
        c.code,
        c.date,
        c.openedAt,
        c.closedAt,
        c.cashRegisterLabel || `Caja #${c.cashRegisterId}`,
        c.userName,
        c.totalSales,
        c.baseCash ?? 0,
        c.totalCash ?? 0,
        c.expectedCash,
        c.countedCash,
        c.difference,
        c.totalCard ?? 0,
        c.totalTransfer ?? 0,
        c.totalCredit ?? 0,
      ]),
    });
  };

  // Single Closure Export Handlers
  const handleExportSingleClosurePdf = (closure: CashClosure) => {
    exportTableToPdf({
      title: `Comprobante de Cierre de Caja — ${closure.code}`,
      subtitle: `${closure.cashRegisterLabel || `Caja #${closure.cashRegisterId}`} | ${closure.date} | Responsable: ${closure.userName}`,
      filename: `cierre-${closure.code}`,
      headers: ['Concepto / Rubro', 'Monto Registrado'],
      rows: [
        ['Código de Cierre', closure.code],
        ['Fecha del Turno', closure.date],
        ['Caja Registradora', closure.cashRegisterLabel || `Caja #${closure.cashRegisterId}`],
        ['Cajero / Usuario Responsable', `${closure.userName} (@${closure.username || 'usuario'})`],
        ['Horario de Apertura y Cierre', `${closure.openedAt} — ${closure.closedAt || '—'}`],
        ['Fondo Inicial (Apertura)', formatMoneyPdf(closure.baseCash ?? 0)],
        ['Ventas en Efectivo', formatMoneyPdf(closure.totalCash ?? 0)],
        ['Ventas con Tarjetas', formatMoneyPdf(closure.totalCard ?? 0)],
        ['Ventas por Transferencia', formatMoneyPdf(closure.totalTransfer ?? 0)],
        ['Ventas a Crédito', formatMoneyPdf(closure.totalCredit ?? 0)],
        ['TOTAL VENDIDO EN EL TURNO', formatMoneyPdf(closure.totalSales)],
        ['Efectivo Físico Esperado en Caja', formatMoneyPdf(closure.expectedCash)],
        ['Efectivo Físico Real Contado', formatMoneyPdf(closure.countedCash)],
        ['Diferencia de Arqueo', formatMoneyPdf(closure.difference)],
        ['Observaciones', closure.notes || 'Sin observaciones registradas'],
      ],
    });
  };

  const handlePrintClosure = (closure: CashClosure) => {
    setViewingClosure(closure);
    // Allow React state to update the printable-document block then trigger print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <AppLayout fullWidth>
      {/* COMPROBANTE OFICIAL PARA IMPRESIÓN FÍSICA / TÉRMICA (SOLO VISIBLE EN PRINT) */}
      {viewingClosure && (
        <div className="hidden print:block printable-document">
          <PrintableCashClosure closure={viewingClosure} />
        </div>
      )}

      {/* VISTA PRINCIPAL (OCULTA AL IMPRIMIR) */}
      <div className="print:hidden apple-scope space-y-4">
        {/* Header */}
        <CashClosureHeader
          isAdmin={isAdmin}
          onOpenRegister={() => setShowOpenModal(true)}
          onCloseRegister={() => setShowCloseModal(true)}
        />

        {/* Metrics */}
        <CashClosureMetrics closures={filteredClosures} />

        {/* Toolbar */}
        <CashClosureToolbar
          currentPeriod={period}
          onPeriodChange={handlePeriodChange}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onCustomDateChange={handleCustomDateChange}
          searchUser={searchUser}
          onSearchUserChange={setSearchUser}
          isAdmin={isAdmin}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />

        {/* Data Table */}
        <CashClosureTable
          closures={filteredClosures}
          isLoading={loading}
          onViewDetail={(c) => setViewingClosure(c)}
          onPrint={handlePrintClosure}
          hasFilters={hasFilters}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Slide-in Detail Drawer */}
      <CashClosureDrawer
        closure={viewingClosure}
        isOpen={Boolean(viewingClosure)}
        onClose={() => setViewingClosure(null)}
        onPrint={handlePrintClosure}
        onExportPdf={handleExportSingleClosurePdf}
      />

      {/* Modal: Apertura de Caja */}
      {showOpenModal && (
        <PosCashOpenModal
          onSuccess={() => {
            void fetchClosures();
            setShowOpenModal(false);
          }}
          onClose={() => setShowOpenModal(false)}
        />
      )}

      {/* Modal: Cierre de Turno */}
      {showCloseModal && (
        <PosCashCloseModal
          onSuccess={() => {
            void fetchClosures();
            setShowCloseModal(false);
          }}
          onClose={() => setShowCloseModal(false)}
        />
      )}
    </AppLayout>
  );
}
