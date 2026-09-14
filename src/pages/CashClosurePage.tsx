import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import type { CashClosure } from '@/lib/cashClosureStore';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { logAuditEvent } from '@/lib/auditStore';
import {
  Lock, Plus, Download, Search, Filter, Calendar, DollarSign, CreditCard, Smartphone,
  CheckCircle, CheckCircle2, AlertTriangle, Printer, FileSpreadsheet, Eye, User, X, PlayCircle,
  ArrowLeft, Clock, ShieldCheck, FileText, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { obtenerRegistrosCierreCaja } from '@/services/cierresCaja.service';
import PosCashOpenModal from '@/pages/point-of-sale-pos/components/PosCashOpenModal';
import PosCashCloseModal from '@/pages/point-of-sale-pos/components/PosCashCloseModal';

export default function CashClosurePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrador';

  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [viewingClosure, setViewingClosure] = useState<CashClosure | null>(null);

  const [searchUser, setSearchUser] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

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
    fetchClosures();
  }, []);

  const filteredClosures = useMemo(() => {
    return closures.filter((c) => {
      if (!isAdmin) {
        const uid = user?.id ?? '';
        const uname = (user?.username ?? '').toLowerCase();
        const matchesUser =
          (c.userId && uid && c.userId === uid) ||
          (c.username && uname && c.username.toLowerCase() === uname);
        if (!matchesUser) return false;
      }
      if (searchUser && !c.userName.toLowerCase().includes(searchUser.toLowerCase()) && !c.username.toLowerCase().includes(searchUser.toLowerCase())) {
        return false;
      }
      if (singleDate && c.date !== singleDate) {
        return false;
      }
      if (startDate && c.date < startDate) return false;
      if (endDate && c.date > endDate) return false;

      return true;
    });
  }, [closures, isAdmin, user, searchUser, singleDate, startDate, endDate]);

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Cierres de Caja Diarios',
      subtitle: !isAdmin ? `Usuario: ${user?.name}` : 'Todos los usuarios',
      filename: 'cierres-de-caja',
      headers: [
        'Código', 'Fecha', 'Apertura', 'Cierre', 'Caja', 'Usuario', 'Vendido', 'Efectivo Esperado', 'Contado', 'Diferencia'
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
        'Código', 'Fecha', 'Apertura', 'Cierre', 'Caja', 'Usuario', 'Total Vendido', 'Fondo Inicial', 'Total Efectivo', 'Efectivo Esperado', 'Efectivo Contado', 'Diferencia', 'Total Tarjetas', 'Total Transferencias', 'Total Crédito'
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

  return (
    <AppLayout>
      {viewingClosure ? (
        /* VISTA PREVIA INLINE COMPLETA DEL CIERRE DE CAJA */
        <div className="space-y-6 slide-up pb-12">
          {/* Top Navigation / Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <button
              type="button"
              onClick={() => setViewingClosure(null)}
              className="btn-secondary flex items-center gap-2 text-xs font-bold w-fit px-4 py-2"
            >
              <ArrowLeft size={16} />
              <span>Volver al listado de cierres</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-1.5 text-xs font-bold py-2 px-3.5"
              >
                <Printer size={15} /> Imprimir Comprobante
              </button>
              <button
                type="button"
                onClick={() => handleExportSingleClosurePdf(viewingClosure)}
                className="btn-primary flex items-center gap-1.5 text-xs font-bold py-2 px-4"
              >
                <Download size={15} /> Exportar PDF
              </button>
            </div>
          </div>

          {/* Header Banner */}
          <div className="card p-6 border-l-4 border-l-primary bg-linear-to-r from-card via-card to-primary/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">
                      Cierre de Caja {viewingClosure.code}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                      Turno Cerrado
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                    {viewingClosure.cashRegisterLabel || `Caja #${viewingClosure.cashRegisterId}`} · Fecha {viewingClosure.date}
                  </p>
                </div>
              </div>

              {/* Difference Highlight */}
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                viewingClosure.difference === 0
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : viewingClosure.difference > 0
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                {viewingClosure.difference === 0 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90">
                    {viewingClosure.difference === 0
                      ? 'Cuadre Exacto'
                      : viewingClosure.difference > 0
                        ? 'Sobrante en Caja'
                        : 'Faltante en Caja'}
                  </span>
                  <span className="text-lg font-black tabular-nums">
                    {viewingClosure.difference >= 0
                      ? `+RD$ ${viewingClosure.difference.toFixed(2)}`
                      : `-RD$ ${Math.abs(viewingClosure.difference).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User & Shift Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 space-y-1">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <User size={14} className="text-primary" /> Cajero Responsable
              </span>
              <p className="text-base font-bold text-foreground truncate">{viewingClosure.userName}</p>
              <p className="text-xs text-muted-foreground">@{viewingClosure.username || 'usuario'}</p>
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar size={14} className="text-primary" /> Fecha de Operación
              </span>
              <p className="text-base font-bold text-foreground">{viewingClosure.date}</p>
              <p className="text-xs text-muted-foreground">Jornada completada</p>
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Clock size={14} className="text-emerald-500" /> Hora de Apertura
              </span>
              <p className="text-base font-bold text-foreground">{viewingClosure.openedAt || '—'}</p>
              <p className="text-xs text-muted-foreground">Inicio de turno</p>
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Lock size={14} className="text-amber-500" /> Hora de Cierre
              </span>
              <p className="text-base font-bold text-foreground">{viewingClosure.closedAt || '—'}</p>
              <p className="text-xs text-muted-foreground">Finalización de turno</p>
            </div>
          </div>

          {/* Financial Breakdown Cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <DollarSign size={16} className="text-primary" /> Desglose Financiero por Método de Pago
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Base Cash */}
              <div className="card p-4 bg-secondary/30 border-border">
                <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider">
                  Fondo Inicial (Apertura)
                </span>
                <p className="text-xl font-black text-foreground mt-1 tabular-nums">
                  RD$ {(viewingClosure.baseCash ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Base entregada al abrir turno</p>
              </div>

              {/* Cash Sales */}
              <div className="card p-4 bg-emerald-500/5 border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight size={14} /> Ventas en Efectivo
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  +RD$ {(viewingClosure.totalCash ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Ingresado en billetes/monedas</p>
              </div>

              {/* Card Sales */}
              <div className="card p-4 bg-blue-500/5 border-blue-500/20">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block uppercase tracking-wider flex items-center gap-1">
                  <CreditCard size={14} /> Ventas con Tarjetas
                </span>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                  RD$ {(viewingClosure.totalCard ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Vía terminal POS electrónico</p>
              </div>

              {/* Transfer Sales */}
              <div className="card p-4 bg-amber-500/5 border-amber-500/20">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider flex items-center gap-1">
                  <Smartphone size={14} /> Ventas por Transferencia
                </span>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                  RD$ {(viewingClosure.totalTransfer ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pagos bancarios directos</p>
              </div>
            </div>
          </div>

          {/* Arqueo y Conciliación Final */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table Breakdown */}
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                Resumen General de Operaciones
              </h3>
              <div className="space-y-2.5 text-sm divide-y divide-border/60 font-medium">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground">Fondo Inicial de Apertura</span>
                  <span className="font-bold text-foreground tabular-nums">
                    RD$ {(viewingClosure.baseCash ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground">Total Ventas en Efectivo</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +RD$ {(viewingClosure.totalCash ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground">Total Ventas Tarjeta</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    RD$ {(viewingClosure.totalCard ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground">Total Ventas Transferencia</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    RD$ {(viewingClosure.totalTransfer ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {(viewingClosure.totalCredit ?? 0) > 0 && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Ventas a Crédito (CxC)</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      RD$ {(viewingClosure.totalCredit ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 bg-primary/5 p-3 rounded-xl border border-primary/20">
                  <span className="font-extrabold text-foreground">TOTAL VENDIDO EN TURNO</span>
                  <span className="text-xl font-black text-primary tabular-nums">
                    RD$ {viewingClosure.totalSales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Reconciliation Box */}
            <div className="card p-5 space-y-4 bg-secondary/20">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                Conciliación y Arqueo de Efectivo
              </h3>

              <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Efectivo Físico Esperado en Caja
                </span>
                <span className="text-2xl font-black text-foreground tabular-nums block">
                  RD$ {viewingClosure.expectedCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  (Fondo Inicial RD$ {(viewingClosure.baseCash ?? 0).toLocaleString()} + Ventas Efectivo RD$ {(viewingClosure.totalCash ?? 0).toLocaleString()})
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Efectivo Físico Real Contado
                </span>
                <span className="text-2xl font-black text-primary tabular-nums block">
                  RD$ {viewingClosure.countedCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[11px] text-muted-foreground">Monto reportado en el conteo de billetes y monedas</p>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                viewingClosure.difference === 0
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : viewingClosure.difference > 0
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                <span className="text-xs font-extrabold uppercase tracking-wider">Diferencia Final:</span>
                <span className="text-lg font-black tabular-nums">
                  {viewingClosure.difference >= 0 ? `+RD$ ${viewingClosure.difference.toFixed(2)}` : `-RD$ ${Math.abs(viewingClosure.difference).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {viewingClosure.notes && (
            <div className="card p-4 space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                Observaciones y Notas del Cierre
              </span>
              <p className="text-sm text-foreground font-medium">{viewingClosure.notes}</p>
            </div>
          )}

          {/* Footer Back Button */}
          <div className="flex justify-start pt-2">
            <button
              type="button"
              onClick={() => setViewingClosure(null)}
              className="btn-secondary flex items-center gap-2 text-xs font-bold px-6 py-2.5"
            >
              <ArrowLeft size={16} />
              <span>Volver a la lista de cierres</span>
            </button>
          </div>
        </div>
      ) : (
        /* VISTA PRINCIPAL / LISTADO DE CIERRES */
        <div className="space-y-6 slide-up">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Lock className="text-primary" size={24} />
                Cierre de Caja Diario
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin ? 'Gestión y auditoría de cierres de caja de todos los usuarios' : 'Realiza y consulta tus cierres diarios de caja'}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowOpenModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <PlayCircle size={16} />
                Iniciar / Abrir Caja
              </button>
              <button
                type="button"
                onClick={() => setShowCloseModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Lock size={16} />
                Realizar Cierre de Hoy
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs text-muted-foreground">Total cierres registrados</p>
              <p className="text-2xl font-bold text-foreground mt-1">{filteredClosures.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted-foreground">Total ventas procesadas</p>
              <p className="text-2xl font-bold text-success mt-1">
                RD$ {filteredClosures.reduce((s, c) => s + c.totalSales, 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted-foreground">Efectivo total en cierres</p>
              <p className="text-2xl font-bold text-info mt-1">
                RD$ {filteredClosures.reduce((s, c) => s + (c.totalCash ?? 0), 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted-foreground">Diferencia neta acumulada</p>
              {(() => {
                const diff = filteredClosures.reduce((s, c) => s + c.difference, 0);
                return (
                  <p className={`text-2xl font-bold mt-1 ${diff < 0 ? 'text-danger' : diff > 0 ? 'text-warning' : 'text-success'}`}>
                    RD$ {diff.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="card p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {isAdmin && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Filtrar por Usuario</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="input-field pl-9"
                      placeholder="Nombre de usuario..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Fecha Específica</label>
                <input
                  type="date"
                  className="input-field"
                  value={singleDate}
                  onChange={(e) => {
                    setSingleDate(e.target.value);
                    setStartDate('');
                    setEndDate('');
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Desde (Rango)</label>
                <input
                  type="date"
                  className="input-field"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSingleDate('');
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Hasta (Rango)</label>
                <input
                  type="date"
                  className="input-field"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSingleDate('');
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Mostrando {filteredClosures.length} cierre(s)
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={handleExportPdf} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                  <Download size={14} /> Exportar PDF
                </button>
                <button type="button" onClick={handleExportExcel} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                  <FileSpreadsheet size={14} /> Exportar Excel
                </button>
              </div>
            </div>
          </div>

          {/* Clean, Optimized Closures Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Caja</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cajero</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total Vendido</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Diferencia</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        Cargando cierres de caja...
                      </td>
                    </tr>
                  ) : filteredClosures.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <Lock size={32} className="mx-auto mb-2 opacity-30" />
                        No se encontraron cierres de caja con los filtros seleccionados
                      </td>
                    </tr>
                  ) : (
                    filteredClosures.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-secondary/10'}`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-primary">{c.code}</td>
                        <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">{c.date}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground whitespace-nowrap">
                          {c.cashRegisterLabel || `Caja #${c.cashRegisterId}`}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-foreground text-xs">{c.userName}</p>
                            <p className="text-[11px] text-muted-foreground">@{c.username || 'usuario'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-foreground whitespace-nowrap">
                          RD$ {c.totalSales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs ${
                              c.difference < 0
                                ? 'bg-danger-bg text-danger'
                                : c.difference > 0
                                ? 'bg-warning-bg text-warning'
                                : 'bg-success-bg text-success'
                            }`}
                          >
                            {c.difference >= 0 ? `+RD$ ${c.difference.toFixed(2)}` : `-RD$ ${Math.abs(c.difference).toFixed(2)}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setViewingClosure(c)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                            title="Ver vista previa completa del cierre"
                          >
                            <Eye size={14} />
                            <span>Ver Detalle</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal: Realizar Cierre de Hoy */}
          {showCloseModal && (
            <PosCashCloseModal
              onSuccess={() => {
                void fetchClosures();
                setShowCloseModal(false);
              }}
              onClose={() => setShowCloseModal(false)}
            />
          )}

          {showOpenModal && (
            <PosCashOpenModal
              onSuccess={() => {
                void fetchClosures();
                setShowOpenModal(false);
              }}
              onClose={() => setShowOpenModal(false)}
            />
          )}
        </div>
      )}
    </AppLayout>
  );
}
