import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, User, Calendar, Clock, Laptop, ArrowRight } from 'lucide-react';
import type { AuditLog } from '../types';
import { ACTION_BADGE_MAP } from '../types';

interface AuditDetailDrawerProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditDetailDrawer({
  log,
  isOpen,
  onClose,
}: AuditDetailDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const badgeClass = ACTION_BADGE_MAP[log.action] || 'apple-badge-neutral';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-[var(--surface)] text-[var(--ink)] shadow-2xl flex flex-col border-l border-[var(--line)] animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="audit-drawer-title" className="text-base font-semibold text-[var(--ink)] truncate">
                  Evento de Auditoría
                </h2>
                <span className={`apple-badge ${badgeClass} text-[10px]`}>
                  {log.action}
                </span>
              </div>
              <p className="text-xs text-[var(--ink2)] truncate">
                {log.module} · {log.date} {log.time}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 select-none">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <User size={13} className="text-[var(--accent)]" /> Usuario
              </span>
              <p className="font-semibold text-[var(--ink)] truncate">{log.user}</p>
              <p className="text-[10px] text-[var(--ink2)] truncate">Rol: {log.role}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Calendar size={13} className="text-[var(--accent)]" /> Fecha y Hora
              </span>
              <p className="font-semibold font-mono text-[var(--ink)]">{log.date}</p>
              <p className="text-[10px] font-mono text-[var(--ink2)]">{log.time}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1 sm:col-span-2">
              <span className="text-[11px] text-[var(--ink2)] flex items-center gap-1.5 font-medium">
                <Laptop size={13} className="text-[var(--accent)]" /> Dispositivo / Dirección IP
              </span>
              <p className="font-mono text-xs text-[var(--ink)]">{log.ip || 'Local / Sistema'}</p>
            </div>
          </div>

          {/* Detalle de la acción */}
          <div className="p-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider block">
              Descripción del Evento
            </span>
            <p className="text-xs text-[var(--ink)] leading-relaxed font-medium">
              {log.details}
            </p>
          </div>

          {/* Comparativa Antes vs Después */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <span>Auditoría de Estado (Antes vs Después)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Antes */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
                <div className="px-3.5 py-2 bg-[var(--surface2)] border-b border-[var(--line)]">
                  <span className="text-[10px] uppercase font-semibold text-[var(--ink2)] tracking-wider">
                    Estado Previo (Antes)
                  </span>
                </div>
                <pre className="p-3 text-[11px] font-mono text-[var(--ink2)] overflow-x-auto max-h-48 leading-relaxed">
                  {log.before
                    ? JSON.stringify(log.before, null, 2)
                    : '// No aplica (Acción Inicial)'}
                </pre>
              </div>

              {/* Después */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
                <div className="px-3.5 py-2 bg-[var(--surface2)] border-b border-[var(--line)]">
                  <span className="text-[10px] uppercase font-semibold text-[var(--accent)] tracking-wider">
                    Estado Resultante (Después)
                  </span>
                </div>
                <pre className="p-3 text-[11px] font-mono text-[var(--ink)] overflow-x-auto max-h-48 leading-relaxed">
                  {log.after
                    ? JSON.stringify(log.after, null, 2)
                    : '// No aplica'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between text-xs text-[var(--ink2)] shrink-0">
          <div className="flex items-center gap-1">
            <span>Presiona</span>
            <kbd className="apple-kbd">Esc</kbd>
            <span>para cerrar</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="apple-btn-secondary !h-8 !px-4 text-xs font-medium cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
