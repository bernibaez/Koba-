import React, { useEffect, useState } from 'react';
import { X, PlayCircle, DollarSign, Monitor, Info, Check, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCashRegisters } from '@/hooks/useCashRegisters';
import { iniciarCaja } from '@/services/cierresCaja.service';
import { ROL_DB_A_UI } from '@/services/auth.service';
import type { CierreCaja } from '@/types/database';
import { logAuditEvent } from '@/lib/auditStore';

interface PosCashOpenModalProps {
  initialCajaId?: string;
  onSuccess?: (cierre: CierreCaja) => void;
  onClose: () => void;
}

export default function PosCashOpenModal({
  initialCajaId,
  onSuccess,
  onClose,
}: PosCashOpenModalProps) {
  const { user } = useAuth();
  const { registers, dbUsers } = useCashRegisters();
  const isAdmin = user?.role === 'Administrador';
  const availableRegisters = isAdmin
    ? registers
    : registers.filter((c) => !c.isAdminBox);

  const resolvedInitial =
    initialCajaId &&
    (isAdmin || availableRegisters.some((c) => c.id === initialCajaId))
      ? initialCajaId
      : availableRegisters[0]?.id || registers.find((c) => !c.isAdminBox)?.id || registers[0]?.id || '2';

  const [selectedCajaId, setSelectedCajaId] = useState(resolvedInitial);
  const [selectedCajeroId, setSelectedCajeroId] = useState<string>(user?.id || '');
  const [montoApertura, setMontoApertura] = useState('5000');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCaja =
    availableRegisters.find((c) => c.id === selectedCajaId) || availableRegisters[0] || registers[0];
  const selectedUser = isAdmin ? dbUsers.find((u) => u.id === selectedCajeroId) : null;

  useEffect(() => {
    if (isAdmin && !selectedCajeroId && dbUsers.length > 0) {
      const match = dbUsers.find((u) => u.id === user?.id) || dbUsers[0];
      if (match) setSelectedCajeroId(match.id);
    }
  }, [isAdmin, dbUsers, user, selectedCajeroId]);

  useEffect(() => {
    if (!isAdmin && selectedCaja?.isAdminBox) {
      const first = registers.find((c) => !c.isAdminBox);
      if (first) setSelectedCajaId(first.id);
    }
  }, [isAdmin, registers, selectedCaja?.isAdminBox]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoApertura);
    if (isNaN(monto) || monto < 0) {
      toast.error('Por favor ingresa un monto de apertura válido (0 o mayor)');
      return;
    }

    setLoading(true);
    try {
      const cajeroNombre = isAdmin
        ? (selectedUser?.nombre_completo || user?.name || 'Cajero Activo')
        : (user?.name || 'Cajero Activo');
      const cajeroUsername = isAdmin
        ? (selectedUser?.correo || user?.username || '')
        : (user?.username || '');
      const cajeroId = isAdmin
        ? (selectedUser?.id || user?.id || null)
        : (user?.id || null);

      const result = await iniciarCaja({
        caja_id: selectedCajaId,
        caja_label: selectedCaja.label,
        cajero_id: cajeroId,
        cajero_nombre: cajeroNombre,
        cajero_username: cajeroUsername,
        monto_apertura: monto,
        notes: notes.trim() || undefined,
      });

      logAuditEvent({
        user: cajeroNombre,
        role: isAdmin && selectedUser ? (ROL_DB_A_UI[selectedUser.rol] || 'Cajero') : (user?.role || 'Cajero'),
        action: 'Inicio de caja',
        module: 'Caja',
        details: `Inicio de caja ${selectedCaja.label} asignada a ${cajeroNombre} con fondo de RD$ ${monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
        after: { caja_id: selectedCajaId, cajero_id: cajeroId, monto_apertura: monto },
      });

      toast.success(`Caja ${selectedCaja.label} iniciada exitosamente para ${cajeroNombre}`);
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col text-slate-800 dark:text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/80 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <PlayCircle size={24} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Inicio / Apertura de Caja
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                  Nuevo Turno
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">
                Registra el fondo inicial entregado para abrir el turno operativo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStart} className="p-6 space-y-5">
          {/* Cajero Responsable */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Cajero Responsable</span>
            </label>
            {isAdmin ? (
              <select
                value={selectedCajeroId}
                onChange={(e) => setSelectedCajeroId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {dbUsers.length > 0 ? (
                  dbUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_completo} ({ROL_DB_A_UI[u.rol] || u.rol}) — {u.correo}
                    </option>
                  ))
                ) : (
                  <option value={user?.id || ''}>
                    {user?.name || 'Usuario Activo'} ({user?.role || 'Cajero'})
                  </option>
                )}
              </select>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                  {(user?.name || 'U').charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{user?.name || 'Usuario Activo'}</p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{user?.role || 'Cajero'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Caja Selector */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Seleccionar Caja Registradora
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableRegisters.map((caja) => {
                const isSelected = selectedCajaId === caja.id;
                return (
                  <button
                    key={caja.id}
                    type="button"
                    onClick={() => setSelectedCajaId(caja.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-900 dark:text-white ring-2 ring-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                      }`}
                    >
                      <Monitor size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{caja.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{caja.cashier} • {caja.role}</p>
                    </div>
                    {isSelected && <Check size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                  </button>
                );
              })}
              {availableRegisters.length === 0 && (
                <p className="col-span-full text-xs text-slate-500 text-center py-4">
                  No hay cajas disponibles para tu perfil.
                </p>
              )}
            </div>
          </div>

          {/* Monto de Apertura / Fondo Inicial */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Monto Inicial / Fondo de Caja (RD$)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                <DollarSign size={20} />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Info size={13} className="text-emerald-500" />
              <span>Este dinero servirá como base para dar cambio durante la jornada.</span>
            </p>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Observaciones / Notas (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Entregado por administración en billetes de RD$ 100 y 500…"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Info Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-3">
            <AlertCircle size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <p className="font-bold">Apertura asignada a: {user?.name || 'Cajero'}</p>
              <p className="text-[11px] opacity-80">
                Al confirmar, la sesión quedará registrada a la hora actual ({new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}).
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <PlayCircle size={16} />
              <span>{loading ? 'Iniciando…' : 'Confirmar Inicio de Caja'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
