import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import CombosHeader from './components/CombosHeader';
import CombosToolbar from './components/CombosToolbar';
import CombosTable from './components/CombosTable';
import ComboFormModal from './components/ComboFormModal';
import ComboDetailModal from './components/ComboDetailModal';
import ComboImportModal from './components/ComboImportModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  Combo,
  getCombos,
  saveOrUpdateCombo,
  deleteCombo,
  duplicateCombo,
  toggleComboStatus,
} from '@/lib/comboStore';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

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

  const refreshList = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const data = getCombos();
      setCombos(data);
      setLoading(false);
    }, 250);
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

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
    setEditingCombo(combo);
    setFormOpen(true);
  };

  const handleSaveCombo = (comboToSave: Combo) => {
    const updated = saveOrUpdateCombo(comboToSave);
    setCombos(updated);
    setFormOpen(false);
    setEditingCombo(null);
    toast.success(
      editingCombo
        ? `Combo "${comboToSave.name}" actualizado correctamente.`
        : `Combo "${comboToSave.name}" creado con éxito.`
    );
  };

  const handleDuplicate = (id: string) => {
    const res = duplicateCombo(id);
    if (res) {
      setCombos(res.updatedList);
      toast.success(`Combo duplicado como "${res.newCombo.name}".`);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = toggleComboStatus(id);
    setCombos(updated);
    const item = updated.find((c) => c.id === id);
    if (item) {
      toast.info(
        `Estado del combo "${item.name}" cambiado a: ${item.active ? 'ACTIVO' : 'INACTIVO'}`
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetCombo) return;
    const updated = deleteCombo(deleteTargetCombo.id);
    setCombos(updated);
    toast.error(`Combo "${deleteTargetCombo.name}" eliminado.`);
    setDeleteTargetCombo(null);
  };

  const handleExportPDF = () => {
    exportTableToPdf({
      title: 'Reporte Oficial de Combos y Ofertas Combinadas',
      subtitle: 'MarketERP - Catálogo de combos vigentes y descontables en POS',
      filename: 'combos-marketerp.pdf',
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

        {/* Create / Edit Modal */}
        <ComboFormModal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveCombo}
          editingCombo={editingCombo}
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
          onImportSuccess={refreshList}
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
