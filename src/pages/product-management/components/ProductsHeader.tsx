import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Plus, Search, Tag, Award, Scale, FileText } from 'lucide-react';

interface ProductsHeaderProps {
  onAdd: () => void;
  onExport: () => void;
  onImport?: () => void;
  onOpenCategories?: () => void;
  onOpenBrands?: () => void;
  onOpenCommandPalette?: () => void;
}

export default function ProductsHeader({
  onAdd,
  onExport,
  onImport,
  onOpenCategories,
  onOpenBrands,
  onOpenCommandPalette,
}: ProductsHeaderProps) {
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setManageMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!manageMenuOpen) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMenu();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [manageMenuOpen, closeMenu]);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 select-none">
      {/* Title & Subtitle */}
      <div>
        <h1 className="apple-title">Productos</h1>
        <p className="apple-subtitle mt-1">Catálogo, precios y existencias.</p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-shrink-0">
        {/* Ghost button: Buscar o ejecutar ⌘K */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="apple-btn-ghost text-xs text-[var(--ink2)] hover:text-[var(--ink)]"
          aria-label="Buscar o ejecutar comandos (Atajo: Comando K o Control K)"
        >
          <Search size={14} strokeWidth={1.8} className="text-[var(--ink2)]" />
          <span>Buscar o ejecutar</span>
          <span className="apple-kbd ml-1">⌘K</span>
        </button>

        {/* Ghost menu: Gestionar */}
        <div className="relative" ref={menuRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setManageMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={manageMenuOpen}
            aria-label="Menú gestionar catálogo, balanza y reportes"
            className={`apple-btn-ghost text-xs ${
              manageMenuOpen ? 'bg-[var(--hover)] text-[var(--ink)]' : 'text-[var(--ink2)] hover:text-[var(--ink)]'
            }`}
          >
            <span>Gestionar</span>
            <ChevronDown
              size={13}
              strokeWidth={1.8}
              className={`transition-transform duration-150 ${manageMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {manageMenuOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 top-full mt-1.5 w-56 py-1.5 rounded-xl border border-[var(--line)] shadow-lg z-50 animate-in fade-in zoom-in-95"
              style={{
                backgroundColor: 'var(--surface)',
                boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  onOpenCategories?.();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-left transition-colors cursor-pointer text-[var(--ink)] hover:bg-[var(--hover)]"
              >
                <Tag size={14} strokeWidth={1.8} className="text-[var(--ink2)]" />
                <span>Categorías</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  onOpenBrands?.();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-left transition-colors cursor-pointer text-[var(--ink)] hover:bg-[var(--hover)]"
              >
                <Award size={14} strokeWidth={1.8} className="text-[var(--ink2)]" />
                <span>Marcas</span>
              </button>

              <div className="my-1 border-t border-[var(--line)]" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  onImport?.();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-left transition-colors cursor-pointer text-[var(--ink)] hover:bg-[var(--hover)]"
              >
                <Scale size={14} strokeWidth={1.8} className="text-[var(--ink2)]" />
                <span>Importar / actualizar balanza</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  onExport();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-left transition-colors cursor-pointer text-[var(--ink)] hover:bg-[var(--hover)]"
              >
                <FileText size={14} strokeWidth={1.8} className="text-[var(--ink2)]" />
                <span>Exportar PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary Pill: Nuevo producto */}
        <button
          type="button"
          onClick={onAdd}
          className="apple-btn-primary"
          aria-label="Crear nuevo producto"
        >
          <span>Nuevo producto</span>
        </button>
      </div>
    </header>
  );
}
