import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { addPosCustomer } from '@/lib/posCustomers';
import type { Customer } from './POSTerminal';

interface Props {
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

export default function PosAddCustomerModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [credit, setCredit] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }
    if (!phone.trim()) {
      toast.error('Ingresa el teléfono del cliente');
      return;
    }
    const customer = addPosCustomer({
      name,
      phone,
      credit: Number(credit) || 0,
    });
    toast.success(`Cliente agregado: ${customer.name}`);
    onCreated(customer);
    onClose();
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
              Se agregará a la lista del punto de venta
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
              type="number"
              min={0}
              className="input-field"
              placeholder="0"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              Guardar cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
