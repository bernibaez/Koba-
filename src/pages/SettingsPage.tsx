import React, { useRef, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Building2, MapPin, FileText, Printer, Tag, DollarSign, Globe, Bell, Shield, Mail, Upload, Save, ChevronRight, Trash2, ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
  clearCompanyLogo,
  getCompanyLogo,
  readLogoFile,
  setCompanyLogo,
} from '@/lib/companyLogo';

const settingsSections = [
  { id: 'company', label: 'Empresa', icon: <Building2 size={18} /> },
  { id: 'locations', label: 'Ubicaciones', icon: <MapPin size={18} /> },
  { id: 'invoice', label: 'Facturación', icon: <FileText size={18} /> },
  { id: 'printers', label: 'Impresoras', icon: <Printer size={18} /> },
  { id: 'taxes', label: 'Impuestos', icon: <Tag size={18} /> },
  { id: 'currency', label: 'Moneda', icon: <DollarSign size={18} /> },
  { id: 'localization', label: 'Localización', icon: <Globe size={18} /> },
  { id: 'notifications', label: 'Notificaciones', icon: <Bell size={18} /> },
  { id: 'permissions', label: 'Permisos', icon: <Shield size={18} /> },
  { id: 'email', label: 'Correo', icon: <Mail size={18} /> },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('company');
  const [logoPreview, setLogoPreview] = useState<string | null>(() => getCompanyLogo());
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    setLogoError(null);
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const dataUrl = await readLogoFile(file);
      setLogoPreview(dataUrl);
      setCompanyLogo(dataUrl);
      setLogoError(null);
      toast.success('Logo actualizado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar la imagen';
      setLogoError(message);
      toast.error(message);
    }
  };

  const handleRemoveLogo = () => {
    clearCompanyLogo();
    setLogoPreview(null);
    setLogoError(null);
    toast.success('Logo eliminado');
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-1">Administra la configuración del sistema</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="card p-3 space-y-1 h-fit">
            {settingsSections?.map(s => (
              <button key={s?.id} onClick={() => setActiveSection(s?.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === s?.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                <div className="flex items-center gap-3">{s?.icon}{s?.label}</div>
                <ChevronRight size={14} className={activeSection === s?.id ? 'text-primary' : 'text-muted-foreground'} />
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeSection === 'company' && (
              <div className="card p-6 space-y-6">
                <h2 className="text-lg font-bold text-foreground">Información de la Empresa</h2>
                <div className="flex items-center gap-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-secondary/50 overflow-hidden relative group"
                    aria-label="Subir logo"
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo de la empresa"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <>
                        <Upload size={20} className="text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Logo</span>
                      </>
                    )}
                    <span className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon size={22} className="text-white" />
                    </span>
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Sube el logo de tu empresa (PNG, JPG, WEBP o SVG, máx. 2MB). Se mostrará en el menú lateral.
                    </p>
                    {logoError && (
                      <p className="text-xs text-danger mt-1">{logoError}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button type="button" onClick={openFilePicker} className="btn-secondary text-xs py-1.5">
                        {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                      </button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="btn-secondary text-xs py-1.5 text-danger flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre de la empresa *</label><input className="input-field" defaultValue="MarketERP Supermercado" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">RNC / Cédula *</label><input className="input-field" defaultValue="131-12345-6" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Teléfono</label><input className="input-field" defaultValue="809-555-0000" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Correo electrónico</label><input className="input-field" defaultValue="info@marketerp.do" type="email" /></div>
                  <div className="md:col-span-2"><label className="text-xs font-medium text-muted-foreground mb-1 block">Dirección</label><input className="input-field" defaultValue="Av. 27 de Febrero #100, Santo Domingo, RD" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Ciudad</label><input className="input-field" defaultValue="Santo Domingo" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">País</label><select className="input-field"><option>República Dominicana</option><option>México</option><option>Colombia</option></select></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Sitio web</label><input className="input-field" defaultValue="www.marketerp.do" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Sector</label><select className="input-field"><option>Supermercado</option><option>Farmacia</option><option>Ferretería</option><option>Otro</option></select></div>
                </div>
                <div className="flex justify-end"><button className="btn-primary flex items-center gap-2"><Save size={16} />Guardar cambios</button></div>
              </div>
            )}

            {activeSection === 'locations' && (
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Ubicaciones Comerciales</h2>
                  <button className="btn-primary flex items-center gap-2 text-sm"><MapPin size={16} />Nueva Sucursal</button>
                </div>
                {[
                  { name: 'Sucursal Principal', address: 'Av. 27 de Febrero #100', phone: '809-555-0001', manager: 'Admin General', status: true },
                  { name: 'Sucursal Norte', address: 'Calle del Sol #45, Santiago', phone: '809-555-0002', manager: 'Carlos López', status: true },
                  { name: 'Sucursal Este', address: 'Av. España #200, San Pedro', phone: '809-555-0003', manager: 'Ana Martínez', status: false },
                ]?.map((loc, i) => (
                  <div key={i} className="border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><MapPin size={18} className="text-primary" /></div>
                      <div>
                        <p className="font-semibold text-foreground">{loc?.name}</p>
                        <p className="text-xs text-muted-foreground">{loc?.address}</p>
                        <p className="text-xs text-muted-foreground">{loc?.phone} · {loc?.manager}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={loc?.status ? 'badge-success' : 'badge-danger'}>{loc?.status ? 'Activa' : 'Inactiva'}</span>
                      <button className="btn-secondary text-xs py-1.5">Editar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'taxes' && (
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Tasas de Impuestos</h2>
                  <button className="btn-primary flex items-center gap-2 text-sm"><Tag size={16} />Nuevo Impuesto</button>
                </div>
                {[
                  { name: 'ITBIS 18%', rate: 18, type: 'Porcentaje', applies: 'Productos generales', active: true },
                  { name: 'ITBIS 16%', rate: 16, type: 'Porcentaje', applies: 'Servicios', active: true },
                  { name: 'ISC Bebidas', rate: 10, type: 'Porcentaje', applies: 'Bebidas alcohólicas', active: true },
                  { name: 'Exento', rate: 0, type: 'Exento', applies: 'Productos básicos', active: true },
                ]?.map((tax, i) => (
                  <div key={i} className="border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{tax?.name}</p>
                      <p className="text-xs text-muted-foreground">{tax?.applies}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">{tax?.rate}%</span>
                      <span className={tax?.active ? 'badge-success' : 'badge-danger'}>{tax?.active ? 'Activo' : 'Inactivo'}</span>
                      <button className="btn-secondary text-xs py-1.5">Editar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'currency' && (
              <div className="card p-6 space-y-4">
                <h2 className="text-lg font-bold text-foreground">Moneda y Formato</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Moneda principal</label><select className="input-field"><option>DOP - Peso Dominicano</option><option>USD - Dólar Americano</option><option>EUR - Euro</option></select></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Símbolo</label><input className="input-field" defaultValue="RD$" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Decimales</label><select className="input-field"><option>2 decimales</option><option>0 decimales</option></select></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Separador de miles</label><select className="input-field"><option>Coma (1,000)</option><option>Punto (1.000)</option></select></div>
                </div>
                <div className="flex justify-end"><button className="btn-primary flex items-center gap-2"><Save size={16} />Guardar</button></div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="card p-6 space-y-4">
                <h2 className="text-lg font-bold text-foreground">Notificaciones</h2>
                {[
                  { label: 'Stock mínimo alcanzado', desc: 'Notificar cuando un producto llegue al stock mínimo', enabled: true },
                  { label: 'Nueva venta registrada', desc: 'Notificar al registrar una nueva venta', enabled: false },
                  { label: 'Compra recibida', desc: 'Notificar al recibir una orden de compra', enabled: true },
                  { label: 'Productos próximos a vencer', desc: 'Alertar 30 días antes del vencimiento', enabled: true },
                  { label: 'Caja abierta/cerrada', desc: 'Notificar apertura y cierre de caja', enabled: false },
                  { label: 'Nuevo usuario registrado', desc: 'Notificar cuando se cree un nuevo usuario', enabled: true },
                ]?.map((n, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-foreground text-sm">{n?.label}</p>
                      <p className="text-xs text-muted-foreground">{n?.desc}</p>
                    </div>
                    <button className={`relative w-11 h-6 rounded-full transition-colors ${n?.enabled ? 'bg-primary' : 'bg-border'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${n?.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'invoice' && (
              <div className="card p-6 space-y-4">
                <h2 className="text-lg font-bold text-foreground">Configuración de Factura</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Prefijo de factura</label><input className="input-field" defaultValue="FAC-" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Número inicial</label><input className="input-field" defaultValue="001" type="number" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Días de crédito por defecto</label><input className="input-field" defaultValue="30" type="number" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de comprobante DGII</label><select className="input-field"><option>B01 - Crédito Fiscal</option><option>B02 - Consumidor Final</option><option>B14 - Régimen Especial</option></select></div>
                  <div className="md:col-span-2"><label className="text-xs font-medium text-muted-foreground mb-1 block">Nota al pie de factura</label><textarea className="input-field" rows={3} defaultValue="Gracias por su compra. Conserve su factura." /></div>
                </div>
                <div className="flex justify-end"><button className="btn-primary flex items-center gap-2"><Save size={16} />Guardar</button></div>
              </div>
            )}

            {!['company','locations','taxes','currency','notifications','invoice']?.includes(activeSection) && (
              <div className="card p-6 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  {settingsSections?.find(s => s?.id === activeSection)?.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{settingsSections?.find(s => s?.id === activeSection)?.label}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Esta sección de configuración está disponible. Selecciona las opciones para personalizar tu sistema.</p>
                <button className="btn-primary mt-4">Configurar</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
