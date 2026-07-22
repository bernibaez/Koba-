import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Plus, Search, Filter, Download, Eye, Edit2, Trash2 } from 'lucide-react';

const mockTransfers = [
  { id: 1, code: 'TRF-001', from: 'Sucursal Principal', to: 'Sucursal Norte', date: '2024-01-15', items: 5, status: 'completed' as const },
  { id: 2, code: 'TRF-002', from: 'Sucursal Norte', to: 'Sucursal Este', date: '2024-01-14', items: 3, status: 'pending' as const },
  { id: 3, code: 'TRF-003', from: 'Sucursal Principal', to: 'Sucursal Este', date: '2024-01-12', items: 8, status: 'completed' as const },
];

const statusMap = { completed: { label: 'Completado', cls: 'badge-success' }, pending: { label: 'Pendiente', cls: 'badge-warning' } };

export default function StockTransfersPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transferencia de Stock</h1>
            <p className="text-sm text-muted-foreground mt-1">Mueve productos entre sucursales</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-fit"><Plus size={16} />Nueva Transferencia</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card p-4"><p className="text-xs text-muted-foreground">Transferencias del mes</p><p className="text-2xl font-bold text-foreground mt-1">12</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-warning mt-1">2</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">Completadas</p><p className="text-2xl font-bold text-success mt-1">10</p></div>
        </div>
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input className="input-field pl-9" placeholder="Buscar transferencias..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2"><Filter size={16} />Filtrar</button>
            <button className="btn-secondary flex items-center gap-2"><Download size={16} />Exportar</button>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Origen</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Destino</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Productos</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
              </tr></thead>
              <tbody>
                {mockTransfers.map((t, i) => (
                  <tr key={t.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                    <td className="px-4 py-3 font-mono text-primary font-medium">{t.code}</td>
                    <td className="px-4 py-3 text-foreground">{t.from}</td>
                    <td className="px-4 py-3 text-foreground">{t.to}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.date}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.items} items</td>
                    <td className="px-4 py-3"><span className={statusMap[t.status].cls}>{statusMap[t.status].label}</span></td>
                    <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye size={14} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors"><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 fade-in" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-lg mx-4 slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-4">Nueva Transferencia</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Sucursal Origen</label><select className="input-field"><option>Sucursal Principal</option><option>Sucursal Norte</option><option>Sucursal Este</option></select></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Sucursal Destino</label><select className="input-field"><option>Sucursal Norte</option><option>Sucursal Principal</option><option>Sucursal Este</option></select></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Fecha</label><input type="date" className="input-field" /></div>
              <textarea className="input-field" placeholder="Notas u observaciones..." rows={3} />
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary flex-1">Crear Transferencia</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
