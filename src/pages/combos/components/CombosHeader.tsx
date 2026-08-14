import React from 'react';
import { Boxes, Plus, Upload } from 'lucide-react';
import { Combo } from '@/lib/comboStore';

interface CombosHeaderProps {
  combos: Combo[];
  onNewCombo: () => void;
  onImport: () => void;
}

export default function CombosHeader({ combos, onNewCombo, onImport }: CombosHeaderProps) {
  const activeCount = combos.filter((c) => c.active).length;
  const avgSavingsPercent = combos.length
    ? (combos.reduce((acc, c) => acc + c.savingsPercent, 0) / combos.length).toFixed(1)
    : '0';
  const totalSalesCount = combos.reduce((acc, c) => acc + (c.salesCount || 0), 0);
  const avgPrice =
    combos.length > 0
      ? combos.reduce((acc, c) => acc + c.price, 0) / combos.length
      : 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Boxes className="text-primary" size={26} />
            Gestión de Combos y Paquetes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea ofertas combinadas que descuentan inventario automáticamente por componente en el POS
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onImport}
            className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          >
            <Upload size={15} /> Importar
          </button>
          <button
            type="button"
            onClick={onNewCombo}
            className="btn-primary flex items-center gap-2 font-bold shadow-md"
          >
            <Plus size={16} /> Nuevo Combo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 hover:border-primary/40 transition-all">
          <p className="text-xs text-muted-foreground font-medium">Total Combos</p>
          <p className="text-2xl font-bold text-foreground mt-1">{combos.length}</p>
        </div>
        <div className="card p-4 hover:border-emerald-500/40 transition-all">
          <p className="text-xs text-muted-foreground font-medium">Activos en POS</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="card p-4 hover:border-amber-500/40 transition-all">
          <p className="text-xs text-muted-foreground font-medium">Ahorro Promedio</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{avgSavingsPercent}%</p>
        </div>
        <div className="card p-4 hover:border-blue-500/40 transition-all">
          <p className="text-xs text-muted-foreground font-medium">Precio Promedio / Ventas</p>
          <p className="text-2xl font-bold text-info mt-1">
            RD$ {avgPrice.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
            <span className="text-sm font-medium text-muted-foreground ml-1">· {totalSalesCount} unds</span>
          </p>
        </div>
      </div>
    </>
  );
}
