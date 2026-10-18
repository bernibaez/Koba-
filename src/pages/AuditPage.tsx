import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import type { AuditLog } from './audit/types';
import { obtenerAuditoria } from '@/services/auditoria.service';
import { exportTableToPdf, exportTableToExcel } from '@/lib/exportPdf';
import { toast } from '@/lib/toast';

import AuditHeader from './audit/components/AuditHeader';
import AuditMetrics from './audit/components/AuditMetrics';
import AuditToolbar from './audit/components/AuditToolbar';
import AuditTable from './audit/components/AuditTable';
import AuditDetailDrawer from './audit/components/AuditDetailDrawer';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Drawer
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    obtenerAuditoria({ limite: 300, signal: ac.signal })
      .then(setLogs)
      .catch((e) => {
        if ((e as Error)?.name === 'AbortError') return;
        toast.error(e instanceof Error ? e.message : 'No se pudo cargar la auditoría');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return logs.filter((log) => {
      const matchSearch =
        !q ||
        log.user.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q);

      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      const matchDate = !dateFilter || log.date === dateFilter;

      return matchSearch && matchAction && matchDate;
    });
  }, [logs, search, actionFilter, dateFilter]);

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Registro de Auditoría del Sistema (Audit Log)',
      filename: 'auditoria-sistema',
      headers: [
        'Fecha/Hora',
        'Usuario',
        'Rol',
        'Acción',
        'Módulo',
        'Detalles de la Acción',
        'IP / Dispositivo',
      ],
      rows: filteredLogs.map((l) => [
        `${l.date} ${l.time}`,
        l.user,
        l.role,
        l.action,
        l.module,
        l.details,
        l.ip,
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Registro de Auditoría del Sistema (Audit Log)',
      filename: 'auditoria-sistema',
      headers: [
        'ID Registro',
        'Fecha',
        'Hora',
        'Usuario',
        'Rol',
        'Acción Realizada',
        'Módulo Sistema',
        'Detalle',
        'IP Dispositivo',
      ],
      rows: filteredLogs.map((l) => [
        l.id,
        l.date,
        l.time,
        l.user,
        l.role,
        l.action,
        l.module,
        l.details,
        l.ip,
      ]),
    });
  };

  const hasFilters = Boolean(search) || actionFilter !== 'all' || Boolean(dateFilter);

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {/* Header */}
        <AuditHeader
          totalCount={logs.length}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />

        {/* Metrics */}
        <AuditMetrics logs={logs} />

        {/* Toolbar */}
        <AuditToolbar
          search={search}
          onSearchChange={setSearch}
          actionFilter={actionFilter}
          onActionFilterChange={setActionFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          filteredCount={filteredLogs.length}
        />

        {/* Table */}
        <AuditTable
          logs={filteredLogs}
          isLoading={loading && logs.length === 0}
          onSelect={(log) => setSelectedLog(log)}
          hasFilters={hasFilters}
          onClearFilters={() => {
            setSearch('');
            setActionFilter('all');
            setDateFilter('');
          }}
        />
      </div>

      {/* Drawer: Inspección de Antes vs Después */}
      <AuditDetailDrawer
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </AppLayout>
  );
}
