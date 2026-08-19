import React from 'react';
import { Package, Download, Plus, FileText } from 'lucide-react';

interface ProductsHeaderProps {
  onAdd: () => void;
  onExport: () => void;
  onImport?: () => void;
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
}

export default function ProductsHeader({
  onAdd,
  onExport,
  onImport,
}: ProductsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="text-primary" size={26} />
          Gestión de Productos e Inventario
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra tu catálogo de productos, precios, stock y etiquetas de código de barras
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onExport} className="btn-secondary flex items-center gap-1.5 text-xs font-semibold">
          <Download size={14} /> Exportar PDF
        </button>
        <button type="button" onClick={onImport} className="btn-secondary flex items-center gap-1.5 text-xs font-semibold">
          <FileText size={15} /> Importar / actualizar balanza
        </button>
        <button type="button" onClick={onAdd} className="btn-primary flex items-center gap-2 font-bold shadow-md">
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>
    </div>
  );
}
