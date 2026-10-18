import React, { useEffect, useRef } from 'react';
import {
  Printer,
  Pencil,
  MoreHorizontal,
  Eye,
  RotateCcw,
  Ban,
  Trash2,
} from 'lucide-react';
import type { Sale } from '../types';
import {
  getSaleActions,
  type SaleActionType,
  type SalePermissions,
} from '../utils/saleActions';

export interface SaleRowActionsProps {
  sale: Sale;
  permissions?: SalePermissions;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  onAction: (actionType: SaleActionType, sale: Sale) => void;
}

export default function SaleRowActions({
  sale,
  permissions,
  isOpen,
  onToggleOpen,
  onClose,
  onAction,
}: SaleRowActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { direct, menu } = getSaleActions(sale, permissions);

  // Cerrar al presionar tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        buttonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDirectClick = (e: React.MouseEvent, actionType: SaleActionType) => {
    e.stopPropagation();
    onClose();
    onAction(actionType, sale);
  };

  const handleMenuItemClick = (e: React.MouseEvent, actionType: SaleActionType) => {
    e.stopPropagation();
    onClose();
    onAction(actionType, sale);
  };

  const renderActionIcon = (actionType: SaleActionType) => {
    switch (actionType) {
      case 'print':
        return <Printer size={15} strokeWidth={1.75} />;
      case 'edit':
        return <Pencil size={15} strokeWidth={1.75} />;
      case 'detail':
        return <Eye size={14} strokeWidth={1.75} className="text-[var(--ink2)]" />;
      case 'return':
        return <RotateCcw size={14} strokeWidth={1.75} className="text-amber-500" />;
      case 'void':
        return <Ban size={14} strokeWidth={1.75} className="text-[var(--bad)]" />;
      case 'delete':
        return <Trash2 size={14} strokeWidth={1.75} className="text-[var(--bad)]" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="relative flex items-center justify-end gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Botones de acción directa (print, edit) */}
      {direct.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={(e) => handleDirectClick(e, action.id)}
          aria-label={action.label}
          title={action.label}
          className="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
        >
          {renderActionIcon(action.id)}
        </button>
      ))}

      {/* Botón de más acciones ⋯ */}
      {menu.length > 0 && (
        <div className="relative inline-block text-left">
          <button
            ref={buttonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleOpen();
            }}
            aria-label="Más acciones"
            title="Más acciones"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            className="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          >
            <MoreHorizontal size={15} strokeWidth={1.75} />
          </button>

          {isOpen && (
            <>
              {/* Backdrop transparente para click outside */}
              <div
                className="fixed inset-0 z-30"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              />

              {/* Menú flotante minimalista estilo Apple */}
              <div
                ref={menuRef}
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-[var(--line)] shadow-lg z-40 py-1 text-xs select-none animate-in fade-in zoom-in-95"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {menu.map((item, idx) => {
                  const isDanger = item.danger;
                  const isVoidOrDelete = item.id === 'void' || item.id === 'delete';

                  return (
                    <React.Fragment key={item.id}>
                      {isVoidOrDelete && idx > 0 && (
                        <div className="my-1 border-t border-[var(--line)]" />
                      )}
                      <button
                        role="menuitem"
                        type="button"
                        onClick={(e) => handleMenuItemClick(e, item.id)}
                        disabled={item.disabled}
                        className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors cursor-pointer outline-none focus-visible:bg-[var(--hover)] ${
                          isDanger
                            ? 'text-[var(--bad)] hover:bg-[var(--bad)]/10'
                            : 'text-[var(--ink)] hover:bg-[var(--hover)]'
                        } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {renderActionIcon(item.id)}
                        <span>{item.label}</span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
