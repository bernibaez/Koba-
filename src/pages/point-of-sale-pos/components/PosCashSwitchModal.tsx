import React, { useState } from 'react';
import { X, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CASH_REGISTERS, type CashRegisterId, type CashRegisterSession } from '@/lib/cashRegisters';

interface Props {
  currentId: CashRegisterId;
  onSelect: (id: CashRegisterId) => void;
  onClose: () => void;
}

export default function PosCashSwitchModal({ currentId, onSelect, onClose }: Props) {
  const [preview, setPreview] = useState<CashRegisterSession>(
    () => CASH_REGISTERS.find((c) => c.id === currentId)!
  );

  const takeOver = (reg: CashRegisterSession) => {
    if (!reg.open) {
      toast.error(`${reg.label} está cerrada`);
      return;
    }
    onSelect(reg.id);
    toast.success(`Administrando ${reg.label} · ${reg.cashier}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={onClose}>
      <div className="card w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Shield size={18} className="text-warning" />
              Cambiar de caja (admin)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Opera otra caja sin cerrar sesión y supervisa la actividad en tiempo real
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {CASH_REGISTERS.map((reg) => (
            <button
              key={reg.id}
              type="button"
              onClick={() => setPreview(reg)}
              className={`text-left border rounded-xl p-3 transition-all ${
                preview.id === reg.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-foreground">{reg.label}</span>
                <span className={reg.open ? 'badge-success' : 'badge-danger'}>
                  {reg.open ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{reg.cashier}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ventas: RD$ {reg.salesToday.toLocaleString('es-DO')}
              </p>
            </button>
          ))}
        </div>

        <div className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{preview.label} · {preview.cashier}</p>
              <p className="text-xs text-muted-foreground">
                {preview.open ? `Abierta desde ${preview.openedAt}` : 'Sesión cerrada'} · {preview.tickets} tickets hoy
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary text-xs flex items-center gap-1"
              onClick={() => toast.success(`Actividad de ${preview.label} actualizada`)}
            >
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Carrito en curso</p>
              <p className="font-bold text-foreground">{preview.cartItems} ítems</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total carrito</p>
              <p className="font-bold text-primary">
                RD$ {preview.currentTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Actividad en vivo</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {preview.movements.map((m, i) => (
                <div key={`${m.time}-${i}`} className="flex items-center justify-between text-xs border-b border-border/60 py-1.5">
                  <div>
                    <span className="font-medium text-foreground">{m.time}</span>
                    <span className="text-muted-foreground"> · {m.type}: {m.detail}</span>
                  </div>
                  <span className={`font-semibold tabular-nums ${m.amount < 0 ? 'text-danger' : 'text-foreground'}`}>
                    {m.amount === 0 ? '—' : `RD$ ${m.amount.toLocaleString('es-DO')}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={!preview.open || preview.id === currentId}
            onClick={() => takeOver(preview)}
          >
            {preview.id === currentId
              ? 'Ya estás en esta caja'
              : preview.open
                ? `Tomar control de ${preview.label}`
                : 'Caja cerrada'}
          </button>
        </div>
      </div>
    </div>
  );
}
