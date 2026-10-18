import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useCajas } from '@/hooks/useCajas';
import { sugerirSiguienteCodigoCaja } from '@/services/cajas.service';
import { verificarLimiteCajas } from '@/services/subscriptionModules.service';
import { exportTableToPdf } from '@/lib/exportPdf';
import '@/styles/apple-tokens.css';
import type { Caja, CajaFormData } from './cajas/types';
import { isCajaActiva, isCajaPrincipal } from './cajas/types';
import CajasHeader from './cajas/components/CajasHeader';
import CajasMetrics from './cajas/components/CajasMetrics';
import CajasTable from './cajas/components/CajasTable';
import CajaFormDialog from './cajas/components/CajaFormDialog';

const emptyForm: CajaFormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  es_caja_principal: false,
  activa: true,
};

export default function CajasPage() {
  const [busqueda, setBusqueda] = useState('');
  const { cajas, loading, crearCaja, actualizarCaja, eliminarCaja, alternarActivaCaja } = useCajas({ busqueda });

  const [showForm, setShowForm] = useState(false);
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null);
  const [form, setForm] = useState<CajaFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [limiteInfo, setLimiteInfo] = useState<{ actual: number; limite: number } | null>(null);

  useEffect(() => {
    verificarLimiteCajas()
      .then((res) => setLimiteInfo({ actual: res.actual, limite: res.limite }))
      .catch(() => {});
  }, [cajas.length]);

  // Global Keyboard Shortcuts (N para Nueva Caja, Esc para cerrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape' && showForm) {
        setShowForm(false);
        return;
      }

      if (isInputFocused || showForm) return;

      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        void openCreate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm, cajas]);

  const openCreate = async () => {
    setEditingCaja(null);
    try {
      const nextCode = await sugerirSiguienteCodigoCaja();
      setForm({
        codigo: nextCode,
        nombre: `Caja #${nextCode} - `,
        descripcion: '',
        es_caja_principal: cajas.length === 0,
        activa: true,
      });
    } catch {
      const usados = new Set(cajas.map((c) => c.codigo.trim()));
      let nextNum = 1;
      while (usados.has(String(nextNum))) nextNum += 1;
      setForm({
        codigo: String(nextNum),
        nombre: `Caja #${nextNum} - `,
        descripcion: '',
        es_caja_principal: cajas.length === 0,
        activa: true,
      });
    }
    setShowForm(true);
  };

  const openEdit = (caja: Caja) => {
    setEditingCaja(caja);
    setForm({
      codigo: caja.codigo,
      nombre: caja.nombre,
      descripcion: caja.descripcion || '',
      es_caja_principal: caja.es_caja_principal ?? false,
      activa: caja.activa ?? caja.activo ?? true,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Ingresa el código y el nombre de la terminal');
      return;
    }

    setSaving(true);
    try {
      if (editingCaja) {
        await actualizarCaja(editingCaja.id, {
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          es_caja_principal: form.es_caja_principal,
          activa: form.activa,
        });
        toast.success('Caja registradora actualizada exitosamente');
      } else {
        await crearCaja({
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          es_caja_principal: form.es_caja_principal,
          activa: form.activa,
        });
        toast.success('Nueva caja registradora agregada');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar caja');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (caja: Caja) => {
    try {
      const activeState = isCajaActiva(caja);
      await alternarActivaCaja(caja.id, !activeState);
      toast.success(`Caja ${caja.nombre} ${!activeState ? 'activada' : 'desactivada'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const handleDelete = async (caja: Caja) => {
    if (!confirm(`¿Eliminar la terminal "${caja.nombre}"?`)) return;
    try {
      await eliminarCaja(caja.id);
      toast.success('Caja eliminada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Gestión de Cajas Registradoras',
      filename: 'cajas_registradoras',
      headers: ['Código', 'Nombre', 'Descripción', 'Principal', 'Estado'],
      rows: cajas.map((c) => [
        `#${c.codigo}`,
        c.nombre,
        c.descripcion || '—',
        isCajaPrincipal(c) ? 'Sí' : 'No',
        isCajaActiva(c) ? 'Activa' : 'Inactiva',
      ]),
    });
  };

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-6">
        {/* Apple Design Header */}
        <CajasHeader
          cajasCount={cajas.length}
          limiteInfo={limiteInfo}
          onNewCaja={openCreate}
          onExportPdf={handleExportPdf}
        />

        {/* Apple Design Metrics */}
        <CajasMetrics cajas={cajas} />

        {/* Toolbar de Búsqueda */}
        <div className="flex items-center justify-between gap-3 pt-1 select-none">
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink2)] pointer-events-none"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o nombre..."
              aria-label="Buscar caja registradora"
              className="w-full h-[34px] pl-8 pr-7 text-xs rounded-xl border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] placeholder-[var(--ink3)] outline-none transition-all duration-150 focus:bg-[var(--surface)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink3)] hover:text-[var(--ink)] p-0.5 rounded-full cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Apple Design Table */}
        <CajasTable
          cajas={cajas}
          isLoading={loading}
          onEdit={openEdit}
          onToggleActive={handleToggle}
          onDelete={handleDelete}
          onNewCaja={openCreate}
          hasSearch={Boolean(busqueda)}
        />

        {/* Modal de Creación / Edición */}
        <CajaFormDialog
          isOpen={showForm}
          editingCaja={editingCaja}
          form={form}
          setForm={setForm}
          isSaving={saving}
          onClose={() => setShowForm(false)}
          onSubmit={handleSave}
        />
      </div>
    </AppLayout>
  );
}
