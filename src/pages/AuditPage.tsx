import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import type { AuditLog, AuditActionType } from '@/lib/auditStore';
import { obtenerAuditoria } from '@/services/auditoria.service';
import { exportTableToPdf, exportTableToExcel } from '@/lib/exportPdf';
import { ShieldCheck, Search, Download, FileSpreadsheet, Eye, X, Filter, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

const actionBadgeMap: Record<AuditActionType, string> = {
  Venta: 'badge-success',
  Devolución: 'badge-warning',
  'Edición de producto': 'badge-info',
  'Cambio de precio': 'badge-warning',
  Eliminación: 'badge-danger',
  'Cierre de caja': 'badge-primary',
  'Apertura de caja': 'badge-success',
  'Inicio de caja': 'badge-success',
  Compra: 'badge-info',
  Pago: 'badge-success',
};

const actionTypes: AuditActionType[] = [
  'Venta', 'Devolución', 'Edición de producto', 'Cambio de precio', 'Eliminación', 'Cierre de caja', 'Apertura de caja', 'Inicio de caja', 'Compra', 'Pago'
];

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
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
    return logs.filter((log) => {
      const matchSearch =
        !search ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase());

      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      const matchDate = !dateFilter || log.date === dateFilter;

      return matchSearch && matchAction && matchDate;
    });
  }, [logs, search, actionFilter, dateFilter]);

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Registro de Auditoría del Sistema (Audit Log)',
      filename: 'auditoria-sistema',
      headers: ['Fecha/Hora', 'Usuario', 'Rol', 'Acción', 'Módulo', 'Detalles de la Acción', 'IP / Dispositivo'],
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
      headers: ['ID Registro', 'Fecha', 'Hora', 'Usuario', 'Rol', 'Acción Realizada', 'Módulo Sistema', 'Detalle', 'IP Dispositivo'],
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

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="text-primary" size={26} />
              Auditoría del Sistema
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registro cronológico inmutable de acciones, ventas, cambios de precios, cierres y modificaciones
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Download size={15} /> Exportar PDF
            </button>
            <button type="button" onClick={handleExportExcel} className="btn-secondary flex items-center gap-1.5 text-xs">
              <FileSpreadsheet size={15} /> Exportar Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Eventos Registrados</p>
            <p className="text-2xl font-bold text-foreground mt-1">{filteredLogs.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Ventas y Cobros Auditados</p>
            <p className="text-2xl font-bold text-success mt-1">
              {filteredLogs.filter((l) => l.action === 'Venta' || l.action === 'Pago').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Modificaciones y Precios</p>
            <p className="text-2xl font-bold text-warning mt-1">
              {filteredLogs.filter((l) => l.action === 'Cambio de precio' || l.action === 'Edición de producto').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Devoluciones y Cierres</p>
            <p className="text-2xl font-bold text-info mt-1">
              {filteredLogs.filter((l) => l.action === 'Devolución' || l.action === 'Cierre de caja').length}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buscar en Auditoría</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="input-field pl-9 text-xs"
                  placeholder="Buscar usuario, detalle o módulo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Acción Realizada</label>
              <select className="input-field text-xs" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                <option value="all">Todas las acciones</option>
                {actionTypes.map((act) => (
                  <option key={`act-${act}`} value={act}>{act}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Filtrar por Fecha</label>
              <input
                type="date"
                className="input-field text-xs"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha / Hora</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Acción</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Módulo</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Detalle de la Acción</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">IP / Dispositivo</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Cargando auditoría…
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <ShieldCheck size={32} className="mx-auto mb-2 opacity-30" />
                      No hay registros de auditoría que coincidan con la búsqueda
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-secondary/10'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {log.date} <span className="font-semibold text-foreground">{log.time}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-foreground text-xs">{log.user}</p>
                        <p className="text-[11px] text-muted-foreground">{log.role}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={actionBadgeMap[log.action] || 'badge-neutral'}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground hidden md:table-cell">
                        {log.module}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground max-w-[280px] truncate">
                        {log.details}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-muted-foreground hidden lg:table-cell">
                        {log.ip}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Ver cambios (Antes vs Después)"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Detail Modal (Antes vs Después) */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setSelectedLog(null)}>
            <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-primary" />
                  <h3 className="font-bold text-foreground text-lg">Detalle del Registro de Auditoría</h3>
                </div>
                <button type="button" onClick={() => setSelectedLog(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-secondary/40 rounded-xl p-3">
                  <div><span className="text-muted-foreground block">Usuario</span><span className="font-bold text-foreground">{selectedLog.user} ({selectedLog.role})</span></div>
                  <div><span className="text-muted-foreground block">Fecha / Hora</span><span className="font-mono">{selectedLog.date} {selectedLog.time}</span></div>
                  <div><span className="text-muted-foreground block">Acción</span><span className="font-bold text-primary">{selectedLog.action}</span></div>
                  <div><span className="text-muted-foreground block">IP</span><span className="font-mono">{selectedLog.ip}</span></div>
                </div>

                <div>
                  <span className="text-muted-foreground block font-semibold mb-1">Descripción de la Acción:</span>
                  <p className="p-2.5 rounded-lg bg-card border border-border text-foreground font-medium">{selectedLog.details}</p>
                </div>

                {/* State Before & After */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Estado Previo (Antes)</p>
                    <pre className="p-2.5 rounded-lg bg-secondary/60 text-muted-foreground overflow-x-auto text-[11px] font-mono max-h-36">
                      {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : 'N/A (Acción Inicial)'}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-primary uppercase tracking-wider text-[10px]">Estado Resultante (Después)</p>
                    <pre className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 overflow-x-auto text-[11px] font-mono max-h-36">
                      {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : 'N/A'}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button type="button" onClick={() => setSelectedLog(null)} className="btn-primary text-xs">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
