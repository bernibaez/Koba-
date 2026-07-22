import React from 'react';
import { Package, TrendingDown, CheckCircle, Download } from 'lucide-react';

interface ProductsHeaderProps {
  onAdd: () => void;
  onExport: () => void;
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
}

export default function ProductsHeader({
  onAdd,
  onExport,
  totalProducts,
  activeProducts,
  lowStockCount,
}: ProductsHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Inventario</span>
          <span>/</span>
          <span className="text-foreground font-medium">Productos</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Gestión de Productos</h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Package size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{totalProducts} productos en total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-success" />
            <span className="text-sm text-muted-foreground">{activeProducts} activos</span>
          </div>
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingDown size={14} className="text-warning" />
              <span className="text-sm text-warning font-medium">{lowStockCount} con stock bajo</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="btn-secondary flex items-center gap-2 text-sm">
          Importar
        </button>
        <button type="button" onClick={onExport} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={14} />
          Exportar PDF
        </button>
        <button type="button" onClick={onAdd} className="btn-primary flex items-center gap-2 text-sm">
          + Nuevo Producto
        </button>
      </div>
    </div>
  );
}
