import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Plus, Download, Edit2, Monitor, Trash2, Power, Star, Search, ShieldCheck, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCajas } from '@/hooks/useCajas';
import { exportTableToPdf } from '@/lib/exportPdf';
import type { Caja } from '@/types/database';
import { InlineLoader, TableRowSkeleton } from '@/components/ui/LoadingSkeleton';

const emptyForm = {
  codigo: '',
  nombre: '',
  descripcion: '',
  es_caja_principal: false,
  activa: true,
};

export default function CajasPage() {
  const [busqueda, setBusqueda] = useState('');
  const { cajas, loading, crearCaja, actualizarCaja, eliminarCaja, alternarActivaCaja } = useCajas({ busqueda });

  const [showForm, setShowForm] = useState(false);
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingCaja(null);
    const nextNum = cajas.length + 1;
    setForm({
      codigo: String(nextNum),
      nombre: `Caja #${nextNum} - `,
      descripcion: '',
      es_caja_principal: cajas.length === 0,
      activa: true,
    });
    setShowForm(true);
  };

  const openEdit = (caja: Caja) => {
    setEditingCaja(caja);
    setForm({
      codigo: caja.codigo,
      nombre: caja.nombre,
      descripcion: caja.descripcion || '',
      es_caja_principal: caja.es_caja_principal ?? false,
      activa: caja.activa ?? caja.activo ?? true,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Ingresa el código y el nombre de la caja registradora');
      return;
    }

    setSaving(true);
    try {
      if (editingCaja) {
        await actualizarCaja(editingCaja.id, {
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          es_caja_principal: form.es_caja_principal,
          activa: form.activa,
        });
        toast.success('Caja registradora actualizada exitosamente');
      } else {
        await crearCaja({
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          es_caja_principal: form.es_caja_principal,
          activa: form.activa,
        });
        toast.success('Nueva caja registradora agregada exitosamente');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar caja');
    } finally {
      setSaving(false);
    }
  };

  const isActiva = (c: Caja) => c.activa ?? c.activo ?? true;
  const isPrincipal = (c: Caja) => c.es_caja_principal ?? false;

  const handleToggle = async (caja: Caja) => {
    try {
      const activeState = isActiva(caja);
      await alternarActivaCaja(caja.id, !activeState);
      toast.success(`Caja ${caja.nombre} ${!activeState ? 'activada' : 'desactivada'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const handleDelete = async (caja: Caja) => {
    if (!confirm(`¿Eliminar la caja "${caja.nombre}"?`)) return;
    try {
      await eliminarCaja(caja.id);
      toast.success('Caja eliminada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Gestión de Cajas Registradoras',
      filename: 'cajas_registradoras',
      headers: ['Código', 'Nombre', 'Descripción', 'Principal', 'Estado'],
      rows: cajas.map((c) => [
        c.codigo,
        c.nombre,
        c.descripcion || '—',
        isPrincipal(c) ? 'Sí' : 'No',
        isActiva(c) ? 'Activa' : 'Inactiva',
      ]),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Monitor size={26} className="text-primary" />
              <span>Gestión de Cajas Registradoras</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registra, configura y administra las cajas disponibles para el Punto de Venta (POS)
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-2">
              <Download size={16} />
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={() => {
                if (showForm) {
                  setShowForm(false);
                } else {
                  openCreate();
                }
              }}
              className="btn-primary flex items-center gap-2 shadow-xs"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              <span>{showForm ? 'Cerrar Formulario' : 'Nueva Caja'}</span>
            </button>
          </div>
        </div>

        {/* FORMULARIO INLINE DE CREACIÓN / EDICIÓN */}
        {showForm && (
          <div className="p-5 rounded-2xl border-2 border-primary/40 bg-card shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Monitor size={20} className="text-primary" />
                <span>{editingCaja ? 'Editar Caja Registradora' : 'Nueva Caja Registradora'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Código
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field font-mono font-bold w-full"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Nombre de Caja
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field font-bold w-full"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Caja #1 - Administrador"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  className="input-field resize-none text-xs w-full"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Ubicada en mostrador principal..."
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.es_caja_principal}
                    onChange={(e) => setForm({ ...form, es_caja_principal: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Marcar como Caja Principal del sistema</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activa}
                    onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Caja activa y disponible para el POS</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  className="btn-secondary text-xs py-2 px-4"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs font-bold py-2 px-5 flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle size={15} />
                  <span>{saving ? 'Guardando…' : editingCaja ? 'Guardar Cambios' : 'Crear Caja'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Monitor size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Cajas Registradas</p>
              <p className="text-2xl font-black text-foreground">{cajas.length}</p>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Cajas Activas</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {cajas.filter(isActiva).length}
              </p>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Star size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Caja Principal</p>
              <p className="text-sm font-bold text-foreground truncate">
                {cajas.find(isPrincipal)?.nombre || 'Sin asignar'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o nombre de caja registradora..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Cajas Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nombre de Caja</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Descripción</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Tipo</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <InlineLoader colSpan={6} message="Cargando cajas registradoras…" />
                    <TableRowSkeleton cols={6} />
                    <TableRowSkeleton cols={6} />
                    <TableRowSkeleton cols={6} />
                  </>
                ) : cajas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No hay cajas registradoras encontradas
                    </td>
                  </tr>
                ) : (
                  cajas.map((caja, i) => (
                    <tr
                      key={caja.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                        i % 2 === 0 ? '' : 'bg-secondary/10'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-foreground">#{caja.codigo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 font-bold text-foreground">
                          <Monitor size={17} className="text-primary flex-shrink-0" />
                          <span>{caja.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {caja.descripcion || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPrincipal(caja) ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20 inline-flex items-center gap-1">
                            <Star size={11} className="fill-amber-500 text-amber-500" />
                            Principal
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">Auxiliar</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={isActiva(caja) ? 'badge-success' : 'badge-danger'}>
                          {isActiva(caja) ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={isActiva(caja) ? 'Desactivar' : 'Activar'}
                            onClick={() => handleToggle(caja)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => openEdit(caja)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            title="Eliminar"
                            onClick={() => handleDelete(caja)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

