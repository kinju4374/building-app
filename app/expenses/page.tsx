'use client';
import { useEffect, useMemo, useState } from 'react';
import ExpenseForm, { ExpenseFormData } from '@/components/ExpenseForm';
import ListCard from '@/components/ListCard';
import ListRow from '@/components/ListRow';
import Badge from '@/components/Badge';

type Expense = ExpenseFormData & { id: string; addedBy: string; status: string };

const CATEGORIES = ['Maid', 'Electricity', 'Water', 'Repairs & Maintenance', 'Security', 'Other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [monthFilter, setMonthFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  async function loadExpenses() {
    setLoading(true);
    const res = await fetch('/api/expenses');
    const data = await res.json();
    if (data.success) setExpenses(data.expenses);
    setLoading(false);
  }

  useEffect(() => { loadExpenses(); }, []);

  async function handleAdd(data: ExpenseFormData) {
    const res = await fetch('/api/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add');
    setMode('list');
    await loadExpenses();
  }

  async function handleEdit(data: ExpenseFormData) {
    if (!editingExpense) return;
    const res = await fetch(`/api/expenses/${editingExpense.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update');
    setMode('list');
    setEditingExpense(null);
    await loadExpenses();
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this expense record?')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    await loadExpenses();
  }

  const availableMonths = useMemo(() => {
    const set = new Set(expenses.map((e) => e.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesMonth = monthFilter === 'all' || e.date.startsWith(monthFilter);
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchesMonth && matchesCategory;
    });
  }, [expenses, monthFilter, categoryFilter]);

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  if (loading) return <p className="p-5 text-sm text-[var(--muted)]">Loading expenses...</p>;

  if (mode === 'add') {
    return (
      <div className="p-5 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold mb-4">Add expense</h1>
        <ExpenseForm onSubmit={handleAdd} onCancel={() => setMode('list')} submitLabel="Add expense" />
      </div>
    );
  }

  if (mode === 'edit' && editingExpense) {
    return (
      <div className="p-5 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold mb-4">Edit expense</h1>
        <ExpenseForm initialData={editingExpense} onSubmit={handleEdit}
          onCancel={() => { setMode('list'); setEditingExpense(null); }} submitLabel="Save changes" />
      </div>
    );
  }

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <button onClick={() => setMode('add')} className="bg-[var(--primary)] text-white text-sm px-3.5 py-2 rounded-lg">+ Add</button>
      </div>

      <div className="flex gap-2 mb-4">
        <select className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm flex-1" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          <option value="all">All months</option>
          {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm flex-1" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-sm text-[var(--muted)] mb-3">Total: ₹{total.toLocaleString('en-IN')} ({filtered.length} entries)</p>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No expenses match this filter.</p>
      ) : (
        <ListCard>
          {[...filtered].reverse().map((e) => (
            <ListRow
              key={e.id}
              title={`${e.description} — ₹${e.amount.toLocaleString('en-IN')}`}
              subtitle={`Paid to ${e.paidTo} · ${e.date}`}
              meta={`Added by ${e.addedBy}`}
              trailing={
                <>
                  <Badge>{e.category}</Badge>
                  <button onClick={() => { setEditingExpense(e); setMode('edit'); }} className="text-sm text-[var(--accent)] font-medium">Edit</button>
                  <button onClick={() => handleRemove(e.id)} className="text-sm text-[var(--danger)] font-medium">Remove</button>
                </>
              }
            />
          ))}
        </ListCard>
      )}
    </div>
  );
}