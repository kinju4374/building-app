'use client';
import { useEffect, useState } from 'react';

type Member = { id: string; name: string; flatNumber: string };
type MaintRecord = { id: string; memberId: string; month: number; year: number; amount: number; paidDate: string; emailSentAt: string };

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MaintenancePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<MaintRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [memberId, setMemberId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [membersRes, recordsRes] = await Promise.all([
      fetch('/api/members').then((r) => r.json()),
      fetch('/api/maintenance').then((r) => r.json()),
    ]);
    if (membersRes.success) setMembers(membersRes.members);
    if (recordsRes.success) setRecords(recordsRes.records);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('');

    if (!memberId || !amount) {
      setError('Please select a member and enter an amount');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, month: Number(month), year: Number(year), amount: Number(amount), paidDate }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      return;
    }

    setStatus(data.emailSent ? 'Recorded and receipt emailed successfully.' : "Recorded, but the email failed to send — check the member's email address.");
    setAmount('');
    await loadData();
  }

  function memberLabel(id: string) {
    const m = members.find((m) => m.id === id);
    return m ? `${m.name} (Flat ${m.flatNumber})` : 'Unknown member';
  }

  if (loading) return <p className="p-8">Loading...</p>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Maintenance</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {status && <p className="text-green-700 text-sm mb-3">{status}</p>}

        <label className="block text-sm mb-1">Member *</label>
        <select className="w-full border rounded px-3 py-2 mb-3" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
          <option value="">Select a member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name} (Flat {m.flatNumber})</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm mb-1">Month *</label>
            <select className="w-full border rounded px-3 py-2" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Year *</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
          </div>
        </div>

        <label className="block text-sm mb-1">Amount (₹) *</label>
        <input type="number" min="1" step="1" className="w-full border rounded px-3 py-2 mb-3" value={amount} onChange={(e) => setAmount(e.target.value)} required />

        <label className="block text-sm mb-1">Date received *</label>
        <input type="date" className="w-full border rounded px-3 py-2 mb-4" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} required />

        <button type="submit" disabled={saving} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {saving ? 'Recording...' : 'Record & send receipt'}
        </button>
      </form>

      <h2 className="font-medium mb-2">Recent records</h2>
      <div className="space-y-2">
        {records.length === 0 && <p className="text-gray-500">No records yet.</p>}
        {[...records].reverse().map((r) => (
          <div key={r.id} className="bg-white p-3 rounded shadow text-sm flex justify-between">
            <span>{memberLabel(r.memberId)} — {MONTH_NAMES[r.month - 1]} {r.year} — ₹{r.amount}</span>
            <span className={r.emailSentAt ? 'text-green-700' : 'text-red-600'}>
              {r.emailSentAt ? 'Emailed' : 'Not emailed'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}