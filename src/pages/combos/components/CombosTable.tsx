import React, { useState } from 'react';
import {
  Edit3,
  Copy,
  Trash2,
  Eye,
  Power,
  Layers,
  Calendar,
  Store,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import { Combo } from '@/lib/comboStore';
import { TableRowSkeleton } from '@/components/ui/LoadingSkeleton';

import CategoryIcon from '@/components/ui/CategoryIcon';

interface CombosTableProps {
  combos: Combo[];
  loading: boolean;
  onEdit: (combo: Combo) => void;
  onDuplicate: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDeleteRequest: (combo: Combo) => void;
  onViewDetail: (combo: Combo) => void;
}

export default function CombosTable({
  combos,
  loading,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDeleteRequest,
  onViewDetail,
}: CombosTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting state
  const [sortField, setSortField] = useState<keyof Combo>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Combo) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedCombos = [...combos].sort((a, b) => {
    const av = a[sortField];
    const bv = b[sortField];
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedCombos.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCombos = sortedCombos.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (val: number) => `RD$ ${val.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <tbody>
            <TableRowSkeleton cols={9} />
            <TableRowSkeleton cols={9} />
            <TableRowSkeleton cols={9} />
            <TableRowSkeleton cols={9} />
            <TableRowSkeleton cols={9} />
          </tbody>
        </table>
      </div>
    );
  }

  if (sortedCombos.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/80 p-12 text-center space-y-3 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-secondary/80 text-muted-foreground flex items-center justify-center mx-auto">
          <Layers size={32} />
        </div>
        <h3 className="text-lg font-extrabold text-foreground">No se encontraron combos</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          No hay combos registradas que coincidan con la búsqueda o filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-border/80 bg-secondary/40 text-muted-foreground text-xs font-black uppercase tracking-wider select-none">
              <th className="py-4 px-4">Combo</th>
              <th className="py-4 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('code')}>
                <div className="flex items-center gap-1">
                  Código
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-4 px-3 text-right">
                <div className="flex items-center justify-end gap-1 text-slate-600 dark:text-slate-300">
                  Precio Costo
                </div>
              </th>
              <th className="py-4 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('price')}>
                <div className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400">
                  Precio Venta
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-4 px-3 text-center">Margen Ganancia</th>
              <th className="py-4 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('normalPrice')}>
                <div className="flex items-center justify-end gap-1">
                  Precio Normal
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-4 px-3 text-center">Ahorro Cliente</th>
              <th className="py-4 px-3 text-center">Componentes</th>
              <th className="py-4 px-3 text-center">Estado</th>
              <th className="py-4 px-3">Vigencia / Sucursales</th>
              <th className="py-4 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginatedCombos.map((combo) => {
              const isExpired = combo.endDate && new Date(combo.endDate) < new Date();
              const comboCost = combo.totalCost ?? (combo.items ? combo.items.reduce((s, i) => s + (i.costPrice || 0) * (i.quantity || 1), 0) : 0);
              const profitAmt = combo.price - comboCost;
              const profitPct = combo.marginPercent ?? (combo.price > 0 ? ((profitAmt / combo.price) * 100) : 0);

              return (
                <tr
                  key={combo.id}
                  className="hover:bg-secondary/30 transition-colors group"
                >
                  {/* Combo info & icon */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={combo.category} name={combo.name} isCombo size="md" />
                      <div className="min-w-0">
                        <p
                          onClick={() => onViewDetail(combo)}
                          className="font-extrabold text-foreground hover:text-primary transition-colors cursor-pointer truncate max-w-[200px]"
                          title={combo.name}
                        >
                          {combo.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{combo.category}</p>
                      </div>
                    </div>
                  </td>

                  {/* Code */}
                  <td className="py-3.5 px-3">
                    <div className="font-mono text-xs font-bold text-foreground">{combo.code}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{combo.barcode}</div>
                  </td>

                  {/* Cost Price */}
                  <td className="py-3.5 px-3 text-right">
                    <span className="font-bold text-muted-foreground text-sm">{formatCurrency(comboCost)}</span>
                  </td>

                  {/* Sale Price */}
                  <td className="py-3.5 px-3 text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(combo.price)}</span>
                  </td>

                  {/* Profit Margin */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 tabular-nums">
                        +{profitPct.toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground mt-0.5 tabular-nums">
                        +{formatCurrency(profitAmt)}
                      </span>
                    </div>
                  </td>

                  {/* Normal price */}
                  <td className="py-3.5 px-3 text-right">
                    <span className="line-through text-xs font-semibold text-muted-foreground">
                      {formatCurrency(combo.normalPrice)}
                    </span>
                  </td>

                  {/* Savings */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        -{combo.savingsPercent.toFixed(1)}%
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground mt-0.5">
                        {formatCurrency(combo.savingsAmount)}
                      </span>
                    </div>
                  </td>

                  {/* Products count */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onViewDetail(combo)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-secondary text-foreground text-xs font-extrabold hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <PackageCheck size={14} />
                      {combo.items.length} prods
                    </button>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(combo.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        combo.active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                      title="Haz clic para cambiar estado"
                    >
                      <span className={`w-2 h-2 rounded-full ${combo.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {combo.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>

                  {/* Validity & Branches */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Calendar size={13} className="text-muted-foreground" />
                        {isExpired ? (
                          <span className="text-danger font-bold flex items-center gap-1">
                            <AlertTriangle size={12} /> Vencido ({combo.endDate})
                          </span>
                        ) : (
                          <span>{combo.startDate} a {combo.endDate}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Store size={12} />
                        <span>{combo.allBranches ? 'Todas las sucursales' : `${combo.branches.length} sucursales`}</span>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(combo)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Ver detalle del combo"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(combo)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Editar combo"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicate(combo.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10 transition-colors"
                        title="Duplicar combo"
                      >
                        <Copy size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(combo.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          combo.active
                            ? 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
                            : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                        title={combo.active ? 'Desactivar' : 'Activar'}
                      >
                        <Power size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteRequest(combo)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Eliminar combo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/80 bg-card">
        <p className="text-xs font-semibold text-muted-foreground">
          Mostrando <span className="font-extrabold text-foreground">{startIndex + 1}</span> a{' '}
          <span className="font-extrabold text-foreground">
            {Math.min(startIndex + itemsPerPage, sortedCombos.length)}
          </span>{' '}
          de <span className="font-extrabold text-foreground">{sortedCombos.length}</span> combos
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-xl border border-border/80 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                currentPage === pageNum
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-xl border border-border/80 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary text-foreground transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
