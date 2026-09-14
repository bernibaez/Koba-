import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Calendar, FileText, X, CheckCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { NCF_TYPES, type NCFRange, type NCFType } from '@/lib/ncfStore';
import { obtenerRangosNcf, guardarRangosNcf } from '@/services/ncf.service';

export default function NCFSettingsTab() {
  const [ranges, setRanges] = useState<NCFRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRange, setEditingRange] = useState<NCFRange | null>(null);

  const loadRanges = async () => {
    setLoading(true);
    try {
      const data = await obtenerRangosNcf();
      setRanges(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron cargar las secuencias NCF');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRanges();
  }, []);

  const persist = async (updated: NCFRange[], successMsg: string) => {
    setSaving(true);
    try {
      await guardarRangosNcf(updated);
      const refreshed = await obtenerRangosNcf();
      setRanges(refreshed);
      toast.success(successMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar secuencias NCF');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = ranges.map((r) => (r.id === id ? { ...r, active: !r.active } : r));
    void persist(updated, 'Estado de secuencia NCF actualizado');
  };

  const handleSaveRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRange) return;

    const exists = ranges.some((r) => r.id === editingRange.id);
    const updated = exists
      ? ranges.map((r) => (r.id === editingRange.id ? editingRange : r))
      : [...ranges, editingRange];

    void persist(updated, `Secuencia ${editingRange.prefix} guardada correctamente`).then(() => {
      setEditingRange(null);
    });
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
          disabled={saving}
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
          className="btn-primary text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Plus size={16} />
          <span>Nueva Secuencia NCF</span>
        </button>
      </div>

      {/* FORMULARIO INLINE DE CREACIÓN / EDICIÓN */}
      {editingRange && (
        <div className="p-5 rounded-2xl border-2 border-primary/40 bg-card shadow-lg space-y-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              {ranges.some((r) => r.id === editingRange.id)
                ? `Editar Secuencia NCF (${editingRange.prefix})`
                : 'Nueva Secuencia de Comprobante Fiscal (NCF)'}
            </h3>
            <button
              type="button"
              onClick={() => setEditingRange(null)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveRange} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1 text-foreground">Tipo de Comprobante (NCF)</label>
                <select
                  value={editingRange.type}
                  onChange={(e) => {
                    const t = e.target.value as NCFType;
                    setEditingRange({ ...editingRange, type: t, prefix: t });
                  }}
                  className="input-field w-full"
                >
                  {Object.values(NCF_TYPES).map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.name} ({t.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-foreground">Número Actual</label>
                <input
                  type="number"
                  min={0}
                  value={editingRange.currentNumber}
                  onChange={(e) =>
                    setEditingRange({
                      ...editingRange,
                      currentNumber: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="input-field font-mono w-full"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-foreground">Número Máximo</label>
                <input
                  type="number"
                  min={1}
                  value={editingRange.maxNumber}
                  onChange={(e) =>
                    setEditingRange({
                      ...editingRange,
                      maxNumber: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="input-field font-mono w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold mb-1 text-foreground">Fecha Vencimiento autorizada DGII</label>
                <input
                  type="date"
                  value={editingRange.expirationDate}
                  onChange={(e) => setEditingRange({ ...editingRange, expirationDate: e.target.value })}
                  className="input-field font-mono w-full"
                />
              </div>

              <div className="sm:col-span-2 flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                  <input
                    type="checkbox"
                    checked={editingRange.active}
                    onChange={(e) => setEditingRange({ ...editingRange, active: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Secuencia Activa</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button type="button" onClick={() => setEditingRange(null)} className="btn-secondary text-xs py-2">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs font-bold py-2 px-4 flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle size={15} />
                <span>{saving ? 'Guardando…' : 'Guardar Secuencia'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Cargando secuencias NCF…</p>
      ) : ranges.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay rangos NCF configurados. Crea una secuencia o ejecuta el seed de Supabase.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ranges.map((r) => {
            const info = NCF_TYPES[r.type];
            const remaining = r.maxNumber - r.currentNumber;
            const percentUsed = Math.min(100, Math.round((r.currentNumber / Math.max(1, r.maxNumber)) * 100));

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
                    disabled={saving}
                    onClick={() => handleToggleActive(r.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      r.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {r.active ? 'Activa' : 'Inactiva'}
                  </button>
                </div>

                <div className="space-y-1 my-3">
                  <div className="flex justify-between text-xs font-mono font-semibold">
                    <span>
                      Actual: {r.prefix}
                      {String(r.currentNumber).padStart(8, '0')}
                    </span>
                    <span>
                      Límite: {r.prefix}
                      {String(r.maxNumber).padStart(8, '0')}
                    </span>
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

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar size={13} /> Vence:{' '}
                    <strong className="text-foreground font-mono">{r.expirationDate}</strong>
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
      )}
    </div>
  );
}

