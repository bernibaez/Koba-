import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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

interface MenuPos {
  top?: number;
  bottom?: number;
  left: number;
}

const MENU_WIDTH = 192;
const MENU_HEIGHT = 270;

function getMenuPositionFor(btnEl: HTMLElement): MenuPos {
  const rect = btnEl.getBoundingClientRect();
  const vw =
    window.visualViewport?.width ?? window.innerWidth ?? document.documentElement.clientWidth;
  const vh =
    window.visualViewport?.height ?? window.innerHeight ?? document.documentElement.clientHeight;
  let left = rect.right - MENU_WIDTH;
  if (left < 8) left = 8;
  if (left + MENU_WIDTH > vw - 8) left = Math.max(8, vw - MENU_WIDTH - 8);
  const spaceBelow = vh - rect.bottom;
  if (spaceBelow < MENU_HEIGHT + 8 && rect.top - 8 > MENU_HEIGHT) {
    return { bottom: vh - rect.top + 6, left };
  }
  return { top: rect.bottom + 6, left };
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

  const formatCurrency = (val: number) =>
    `RD$ ${val.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openCombo = combos.find((c) => c.id === openId) ?? null;

  useLayoutEffect(() => {
    if (!openId) {
      setMenuPos(null);
      return;
    }
    const btn = btnRefs.current[openId];
    if (!btn) {
      setOpenId(null);
      return;
    }
    setMenuPos(getMenuPositionFor(btn));
  }, [openId]);

  useLayoutEffect(() => {
    if (!openId) return;
    const onDocMouseDown = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as Node | null;
      const menuEl = menuRef.current;
      const btnEl = openId ? btnRefs.current[openId] : null;
      if (
        target &&
        (!menuEl || !menuEl.contains(target)) &&
        (!btnEl || !btnEl.contains(target))
      ) {
        setOpenId(null);
      }
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpenId(null);
    };
    const onReposition = () => {
      const btn = btnRefs.current[openId];
      if (!btn) return;
      setMenuPos(getMenuPositionFor(btn));
    };
    const onScrollOrResize = () => setOpenId(null);
    document.addEventListener('mousedown', onDocMouseDown, true);
    document.addEventListener('touchstart', onDocMouseDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, true);
    window.visualViewport?.addEventListener('scroll', onScrollOrResize, true);
    window.visualViewport?.addEventListener('resize', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown, true);
      document.removeEventListener('touchstart', onDocMouseDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize, true);
      window.visualViewport?.removeEventListener('scroll', onScrollOrResize, true);
      window.visualViewport?.removeEventListener('resize', onReposition, true);
    };
  }, [openId]);

  const toggleMenu = (combo: Combo) => {
    setOpenId((prev) => (prev === combo.id ? null : combo.id));
  };

  return (
    <>
      <div className="card border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
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
                combos.map((combo) => {
                  const isExpired = combo.endDate && new Date(combo.endDate) < new Date();
                  const comboCost =
                    combo.totalCost ??
                    (combo.items
                      ? combo.items.reduce((s, it) => s + (it.costPrice || 0) * (it.quantity || 1), 0)
                      : 0);
                  const profitAmt = combo.price - comboCost;
                  const profitPct =
                    combo.marginPercent ?? (combo.price > 0 ? (profitAmt / combo.price) * 100 : 0);
                  const isOpen = openId === combo.id;

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
                        <button
                          type="button"
                          ref={(el) => {
                            btnRefs.current[combo.id] = el;
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(combo);
                          }}
                          className={`px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                            isOpen
                              ? 'border-primary/40 text-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>Acciones</span>
                          <MoreVertical
                            size={14}
                            className={isOpen ? 'text-primary' : 'text-slate-400'}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openCombo && menuPos && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                top: menuPos.top !== undefined ? `${menuPos.top}px` : undefined,
                bottom: menuPos.bottom !== undefined ? `${menuPos.bottom}px` : undefined,
                left: `${menuPos.left}px`,
                width: `${MENU_WIDTH}px`,
                zIndex: 9999,
              }}
              className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl py-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs"
            >
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(null);
                    onViewDetail(openCombo);
                  }}
                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                >
                  <Eye size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Ver Detalle</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(null);
                    onEdit(openCombo);
                  }}
                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                >
                  <Edit size={15} className="text-amber-500 dark:text-amber-400" />
                  <span>Editar Combo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(null);
                    onDuplicate(openCombo.id);
                  }}
                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                >
                  <Copy size={15} className="text-blue-500 dark:text-blue-400" />
                  <span>Duplicar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(null);
                    onToggleStatus(openCombo.id);
                  }}
                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                >
                  <Power size={15} className="text-slate-500 dark:text-slate-400" />
                  <span>{openCombo.active ? 'Desactivar' : 'Activar'}</span>
                </button>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(null);
                    onDeleteRequest(openCombo);
                  }}
                  className="w-full text-left px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
