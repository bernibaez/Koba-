import React from 'react';
import { X, Users, Truck, Tag } from 'lucide-react';
import { TIPO_CLIENTE_OPTIONS, type ContactsTab, type FormMode } from './types';

interface ContactFormModalProps {
  open: boolean;
  tab: ContactsTab;
  mode: FormMode;
  saving: boolean;
  formNombre: string;
  setFormNombre: (val: string) => void;
  formTelefono: string;
  setFormTelefono: (val: string) => void;
  formCorreo: string;
  setFormCorreo: (val: string) => void;
  formDireccion: string;
  setFormDireccion: (val: string) => void;
  formCredito: string;
  setFormCredito: (val: string) => void;
  formGrupo: string;
  setFormGrupo: (val: string) => void;
  formDescuento: string;
  setFormDescuento: (val: string) => void;
  formDescripcion: string;
  setFormDescripcion: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
  onSwitchToEdit: () => void;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  open,
  tab,
  mode,
  saving,
  formNombre,
  setFormNombre,
  formTelefono,
  setFormTelefono,
  formCorreo,
  setFormCorreo,
  formDireccion,
  setFormDireccion,
  formCredito,
  setFormCredito,
  formGrupo,
  setFormGrupo,
  formDescuento,
  setFormDescuento,
  formDescripcion,
  setFormDescripcion,
  onClose,
  onSave,
  onSwitchToEdit,
}) => {
  if (!open) return null;

  const isReadonly = mode === 'view';

  const getTitle = () => {
    const entity =
      tab === 'customers' ? 'Cliente' : tab === 'suppliers' ? 'Proveedor' : 'Grupo';
    if (mode === 'view') return `Detalle del ${entity}`;
    if (mode === 'edit') return `Editar ${entity}`;
    return `Nuevo ${entity}`;
  };

  const getIcon = () => {
    switch (tab) {
      case 'customers':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'suppliers':
        return <Truck className="w-4 h-4 text-amber-500" />;
      case 'groups':
        return <Tag className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface2)]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface2)] flex items-center justify-center border border-[var(--border)]">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)]">{getTitle()}</h3>
              <p className="text-[11px] text-[var(--ink2)]">
                {isReadonly
                  ? 'Ficha informativa del registro'
                  : 'Completa la información requerida'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
              Nombre o Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              placeholder="Ej. Comercial Los Ángeles SRL / Juan Pérez"
              disabled={isReadonly}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all disabled:opacity-75"
            />
          </div>

          {tab !== 'groups' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="809-555-0100"
                    disabled={isReadonly}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    placeholder="contacto@empresa.com"
                    disabled={isReadonly}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all disabled:opacity-75"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formDireccion}
                  onChange={(e) => setFormDireccion(e.target.value)}
                  placeholder="Calle Principal #12, Santo Domingo"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all disabled:opacity-75"
                />
              </div>
            </>
          )}

          {tab === 'customers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Límite de Crédito (RD$)
                </label>
                <input
                  type="number"
                  value={formCredito}
                  onChange={(e) => setFormCredito(e.target.value)}
                  placeholder="0.00"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all font-mono disabled:opacity-75"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Tipo de Cliente / Fiscal
                </label>
                <select
                  value={formGrupo}
                  onChange={(e) => setFormGrupo(e.target.value)}
                  disabled={isReadonly}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all disabled:opacity-75 cursor-pointer"
                >
                  <option value="">Selecciona tipo...</option>
                  {TIPO_CLIENTE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {tab === 'groups' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Porcentaje de Descuento (%)
                </label>
                <input
                  type="number"
                  value={formDescuento}
                  onChange={(e) => setFormDescuento(e.target.value)}
                  placeholder="Ej. 10"
                  disabled={isReadonly}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all font-mono disabled:opacity-75"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--ink2)] mb-1">
                  Descripción o Condiciones
                </label>
                <textarea
                  rows={3}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Descripción de la tarifa preferencial..."
                  disabled={isReadonly}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)] placeholder-[var(--ink3)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all disabled:opacity-75 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface2)]/40 flex items-center justify-end gap-2">
          {isReadonly ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={onSwitchToEdit}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Editar Información
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-contrast,#ffffff)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
