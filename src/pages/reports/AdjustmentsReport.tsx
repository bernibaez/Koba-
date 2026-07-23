import React, { useMemo, useState } from 'react';
import { Search, Sliders } from 'lucide-react';

const mockAdjustments = [
  { id: 1, user: 'Admin General', date: '2024-01-15', product: 'Arroz Selecto 5lb', previousQty: 200, newQty: 250, reason: 'Inventario inicial / conteo físico' },
  { id: 2, user: 'Carlos López', date: '2024-01-14', product: 'Aceite Vegetal 1L', previousQty: 23, newQty: 18, reason: 'Productos dañados' },
  { id: 3, user: 'María García', date: '2024-01-13', product: 'Leche Entera 1L', previousQty: 11, newQty: 8, reason: 'Vencimiento' },
  { id: 4, user: 'Admin General', date: '2024-01-12', product: 'Azúcar Blanca 2lb', previousQty: 80, newQty: 180, reason: 'Corrección de inventario' },
  { id: 5, user: 'Pedro Sánchez', date: '2024-01-11', product: 'Detergente 1kg', previousQty: 5, newQty: 0, reason: 'Merma por rotura' },
  { id: 6, user: 'Luisa Fernández', date: '2024-01-10', product: 'Refresco Cola 2L', previousQty: 12, newQty: 5, reason: 'Ajuste por diferencia de conteo' },
];

/** Informe de ajustes (dentro de Informes) */
export default function AdjustmentsReport() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      mockAdjustments.filter(
        (a) =>
          a.user.toLowerCase().includes(search.toLowerCase()) ||
          a.product.toLowerCase().includes(search.toLowerCase()) ||
          a.reason.toLowerCase().includes(search.toLowerCase()) ||
          a.date.includes(search)
      ),
    [search]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Total ajustes</p>
          <p className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
            <Sliders size={20} className="text-primary" />
            {mockAdjustments.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Incrementos</p>
          <p className="text-2xl font-bold text-success mt-1">
            {mockAdjustments.filter((a) => a.newQty > a.previousQty).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Disminuciones</p>
          <p className="text-2xl font-bold text-danger mt-1">
            {mockAdjustments.filter((a) => a.newQty < a.previousQty).length}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-field pl-9"
          placeholder="Buscar por usuario, producto o motivo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Producto</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Cant. anterior</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Cant. nueva</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Diferencia</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const diff = a.newQty - a.previousQty;
                return (
                  <tr key={a.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{a.user}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.date}</td>
                    <td className="px-4 py-3 text-foreground">{a.product}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.previousQty}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.newQty}</td>
                    <td className="px-4 py-3">
                      <span className={diff >= 0 ? 'badge-success' : 'badge-danger'}>
                        {diff >= 0 ? `+${diff}` : diff}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{a.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
