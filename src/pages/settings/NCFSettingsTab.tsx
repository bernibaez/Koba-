import React, { useState } from 'react';
import { ShieldCheck, Plus, RefreshCw, AlertTriangle, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getNCFRanges, saveNCFRanges, NCF_TYPES, type NCFRange, type NCFType } from '@/lib/ncfStore';

export default function NCFSettingsTab() {
  const [ranges, setRanges] = useState<NCFRange[]>(() => getNCFRanges());
  const [editingRange, setEditingRange] = useState<NCFRange | null>(null);

  const handleToggleActive = (id: string) => {
    const updated = ranges.map((r) => (r.id === id ? { ...r, active: !r.active } : r));
    setRanges(updated);
    saveNCFRanges(updated);
    toast.success('Estado de secuencia NCF actualizado');
  };

  const handleSaveRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRange) return;

    const exists = ranges.some((r) => r.id === editingRange.id);
    let updated: NCFRange[];
    if (exists) {
      updated = ranges.map((r) => (r.id === editingRange.id ? editingRange : r));
    } else {
      updated = [...ranges, editingRange];
    }

    setRanges(updated);
    saveNCFRanges(updated);
    setEditingRange(null);
    toast.success(`Secuencia ${editingRange.prefix} guardada correctamente`);
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary" />
            Secuencias de Comprobantes Fiscales (NCF - DGII)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Administración de rangos y secuencias numéricas autorizadas por la DGII de República Dominicana
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setEditingRange({
              id: `ncf-${Date.now()}`,
              type: 'B01',
              prefix: 'B01',
              currentNumber: 0,
              maxNumber: 1000,
              expirationDate: '2027-12-31',
              active: true,
            })
          }
          className="btn-primary text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Nueva Secuencia NCF</span>
        </button>
      </div>

      {/* Grid of Active Ranges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ranges.map((r) => {
          const info = NCF_TYPES[r.type];
          const remaining = r.maxNumber - r.currentNumber;
          const percentUsed = Math.min(100, Math.round((r.currentNumber / r.maxNumber) * 100));

          return (
            <div
              key={r.id}
              className={`p-4 rounded-2xl border transition-all ${
                r.active
                  ? 'border-border bg-card shadow-2xs'
                  : 'border-border/50 bg-secondary/30 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-primary">{r.prefix}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {info?.name.split('(')[0] || r.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{info?.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(r.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    r.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {r.active ? 'Activa' : 'Inactiva'}
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 my-3">
                <div className="flex justify-between text-xs font-mono font-semibold">
                  <span>Actual: {r.prefix}{String(r.currentNumber).padStart(8, '0')}</span>
                  <span>Límite: {r.prefix}{String(r.maxNumber).padStart(8, '0')}</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      remaining < 50 ? 'bg-rose-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span>Usado: {percentUsed}%</span>
                  <span className={remaining < 50 ? 'font-bold text-rose-500' : ''}>
                    Restantes: {remaining}
                  </span>
                </div>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar size={13} /> Vence: <strong className="text-foreground font-mono">{r.expirationDate}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setEditingRange(r)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Editar Rango
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editing Modal / Drawer */}
      {editingRange && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRange}
            className="card w-full max-w-md p-6 space-y-4 shadow-2xl border border-border"
          >
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Configurar Secuencia NCF ({editingRange.prefix})
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Tipo de Comprobante (NCF)</label>
                <select
                  value={editingRange.type}
                  onChange={(e) => {
                    const t = e.target.value as NCFType;
                    setEditingRange({ ...editingRange, type: t, prefix: t });
                  }}
                  className="input-field"
                >
                  {Object.values(NCF_TYPES).map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Número Actual</label>
                  <input
                    type="number"
                    value={editingRange.currentNumber}
                    onChange={(e) =>
                      setEditingRange({ ...editingRange, currentNumber: parseInt(e.target.value, 10) || 0 })
                    }
                    className="input-field font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Número Máximo</label>
                  <input
                    type="number"
                    value={editingRange.maxNumber}
                    onChange={(e) =>
                      setEditingRange({ ...editingRange, maxNumber: parseInt(e.target.value, 10) || 0 })
                    }
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Fecha de Vencimiento autorizada DGII</label>
                <input
                  type="date"
                  value={editingRange.expirationDate}
                  onChange={(e) => setEditingRange({ ...editingRange, expirationDate: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingRange(null)}
                className="btn-secondary text-xs"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary text-xs font-bold">
                Guardar Secuencia
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
