import { getCompanyLogo } from './companyLogo';

export type PrintFormat = 'ticket_80mm' | 'full_page';
export type TemplateStyle = 'modern' | 'classic' | 'minimal';

export interface InvoiceSettings {
  companyName: string;
  companyRnc: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  printFormat: PrintFormat;
  templateStyle: TemplateStyle;
  accentColor: string;
  showLogo: boolean;
  showCashier: boolean;
  showCustomerRncInNormal: boolean;
  showDgiiLegend: boolean;
  showSignatureLine: boolean;
  footerMessage: string;
  termsAndConditions: string;
  dgiiNotice: string;
}

const INVOICE_SETTINGS_KEY = 'marketerp_invoice_settings';

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  companyName: 'SUPERMERCADO MERCATO S.R.L.',
  companyRnc: '131-45678-9',
  companyPhone: '(809) 555-0199',
  companyEmail: 'contacto@mercato.do',
  companyAddress: 'Av. 27 de Febrero #450, Santo Domingo, R.D.',
  printFormat: 'ticket_80mm',
  templateStyle: 'modern',
  accentColor: '#1e40af', // Indigo/Blue corporate
  showLogo: true,
  showCashier: true,
  showCustomerRncInNormal: false,
  showDgiiLegend: true,
  showSignatureLine: true,
  footerMessage: '¡Gracias por preferirnos! Conserve este comprobante para cualquier reclamación.',
  termsAndConditions: 'Cambios permitidos dentro de los 15 días posteriores a la compra con factura original en buen estado.',
  dgiiNotice: 'Comprobante fiscal válido para sustentar costos y gastos de conformidad con la Ley 11-92 y Norma General 06-2018 de la DGII.',
};

const LISTENERS = new Set<() => void>();

export function getInvoiceSettings(): InvoiceSettings {
  try {
    const raw = localStorage.getItem(INVOICE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_INVOICE_SETTINGS, ...parsed };
    }
  } catch {
    /* fallback to defaults */
  }
  return { ...DEFAULT_INVOICE_SETTINGS };
}

export function saveInvoiceSettings(settings: Partial<InvoiceSettings>): InvoiceSettings {
  const current = getInvoiceSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(INVOICE_SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    /* ignore write errors */
  }
  LISTENERS.forEach((cb) => cb());
  return updated;
}

export function subscribeInvoiceSettings(callback: () => void): () => void {
  LISTENERS.add(callback);
  return () => {
    LISTENERS.delete(callback);
  };
}
