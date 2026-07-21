'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import { Plus, Search, Filter, Download, Eye, Edit2, Trash2 } from 'lucide-react';

const mockAdjustments = [
  { id: 1, code: 'AJU-001', product: 'Arroz Selecto 5lb', type: 'entrada' as const, qty: 50, reason: 'Inventario inicial', date: '2024-01-15', responsible: 'Admin General' },
  { id: 2, code: 'AJU-002', product: 'Aceite Vegetal 1L', type: 'salida' as const, qty: 5, reason: 'Productos dañados', date: '2024-01-14', responsible: 'Carlos López' },
  { id: 3, code: 'AJU-003', product: 'Leche Entera 1L', type: 'perdida' as const, qty: 3, reason: 'Vencimiento', date: '2024-01-13', responsible: 'María García' },
  { id: 4, code: 'AJU-004', product: 'Azúcar Blanca 2lb', type: 'entrada' as const, qty: 100, reason: 'Corrección de inventario', date: '2024-01-12', responsible: 'Admin General' },
];

const typeMap = {
  entrada: { label: 'Entrada', cls: 'badge-success' },
  salida: { label: 'Salida', cls: 'badge-warning' },
  perdida: { label: 'Pérdida', cls: 'badge-danger' },
};

export default function StockAdjustmentsPage() {
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  return (
    <AppLayout currentPath={pathname}>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ajuste de Stock</h1>
            <p className="text-sm text-muted-foreground mt-1">Registra entradas, salidas y pérdidas de inventario</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-fit"><Plus size={16} />Nuevo Ajuste</button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4"><p className="text-xs text-muted-foreground">Entradas</p><p className="text-2xl font-bold text-success mt-1">8</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">Salidas</p><p className="text-2xl font-bold text-warning mt-1">3</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">Pérdidas</p><p className="text-2xl font-bold text-danger mt-1">2</p></div>
        </div>
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input className="input-field pl-9" placeholder="Buscar ajustes..." value={search} onChange={e => setSearch(e.target.value)} /></div>
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
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Producto</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Cantidad</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Motivo</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Responsable</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
              </tr></thead>
              <tbody>
                {mockAdjustments.map((a, i) => (
                  <tr key={a.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                    <td className="px-4 py-3 font-mono text-primary font-medium">{a.code}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{a.product}</td>
                    <td className="px-4 py-3"><span className={typeMap[a.type].cls}>{typeMap[a.type].label}</span></td>
                    <td className="px-4 py-3 text-foreground font-semibold hidden md:table-cell">{a.qty} uds</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{a.reason}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.date}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{a.responsible}</td>
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
          <div className="card p-6 w-full max-w-md mx-4 slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-4">Nuevo Ajuste de Stock</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de ajuste</label>
                <select className="input-field"><option>Entrada</option><option>Salida</option><option>Pérdida</option><option>Producto dañado</option></select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Producto</label><input className="input-field" placeholder="Buscar producto..." /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Cantidad</label><input className="input-field" type="number" placeholder="0" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Motivo</label><textarea className="input-field" rows={3} placeholder="Describe el motivo del ajuste..." /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary flex-1">Guardar Ajuste</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
