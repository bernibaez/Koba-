import React, { useState } from 'react';
import {
  getInvoiceSettings,
  saveInvoiceSettings,
  type InvoiceSettings,
  type PrintFormat,
  type TemplateStyle,
} from '@/lib/invoiceSettingsStore';
import PrintableInvoice, { type InvoiceItem } from '@/components/PrintableInvoice';
import {
  FileText,
  Printer,
  Receipt,
  Palette,
  Save,
  CheckCircle,
  Eye,
  Building,
  ShieldAlert,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

const ACCENT_PRESETS = [
  { name: 'Índigo Corporativo', hex: '#1e40af' },
  { name: 'Esmeralda', hex: '#047857' },
  { name: 'Violeta Ejecutivo', hex: '#6d28d9' },
  { name: 'Negro Slate', hex: '#0f172a' },
  { name: 'Rojo Carmesí', hex: '#be123c' },
  { name: 'Ámbar Cálido', hex: '#b45309' },
];

const SAMPLE_ITEMS: InvoiceItem[] = [
  { sku: 'PROD-001', name: 'Arroz Súper Selecto 10 lbs', qty: 2, price: 380, subtotal: 760, itbis: 0 },
  { sku: 'PROD-014', name: 'Aceite Vegetal Crisol 64 oz', qty: 1, price: 295, subtotal: 295, itbis: 45 },
  { sku: 'PROD-088', name: 'Leche Entera Milex 1L', qty: 4, price: 85, subtotal: 340, itbis: 0 },
  { sku: 'PROD-102', name: 'Queso Cheddar loncheado 200g', qty: 1, price: 185, subtotal: 185, itbis: 28.2 },
];

export default function InvoiceSettingsTab() {
  const [settings, setSettings] = useState<InvoiceSettings>(() => getInvoiceSettings());
  const [previewMode, setPreviewMode] = useState<'normal' | 'fiscal'>('normal');
  const [previewFormat, setPreviewFormat] = useState<PrintFormat>(settings.printFormat);
  const [saving, setSaving] = useState(false);

  const handleFieldChange = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      saveInvoiceSettings(settings);
      toast.success('Configuración de factura guardada correctamente');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults = getInvoiceSettings();
    setSettings(defaults);
    toast.info('Valores restablecidos');
  };

  // Sample data for preview calculations
  const sampleSubtotal = 1339;
  const sampleItbis = 73.2;
  const sampleTotal = sampleSubtotal + sampleItbis;

  const sampleNormalData = {
    invoiceNumber: 'FAC-000452',
    isFiscal: false,
    issueDate: new Date().toLocaleDateString('es-DO'),
    issueTime: '10:45 AM',
    cashier: 'Caja #1 (Admin)',
    customerName: 'Juan Pérez',
    items: SAMPLE_ITEMS,
    subtotal: sampleSubtotal,
    itbis: sampleItbis,
    total: sampleTotal,
    paymentMethod: 'efectivo',
    cashReceived: 1600,
    change: 187.8,
  };

  const sampleFiscalData = {
    invoiceNumber: 'B0100000084',
    isFiscal: true,
    ncf: 'B0100000084',
    ncfType: 'B01',
    ncfTypeName: 'FACTURA DE CRÉDITO FISCAL (B01)',
    expirationDate: '31/12/2027',
    issueDate: new Date().toLocaleDateString('es-DO'),
    issueTime: '10:45 AM',
    cashier: 'Caja #1 (Admin)',
    customerName: 'DISTRIBUIDORA NACIONAL S.A.',
    customerRnc: '101-98765-4',
    customerPhone: '(809) 555-9000',
    customerAddress: 'Av. Winston Churchill #102, Sto. Dgo.',
    items: SAMPLE_ITEMS,
    subtotal: sampleSubtotal,
    itbis: sampleItbis,
    total: sampleTotal,
    paymentMethod: 'transferencia',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={22} className="text-indigo-400" />
            <h2 className="text-xl font-black tracking-tight">Diseño & Configuración de Facturas</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Personaliza el formato de impresión, colores de acento, encabezados y leyendas de la DGII para comprobantes normales y fiscales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            Restablecer
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-black bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Save size={15} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls & Settings Form (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Format & Style Selection */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-wide border-b border-border pb-2">
              <Printer size={16} className="text-indigo-500" />
              Formato de Impresión & Plantilla
            </h3>

            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Formato Predeterminado</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('printFormat', 'ticket_80mm');
                    setPreviewFormat('ticket_80mm');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.printFormat === 'ticket_80mm'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 font-bold'
                      : 'border-border hover:bg-secondary text-foreground'
                  }`}
                >
                  <p className="text-xs font-extrabold flex items-center gap-1.5">
                    <Receipt size={14} className="text-indigo-500" /> Ticket Térmico (80mm)
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ideal para POS y cajas de cobro rápido</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('printFormat', 'full_page');
                    setPreviewFormat('full_page');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.printFormat === 'full_page'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 font-bold'
                      : 'border-border hover:bg-secondary text-foreground'
                  }`}
                >
                  <p className="text-xs font-extrabold flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-500" /> Hoja Completa (Carta / A4)
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ideal para crédito fiscal y facturas B01</p>
                </button>
              </div>
            </div>

            {/* Accent Color Palette */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block flex items-center gap-1">
                <Palette size={14} className="text-indigo-500" />
                Color de Acento en Factura
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ACCENT_PRESETS.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => handleFieldChange('accentColor', p.hex)}
                    className={`h-9 rounded-xl border flex items-center justify-center transition-all ${
                      settings.accentColor === p.hex
                        ? 'ring-2 ring-offset-2 ring-indigo-600 border-transparent shadow-xs scale-105'
                        : 'border-border hover:scale-95'
                    }`}
                    style={{ backgroundColor: p.hex }}
                    title={p.name}
                  >
                    {settings.accentColor === p.hex && <CheckCircle size={14} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Company Info Fields */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-wide border-b border-border pb-2">
              <Building size={16} className="text-indigo-500" />
              Datos Comerciales en Factura
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Nombre Oficial / Razón Social *</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">RNC de la Empresa *</label>
                <input
                  type="text"
                  value={settings.companyRnc}
                  onChange={(e) => handleFieldChange('companyRnc', e.target.value)}
                  className="input-field text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Teléfono Principal</label>
                <input
                  type="text"
                  value={settings.companyPhone}
                  onChange={(e) => handleFieldChange('companyPhone', e.target.value)}
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Correo Electrónico</label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => handleFieldChange('companyEmail', e.target.value)}
                  className="input-field text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Dirección Fiscal / Local</label>
                <input
                  type="text"
                  value={settings.companyAddress}
                  onChange={(e) => handleFieldChange('companyAddress', e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>
          </div>

          {/* Display & Visibility Options */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-wide border-b border-border pb-2">
              <Sliders size={16} className="text-indigo-500" />
              Opciones de Visibilidad
            </h3>

            <div className="space-y-2">
              {[
                { key: 'showLogo' as const, label: 'Mostrar Logo de la Empresa', desc: 'Incluye el logo en el encabezado de la factura' },
                { key: 'showCashier' as const, label: 'Mostrar Nombre del Cajero', desc: 'Identifica al operador que emitió la factura' },
                { key: 'showCustomerRncInNormal' as const, label: 'Mostrar RNC en Factura Normal', desc: 'Incluye el RNC en facturas de consumo simple si el cliente lo posee' },
                { key: 'showDgiiLegend' as const, label: 'Mostrar Leyenda Legal DGII', desc: 'Sustento fiscal conforme a Ley 11-92 y Norma 06-2018' },
                { key: 'showSignatureLine' as const, label: 'Mostrar Líneas de Firma', desc: 'Líneas para firma de entregado y recibido conforme' },
              ].map((opt) => (
                <label key={opt.key} className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-secondary/40 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-foreground">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[opt.key]}
                    onChange={(e) => handleFieldChange(opt.key, e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Custom Texts & Legal Notices */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-wide border-b border-border pb-2">
              <ShieldAlert size={16} className="text-indigo-500" />
              Textos & Pie de Página
            </h3>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Mensaje de Agradecimiento (Pie de página)</label>
              <input
                type="text"
                value={settings.footerMessage}
                onChange={(e) => handleFieldChange('footerMessage', e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Términos, Garantía & Políticas de Devolución</label>
              <textarea
                rows={2}
                value={settings.termsAndConditions}
                onChange={(e) => handleFieldChange('termsAndConditions', e.target.value)}
                className="input-field text-xs py-2"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Leyenda Legal DGII (Para Factura Fiscal)</label>
              <textarea
                rows={2}
                value={settings.dgiiNotice}
                onChange={(e) => handleFieldChange('dgiiNotice', e.target.value)}
                className="input-field text-xs py-2 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (6 cols) */}
        <div className="lg:col-span-6 space-y-4 sticky top-6">
          <div className="card p-4 space-y-3 bg-slate-900 text-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  Vista Previa en Tiempo Real
                </h3>
              </div>

              {/* Format Toggle for Live Preview */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewFormat('ticket_80mm')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                    previewFormat === 'ticket_80mm'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ticket 80mm
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFormat('full_page')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                    previewFormat === 'full_page'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hoja Completa
                </button>
              </div>
            </div>

            {/* Mode Switcher: Factura Normal vs Factura Fiscal */}
            <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewMode('normal')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                  previewMode === 'normal'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Factura Normal (Consumidor)
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('fiscal')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                  previewMode === 'fiscal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Factura Fiscal (NCF B01/B02)
              </button>
            </div>

            {/* Live Rendered Canvas Container */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[620px] overflow-y-auto scrollbar-thin">
              <PrintableInvoice
                invoiceData={previewMode === 'fiscal' ? sampleFiscalData : sampleNormalData}
                settingsOverride={settings}
                formatOverride={previewFormat}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
              <span>* Los cambios se actualizan en vivo en la vista previa.</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
              >
                <Printer size={13} /> Probar Impresión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
