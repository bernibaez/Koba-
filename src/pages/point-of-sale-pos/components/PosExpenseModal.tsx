import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { addCashExpense, getCashExpenses, nextCode } from '@/lib/posStore';

const categories = ['Transporte', 'Limpieza', 'Compras menores', 'Mensajería', 'Otros'];

export default function PosExpenseModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const save = () => {
    const value = parseFloat(amount);
    if (!description.trim() || !value || value <= 0) {
      toast.error('Completa descripción y monto válido');
      return;
    }
    const now = new Date();
    addCashExpense({
      id: `exp-${Date.now()}`,
      code: nextCode('GCJ', getCashExpenses().length),
      category,
      description: description.trim(),
      amount: value,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      user: 'Admin General',
      cashier: 'Caja #1',
    });
    toast.success(`Gasto registrado: RD$ ${value.toLocaleString('es-DO')}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={onClose}>
      <div className="card w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Gasto de caja</h3>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoría</label>
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Descripción *</label>
          <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Pago de mensajería" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Monto (RD$) *</label>
          <input className="input-field" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={save}>Registrar gasto</button>
        </div>
      </div>
    </div>
  );
}
