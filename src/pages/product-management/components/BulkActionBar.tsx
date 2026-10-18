import React, { useState, useRef, useEffect } from 'react';
import { Download, X, CheckCircle2, ChevronUp } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onChangeStatus: (status: 'active' | 'inactive') => void;
  onExport: () => void;
  onCancel: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onChangeStatus,
  onExport,
  onCancel,
}: BulkActionBarProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusMenuOpen) return;

    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setStatusMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [statusMenuOpen]);

  if (selectedCount === 0) return null;

  return (
    <aside
      role="region"
      aria-label="Acciones masivas para productos seleccionados"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9980] max-w-[95vw] select-none"
    >
      <div
        className="flex items-center gap-2 sm:gap-3 px-4 py-2 rounded-full bg-[#1c1c1e] text-[#f5f5f7] border border-[#2c2c2e] shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-200"
        style={{
          boxShadow: '0 20px 45px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Contador */}
        <span className="text-xs font-semibold whitespace-nowrap text-white pl-1">
          {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
        </span>

        <span className="h-4 w-[1px] bg-[#3a3a3c]" aria-hidden="true" />

        {/* Cambiar estado */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setStatusMenuOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={statusMenuOpen}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#f5f5f7] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#30d17b]"
          >
            <span>Cambiar estado</span>
            <ChevronUp size={12} strokeWidth={2} className={`transition-transform duration-150 ${statusMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {statusMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 py-1 rounded-xl bg-[#2c2c2e] border border-[#3a3a3c] shadow-xl text-xs text-white z-50 animate-in fade-in zoom-in-95"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setStatusMenuOpen(false);
                  onChangeStatus('active');
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer outline-none focus-visible:bg-white/15"
              >
                <CheckCircle2 size={13} className="text-[#30d17b]" />
                <span>Marcar como activo</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setStatusMenuOpen(false);
                  onChangeStatus('inactive');
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 text-[#a1a1a6] hover:text-white transition-colors cursor-pointer outline-none focus-visible:bg-white/15"
              >
                <X size={13} />
                <span>Marcar como inactivo</span>
              </button>
            </div>
          )}
        </div>

        {/* Exportar */}
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#f5f5f7] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#30d17b]"
        >
          <Download size={13} strokeWidth={1.8} />
          <span>Exportar</span>
        </button>

        <span className="h-4 w-[1px] bg-[#3a3a3c]" aria-hidden="true" />

        {/* Cancelar */}
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 text-xs font-medium text-[#a1a1a6] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#30d17b]"
        >
          Cancelar
        </button>
      </div>
    </aside>
  );
}
