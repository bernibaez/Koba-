import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { crearCliente } from '@/services/clientes.service';
import type { Customer } from './POSTerminal';

interface Props {
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

export default function PosAddCustomerModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [credit, setCredit] = useState('0');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }
    if (!phone.trim()) {
      toast.error('Ingresa el teléfono del cliente');
      return;
    }
    setSaving(true);
    try {
      const created = await crearCliente({
        nombre: name.trim(),
        telefono: phone.trim(),
        limite_credito: Number(credit) || 0,
        tipo_cliente: Number(credit) > 0 ? 'credito' : 'final',
      });
      const customer: Customer = {
        id: created.id,
        name: created.nombre,
        phone: created.telefono ?? '',
        credit: Number(created.limite_credito ?? 0),
      };
      toast.success(`Cliente agregado: ${customer.name}`);
      onCreated(customer);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className="card w-full max-w-md p-6 sm:p-7 space-y-5 modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-foreground text-xl flex items-center gap-2">
              <UserPlus size={22} className="text-primary" />
              Nuevo cliente
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Se guardará en Supabase y estará disponible en el POS
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Nombre *</label>
            <input
              className="input-field h-12 text-base"
              placeholder="Nombre completo o empresa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Teléfono *</label>
            <input
              className="input-field h-12 text-base"
              placeholder="809-555-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-muted-foreground mb-1.5 block">
              Límite de crédito (RD$)
            </label>
            <input
              className="input-field h-12 text-base"
              type="number"
              min={0}
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3 text-sm font-bold" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cliente'}
          </button>
        </form>
      </div>
    </div>
  );
}
