import React, { useState } from 'react';
import {
  Eye,
  Edit,
  Copy,
  Trash2,
  Power,
  MoreVertical,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  Layers,
} from 'lucide-react';
import { Combo } from '@/lib/comboStore';
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
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    `RD$ ${val.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="card overflow-hidden border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="text-left px-5 py-3.5">Combo</th>
              <th className="text-left px-4 py-3.5">Código</th>
              <th className="text-right px-5 py-3.5">Precio Venta</th>
              <th className="text-right px-5 py-3.5">Ganancia</th>
              <th className="text-center px-4 py-3.5">Componentes</th>
              <th className="text-center px-4 py-3.5">Estado</th>
              <th className="text-left px-4 py-3.5">Vigencia</th>
              <th className="text-right px-5 py-3.5">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  Cargando combos desde Supabase...
                </td>
              </tr>
            ) : combos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Layers size={28} className="opacity-40" />
                    <span>No se encontraron combos registrados</span>
                  </div>
                </td>
              </tr>
            ) : (
              combos.map((combo, i) => {
                const openUpward = i >= combos.length - 2 || (combos.length > 3 && i >= combos.length / 2);
                const isExpired = combo.endDate && new Date(combo.endDate) < new Date();
                const comboCost =
                  combo.totalCost ??
                  (combo.items
                    ? combo.items.reduce((s, it) => s + (it.costPrice || 0) * (it.quantity || 1), 0)
                    : 0);
                const profitAmt = combo.price - comboCost;
                const profitPct =
                  combo.marginPercent ?? (combo.price > 0 ? (profitAmt / combo.price) * 100 : 0);

                return (
                  <tr
                    key={combo.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={combo.category} name={combo.name} isCombo size="md" />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onViewDetail(combo)}
                            className="font-bold text-xs text-slate-900 dark:text-white hover:text-primary transition-colors text-left truncate max-w-[220px] block"
                          >
                            {combo.name}
                          </button>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {combo.category}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {combo.code}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium font-mono mt-0.5">
                        {combo.barcode || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="font-extrabold text-xs tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(combo.price)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5 line-through">
                        {formatCurrency(combo.normalPrice)}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="font-extrabold text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(profitAmt)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {profitPct.toFixed(1)}% · ahorro {combo.savingsPercent.toFixed(1)}%
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onViewDetail(combo)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:border-primary/40 transition-colors"
                      >
                        <Package size={14} />
                        {combo.items.length} prods
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(combo.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                          combo.active
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
                        }`}
                        title="Clic para cambiar estado"
                      >
                        {combo.active ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        <span>{combo.active ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        {isExpired ? (
                          <span className="text-rose-600 dark:text-rose-400">Vencido</span>
                        ) : (
                          <span>
                            {combo.startDate || '—'} → {combo.endDate || '—'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionsId(openActionsId === combo.id ? null : combo.id)
                          }
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Acciones</span>
                          <MoreVertical size={14} className="text-slate-400" />
                        </button>

                        {openActionsId === combo.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setOpenActionsId(null)}
                            />
                            <div
                              className={`absolute right-0 ${
                                openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                              } w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-40 py-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs animate-in fade-in zoom-in-95`}
                            >
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionsId(null);
                                    onViewDetail(combo);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                                >
                                  <Eye size={15} className="text-emerald-600" />
                                  <span>Ver Detalle</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionsId(null);
                                    onEdit(combo);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                                >
                                  <Edit size={15} className="text-amber-500" />
                                  <span>Editar Combo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionsId(null);
                                    onDuplicate(combo.id);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                                >
                                  <Copy size={15} className="text-blue-500" />
                                  <span>Duplicar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionsId(null);
                                    onToggleStatus(combo.id);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                                >
                                  <Power size={15} className="text-slate-500" />
                                  <span>{combo.active ? 'Desactivar' : 'Activar'}</span>
                                </button>
                              </div>
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionsId(null);
                                    onDeleteRequest(combo);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
