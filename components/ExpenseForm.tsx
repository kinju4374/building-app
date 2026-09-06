'use client';
import { useState } from 'react';

const CATEGORIES = ['Maid', 'Electricity', 'Water', 'Repairs & Maintenance', 'Security', 'Other'];

export type ExpenseFormData = {
  date: string;
  category: string;
  description: string;
  amount: number;
  paidTo: string;
};

export default function ExpenseForm({
  initialData, onSubmit, onCancel, submitLabel = 'Save',
}: {
  initialData?: ExpenseFormData;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [paidTo, setPaidTo] = useState(initialData?.paidTo || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!date || !category || !description.trim() || !amount || !paidTo.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (Number(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ date, category, description: description.trim(), amount: Number(amount), paidTo: paidTo.trim() });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-lg">
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <label className="block text-sm mb-1">Date *</label>
      <input type="date" className="w-full border rounded px-3 py-2 mb-3" value={date} onChange={(e) => setDate(e.target.value)} required />

      <label className="block text-sm mb-1">Category *</label>
      <select className="w-full border rounded px-3 py-2 mb-3" value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label className="block text-sm mb-1">Description *</label>
      <input className="w-full border rounded px-3 py-2 mb-3" value={description} onChange={(e) => setDescription(e.target.value)} required />

      <label className="block text-sm mb-1">Amount (₹) *</label>
      <input type="number" min="1" step="1" className="w-full border rounded px-3 py-2 mb-3" value={amount} onChange={(e) => setAmount(e.target.value)} required />

      <label className="block text-sm mb-1">Paid to *</label>
      <input className="w-full border rounded px-3 py-2 mb-4" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} required />

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">Cancel</button>
      </div>
    </form>
  );
}