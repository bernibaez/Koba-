import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { useClientes } from '@/hooks/useClientes';
import { useProveedores } from '@/hooks/useProveedores';
import { useGrupos } from '@/hooks/useGrupos';
import { toast } from '@/lib/toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CRMClienteExpediente from '@/components/crm/CRMClienteExpediente';
import type { TipoCliente } from '@/types/database';

import {
  type Customer,
  type Supplier,
  type CustomerGroup,
  type ContactsTab,
  type FormMode,
  type DeleteTarget,
  TIPO_CLIENTE_OPTIONS,
} from './contacts/types';
import { ContactsHeader } from './contacts/ContactsHeader';
import { ContactsMetrics } from './contacts/ContactsMetrics';
import { ContactsToolbar } from './contacts/ContactsToolbar';
import { ContactsCustomersTable } from './contacts/ContactsCustomersTable';
import { ContactsSuppliersTable } from './contacts/ContactsSuppliersTable';
import { ContactsGroupsTable } from './contacts/ContactsGroupsTable';
import { ContactFormModal } from './contacts/ContactFormModal';

export default function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTab = (searchParams.get('tab') as ContactsTab) || 'customers';
  const [tab, setTab] = useState<ContactsTab>(initialTab);
  const [selectedExpedienteCustomer, setSelectedExpedienteCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formCredito, setFormCredito] = useState('');
  const [formGrupo, setFormGrupo] = useState('');
  const [formDescuento, setFormDescuento] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');

  const { clientes, crear: crearCliente, actualizar: actualizarCliente, eliminar: eliminarCliente } = useClientes(search);
  const { proveedores, crear: crearProveedor, actualizar: actualizarProveedor, eliminar: eliminarProveedor } = useProveedores(search);
  const { grupos, crear: crearGrupo, actualizar: actualizarGrupo, eliminar: eliminarGrupo } = useGrupos();

  const filteredCustomers: Customer[] = useMemo(
    () =>
      clientes.map((c) => ({
        id: c.id,
        name: c.nombre,
        phone: c.telefono ?? '',
        email: c.correo ?? '',
        address: c.direccion ?? '',
        credit: Number(c.limite_credito),
        purchases: 0,
        balance: Number(c.balance_actual),
        status: c.activo ? 'active' : 'inactive',
        group: c.tipo_cliente,
      })),
    [clientes]
  );

  const filteredSuppliers: Supplier[] = useMemo(
    () =>
      proveedores.map((p) => ({
        id: p.id,
        name: p.nombre,
        phone: p.telefono ?? '',
        email: p.correo ?? '',
        address: p.direccion ?? '',
        contact: p.correo ?? p.telefono ?? p.codigo,
        purchases: 0,
        balance: 0,
        status: p.activo ? 'active' : 'inactive',
      })),
    [proveedores]
  );

  const customerGroups: CustomerGroup[] = useMemo(
    () =>
      grupos.map((g) => ({
        id: g.id,
        nombre: g.nombre,
        porcentaje_descuento: g.porcentaje_descuento,
        descripcion: g.descripcion,
        clientes_count: g.clientes_count,
      })),
    [grupos]
  );

  useEffect(() => {
    const cid = searchParams.get('clienteId') || searchParams.get('id');
    if (cid && filteredCustomers.length > 0) {
      const match = filteredCustomers.find((c) => c.id === cid);
      if (match) setSelectedExpedienteCustomer(match);
    }
  }, [searchParams, filteredCustomers]);

  const handleSelectTab = (newTab: ContactsTab) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const resetForm = () => {
    setFormNombre('');
    setFormTelefono('');
    setFormCorreo('');
    setFormDireccion('');
    setFormCredito('');
    setFormGrupo('');
    setFormDescuento('');
    setFormDescripcion('');
    setEditingId(null);
    setFormMode('create');
  };

  const closeFormModal = () => {
    if (saving) return;
    setShowModal(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setFormMode('create');
    setShowModal(true);
  };

  const fillCustomerForm = (c: Customer) => {
    setFormNombre(c.name);
    setFormTelefono(c.phone);
    setFormCorreo(c.email);
    setFormDireccion(c.address);
    setFormCredito(String(c.credit || ''));
    setFormGrupo(c.group || '');
    setEditingId(c.id);
  };

  const fillSupplierForm = (s: Supplier) => {
    setFormNombre(s.name);
    setFormTelefono(s.phone);
    setFormCorreo(s.email);
    setFormDireccion(s.address);
    setFormCredito('');
    setFormGrupo('');
    setEditingId(s.id);
  };

  const openPreviewCustomer = (c: Customer) => {
    fillCustomerForm(c);
    setFormMode('view');
    setShowModal(true);
  };

  const openEditCustomer = (c: Customer) => {
    fillCustomerForm(c);
    setFormMode('edit');
    setShowModal(true);
  };

  const openPreviewSupplier = (s: Supplier) => {
    fillSupplierForm(s);
    setFormMode('view');
    setShowModal(true);
  };

  const openEditSupplier = (s: Supplier) => {
    fillSupplierForm(s);
    setFormMode('edit');
    setShowModal(true);
  };

  const openEditGroup = (g: CustomerGroup) => {
    setFormNombre(g.nombre);
    setFormDescuento(String(g.porcentaje_descuento ?? 0));
    setFormDescripcion(g.descripcion ?? '');
    setEditingId(g.id);
    setFormMode('edit');
    setShowModal(true);
  };

  const handleExportPdf = () => {
    if (tab === 'customers') {
      exportTableToPdf({
        title: 'Clientes',
        filename: 'clientes',
        headers: ['Nombre', 'Teléfono', 'Email', 'Grupo', 'Crédito', 'Compras', 'Saldo', 'Estado'],
        rows: filteredCustomers.map((c) => [
          c.name,
          c.phone,
          c.email,
          c.group,
          formatMoneyPdf(c.credit),
          c.purchases,
          formatMoneyPdf(c.balance),
          c.status === 'active' ? 'Activo' : 'Inactivo',
        ]),
        landscape: true,
      });
      return;
    }
    if (tab === 'suppliers') {
      exportTableToPdf({
        title: 'Proveedores',
        filename: 'proveedores',
        headers: ['Nombre', 'Contacto', 'Teléfono', 'Email', 'Compras', 'Saldo', 'Estado'],
        rows: filteredSuppliers.map((s) => [
          s.name,
          s.contact,
          s.phone,
          s.email,
          s.purchases,
          formatMoneyPdf(s.balance),
          s.status === 'active' ? 'Activo' : 'Inactivo',
        ]),
        landscape: true,
      });
      return;
    }
    exportTableToPdf({
      title: 'Grupos de Clientes',
      filename: 'grupos-clientes',
      headers: ['Grupo', 'Descuento', 'Clientes', 'Descripción'],
      rows: customerGroups.map((g) => [
        g.nombre,
        `${g.porcentaje_descuento}%`,
        g.clientes_count ?? 0,
        g.descripcion ?? '',
      ]),
    });
  };

  const handleSave = async () => {
    if (!formNombre.trim()) {
      toast.error(
        tab === 'customers'
          ? 'Ingresa el nombre del cliente'
          : tab === 'suppliers'
            ? 'Ingresa el nombre del proveedor'
            : 'Ingresa el nombre del grupo'
      );
      return;
    }

    setSaving(true);
    try {
      if (tab === 'groups') {
        const payload = {
          nombre: formNombre.trim(),
          porcentaje_descuento: formDescuento ? Number(formDescuento) : 0,
          descripcion: formDescripcion.trim() || null,
        };
        if (formMode === 'edit' && editingId) {
          await actualizarGrupo(editingId, payload);
          toast.success('Grupo actualizado');
        } else {
          await crearGrupo(payload);
          toast.success('Grupo creado');
        }
      } else if (tab === 'customers') {
        const tipo = TIPO_CLIENTE_OPTIONS.some((o) => o.value === formGrupo)
          ? (formGrupo as TipoCliente)
          : undefined;
        const payload = {
          nombre: formNombre.trim(),
          telefono: formTelefono.trim() || undefined,
          correo: formCorreo.trim() || undefined,
          direccion: formDireccion.trim() || undefined,
          limite_credito: formCredito ? Number(formCredito) : undefined,
          tipo_cliente: tipo,
        };
        if (formMode === 'edit' && editingId) {
          await actualizarCliente(editingId, {
            nombre: payload.nombre,
            telefono: payload.telefono ?? null,
            correo: payload.correo ?? null,
            direccion: payload.direccion ?? null,
            limite_credito: payload.limite_credito,
            tipo_cliente: payload.tipo_cliente,
          });
          toast.success('Cliente actualizado');
        } else {
          await crearCliente(payload);
          toast.success('Cliente creado');
        }
      } else {
        const payload = {
          nombre: formNombre.trim(),
          telefono: formTelefono.trim() || undefined,
          correo: formCorreo.trim() || undefined,
          direccion: formDireccion.trim() || undefined,
        };
        if (formMode === 'edit' && editingId) {
          await actualizarProveedor(editingId, {
            nombre: payload.nombre,
            telefono: payload.telefono ?? null,
            correo: payload.correo ?? null,
            direccion: payload.direccion ?? null,
          });
          toast.success('Proveedor actualizado');
        } else {
          await crearProveedor(payload);
          toast.success('Proveedor creado');
        }
      }
      setShowModal(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'customer') {
        await eliminarCliente(deleteTarget.id);
        toast.success('Cliente eliminado');
      } else if (deleteTarget.type === 'supplier') {
        await eliminarProveedor(deleteTarget.id);
        toast.success('Proveedor eliminado');
      } else {
        await eliminarGrupo(deleteTarget.id);
        toast.success('Grupo eliminado');
      }
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {selectedExpedienteCustomer ? (
          <CRMClienteExpediente
            cliente={selectedExpedienteCustomer}
            onClose={() => setSelectedExpedienteCustomer(null)}
            onCrearCotizacion={() => navigate('/sales')}
            onNuevaVenta={() => navigate('/point-of-sale-pos')}
          />
        ) : (
          <>
            <ContactsHeader
              tab={tab}
              onOpenCreate={openCreate}
              onExportPdf={handleExportPdf}
              onNavigateCrm={() => navigate('/crm')}
            />

            <ContactsMetrics
              tab={tab}
              customers={filteredCustomers}
              suppliers={filteredSuppliers}
              groups={customerGroups}
            />

            <ContactsToolbar
              tab={tab}
              onTabChange={handleSelectTab}
              search={search}
              onSearchChange={setSearch}
              counts={{
                customers: filteredCustomers.length,
                suppliers: filteredSuppliers.length,
                groups: customerGroups.length,
              }}
            />

            {tab === 'customers' && (
              <ContactsCustomersTable
                customers={filteredCustomers}
                onOpenExpediente={(c) => setSelectedExpedienteCustomer(c)}
                onPreview={openPreviewCustomer}
                onEdit={openEditCustomer}
                onDelete={(c) => setDeleteTarget({ type: 'customer', id: c.id, name: c.name })}
              />
            )}

            {tab === 'suppliers' && (
              <ContactsSuppliersTable
                suppliers={filteredSuppliers}
                onPreview={openPreviewSupplier}
                onEdit={openEditSupplier}
                onDelete={(s) => setDeleteTarget({ type: 'supplier', id: s.id, name: s.name })}
              />
            )}

            {tab === 'groups' && (
              <ContactsGroupsTable
                groups={customerGroups}
                onEdit={openEditGroup}
                onDelete={(g) => setDeleteTarget({ type: 'group', id: g.id, name: g.nombre })}
              />
            )}
          </>
        )}
      </div>

      <ContactFormModal
        open={showModal}
        tab={tab}
        mode={formMode}
        saving={saving}
        formNombre={formNombre}
        setFormNombre={setFormNombre}
        formTelefono={formTelefono}
        setFormTelefono={setFormTelefono}
        formCorreo={formCorreo}
        setFormCorreo={setFormCorreo}
        formDireccion={formDireccion}
        setFormDireccion={setFormDireccion}
        formCredito={formCredito}
        setFormCredito={setFormCredito}
        formGrupo={formGrupo}
        setFormGrupo={setFormGrupo}
        formDescuento={formDescuento}
        setFormDescuento={setFormDescuento}
        formDescripcion={formDescripcion}
        setFormDescripcion={setFormDescripcion}
        onClose={closeFormModal}
        onSave={handleSave}
        onSwitchToEdit={() => setFormMode('edit')}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={
          deleteTarget?.type === 'supplier'
            ? 'Eliminar proveedor'
            : deleteTarget?.type === 'group'
              ? 'Eliminar grupo'
              : 'Eliminar cliente'
        }
        description={`¿Eliminar "${deleteTarget?.name ?? ''}"? Esta acción lo desactivará del sistema.`}
        confirmLabel="Eliminar"
        loading={deleting}
        busyLabel="Eliminando…"
      />
    </AppLayout>
  );
}
