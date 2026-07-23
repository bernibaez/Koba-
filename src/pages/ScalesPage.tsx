import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Plus, Download, Edit2, Scale, RefreshCw, Power } from 'lucide-react';
import { toast } from 'sonner';
import { getScales, saveScales, type ScaleDevice } from '@/lib/posStore';
import { exportTableToPdf } from '@/lib/exportPdf';

const emptyForm = { name: '', ip: '', port: '4001', active: true };

export default function ScalesPage() {
  const [scales, setScales] = useState<ScaleDevice[]>(() => getScales());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ScaleDevice | null>(null);
  const [form, setForm] = useState(emptyForm);

  const persist = (list: ScaleDevice[]) => {
    setScales(list);
    saveScales(list);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (scale: ScaleDevice) => {
    setEditing(scale);
    setForm({ name: scale.name, ip: scale.ip, port: scale.port, active: scale.active });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.ip.trim() || !form.port.trim()) {
      toast.error('Completa nombre, IP y puerto');
      return;
    }
    if (editing) {
      persist(
        scales.map((s) =>
          s.id === editing.id
            ? { ...s, name: form.name.trim(), ip: form.ip.trim(), port: form.port.trim(), active: form.active }
            : s
        )
      );
      toast.success('Balanza actualizada');
    } else {
      const item: ScaleDevice = {
        id: `sc-${Date.now()}`,
        name: form.name.trim(),
        ip: form.ip.trim(),
        port: form.port.trim(),
        active: form.active,
        lastSync: null,
      };
      persist([item, ...scales]);
      toast.success('Balanza agregada');
    }
    setShowModal(false);
  };

  const toggleActive = (id: string) => {
    persist(scales.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  };

  const syncProducts = (scale: ScaleDevice) => {
    const mockProducts = [
      { codigo: 'CAR-001', nombre: 'Carne de Res lb', precio: 285, tipo: 'peso', fecha: new Date().toLocaleString('es-DO') },
      { codigo: 'POL-001', nombre: 'Pollo Entero lb', precio: 98, tipo: 'peso', fecha: new Date().toLocaleString('es-DO') },
      { codigo: 'CER-001', nombre: 'Cerdo lb', precio: 175, tipo: 'peso', fecha: new Date().toLocaleString('es-DO') },
      { codigo: 'FRU-001', nombre: 'Plátano lb', precio: 25, tipo: 'peso', fecha: new Date().toLocaleString('es-DO') },
    ];
    const now = new Date().toLocaleString('es-DO');
    persist(scales.map((s) => (s.id === scale.id ? { ...s, lastSync: now } : s)));
    toast.success(
      `Sincronizados ${mockProducts.length} productos en ${scale.name}: ${mockProducts.map((p) => p.codigo).join(', ')}`
    );
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Gestión de Balanzas',
      filename: 'balanzas',
      headers: ['Nombre', 'IP', 'Puerto', 'Estado', 'Última sync'],
      rows: scales.map((s) => [
        s.name,
        s.ip,
        s.port,
        s.active ? 'Activa' : 'Inactiva',
        s.lastSync ?? '—',
      ]),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Balanzas</h1>
            <p className="text-sm text-muted-foreground mt-1">Configura y sincroniza dispositivos de pesaje</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-2">
              <Download size={16} />
              Exportar PDF
            </button>
            <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Nueva balanza
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Total balanzas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{scales.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Activas</p>
            <p className="text-2xl font-bold text-success mt-1">{scales.filter((s) => s.active).length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Inactivas</p>
            <p className="text-2xl font-bold text-muted-foreground mt-1">{scales.filter((s) => !s.active).length}</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">IP</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Puerto</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Última sync</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {scales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No hay balanzas configuradas
                    </td>
                  </tr>
                ) : (
                  scales.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <Scale size={16} className="text-primary" />
                          {s.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{s.ip}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground hidden md:table-cell">{s.port}</td>
                      <td className="px-4 py-3">
                        <span className={s.active ? 'badge-success' : 'badge-danger'}>
                          {s.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{s.lastSync ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Sincronizar productos"
                            onClick={() => syncProducts(s)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            type="button"
                            title={s.active ? 'Desactivar' : 'Activar'}
                            onClick={() => toggleActive(s.id)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Power size={14} />
                          </button>
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => openEdit(s)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 size={14} />
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 fade-in" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-md mx-4 slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editing ? 'Editar balanza' : 'Nueva balanza'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre</label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Balanza Carnes"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Dirección IP</label>
                <input
                  className="input-field"
                  value={form.ip}
                  onChange={(e) => setForm({ ...form, ip: e.target.value })}
                  placeholder="192.168.1.50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Puerto</label>
                <input
                  className="input-field"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: e.target.value })}
                  placeholder="4001"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-border"
                />
                Balanza activa
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary flex-1" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
