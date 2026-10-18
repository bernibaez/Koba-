import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import {
  Building2,
  MapPin,
  FileText,
  Printer,
  Tag,
  DollarSign,
  Globe,
  Bell,
  Shield,
  Mail,
  Upload,
  Save,
  ChevronRight,
  Trash2,
  ImageIcon,
  ShieldCheck,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import {
  clearCompanyLogo,
  getCompanyLogo,
  readLogoFile,
  setCompanyLogo,
  syncCompanyLogoFromDb,
} from '@/lib/companyLogo';
import NCFSettingsTab from './settings/NCFSettingsTab';
import PermissionsSettingsTab from './settings/PermissionsSettingsTab';
import InvoiceSettingsTab from './settings/InvoiceSettingsTab';

const settingsSections = [
  { id: 'company', label: 'Empresa & Logo', icon: <Building2 className="w-4 h-4" /> },
  { id: 'locations', label: 'Ubicaciones & Sucursales', icon: <MapPin className="w-4 h-4" /> },
  { id: 'invoice', label: 'Facturación & Términos', icon: <FileText className="w-4 h-4" /> },
  { id: 'ncf', label: 'Secuencias NCF (DGII)', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'taxes', label: 'Impuestos & ITBIS', icon: <Tag className="w-4 h-4" /> },
  { id: 'currency', label: 'Moneda & Símbolos', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'notifications', label: 'Alertas & Notificaciones', icon: <Bell className="w-4 h-4" /> },
  { id: 'permissions', label: 'Permisos & Seguridad', icon: <Shield className="w-4 h-4" /> },
  { id: 'printers', label: 'Impresoras', icon: <Printer className="w-4 h-4" /> },
  { id: 'localization', label: 'Localización', icon: <Globe className="w-4 h-4" /> },
  { id: 'email', label: 'Servidor de Correo', icon: <Mail className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get('section') || searchParams.get('tab') || 'company';
  const [activeSection, setActiveSection] = useState(initialSection);
  const [logoPreview, setLogoPreview] = useState<string | null>(() => getCompanyLogo());
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [empresaNombre, setEmpresaNombre] = useState('Mercato Supermercado');
  const [empresaRnc, setEmpresaRnc] = useState('');
  const [empresaTelefono, setEmpresaTelefono] = useState('');
  const [empresaCorreo, setEmpresaCorreo] = useState('');
  const [empresaDireccion, setEmpresaDireccion] = useState('');
  const [empresaMoneda, setEmpresaMoneda] = useState('DOP');
  const [empresaItbis, setEmpresaItbis] = useState('18');
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [sucursales, setSucursales] = useState<{ id: string; codigo: string; nombre: string }[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('mercato_notif_prefs');
      if (raw) return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      /* ignore */
    }
    return {
      stock: true,
      venta: false,
      compra: true,
      vencimiento: true,
      caja: false,
      usuario: true,
    };
  });

  useEffect(() => {
    void syncCompanyLogoFromDb().then((url) => setLogoPreview(url));
    void import('@/services/empresa.service')
      .then(({ obtenerConfiguracionEmpresa }) => obtenerConfiguracionEmpresa())
      .then((cfg) => {
        if (!cfg) return;
        setEmpresaNombre(cfg.nombre_comercial || '');
        setEmpresaRnc(cfg.rnc || '');
        setEmpresaTelefono(cfg.telefono || '');
        setEmpresaCorreo(cfg.correo || '');
        setEmpresaDireccion(cfg.direccion || '');
        setEmpresaMoneda(cfg.moneda || 'DOP');
        setEmpresaItbis(String(cfg.itbis_porcentaje ?? 18));
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    if (activeSection !== 'locations') return;
    setLoadingSucursales(true);
    void import('@/services/transferencias.service')
      .then(({ obtenerSucursales }) => obtenerSucursales())
      .then(setSucursales)
      .catch(() => setSucursales([]))
      .finally(() => setLoadingSucursales(false));
  }, [activeSection]);

  const handleSelectSection = (id: string) => {
    setActiveSection(id);
    setSearchParams({ section: id });
  };

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

  const handleSaveEmpresa = async () => {
    setSavingEmpresa(true);
    try {
      const { guardarConfiguracionEmpresa } = await import('@/services/empresa.service');
      const { saveInvoiceSettings } = await import('@/lib/invoiceSettingsStore');
      await guardarConfiguracionEmpresa({
        nombre_comercial: empresaNombre,
        rnc: empresaRnc,
        telefono: empresaTelefono,
        correo: empresaCorreo,
        direccion: empresaDireccion,
        moneda: empresaMoneda,
        itbis_porcentaje: parseFloat(empresaItbis) || 18,
      });
      saveInvoiceSettings({
        companyName: empresaNombre,
        companyRnc: empresaRnc,
        companyPhone: empresaTelefono,
        companyEmail: empresaCorreo,
        companyAddress: empresaDireccion,
      });
      toast.success('Datos de empresa guardados y sincronizados');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSavingEmpresa(false);
    }
  };

  return (
    <AppLayout fullWidth>
      <div className="apple-scope space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface2)] text-[var(--ink2)] border border-[var(--border)]">
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                Ajustes & Parámetros Operativos
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
              Configuración del Sistema
            </h1>
            <p className="text-xs text-[var(--ink2)] mt-0.5">
              Administra la identidad corporativa, secuencias de NCF DGII, sucursales y permisos de acceso.
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Navigation Sidebar */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2 space-y-0.5 h-fit shadow-xs">
            <p className="text-[10px] font-bold text-[var(--ink3)] uppercase tracking-wider px-2.5 py-2">
              Secciones
            </p>
            {settingsSections.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSection(s.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] font-semibold shadow-xs'
                      : 'text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span>{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--primary-contrast,#ffffff)]' : 'text-[var(--ink3)]'}`} />
                </button>
              );
            })}
          </div>

          {/* Section Viewport */}
          <div className="lg:col-span-3">
            {activeSection === 'company' && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)]">
                    Identidad & Logo de la Empresa
                  </h2>
                  <p className="text-[11px] text-[var(--ink2)] mt-0.5">
                    Esta información se refleja en comprobantes fiscales, facturas impresas y reportes.
                  </p>
                </div>

                {/* Logo Upload Box */}
                <div className="flex items-center gap-5 p-4 rounded-xl bg-[var(--surface2)]/50 border border-[var(--border)]">
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
                    className="w-20 h-20 rounded-xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors bg-[var(--surface)] overflow-hidden relative group shrink-0"
                    aria-label="Subir logo"
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo de la empresa"
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-[var(--ink3)] mb-1" />
                        <span className="text-[10px] text-[var(--ink3)]">Subir</span>
                      </>
                    )}
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </span>
                  </button>

                  <div className="flex-1">
                    <p className="text-xs text-[var(--ink2)] leading-relaxed">
                      Sube el logo corporativo (PNG, JPG o SVG, máx. 2MB). Se utilizará en la barra lateral y en encabezados de impresión.
                    </p>
                    {logoError && (
                      <p className="text-[11px] text-red-500 mt-1">{logoError}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="px-3 py-1 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                      >
                        {logoPreview ? 'Cambiar logo' : 'Subir imagen'}
                      </button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-1 text-xs font-medium rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      Nombre o Razón Social <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      value={empresaNombre}
                      onChange={(e) => setEmpresaNombre(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      RNC / Cédula Fiscal <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                      value={empresaRnc}
                      onChange={(e) => setEmpresaRnc(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      Teléfono Principal
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      value={empresaTelefono}
                      onChange={(e) => setEmpresaTelefono(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      type="email"
                      value={empresaCorreo}
                      onChange={(e) => setEmpresaCorreo(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      Dirección Física
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      value={empresaDireccion}
                      onChange={(e) => setEmpresaDireccion(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      Moneda Base
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                      value={empresaMoneda}
                      onChange={(e) => setEmpresaMoneda(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      ITBIS por Defecto (%)
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                      type="number"
                      value={empresaItbis}
                      onChange={(e) => setEmpresaItbis(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs"
                    disabled={savingEmpresa}
                    onClick={() => void handleSaveEmpresa()}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingEmpresa ? 'Guardando…' : 'Guardar Parámetros'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'locations' && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--ink)]">
                      Ubicaciones & Sucursales
                    </h2>
                    <p className="text-[11px] text-[var(--ink2)] mt-0.5">
                      Puntos de despacho y venta vinculados a inventario multi-almacén.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    onClick={() =>
                      toast.info('Crea sucursales desde Supabase o el módulo de transferencias')
                    }
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Nueva Sucursal</span>
                  </button>
                </div>

                {loadingSucursales ? (
                  <p className="text-xs text-[var(--ink2)] py-8 text-center">Cargando sucursales…</p>
                ) : sucursales.length === 0 ? (
                  <div className="p-8 text-center border border-[var(--border)] rounded-xl bg-[var(--surface2)]/30 text-xs text-[var(--ink2)]">
                    No hay sucursales registradas en la base de datos.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sucursales.map((loc) => (
                      <div
                        key={loc.id}
                        className="border border-[var(--border)] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface2)]/40 hover:bg-[var(--surface2)]/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-[var(--ink)]">{loc.nombre}</p>
                            <p className="text-[10px] text-[var(--ink3)] font-mono">{loc.codigo}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                          Operativa
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'taxes' && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--ink)]">
                      Tasas de Impuestos & Retenciones
                    </h2>
                    <p className="text-[11px] text-[var(--ink2)] mt-0.5">
                      Configuración de alícuotas tributarias de la Dirección General de Impuestos Internos.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
                    disabled={savingEmpresa}
                    onClick={() => void handleSaveEmpresa()}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Guardar ITBIS</span>
                  </button>
                </div>

                <div className="border border-[var(--border)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface2)]/40">
                  <div>
                    <p className="font-semibold text-xs text-[var(--ink)]">ITBIS General Predeterminado</p>
                    <p className="text-[11px] text-[var(--ink2)] mt-0.5">
                      Porcentaje aplicado automáticamente en ventas POS y cotizaciones B2B.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-24 px-3 py-1.5 text-sm font-bold font-mono text-right bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      type="number"
                      value={empresaItbis}
                      onChange={(e) => setEmpresaItbis(e.target.value)}
                    />
                    <span className="text-xs font-semibold text-[var(--ink2)]">%</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'currency' && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)]">
                    Moneda & Formato Numérico
                  </h2>
                  <p className="text-[11px] text-[var(--ink2)] mt-0.5">
                    Define la unidad monetaria en que se expresan precios e informes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      Moneda Principal
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                      value={empresaMoneda}
                      onChange={(e) => setEmpresaMoneda(e.target.value)}
                    >
                      <option value="DOP">DOP - Peso Dominicano</option>
                      <option value="USD">USD - Dólar Estadounidense</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                      Símbolo Monetario
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] font-mono font-bold"
                      readOnly
                      value={empresaMoneda === 'USD' ? 'US$' : empresaMoneda === 'EUR' ? '€' : 'RD$'}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs"
                    disabled={savingEmpresa}
                    onClick={() => void handleSaveEmpresa()}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Moneda</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)]">
                    Notificaciones & Avisos Automáticos
                  </h2>
                  <p className="text-[11px] text-[var(--ink2)] mt-0.5">
                    Preferencias locales activas para alertas visuales y sonoras en el navegador.
                  </p>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {(
                    [
                      { key: 'stock', label: 'Stock mínimo alcanzado', desc: 'Notificar cuando un producto llegue al nivel de reposición' },
                      { key: 'venta', label: 'Nueva venta registrada', desc: 'Aviso instantáneo al registrar una orden' },
                      { key: 'compra', label: 'Compra recibida', desc: 'Notificar al completar la recepción en almacén' },
                      { key: 'vencimiento', label: 'Lotes próximos a vencer', desc: 'Alertar 30 días antes del vencimiento' },
                      { key: 'caja', label: 'Apertura y cierre de caja', desc: 'Confirmación al abrir o cerrar jornada' },
                      { key: 'usuario', label: 'Nuevo usuario registrado', desc: 'Avisar cuando se cree una nueva cuenta' },
                    ] as const
                  ).map((n) => {
                    const enabled = Boolean(notifPrefs[n.key]);
                    return (
                      <div
                        key={n.key}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-[var(--ink)]">{n.label}</p>
                          <p className="text-[11px] text-[var(--ink2)] mt-0.5">{n.desc}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={n.label}
                          onClick={() => {
                            setNotifPrefs((prev) => {
                              const next = { ...prev, [n.key]: !Boolean(prev[n.key]) };
                              try {
                                localStorage.setItem('mercato_notif_prefs', JSON.stringify(next));
                              } catch {
                                /* ignore */
                              }
                              toast.success(next[n.key] ? `${n.label} activada` : `${n.label} desactivada`);
                              return next;
                            });
                          }}
                          className={`
                            relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
                            border border-transparent transition-colors duration-200 cursor-pointer
                            ${enabled ? 'bg-emerald-500' : 'bg-[var(--border)]'}
                          `}
                        >
                          <span
                            className={`
                              pointer-events-none inline-block h-4 w-4 rounded-full
                              bg-white shadow-sm ring-0
                              transition duration-200 ease-in-out
                              ${enabled ? 'translate-x-5' : 'translate-x-1'}
                            `}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSection === 'invoice' && <InvoiceSettingsTab />}

            {activeSection === 'ncf' && <NCFSettingsTab />}

            {activeSection === 'permissions' && <PermissionsSettingsTab />}

            {!['company', 'locations', 'taxes', 'currency', 'notifications', 'invoice', 'ncf', 'permissions'].includes(
              activeSection
            ) && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 flex flex-col items-center justify-center py-16 text-center shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface2)] flex items-center justify-center mb-3 text-[var(--ink3)]">
                  {settingsSections.find((s) => s.id === activeSection)?.icon}
                </div>
                <h3 className="font-bold text-xs text-[var(--ink)] mb-1">
                  {settingsSections.find((s) => s.id === activeSection)?.label}
                </h3>
                <p className="text-[11px] text-[var(--ink2)] max-w-xs mx-auto">
                  Esta sección utiliza parámetros predeterminados. Para cambios operativos, utiliza Empresa, NCF o Permisos.
                </p>
                <button
                  type="button"
                  className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                  onClick={() => handleSelectSection('company')}
                >
                  Ir a Empresa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
