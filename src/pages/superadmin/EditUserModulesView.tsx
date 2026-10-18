import React, { useState } from 'react';
import {
  ArrowLeft,
  Layers,
  Sparkles,
  CheckCircle2,
  Check,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import type { Empresa, Perfil } from '@/types/database';
import { ALL_APP_MODULES } from '@/services/subscriptionModules.service';

interface EditUserModulesViewProps {
  user: Perfil;
  empresa?: Empresa | null;
  mode: 'inherit' | 'custom';
  onModeChange: (mode: 'inherit' | 'custom') => void;
  customModules: string[];
  onToggleModule: (moduleId: string) => void;
  onSetAllModules: (all: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function EditUserModulesView({
  user,
  empresa,
  mode,
  onModeChange,
  customModules,
  onToggleModule,
  onSetAllModules,
  onSubmit,
  onCancel,
  submitting,
}: EditUserModulesViewProps) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('todos');

  const filteredModules = ALL_APP_MODULES.filter((m) => {
    const matchCat = filterCat === 'todos' || m.group === filterCat;
    const matchSearch =
      !search ||
      m.label.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.href.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-secondary/60 text-foreground text-xs font-semibold transition group cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver a Usuarios</span>
          </button>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <span>Super Admin / Usuarios / Módulos</span>
              <span>•</span>
              <span className="font-semibold text-foreground">{empresa?.nombre || 'KOBA'}</span>
              <span>(Plan {(empresa?.plan || 'pro').toUpperCase()})</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Módulos de Acceso: {user.nombre_completo}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary/60 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Guardar Módulos</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div
          onClick={() => onModeChange('inherit')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            mode === 'inherit'
              ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-2xs'
              : 'border-border/70 bg-card hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Layers size={14} className={mode === 'inherit' ? 'text-primary' : ''} />
              Heredar del Plan de Empresa
            </span>
            {mode === 'inherit' && (
              <CheckCircle2 size={16} className="text-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            El usuario tendrá acceso automáticamente a todos los módulos que estén permitidos para el plan <strong>{(empresa?.plan || 'pro').toUpperCase()}</strong>.
          </p>
        </div>

        <div
          onClick={() => onModeChange('custom')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            mode === 'custom'
              ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-2xs'
              : 'border-border/70 bg-card hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Sparkles size={14} className={mode === 'custom' ? 'text-primary' : ''} />
              Personalizar Excepciones
            </span>
            {mode === 'custom' && (
              <CheckCircle2 size={16} className="text-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Permite habilitar o bloquear módulos específicos exclusivamente para esta cuenta, sin importar el plan de su empresa.
          </p>
        </div>
      </div>

      {/* Custom Modules Picker */}
      {mode === 'custom' && (
        <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Selección de Módulos Autorizados ({customModules.length} de {ALL_APP_MODULES.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Marca únicamente los módulos que deseas que aparezcan en el menú lateral de este usuario
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetAllModules(true)}
                className="text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                Marcar Todos
              </button>
              <span className="text-border">•</span>
              <button
                type="button"
                onClick={() => onSetAllModules(false)}
                className="text-xs text-muted-foreground font-semibold hover:underline cursor-pointer"
              >
                Solo Dashboard
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar módulo por nombre o ruta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {['todos', 'Principal', 'Operaciones', 'Inventario', 'CRM', 'Finanzas', 'Análisis', 'Configuración'].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCat(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      filterCat === cat
                        ? 'bg-foreground text-background font-bold shadow-2xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {filteredModules.map((mod) => {
              const isChecked = customModules.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  onClick={() => onToggleModule(mod.id)}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all text-left ${
                    isChecked
                      ? 'border-primary/50 bg-primary/5 shadow-2xs text-foreground'
                      : 'border-border/60 bg-background/50 hover:bg-secondary/40 text-muted-foreground opacity-80'
                  }`}
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center border text-[10px] shrink-0 transition-colors ${
                      isChecked
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {isChecked && <Check size={11} />}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-foreground truncate">{mod.label}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground shrink-0 font-medium">
                        {mod.group}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {mod.description}
                    </p>
                    <span className="font-mono text-[9px] text-muted-foreground/70 block mt-0.5">
                      {mod.href}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary/60 text-foreground text-xs font-semibold transition cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Volver a Usuarios</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Guardando Permisos...</span>
            </>
          ) : (
            <>
              <Check size={15} />
              <span>Guardar Configuración de Módulos</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
