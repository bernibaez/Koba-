import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import CombosHeader from './components/CombosHeader';
import CombosToolbar from './components/CombosToolbar';
import CombosTable from './components/CombosTable';
import ComboFormModal from './components/ComboFormModal';
import ComboDetailModal from './components/ComboDetailModal';
import ComboImportModal from './components/ComboImportModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Combo, duplicateCombo } from '@/lib/comboStore';
import { useCombos } from '@/hooks/useCombos';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

export default function CombosPage() {
  const { combos, loading, refetch, guardar, eliminar } = useCombos();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [validityFilter, setValidityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [detailCombo, setDetailCombo] = useState<Combo | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTargetCombo, setDeleteTargetCombo] = useState<Combo | null>(null);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditingCombo(null);
        setFormOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFilters((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtering Logic
  const filteredCombos = combos.filter((combo) => {
    const matchSearch =
      search === '' ||
      combo.name.toLowerCase().includes(search.toLowerCase()) ||
      combo.code.toLowerCase().includes(search.toLowerCase()) ||
      combo.barcode.includes(search) ||
      combo.category.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && combo.active) ||
      (statusFilter === 'inactive' && !combo.active);

    const matchBranch =
      branchFilter === 'all' ||
      combo.allBranches ||
      combo.branches.includes(branchFilter);

    const now = new Date();
    const isExpired = combo.endDate && new Date(combo.endDate) < now;
    const matchValidity =
      validityFilter === 'all' ||
      (validityFilter === 'valid' && !isExpired) ||
      (validityFilter === 'expired' && isExpired);

    return matchSearch && matchStatus && matchBranch && matchValidity;
  });

  // Handlers
  const handleOpenNew = () => {
    setEditingCombo(null);
    setFormOpen(true);
  };

  const handleEdit = (combo: Combo) => {
    setDetailCombo(null);
    setEditingCombo(combo);
    setFormOpen(true);
  };

  const handleSaveCombo = async (comboToSave: Combo) => {
    try {
      await guardar(comboToSave);
      setFormOpen(false);
      setEditingCombo(null);
      toast.success(
        editingCombo
          ? `Combo "${comboToSave.name}" actualizado correctamente.`
          : `Combo "${comboToSave.name}" creado con éxito.`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar combo');
    }
  };

  const handleDuplicate = async (id: string) => {
    const res = duplicateCombo(id);
    if (res) {
      try {
        await guardar(res.newCombo);
        toast.success(`Combo duplicado como "${res.newCombo.name}".`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al duplicar');
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const item = combos.find((c) => c.id === id);
    if (!item) return;
    try {
      await guardar({ ...item, active: !item.active });
      toast.info(
        `Estado del combo "${item.name}" cambiado a: ${!item.active ? 'ACTIVO' : 'INACTIVO'}`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cambiar estado');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetCombo) return;
    try {
      await eliminar(deleteTargetCombo.id);
      toast.error(`Combo "${deleteTargetCombo.name}" eliminado.`);
      setDeleteTargetCombo(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const handleExportPDF = () => {
    exportTableToPdf({
      title: 'Reporte Oficial de Combos y Ofertas Combinadas',
      subtitle: 'Mercato - Catálogo de combos vigentes y descontables en POS',
      filename: 'combos-mercato.pdf',
      landscape: true,
      headers: [
        'Código',
        'Nombre del Combo',
        'Categoría',
        'Precio Combo',
        'Precio Normal',
        'Ahorro',
        'Prods',
        'Estado',
        'Vigencia',
        'Sucursales',
      ],
      rows: filteredCombos.map((c) => [
        c.code,
        c.name,
        c.category,
        formatMoneyPdf(c.price),
        formatMoneyPdf(c.normalPrice),
        `${formatMoneyPdf(c.savingsAmount)} (${c.savingsPercent.toFixed(1)}%)`,
        c.items.length,
        c.active ? 'ACTIVO' : 'INACTIVO',
        `${c.startDate} - ${c.endDate}`,
        c.allBranches ? 'Todas' : c.branches.join(', '),
      ]),
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setBranchFilter('all');
    setValidityFilter('all');
  };

  if (formOpen) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <ComboFormModal
            isOpen={formOpen}
            onClose={() => {
              setFormOpen(false);
              setEditingCombo(null);
            }}
            onSave={handleSaveCombo}
            editingCombo={editingCombo}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Component */}
        <CombosHeader
          combos={combos}
          onNewCombo={handleOpenNew}
          onExport={handleExportPDF}
          onImport={() => setImportOpen(true)}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
          showFilters={showFilters}
        />

        {/* Toolbar Component */}
        <CombosToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          branchFilter={branchFilter}
          onBranchFilterChange={setBranchFilter}
          validityFilter={validityFilter}
          onValidityFilterChange={setValidityFilter}
          showFilters={showFilters}
          onResetFilters={handleResetFilters}
        />

        {/* Main Table Component */}
        <CombosTable
          combos={filteredCombos}
          loading={loading}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onToggleStatus={handleToggleStatus}
          onDeleteRequest={(combo) => setDeleteTargetCombo(combo)}
          onViewDetail={(combo) => setDetailCombo(combo)}
        />

        {/* Detail Inspection Modal */}
        <ComboDetailModal
          combo={detailCombo}
          isOpen={!!detailCombo}
          onClose={() => setDetailCombo(null)}
          onEdit={(combo) => handleEdit(combo)}
        />

        {/* Import Dataset Modal */}
        <ComboImportModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          onImportSuccess={() => refetch()}
        />

        {/* Confirm Delete Modal */}
        <ConfirmModal
          open={!!deleteTargetCombo}
          onClose={() => setDeleteTargetCombo(null)}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Combo"
          description={`¿Estás seguro de que deseas eliminar permanentemente el combo "${deleteTargetCombo?.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Sí, Eliminar Combo"
        />
      </div>
    </AppLayout>
  );
}
