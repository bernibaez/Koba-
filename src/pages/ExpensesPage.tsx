import React, { useMemo, useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from '@/lib/toast';
import { useGastos } from '@/hooks/useGastos';
import type {
  GastoUi,
  CategoriaGastoUi,
  ExpensesTab,
  ExpenseStatusFilter,
} from './expenses/types';
import { EXPENSE_STATUS_CONFIG } from './expenses/types';

import ExpensesHeader from './expenses/components/ExpensesHeader';
import ExpensesMetrics from './expenses/components/ExpensesMetrics';
import ExpensesToolbar from './expenses/components/ExpensesToolbar';
import ExpensesTable from './expenses/components/ExpensesTable';
import ExpensesCategoriesGrid from './expenses/components/ExpensesCategoriesGrid';
import ExpenseFormModal from './expenses/components/ExpenseFormModal';
import ExpenseCategoryModal from './expenses/components/ExpenseCategoryModal';
import ExpenseDetailDrawer from './expenses/components/ExpenseDetailDrawer';

export default function ExpensesPage() {
  const {
    gastos,
    categorias,
    loading,
    error,
    crear,
    actualizar,
    crearCategoria,
    cambiarEstado,
    eliminar,
    eliminarCategoria,
  } = useGastos();

  const [tab, setTab] = useState<ExpensesTab>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatusFilter>('all');

  // Modals & Drawers
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoUi | null>(null);
  const [viewingGasto, setViewingGasto] = useState<GastoUi | null>(null);

  // Global hotkeys: "G" for new expense, "C" for new category
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (!isInput && !showExpenseModal && !showCategoryModal && !viewingGasto) {
        if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          setEditingGasto(null);
          setShowExpenseModal(true);
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          setShowCategoryModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExpenseModal, showCategoryModal, viewingGasto]);

  const filteredGastos = useMemo(() => {
    const q = search.toLowerCase().trim();
    return gastos.filter((e) => {
      const matchSearch =
        !q ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [gastos, search, statusFilter]);

  const filteredCategorias = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categorias;
    return categorias.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categorias, search]);

  const handleSaveExpense = async (params: {
    categoria_id: string;
    descripcion: string;
    monto: number;
    tiene_recibo: boolean;
  }) => {
    try {
      if (editingGasto) {
        await actualizar(editingGasto.id, params);
        toast.success('Gasto actualizado con éxito');
      } else {
        await crear({
          ...params,
          estado: 'pendiente',
        });
        toast.success('Gasto registrado con éxito');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar el gasto');
      throw e;
    }
  };

  const handleSaveCategory = async (params: {
    nombre: string;
    descripcion: string;
    presupuesto_mensual: number;
  }) => {
    try {
      await crearCategoria(params);
      toast.success('Categoría creada exitosamente');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo crear la categoría');
      throw e;
    }
  };

  const handleApproveExpense = async (gasto: GastoUi) => {
    try {
      await cambiarEstado(gasto.id, 'aprobado');
      toast.success(`Gasto ${gasto.code} aprobado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al aprobar gasto');
    }
  };

  const handleRejectExpense = async (gasto: GastoUi) => {
    try {
      await cambiarEstado(gasto.id, 'rechazado');
      toast.success(`Gasto ${gasto.code} rechazado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al rechazar gasto');
    }
  };

  const handleDeleteExpense = async (gasto: GastoUi) => {
    if (!confirm(`¿Eliminar gasto ${gasto.code}? Esta acción es permanente.`)) return;
    try {
      await eliminar(gasto.id);
      toast.success('Gasto eliminado exitosamente');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Solo administradores pueden eliminar gastos');
    }
  };

  const handleDeleteCategory = async (cat: CategoriaGastoUi) => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    try {
      await eliminarCategoria(cat.id);
      toast.success('Categoría eliminada exitosamente');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar categoría');
    }
  };

  const handleExportPdf = () => {
    if (tab === 'list') {
      exportTableToPdf({
        title: 'Reporte de Gastos Operativos',
        filename: 'gastos-operativos',
        headers: [
          'Código',
          'Fecha',
          'Categoría',
          'Descripción',
          'Responsable',
          'Monto',
          'Comprobante',
          'Estado',
        ],
        rows: filteredGastos.map((e) => [
          e.code,
          e.date,
          e.category,
          e.description,
          e.responsible,
          formatMoneyPdf(e.amount),
          e.receipt ? 'Sí' : 'No',
          EXPENSE_STATUS_CONFIG[e.status]?.label ?? e.status,
        ]),
        landscape: true,
      });
      return;
    }

    exportTableToPdf({
      title: 'Reporte de Categorías y Presupuestos de Gastos',
      filename: 'categorias-gastos',
      headers: ['Categoría', 'Descripción', 'Presupuesto', 'Gastado', 'Disponible'],
      rows: categorias.map((c) => [
        c.name,
        c.description,
        formatMoneyPdf(c.budget),
        formatMoneyPdf(c.spent),
        formatMoneyPdf(Math.max(0, c.budget - c.spent)),
      ]),
    });
  };

  const hasFilters = Boolean(search) || (tab === 'list' && statusFilter !== 'all');

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {/* Header */}
        <ExpensesHeader
          currentTab={tab}
          onNewExpense={() => {
            setEditingGasto(null);
            setShowExpenseModal(true);
          }}
          onNewCategory={() => setShowCategoryModal(true)}
          expensesCount={gastos.length}
        />

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Metrics */}
        <ExpensesMetrics gastos={gastos} categorias={categorias} />

        {/* Toolbar */}
        <ExpensesToolbar
          currentTab={tab}
          onTabChange={setTab}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onExportPdf={handleExportPdf}
          filteredCount={tab === 'list' ? filteredGastos.length : filteredCategorias.length}
        />

        {/* Main Content: List or Categories Grid */}
        {tab === 'list' ? (
          <ExpensesTable
            gastos={filteredGastos}
            isLoading={loading && gastos.length === 0}
            onView={(e) => setViewingGasto(e)}
            onEdit={(e) => {
              setEditingGasto(e);
              setShowExpenseModal(true);
            }}
            onApprove={handleApproveExpense}
            onReject={handleRejectExpense}
            onDelete={handleDeleteExpense}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setSearch('');
              setStatusFilter('all');
            }}
          />
        ) : (
          <ExpensesCategoriesGrid
            categorias={filteredCategorias}
            isLoading={loading && categorias.length === 0}
            onDeleteCategory={handleDeleteCategory}
            onNewCategory={() => setShowCategoryModal(true)}
          />
        )}
      </div>

      {/* Modal: New / Edit Expense */}
      <ExpenseFormModal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingGasto(null);
        }}
        onSubmit={handleSaveExpense}
        categorias={categorias}
        editingGasto={editingGasto}
      />

      {/* Modal: New Category */}
      <ExpenseCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={handleSaveCategory}
      />

      {/* Drawer: Expense Detail */}
      <ExpenseDetailDrawer
        gasto={viewingGasto}
        isOpen={Boolean(viewingGasto)}
        onClose={() => setViewingGasto(null)}
        onEdit={(e) => {
          setEditingGasto(e);
          setShowExpenseModal(true);
        }}
        onApprove={handleApproveExpense}
        onReject={handleRejectExpense}
        onDelete={handleDeleteExpense}
      />
    </AppLayout>
  );
}
