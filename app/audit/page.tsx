'use client';
import { useEffect, useMemo, useState } from 'react';
import ListCard from '@/components/ListCard';
import ListRow from '@/components/ListRow';

type MaintRecord = { id: string; memberId: string; month: number; year: number; amount: number };
type Expense = { id: string; date: string; category: string; amount: number };
type AuditEntry = { id: string; timestamp: string; user: string; role: string; action: string; details: string };

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function exportCsv(logs: AuditEntry[]) {
  const header = ['Timestamp', 'User', 'Role', 'Action', 'Details'];
  const rows = logs.map((l) => [l.timestamp, l.user, l.role, l.action, l.details]);
  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const [maintenance, setMaintenance] = useState<MaintRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [m, e, a] = await Promise.all([
        fetch('/api/maintenance').then((r) => r.json()),
        fetch('/api/expenses').then((r) => r.json()),
        fetch('/api/audit').then((r) => r.json()),
      ]);
      if (m.success) setMaintenance(m.records);
      if (e.success) setExpenses(e.expenses);
      if (a.success) setLogs(a.logs);
      setLoading(false);
    }
    load();
  }, []);

  const monthlyMaintenance = useMemo(
    () => maintenance.filter((r) => r.month === month && r.year === year),
    [maintenance, month, year]
  );
  const monthlyExpenses = useMemo(
    () => expenses.filter((e) => {
      const [y, m] = e.date.split('-').map(Number);
      return y === year && m === month;
    }),
    [expenses, month, year]
  );

  const totalCollected = monthlyMaintenance.reduce((sum, r) => sum + r.amount, 0);
  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const net = totalCollected - totalSpent;

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthlyExpenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthlyExpenses]);

  const recentLogs = useMemo(() => [...logs].reverse().slice(0, 50), [logs]);

  if (loading) return <p className="p-5 text-sm text-[var(--muted)]">Loading audit report...</p>;

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Audit report</h1>

      <div className="flex gap-2 mb-5">
        <select className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm flex-1" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTH_NAMES.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
        </select>
        <input type="number" className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
          <p className="text-xs text-[var(--muted)] mb-1">Collected</p>
          <p className="text-base font-semibold text-[var(--success)]">₹{totalCollected.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
          <p className="text-xs text-[var(--muted)] mb-1">Spent</p>
          <p className="text-base font-semibold text-[var(--danger)]">₹{totalSpent.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
          <p className="text-xs text-[var(--muted)] mb-1">Net</p>
          <p className={`text-base font-semibold ${net >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>₹{net.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {expenseByCategory.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-[var(--muted)] mb-2">Expenses by category</h2>
          <ListCard>
            {expenseByCategory.map(([category, amount]) => (
              <ListRow key={category} title={category} trailing={<span className="text-sm font-medium">₹{amount.toLocaleString('en-IN')}</span>} />
            ))}
          </ListCard>
        </>
      )}

      <div className="flex justify-between items-center mt-6 mb-2">
        <h2 className="text-sm font-medium text-[var(--muted)]">Recent activity</h2>
        <button onClick={() => exportCsv(logs)} className="text-sm text-[var(--accent)] font-medium">Export CSV</button>
      </div>

      {recentLogs.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No activity recorded yet.</p>
      ) : (
        <ListCard>
          {recentLogs.map((log) => (
            <ListRow
              key={log.id}
              title={log.action}
              subtitle={log.details}
              meta={`${log.user} (${log.role}) · ${new Date(log.timestamp).toLocaleString('en-IN')}`}
            />
          ))}
        </ListCard>
      )}
    </div>
  );
}