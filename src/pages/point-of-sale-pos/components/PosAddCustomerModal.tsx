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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={onClose}>
      <div
        className="card w-full max-w-md p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <UserPlus size={18} className="text-primary" />
              Nuevo cliente
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Se guardará en Supabase y estará disponible en el POS
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre *</label>
            <input
              className="input-field"
              placeholder="Nombre completo o empresa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Teléfono *</label>
            <input
              className="input-field"
              placeholder="809-555-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Límite de crédito (RD$)
            </label>
            <input
              className="input-field"
              type="number"
              min={0}
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cliente'}
          </button>
        </form>
      </div>
    </div>
  );
}
