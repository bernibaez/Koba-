import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Users, Truck, Tag, Plus, Search, Filter, Edit2, Trash2, Download, Eye, Phone, MapPin, CreditCard } from 'lucide-react';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { useClientes } from '@/hooks/useClientes';
import { useProveedores } from '@/hooks/useProveedores';
import { useGrupos } from '@/hooks/useGrupos';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { TipoCliente } from '@/types/database';

const TIPO_CLIENTE_OPTIONS: { value: TipoCliente; label: string }[] = [
  { value: 'final', label: 'Final' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'credito', label: 'Crédito' },
];

interface Customer {
  id: string; name: string; phone: string; email: string; address: string;
  credit: number; purchases: number; balance: number; status: 'active' | 'inactive'; group: string;
}
interface Supplier {
  id: string; name: string; phone: string; email: string; address: string;
  contact: string; purchases: number; balance: number; status: 'active' | 'inactive';
}

type Tab = 'customers' | 'suppliers' | 'groups';
type FormMode = 'create' | 'edit' | 'view';

export default function ContactsPage() {
  const [tab, setTab] = useState<Tab>('customers');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'customer' | 'supplier' | 'group'; id: string; name: string } | null>(null);

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

  const customerStats = useMemo(() => {
    const total = filteredCustomers.length;
    const activos = filteredCustomers.filter((c) => c.status === 'active').length;
    const credito = filteredCustomers.reduce((s, c) => s + c.credit, 0);
    const saldo = filteredCustomers.reduce((s, c) => s + c.balance, 0);
    return { total, activos, credito, saldo };
  }, [filteredCustomers]);

  const supplierStats = useMemo(() => {
    const total = filteredSuppliers.length;
    const activos = filteredSuppliers.filter((s) => s.status === 'active').length;
    return { total, activos };
  }, [filteredSuppliers]);

  const tabs = [
    { id: 'customers' as Tab, label: 'Clientes', icon: <Users size={16} /> },
    { id: 'suppliers' as Tab, label: 'Proveedores', icon: <Truck size={16} /> },
    { id: 'groups' as Tab, label: 'Grupos', icon: <Tag size={16} /> },
  ];

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

  const openEditGroup = (g: { id: string; nombre: string; porcentaje_descuento: number; descripcion: string | null }) => {
    setFormNombre(g.nombre);
    setFormDescuento(String(g.porcentaje_descuento ?? 0));
    setFormDescripcion(g.descripcion ?? '');
    setEditingId(g.id);
    setFormMode('edit');
    setShowModal(true);
  };

  const formatK = (n: number) => {
    if (n >= 1000) return `RD$ ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
    return `RD$ ${n.toLocaleString()}`;
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
      rows: grupos.map((g) => [
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

  const isReadonly = formMode === 'view';
  const formTitle =
    formMode === 'view'
      ? tab === 'customers'
        ? 'Detalle del Cliente'
        : tab === 'suppliers'
          ? 'Detalle del Proveedor'
          : 'Detalle del Grupo'
      : formMode === 'edit'
        ? tab === 'customers'
          ? 'Editar Cliente'
          : tab === 'suppliers'
            ? 'Editar Proveedor'
            : 'Editar Grupo'
        : tab === 'customers'
          ? 'Nuevo Cliente'
          : tab === 'suppliers'
            ? 'Nuevo Proveedor'
            : 'Nuevo Grupo';

  const formSubtitle =
    formMode === 'view'
      ? 'Consulta la información registrada'
      : formMode === 'edit'
        ? 'Actualiza los datos y guarda los cambios'
        : tab === 'customers'
          ? 'Registra un nuevo cliente en el sistema'
          : tab === 'suppliers'
            ? 'Registra un nuevo proveedor en el sistema'
            : 'Crea un nuevo grupo de clientes';

  if (showModal) {
    return (
      <AppLayout>
        <div className="space-y-6 slide-up">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{formTitle}</h1>
              <p className="text-sm text-muted-foreground mt-1">{formSubtitle}</p>
            </div>
            <button type="button" onClick={closeFormModal} className="btn-secondary" disabled={saving}>
              ← Volver a Contactos
            </button>
          </div>

          <div className="card p-5 sm:p-6 space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="input-field sm:col-span-2"
                placeholder="Nombre"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                readOnly={isReadonly}
                disabled={isReadonly}
              />
              {tab !== 'groups' && (
                <>
                  <input
                    className="input-field"
                    placeholder="Teléfono"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    readOnly={isReadonly}
                    disabled={isReadonly}
                  />
                  <input
                    className="input-field"
                    placeholder="Email"
                    type="email"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    readOnly={isReadonly}
                    disabled={isReadonly}
                  />
                  <input
                    className="input-field sm:col-span-2"
                    placeholder="Dirección"
                    value={formDireccion}
                    onChange={(e) => setFormDireccion(e.target.value)}
                    readOnly={isReadonly}
                    disabled={isReadonly}
                  />
                </>
              )}
              {tab === 'customers' && (
                <>
                  <input
                    className="input-field"
                    placeholder="Límite de crédito"
                    type="number"
                    value={formCredito}
                    onChange={(e) => setFormCredito(e.target.value)}
                    readOnly={isReadonly}
                    disabled={isReadonly}
                  />
                  <select
                    className="input-field"
                    value={formGrupo}
                    onChange={(e) => setFormGrupo(e.target.value)}
                    disabled={isReadonly}
                  >
                    <option value="">Tipo de cliente...</option>
                    {TIPO_CLIENTE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {tab === 'groups' && (
                <>
                  <input
                    className="input-field"
                    placeholder="Descuento (%)"
                    type="number"
                    value={formDescuento}
                    onChange={(e) => setFormDescuento(e.target.value)}
                    readOnly={isReadonly}
                    disabled={isReadonly}
                  />
                  <textarea
                    className="input-field sm:col-span-2"
                    placeholder="Descripción"
                    rows={3}
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    readOnly={isReadonly}
                    disabled={isReadonly}
                  />
                </>
              )}
            </div>
            <div className="flex gap-3 pt-2 border-t border-border">
              {isReadonly ? (
                <>
                  <button type="button" className="btn-secondary flex-1" onClick={closeFormModal}>
                    Cerrar
                  </button>
                  <button type="button" className="btn-primary flex-1" onClick={() => setFormMode('edit')}>
                    Editar
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-secondary flex-1" disabled={saving} onClick={closeFormModal}>
                    Cancelar
                  </button>
                  <button type="button" className="btn-primary flex-1" disabled={saving} onClick={handleSave}>
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona clientes, proveedores y grupos</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 w-fit">
            <Plus size={16} /> Nuevo {tab === 'customers' ? 'Cliente' : tab === 'suppliers' ? 'Proveedor' : 'Grupo'}
          </button>
        </div>

        <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tab === 'customers' && <>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Total Clientes</p><p className="text-2xl font-bold text-foreground mt-1">{customerStats.total}</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Activos</p><p className="text-2xl font-bold text-success mt-1">{customerStats.activos}</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Crédito Total</p><p className="text-2xl font-bold text-info mt-1">{formatK(customerStats.credito)}</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Saldo Pendiente</p><p className="text-2xl font-bold text-warning mt-1">{formatK(customerStats.saldo)}</p></div>
          </>}
          {tab === 'suppliers' && <>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Total Proveedores</p><p className="text-2xl font-bold text-foreground mt-1">{supplierStats.total}</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Activos</p><p className="text-2xl font-bold text-success mt-1">{supplierStats.activos}</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Compras este mes</p><p className="text-2xl font-bold text-info mt-1">—</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Saldo por pagar</p><p className="text-2xl font-bold text-warning mt-1">—</p></div>
          </>}
          {tab === 'groups' && <>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Total Grupos</p><p className="text-2xl font-bold text-foreground mt-1">{grupos.length}</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Clientes Asignados</p><p className="text-2xl font-bold text-success mt-1">{grupos.reduce((s, g) => s + (g.clientes_count ?? 0), 0)}</p></div>
          </>}
        </div>

        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="input-field pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2"><Filter size={16} />Filtrar</button>
            <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-2"><Download size={16} />Exportar PDF</button>
          </div>
        </div>

        {/* Customers Table */}
        {tab === 'customers' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Grupo</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Crédito</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Compras</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">Saldo</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c, i) => (
                    <tr key={c.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center text-info font-bold text-sm flex-shrink-0">{c.name.charAt(0)}</div>
                          <div>
                            <p className="font-medium text-foreground">{c.name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Phone size={10} />{c.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="badge-neutral">{c.group}</span></td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground"><CreditCard size={12} />RD$ {c.credit.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{c.purchases} compras</td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className={c.balance > 0 ? 'text-warning font-semibold' : 'text-success font-semibold'}>
                          {c.balance > 0 ? `RD$ ${c.balance.toLocaleString()}` : 'Al día'}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className={c.status === 'active' ? 'badge-success' : 'badge-danger'}>{c.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => openPreviewCustomer(c)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Ver"><Eye size={14} /></button>
                          <button type="button" onClick={() => openEditCustomer(c)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Editar"><Edit2 size={14} /></button>
                          <button type="button" onClick={() => setDeleteTarget({ type: 'customer', id: c.id, name: c.name })} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
              <span>Mostrando {filteredCustomers.length} clientes</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 rounded-lg hover:bg-secondary transition-colors">Anterior</button>
                <button className="px-3 py-1 rounded-lg bg-primary text-primary-foreground">1</button>
                <button className="px-3 py-1 rounded-lg hover:bg-secondary transition-colors">Siguiente</button>
              </div>
            </div>
          </div>
        )}

        {/* Suppliers Table */}
        {tab === 'suppliers' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Proveedor</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Contacto</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Compras</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Saldo</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((s, i) => (
                    <tr key={s.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning font-bold text-sm flex-shrink-0">{s.name.charAt(0)}</div>
                          <div>
                            <p className="font-medium text-foreground">{s.name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin size={10} />{s.address ? (s.address.length > 30 ? `${s.address.substring(0, 30)}...` : s.address) : '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-foreground text-sm">{s.contact || '—'}</p>
                        <p className="text-xs text-muted-foreground">{s.phone}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{s.purchases} órdenes</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={s.balance > 0 ? 'text-warning font-semibold' : 'text-success font-semibold'}>
                          {s.balance > 0 ? `RD$ ${s.balance.toLocaleString()}` : 'Al día'}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className={s.status === 'active' ? 'badge-success' : 'badge-danger'}>{s.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => openPreviewSupplier(s)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Ver"><Eye size={14} /></button>
                          <button type="button" onClick={() => openEditSupplier(s)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Editar"><Edit2 size={14} /></button>
                          <button type="button" onClick={() => setDeleteTarget({ type: 'supplier', id: s.id, name: s.name })} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Groups Table */}
        {tab === 'groups' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Grupo</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Descripción</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Descuento</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Clientes</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No hay grupos registrados en la base de datos
                      </td>
                    </tr>
                  ) : (
                    grupos.map((g, i) => (
                      <tr
                        key={g.id}
                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{g.nombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{g.descripcion || '—'}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="badge-success">{g.porcentaje_descuento}%</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {g.clientes_count ?? 0} clientes
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditGroup(g)}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({ type: 'group', id: g.id, name: g.nombre })
                              }
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
