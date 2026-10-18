import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Check, RefreshCw } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import type { Perfil } from '@/types/database';

interface ResetPasswordModalProps {
  open: boolean;
  user: Perfil | null;
  newPass: string;
  onPassChange: (pass: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitting: boolean;
}

export default function ResetPasswordModal({
  open,
  user,
  newPass,
  onPassChange,
  onSubmit,
  onClose,
  submitting,
}: ResetPasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  if (!user) return null;

  return (
    <ModalShell open={open} onClose={onClose} size="md">
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
            <KeyRound size={12} />
            <span>Seguridad & Acceso</span>
          </div>
          <h3 className="text-base font-bold text-foreground">
            Cambiar Contraseña de Usuario
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Asigna una nueva clave a <strong className="text-foreground">{user.nombre_completo}</strong> ({user.correo})
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mínimo 6 caracteres"
                value={newPass}
                onChange={(e) => onPassChange(e.target.value)}
                className="w-full px-3.5 py-2 pr-9 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              El usuario podrá iniciar sesión de inmediato con esta nueva clave.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary/60 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Actualizar Clave</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
