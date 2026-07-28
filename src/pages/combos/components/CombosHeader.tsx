import React from 'react';
import { Boxes, CheckCircle2, TrendingUp, Sparkles, Plus, Download, Upload, Filter } from 'lucide-react';
import { Combo } from '@/lib/comboStore';

interface CombosHeaderProps {
  combos: Combo[];
  onNewCombo: () => void;
  onExport: () => void;
  onImport: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
}

export default function CombosHeader({
  combos,
  onNewCombo,
  onExport,
  onImport,
  onToggleFilters,
  showFilters,
}: CombosHeaderProps) {
  const activeCount = combos.filter((c) => c.active).length;
  const avgSavingsPercent = combos.length
    ? (combos.reduce((acc, c) => acc + c.savingsPercent, 0) / combos.length).toFixed(1)
    : '0';
  const totalSalesCount = combos.reduce((acc, c) => acc + (c.salesCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Title & Actions Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-card to-secondary/30 p-6 rounded-2xl border border-border/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-xs">
              <Boxes size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Gestión de Combos y Paquetes
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {combos.length} Combos
                </span>
              </h1>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                Crea y administra ofertas combinadas que descuentan inventario automáticamente por componente en el POS.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleFilters}
            className={`btn-secondary flex items-center gap-2 text-sm font-bold transition-all ${
              showFilters ? 'bg-primary/10 text-primary border-primary/30' : ''
            }`}
          >
            <Filter size={16} />
            Filtros
          </button>

          <button
            type="button"
            onClick={onImport}
            className="btn-secondary flex items-center gap-2 text-sm font-bold"
          >
            <Upload size={16} />
            Importar
          </button>

          <button
            type="button"
            onClick={onExport}
            className="btn-secondary flex items-center gap-2 text-sm font-bold"
          >
            <Download size={16} />
            Exportar
          </button>

          <button
            type="button"
            onClick={onNewCombo}
            className="btn-primary flex items-center gap-2 text-sm font-bold shadow-md shadow-primary/20 scale-[1.02] hover:scale-[1.04] transition-all"
          >
            <Plus size={18} />
            Nuevo Combo
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Boxes size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Combos</p>
            <p className="text-2xl font-black text-foreground">{combos.length}</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Activos en POS</p>
            <p className="text-2xl font-black text-foreground">{activeCount}</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ahorro Promedio</p>
            <p className="text-2xl font-black text-foreground">{avgSavingsPercent}%</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ventas por Combo</p>
            <p className="text-2xl font-black text-foreground">{totalSalesCount} unds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
