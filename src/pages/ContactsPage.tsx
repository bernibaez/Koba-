import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Users, Truck, Tag, Plus, Search, Filter, Edit2, Trash2, Download, Eye, Phone, MapPin, CreditCard } from 'lucide-react';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { useClientes } from '@/hooks/useClientes';
import { toast } from 'sonner';
import ModalShell from '@/components/ui/ModalShell';

interface Customer {
  id: string; name: string; phone: string; email: string; address: string;
  credit: number; purchases: number; balance: number; status: 'active' | 'inactive'; group: string;
}
interface Supplier {
  id: number; name: string; phone: string; email: string; address: string;
  contact: string; purchases: number; balance: number; status: 'active' | 'inactive';
}
interface Group {
  id: number; name: string; discount: number; customers: number; description: string;
}

const mockSuppliers: Supplier[] = [
  { id: 1, name: 'Distribuidora Nacional S.A.', phone: '809-555-2001', email: 'ventas@disnac.com', address: 'Zona Industrial Herrera', contact: 'Ing. Ramón Castro', purchases: 45, balance: 25000, status: 'active' },
  { id: 2, name: 'Importadora del Caribe', phone: '809-555-2002', email: 'info@impocaribe.com', address: 'Puerto de Haina', contact: 'Lic. Sandra Matos', purchases: 28, balance: 0, status: 'active' },
  { id: 3, name: 'Alimentos Frescos RD', phone: '809-555-2003', email: 'pedidos@alimfrescos.com', address: 'Mercado Nuevo, Santiago', contact: 'Sr. Felipe Núñez', purchases: 120, balance: 8000, status: 'active' },
  { id: 4, name: 'Bebidas y Más', phone: '809-555-2004', email: 'ventas@bebidasmas.com', address: 'Av. Independencia #200', contact: 'Sra. Patricia Lora', purchases: 67, balance: 3500, status: 'inactive' },
];

const mockGroups: Group[] = [
  { id: 1, name: 'VIP', discount: 10, customers: 25, description: 'Clientes con alto volumen de compras' },
  { id: 2, name: 'Mayorista', discount: 15, customers: 12, description: 'Clientes que compran al por mayor' },
  { id: 3, name: 'Regular', discount: 0, customers: 180, description: 'Clientes regulares sin descuento especial' },
  { id: 4, name: 'Empleados', discount: 20, customers: 8, description: 'Descuento especial para empleados' },
];

type Tab = 'customers' | 'suppliers' | 'groups';

export default function ContactsPage() {
  const [tab, setTab] = useState<Tab>('customers');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formCorreo, setFormCorreo] = useState('');

  const { clientes, crear } = useClientes(search);

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

  const tabs = [
    { id: 'customers' as Tab, label: 'Clientes', icon: <Users size={16} /> },
    { id: 'suppliers' as Tab, label: 'Proveedores', icon: <Truck size={16} /> },
    { id: 'groups' as Tab, label: 'Grupos', icon: <Tag size={16} /> },
  ];

  const filteredSuppliers = mockSuppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

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
      rows: mockGroups.map((g) => [g.name, `${g.discount}%`, g.customers, g.description]),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona clientes, proveedores y grupos</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-fit">
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
            <div className="card p-4"><p className="text-xs text-muted-foreground">Total Clientes</p><p className="text-2xl font-bold text-foreground mt-1">225</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Activos</p><p className="text-2xl font-bold text-success mt-1">198</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Crédito Total</p><p className="text-2xl font-bold text-info mt-1">RD$ 79K</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Saldo Pendiente</p><p className="text-2xl font-bold text-warning mt-1">RD$ 24.7K</p></div>
          </>}
          {tab === 'suppliers' && <>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Total Proveedores</p><p className="text-2xl font-bold text-foreground mt-1">18</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Activos</p><p className="text-2xl font-bold text-success mt-1">15</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Compras este mes</p><p className="text-2xl font-bold text-info mt-1">RD$ 145K</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Saldo por pagar</p><p className="text-2xl font-bold text-warning mt-1">RD$ 36.5K</p></div>
          </>}
          {tab === 'groups' && <>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Total Grupos</p><p className="text-2xl font-bold text-foreground mt-1">4</p></div>
            <div className="card p-4"><p className="text-xs text-muted-foreground">Clientes Asignados</p><p className="text-2xl font-bold text-success mt-1">225</p></div>
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
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors"><Trash2 size={14} /></button>
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
                              <MapPin size={10} />{s.address.substring(0, 30)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-foreground text-sm">{s.contact}</p>
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
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors"><Trash2 size={14} /></button>
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
                  {mockGroups.map((g, i) => (
                    <tr key={g.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-3 font-medium text-foreground">{g.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{g.description}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="badge-success">{g.discount}%</span></td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{g.customers} clientes</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-danger transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ModalShell
        open={showModal}
        onClose={() => setShowModal(false)}
        size="lg"
        busy={saving}
        busyLabel="Guardando…"
        className="p-6"
      >
            <h2 className="text-lg font-bold text-foreground mb-4">
              {tab === 'customers' ? 'Nuevo Cliente' : tab === 'suppliers' ? 'Nuevo Proveedor' : 'Nuevo Grupo'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input-field col-span-2"
                placeholder="Nombre"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
              {tab !== 'groups' && <>
                <input
                  className="input-field"
                  placeholder="Teléfono"
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="Email"
                  type="email"
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                />
                <input className="input-field col-span-2" placeholder="Dirección" />
              </>}
              {tab === 'customers' && <>
                <input className="input-field" placeholder="Límite de crédito" type="number" />
                <select className="input-field">
                  <option>Seleccionar grupo...</option>
                  {mockGroups.map(g => <option key={g.id}>{g.name}</option>)}
                </select>
              </>}
              {tab === 'groups' && <>
                <input className="input-field" placeholder="Descuento (%)" type="number" />
                <textarea className="input-field col-span-2" placeholder="Descripción" rows={3} />
              </>}
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" className="btn-secondary flex-1" disabled={saving} onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={saving}
                onClick={async () => {
                  if (tab !== 'customers') {
                    setShowModal(false);
                    return;
                  }
                  if (!formNombre.trim()) {
                    toast.error('Ingresa el nombre del cliente');
                    return;
                  }
                  setSaving(true);
                  try {
                    await crear({
                      nombre: formNombre.trim(),
                      telefono: formTelefono.trim() || undefined,
                      correo: formCorreo.trim() || undefined,
                    });
                    toast.success('Cliente creado');
                    setShowModal(false);
                    setFormNombre('');
                    setFormTelefono('');
                    setFormCorreo('');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Error al crear cliente');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Guardar
              </button>
            </div>
      </ModalShell>
    </AppLayout>
  );
}
