import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import type { CashClosure } from '@/lib/cashClosureStore';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { logAuditEvent } from '@/lib/auditStore';
import {
  Lock, Plus, Download, Search, Filter, Calendar, DollarSign, CreditCard, Smartphone, CheckCircle, AlertTriangle, Printer, FileSpreadsheet, Eye, User, X
} from 'lucide-react';
import { toast } from 'sonner';
import { guardarCierreCaja, obtenerCierresCaja } from '@/services/cierresCaja.service';
import { obtenerHistorialVentas } from '@/services/ventas.service';

export default function CashClosurePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrador';

  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingClosure, setViewingClosure] = useState<CashClosure | null>(null);

  const [searchUser, setSearchUser] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentSession, setCurrentSession] = useState({
    totalSales: 0,
    totalCash: 0,
    totalCard: 0,
    cardCount: 0,
    totalTransfer: 0,
    transferCount: 0,
    totalCheque: 0,
    chequeCount: 0,
    baseCash: 0,
    openedAt: `${new Date().toISOString().slice(0, 10)} 08:00`,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await obtenerCierresCaja();
        if (!alive) return;
        setClosures(
          rows.map((c) => ({
            id: c.id,
            code: c.codigo,
            userId: c.cajero_id ?? '',
            username: '',
            userName: '',
            openedAt: c.abierta_en,
            closedAt: c.cerrada_en ?? '',
            date: (c.cerrada_en ?? c.abierta_en).slice(0, 10),
            cashRegisterId: c.caja_id,
            cashRegisterLabel: `Caja ${c.caja_id}`,
            totalSales: Number(c.total_ventas),
            totalCash: Number(c.total_efectivo),
            totalCard: Number(c.total_tarjeta),
            cardCount: 0,
            totalTransfer: Number(c.total_transferencia),
            transferCount: 0,
            totalCheque: 0,
            chequeCount: 0,
            totalCredit: 0,
            creditCount: 0,
            expectedCash: Number(c.monto_esperado),
            countedCash: Number(c.monto_real),
            difference: Number(c.monto_diferencia),
          }))
        );

        const hoy = new Date().toISOString().slice(0, 10);
        const ventasHoy = await obtenerHistorialVentas({
          pagina: 1,
          limite: 500,
          fechaInicio: hoy,
          fechaFin: hoy,
        });
        if (!alive) return;
        let totalSales = 0;
        let totalCash = 0;
        let totalCard = 0;
        let cardCount = 0;
        let totalTransfer = 0;
        let transferCount = 0;
        for (const v of ventasHoy.datos) {
          totalSales += Number(v.monto_total);
          totalCash += Number(v.monto_efectivo);
          totalCard += Number(v.monto_tarjeta);
          totalTransfer += Number(v.monto_transferencia);
          if (Number(v.monto_tarjeta) > 0) cardCount += 1;
          if (Number(v.monto_transferencia) > 0) transferCount += 1;
        }
        setCurrentSession((s) => ({
          ...s,
          totalSales,
          totalCash,
          totalCard,
          cardCount,
          totalTransfer,
          transferCount,
        }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al cargar cierres');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const expectedCash = currentSession.baseCash + currentSession.totalCash;
  const countedNum = parseFloat(countedCash) || 0;
  const cashDiff = countedCash === '' ? 0 : countedNum - expectedCash;

  // Filter closures by role and filters
  const filteredClosures = useMemo(() => {
    return closures.filter((c) => {
      // Role check: non-admin can only see own closures
      if (!isAdmin && c.username.toLowerCase() !== (user?.username ?? '').toLowerCase()) {
        return false;
      }
      // User filter (admin only)
      if (searchUser && !c.userName.toLowerCase().includes(searchUser.toLowerCase()) && !c.username.toLowerCase().includes(searchUser.toLowerCase())) {
        return false;
      }
      // Single date
      if (singleDate && c.date !== singleDate) {
        return false;
      }
      // Date range
      if (startDate && c.date < startDate) return false;
      if (endDate && c.date > endDate) return false;

      return true;
    });
  }, [closures, isAdmin, user, searchUser, singleDate, startDate, endDate]);

  const handleSaveClosure = async () => {
    if (countedCash === '') {
      toast.error('Ingresa el monto de efectivo contado');
      return;
    }

    const now = new Date();
    const closedAt = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`;
    const count = closures.length + 1;
    const code = `CC-${String(count).padStart(3, '0')}`;

    setSaving(true);
    try {
      const saved = await guardarCierreCaja({
        codigo: code,
        caja_id: '1',
        cajero_id: user?.id ?? null,
        cajero_nombre: user?.name ?? 'Usuario',
        cajero_username: user?.username ?? '',
        caja_label: 'Caja #1',
        monto_apertura: currentSession.baseCash,
        monto_esperado: expectedCash,
        monto_real: countedNum,
        monto_diferencia: cashDiff,
        total_ventas: currentSession.totalSales,
        total_efectivo: currentSession.totalCash,
        total_tarjeta: currentSession.totalCard,
        total_transferencia: currentSession.totalTransfer,
        estado: 'cerrada',
        notes: notes || undefined,
      });

      const newClosure: CashClosure = {
      id: saved.id,
      code: saved.codigo,
      userId: user?.id ?? '0',
      username: user?.username ?? 'usuario',
      userName: user?.name ?? 'Usuario Sistema',
      openedAt: currentSession.openedAt,
      closedAt,
      date: now.toISOString().slice(0, 10),
      cashRegisterId: '1',
      cashRegisterLabel: 'Caja #1',
      totalSales: currentSession.totalSales,
      totalCash: currentSession.totalCash,
      totalCard: currentSession.totalCard,
      cardCount: currentSession.cardCount,
      totalTransfer: currentSession.totalTransfer,
      transferCount: currentSession.transferCount,
      totalCheque: currentSession.totalCheque,
      chequeCount: currentSession.chequeCount,
      totalCredit: 0,
      creditCount: 0,
      expectedCash,
      countedCash: countedNum,
      difference: cashDiff,
      notes: notes || undefined,
    };

      setClosures((prev) => [newClosure, ...prev]);

      logAuditEvent({
        user: user?.name ?? 'Usuario',
        role: user?.role ?? 'Cajero',
        action: 'Cierre de caja',
        module: 'Caja',
        details: `Cierre ${newClosure.code} realizado por RD$ ${newClosure.totalSales.toLocaleString()} (Diferencia: RD$ ${cashDiff})`,
        after: { code: newClosure.code, totalSales: newClosure.totalSales, difference: cashDiff },
      });

      toast.success(`Cierre de caja ${newClosure.code} registrado en Supabase`);
      setShowCreateModal(false);
      setCountedCash('');
      setNotes('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar cierre');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Cierres de Caja Diarios',
      subtitle: !isAdmin ? `Usuario: ${user?.name}` : 'Todos los usuarios',
      filename: 'cierres-de-caja',
      headers: [
        'Código', 'Fecha', 'Apertura', 'Cierre', 'Usuario', 'Vendido', 'Efectivo Esperado', 'Contado', 'Diferencia', 'Tarjetas', 'Transf.'
      ],
      rows: filteredClosures.map((c) => [
        c.code,
        c.date,
        c.openedAt.split(' ')[1] || c.openedAt,
        c.closedAt.split(' ')[1] || c.closedAt,
        c.userName,
        formatMoneyPdf(c.totalSales),
        formatMoneyPdf(c.expectedCash),
        formatMoneyPdf(c.countedCash),
        formatMoneyPdf(c.difference),
        `${formatMoneyPdf(c.totalCard)} (${c.cardCount})`,
        `${formatMoneyPdf(c.totalTransfer)} (${c.transferCount})`,
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Reporte de Cierres de Caja Diarios',
      filename: 'cierres-de-caja',
      headers: [
        'Código', 'Fecha', 'Apertura', 'Cierre', 'Usuario', 'Total Vendido', 'Total Efectivo', 'Efectivo Esperado', 'Efectivo Contado', 'Diferencia', 'Total Tarjetas', 'Cant. Tarjetas', 'Total Transferencias', 'Cant. Transferencias', 'Total Cheques', 'Cant. Cheques'
      ],
      rows: filteredClosures.map((c) => [
        c.code,
        c.date,
        c.openedAt,
        c.closedAt,
        c.userName,
        c.totalSales,
        c.totalCash,
        c.expectedCash,
        c.countedCash,
        c.difference,
        c.totalCard,
        c.cardCount,
        c.totalTransfer,
        c.transferCount,
        c.totalCheque,
        c.chequeCount,
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
              <Lock className="text-primary" size={24} />
              Cierre de Caja Diario
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? 'Gestión y auditoría de cierres de caja de todos los usuarios' : 'Realiza y consulta tus cierres diarios de caja'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
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
              RD$ {filteredClosures.reduce((s, c) => s + c.totalCash, 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
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

        {/* Closures Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Horario</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total Vendido</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Efectivo Esp.</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Contado</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Diferencia</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClosures.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
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
                      <td className="px-4 py-3 text-foreground font-medium">{c.date}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-foreground">{c.userName}</p>
                          <p className="text-xs text-muted-foreground">@{c.username}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <span>Apertura: {c.openedAt.split(' ')[1] || c.openedAt}</span>
                        <br />
                        <span>Cierre: {c.closedAt.split(' ')[1] || c.closedAt}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        RD$ {c.totalSales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        RD$ {c.expectedCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
                        RD$ {c.countedCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            c.difference < 0
                              ? 'bg-danger-bg text-danger'
                              : c.difference > 0
                              ? 'bg-warning-bg text-warning'
                              : 'bg-success-bg text-success'
                          }`}
                        >
                          RD$ {c.difference.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingClosure(c)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Ver detalle del cierre"
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

        {/* Modal: Realizar Cierre de Hoy */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
            <div className="card w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Cierre de Caja Diario</h3>
                    <p className="text-xs text-muted-foreground">Confirma los montos y registra el arqueo final</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowCreateModal(false)} className="p-1.5 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {/* User info */}
              <div className="bg-secondary/40 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Usuario Responsable</span>
                  <span className="font-bold text-foreground text-sm">{user?.name ?? 'Usuario'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Hora de Apertura</span>
                  <span className="font-semibold text-foreground">{currentSession.openedAt}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Hora de Cierre</span>
                  <span className="font-semibold text-foreground">{new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Sales Summary Grid */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumen de Ventas por Método de Pago</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-card border border-border rounded-xl p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign size={14} className="text-success" /> Efectivo
                    </p>
                    <p className="text-base font-bold text-foreground mt-1 tabular-nums">
                      RD$ {currentSession.totalCash.toLocaleString('es-DO')}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CreditCard size={14} className="text-info" /> Tarjetas ({currentSession.cardCount})
                    </p>
                    <p className="text-base font-bold text-foreground mt-1 tabular-nums">
                      RD$ {currentSession.totalCard.toLocaleString('es-DO')}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Smartphone size={14} className="text-warning" /> Transfer. ({currentSession.transferCount})
                    </p>
                    <p className="text-base font-bold text-foreground mt-1 tabular-nums">
                      RD$ {currentSession.totalTransfer.toLocaleString('es-DO')}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle size={14} className="text-primary" /> Cheques ({currentSession.chequeCount})
                    </p>
                    <p className="text-base font-bold text-foreground mt-1 tabular-nums">
                      RD$ {currentSession.totalCheque.toLocaleString('es-DO')}
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
                  <span className="font-bold text-foreground">TOTAL VENDIDO HOY</span>
                  <span className="text-2xl font-bold text-primary tabular-nums">
                    RD$ {currentSession.totalSales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Cash Reconciliation Form */}
              <div className="space-y-4 pt-2 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Arqueo de Efectivo en Caja</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-secondary/30 rounded-xl p-3">
                    <span className="text-xs text-muted-foreground block">Monto Esperado en Caja (Efectivo + Fondo)</span>
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      RD$ {expectedCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Fondo base RD$ {currentSession.baseCash.toLocaleString()} + Efectivo RD$ {currentSession.totalCash.toLocaleString()})
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Efectivo Físico Contado (RD$) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      className="input-field text-lg font-bold tabular-nums"
                    />
                  </div>
                </div>

                {countedCash !== '' && (
                  <div
                    className={`rounded-xl p-3 flex justify-between items-center ${
                      cashDiff < 0 ? 'bg-danger-bg border border-danger/30 text-danger' : cashDiff > 0 ? 'bg-warning-bg border border-warning/30 text-warning' : 'bg-success-bg border border-success/30 text-success'
                    }`}
                  >
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      {cashDiff < 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                      Diferencia de Efectivo:
                    </span>
                    <span className="text-xl font-bold tabular-nums">
                      RD$ {cashDiff.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observaciones / Notas</label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Detalles opcionales sobre el cierre..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="button" onClick={handleSaveClosure} className="btn-primary flex items-center gap-2">
                  <Lock size={16} />
                  Guardar y Cerrar Caja
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Ver Detalle de Cierre */}
        {viewingClosure && (
          <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setViewingClosure(null)}>
            <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-foreground text-lg">Comprobante de Cierre {viewingClosure.code}</h3>
                <button type="button" onClick={() => setViewingClosure(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Usuario:</span>
                  <span className="font-bold text-foreground">{viewingClosure.userName} (@{viewingClosure.username})</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-medium">{viewingClosure.date}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Apertura / Cierre:</span>
                  <span className="font-mono text-xs">{viewingClosure.openedAt} — {viewingClosure.closedAt}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Total Vendido:</span>
                  <span className="font-bold text-primary">RD$ {viewingClosure.totalSales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Efectivo en Caja:</span>
                  <span className="font-semibold">RD$ {viewingClosure.totalCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Tarjetas:</span>
                  <span className="font-semibold">RD$ {viewingClosure.totalCard.toLocaleString('es-DO')} ({viewingClosure.cardCount} ops)</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Transferencias:</span>
                  <span className="font-semibold">RD$ {viewingClosure.totalTransfer.toLocaleString('es-DO')} ({viewingClosure.transferCount} ops)</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Cheques:</span>
                  <span className="font-semibold">RD$ {viewingClosure.totalCheque.toLocaleString('es-DO')} ({viewingClosure.chequeCount} ops)</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Efectivo Esperado:</span>
                  <span className="font-semibold">RD$ {viewingClosure.expectedCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Efectivo Contado:</span>
                  <span className="font-bold text-foreground">RD$ {viewingClosure.countedCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Diferencia:</span>
                  <span className={`font-bold ${viewingClosure.difference < 0 ? 'text-danger' : viewingClosure.difference > 0 ? 'text-warning' : 'text-success'}`}>
                    RD$ {viewingClosure.difference.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {viewingClosure.notes && (
                  <div className="bg-secondary/40 rounded-lg p-2.5 text-xs text-muted-foreground mt-2">
                    <span className="font-semibold text-foreground block">Notas:</span>
                    {viewingClosure.notes}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary flex items-center gap-1.5"
                >
                  <Printer size={16} /> Imprimir Comprobante
                </button>
                <button type="button" onClick={() => setViewingClosure(null)} className="btn-primary">
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
