import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { DollarSign, Tag, Plus, Search, Download, Check, X, Trash2 } from 'lucide-react';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';
import { useGastos } from '@/hooks/useGastos';
import type { GastoStatusUi } from '@/services/gastos.service';
import {
  InlineLoader,
  KpiGridSkeleton,
  PageContentSkeleton,
  Skeleton,
} from '@/components/ui/LoadingSkeleton';
import ModalShell from '@/components/ui/ModalShell';

type Tab = 'list' | 'categories';

const statusMap: Record<GastoStatusUi, { label: string; cls: string }> = {
  approved: { label: 'Aprobado', cls: 'badge-success' },
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  rejected: { label: 'Rechazado', cls: 'badge-danger' },
};

export default function ExpensesPage() {
  const {
    gastos,
    categorias,
    loading,
    error,
    crear,
    crearCategoria,
    cambiarEstado,
    eliminar,
    eliminarCategoria,
  } = useGastos();

  const [tab, setTab] = useState<Tab>('list');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [catId, setCatId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [tieneRecibo, setTieneRecibo] = useState(false);

  const [catNombre, setCatNombre] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catPresupuesto, setCatPresupuesto] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return gastos.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q)
    );
  }, [gastos, search]);

  const totalSpent = gastos.filter((e) => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);

  const handleExportPdf = () => {
    if (tab === 'list') {
      exportTableToPdf({
        title: 'Listado de Gastos',
        filename: 'gastos',
        headers: ['Código', 'Fecha', 'Categoría', 'Descripción', 'Responsable', 'Monto', 'Recibo', 'Estado'],
        rows: filtered.map((e) => [
          e.code, e.date, e.category, e.description, e.responsible,
          formatMoneyPdf(e.amount), e.receipt ? 'Sí' : 'No', statusMap[e.status]?.label ?? e.status,
        ]),
        landscape: true,
      });
      return;
    }
    exportTableToPdf({
      title: 'Categorías de Gastos',
      filename: 'categorias-gastos',
      headers: ['Categoría', 'Descripción', 'Presupuesto', 'Gastado', 'Disponible'],
      rows: categorias.map((c) => [
        c.name, c.description, formatMoneyPdf(c.budget), formatMoneyPdf(c.spent), formatMoneyPdf(c.budget - c.spent),
      ]),
    });
  };

  const resetModal = () => {
    setCatId('');
    setDescripcion('');
    setMonto('');
    setTieneRecibo(false);
    setCatNombre('');
    setCatDesc('');
    setCatPresupuesto('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === 'list') {
        const m = parseFloat(monto);
        await crear({
          categoria_id: catId,
          descripcion,
          monto: m,
          tiene_recibo: tieneRecibo,
          estado: 'pendiente',
        });
        toast.success('Gasto registrado');
      } else {
        await crearCategoria({
          nombre: catNombre,
          descripcion: catDesc,
          presupuesto_mensual: parseFloat(catPresupuesto) || 0,
        });
        toast.success('Categoría creada');
      }
      setShowModal(false);
      resetModal();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading && gastos.length === 0) {
    return (
      <AppLayout>
        <PageContentSkeleton kpiCount={4} tableCols={9} tableRows={6} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
            <p className="text-sm text-muted-foreground mt-1">Control de gastos operativos y categorías</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetModal();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2 w-fit"
          >
            <Plus size={16} />
            {tab === 'list' ? 'Nuevo Gasto' : 'Nueva Categoría'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        {loading ? (
          <KpiGridSkeleton count={4} />
        ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Gastos del mes</p>
            <p className="text-2xl font-bold text-foreground mt-1">RD$ {totalSpent.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Registros</p>
            <p className="text-2xl font-bold text-info mt-1">{gastos.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-warning mt-1">
              {gastos.filter((e) => e.status === 'pending').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Categorías</p>
            <p className="text-2xl font-bold text-primary mt-1">{categorias.length}</p>
          </div>
        </div>
        )}

        <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
          {[
            { id: 'list' as Tab, label: 'Lista de Gastos', icon: <DollarSign size={16} /> },
            { id: 'categories' as Tab, label: 'Categorías', icon: <Tag size={16} /> },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-field pl-9"
              placeholder="Buscar gastos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-2">
            <Download size={16} />
            Exportar PDF
          </button>
        </div>

        {tab === 'list' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Descripción</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Categoría</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Responsable</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Monto</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Comprobante</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <InlineLoader colSpan={9} message="Cargando gastos…" />}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No hay gastos registrados</td>
                    </tr>
                  )}
                  {filtered.map((e, i) => (
                    <tr
                      key={e.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}
                    >
                      <td className="px-4 py-3 font-mono text-primary font-medium">{e.code}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{e.description}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="badge-neutral">{e.category}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{e.responsible}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{e.date}</td>
                      <td className="px-4 py-3 font-bold text-foreground">RD$ {e.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {e.receipt ? <span className="badge-success">Sí</span> : <span className="badge-danger">No</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={statusMap[e.status].cls}>{statusMap[e.status].label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {e.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                title="Aprobar"
                                className="p-1.5 rounded-lg hover:bg-secondary text-success"
                                onClick={async () => {
                                  try {
                                    await cambiarEstado(e.id, 'aprobado');
                                    toast.success('Gasto aprobado');
                                  } catch (err) {
                                    toast.error(err instanceof Error ? err.message : 'Error');
                                  }
                                }}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                title="Rechazar"
                                className="p-1.5 rounded-lg hover:bg-secondary text-danger"
                                onClick={async () => {
                                  try {
                                    await cambiarEstado(e.id, 'rechazado');
                                    toast.success('Gasto rechazado');
                                  } catch (err) {
                                    toast.error(err instanceof Error ? err.message : 'Error');
                                  }
                                }}
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            title="Eliminar"
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger"
                            onClick={async () => {
                              if (!confirm(`¿Eliminar ${e.code}?`)) return;
                              try {
                                await eliminar(e.id);
                                toast.success('Gasto eliminado');
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : 'Solo admin puede eliminar');
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
              Mostrando {filtered.length} de {gastos.length} gastos
            </div>
          </div>
        )}

        {tab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading &&
              Array.from({ length: 3 }, (_, i) => (
                <div key={`cat-skel-${i}`} className="card p-5 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            {!loading && categorias.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full py-8 text-center">
                No hay categorías. Crea la primera con «Nueva Categoría».
              </p>
            )}
            {categorias.map((cat) => {
              const pct = cat.budget > 0 ? Math.min(100, Math.round((cat.spent / cat.budget) * 100)) : 0;
              const color = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-primary';
              return (
                <div key={cat.id} className="card p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.description || '—'}</p>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger"
                      onClick={async () => {
                        if (!confirm(`¿Desactivar categoría ${cat.name}?`)) return;
                        try {
                          await eliminarCategoria(cat.id);
                          toast.success('Categoría desactivada');
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Error');
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Gastado</span>
                      <span className="font-semibold text-foreground">
                        RD$ {cat.spent.toLocaleString()} / {cat.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={pct >= 90 ? 'text-danger font-medium' : 'text-muted-foreground'}>
                        {pct}% utilizado
                      </span>
                      <span className="text-muted-foreground">
                        Disponible: RD$ {(cat.budget - cat.spent).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ModalShell
        open={showModal}
        onClose={() => setShowModal(false)}
        size="md"
        busy={saving}
        busyLabel="Guardando…"
        className="p-6"
      >
        <h2 className="text-lg font-bold text-foreground mb-4">
          {tab === 'list' ? 'Nuevo Gasto' : 'Nueva Categoría'}
        </h2>
        <div className="space-y-3">
          {tab === 'list' ? (
            <>
              <select className="input-field" value={catId} onChange={(e) => setCatId(e.target.value)}>
                <option value="">Seleccionar categoría...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                className="input-field"
                placeholder="Descripción del gasto"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <input
                className="input-field"
                placeholder="Monto (RD$)"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={tieneRecibo} onChange={(e) => setTieneRecibo(e.target.checked)} />
                Tiene comprobante
              </label>
            </>
          ) : (
            <>
              <input
                className="input-field"
                placeholder="Nombre de la categoría"
                value={catNombre}
                onChange={(e) => setCatNombre(e.target.value)}
              />
              <textarea
                className="input-field"
                placeholder="Descripción"
                rows={3}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
              <input
                className="input-field"
                placeholder="Presupuesto mensual (RD$)"
                type="number"
                value={catPresupuesto}
                onChange={(e) => setCatPresupuesto(e.target.value)}
              />
            </>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" className="btn-secondary flex-1" disabled={saving} onClick={() => setShowModal(false)}>
            Cancelar
          </button>
          <button type="button" className="btn-primary flex-1" disabled={saving} onClick={handleSave}>
            Guardar
          </button>
        </div>
      </ModalShell>
    </AppLayout>
  );
}
