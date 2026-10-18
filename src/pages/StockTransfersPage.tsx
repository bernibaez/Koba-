import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { exportTableToPdf } from '@/lib/exportPdf';
import { toast } from '@/lib/toast';
import {
  crearTransferencia,
  obtenerSucursales,
  obtenerTransferencias,
} from '@/services/transferencias.service';
import type { TransferenciaUi, SucursalUi, TransferStatusFilter } from './stock-transfers/types';
import { TRANSFER_STATUS_CONFIG } from './stock-transfers/types';
import { useProductos } from '@/hooks/useProductos';
import type { ProductItem } from '@/lib/productStore';

import StockTransfersHeader from './stock-transfers/components/StockTransfersHeader';
import StockTransfersMetrics from './stock-transfers/components/StockTransfersMetrics';
import StockTransfersToolbar from './stock-transfers/components/StockTransfersToolbar';
import StockTransfersTable from './stock-transfers/components/StockTransfersTable';
import StockTransferFormModal from './stock-transfers/components/StockTransferFormModal';
import StockTransferDetailDrawer from './stock-transfers/components/StockTransferDetailDrawer';

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<TransferenciaUi[]>([]);
  const [sucursales, setSucursales] = useState<SucursalUi[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>('all');

  // Modals & Drawers
  const [showModal, setShowModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferenciaUi | null>(null);

  const { productosUi } = useProductos({ pagina: 1, limite: 300, estado: 'activo' });

  const catalogProducts = useMemo(() => {
    return (productosUi || []) as ProductItem[];
  }, [productosUi]);

  const reload = async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([obtenerTransferencias(), obtenerSucursales()]);
      setTransfers(t);
      setSucursales(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar transferencias');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  // Global hotkey "T" to open new transfer modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if ((e.key === 't' || e.key === 'T') && !isInput && !showModal && !selectedTransfer) {
        e.preventDefault();
        setShowModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, selectedTransfer]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return transfers.filter((t) => {
      const matchSearch =
        !q ||
        t.codigo.toLowerCase().includes(q) ||
        t.origen.toLowerCase().includes(q) ||
        t.destino.toLowerCase().includes(q) ||
        (t.motivo && t.motivo.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || t.estado === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transfers, search, statusFilter]);

  const handleCreate = async (params: {
    sucursal_origen_id: string;
    sucursal_destino_id: string;
    motivo?: string;
    producto_id: string;
    cantidad: number;
  }) => {
    try {
      await crearTransferencia({
        sucursal_origen_id: params.sucursal_origen_id,
        sucursal_destino_id: params.sucursal_destino_id,
        motivo: params.motivo,
        lineas: [{ producto_id: params.producto_id, cantidad: params.cantidad }],
      });
      toast.success('Transferencia registrada exitosamente');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo crear la transferencia');
      throw e;
    }
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Transferencias de Stock',
      filename: 'transferencias-stock',
      headers: ['Código', 'Origen', 'Destino', 'Fecha', 'Ítems', 'Estado'],
      rows: filtered.map((t) => [
        t.codigo,
        t.origen,
        t.destino,
        t.fecha,
        `${t.items} items`,
        TRANSFER_STATUS_CONFIG[t.estado]?.label ?? t.estado,
      ]),
      landscape: true,
    });
  };

  const hasFilters = Boolean(search) || statusFilter !== 'all';

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {/* Header */}
        <StockTransfersHeader
          onNewTransfer={() => setShowModal(true)}
          transfersCount={transfers.length}
        />

        {/* Metrics */}
        <StockTransfersMetrics transfers={transfers} />

        {/* Toolbar */}
        <StockTransfersToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onExportPdf={handleExportPdf}
          filteredCount={filtered.length}
        />

        {/* Table */}
        <StockTransfersTable
          transfers={filtered}
          isLoading={loading && transfers.length === 0}
          onSelect={(t) => setSelectedTransfer(t)}
          hasFilters={hasFilters}
          onClearFilters={() => {
            setSearch('');
            setStatusFilter('all');
          }}
        />
      </div>

      {/* Modal: Nueva Transferencia */}
      <StockTransferFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        sucursales={sucursales}
        productos={catalogProducts}
      />

      {/* Drawer: Detalle de Transferencia */}
      <StockTransferDetailDrawer
        transfer={selectedTransfer}
        isOpen={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
      />
    </AppLayout>
  );
}
