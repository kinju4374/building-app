'use client';
import { useEffect, useState } from 'react';
import MemberForm, { MemberFormData } from '@/components/MemberForm';

type Member = MemberFormData & { id: string; joinDate: string; status: string };

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  async function loadMembers() {
    setLoading(true);
    const res = await fetch('/api/members');
    const data = await res.json();
    if (data.success) setMembers(data.members);
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleAdd(data: MemberFormData) {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add');
    setMode('list');
    await loadMembers();
  }

  async function handleEdit(data: MemberFormData) {
    if (!editingMember) return;
    const res = await fetch(`/api/members/${editingMember.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update');
    setMode('list');
    setEditingMember(null);
    await loadMembers();
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this member? They will be marked inactive, not deleted.')) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    await loadMembers();
  }

  if (loading) return <p className="p-8">Loading members...</p>;

  if (mode === 'add') {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold mb-4">Add member</h1>
        <MemberForm onSubmit={handleAdd} onCancel={() => setMode('list')} submitLabel="Add member" />
      </div>
    );
  }

  if (mode === 'edit' && editingMember) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold mb-4">Edit member</h1>
        <MemberForm
          initialData={editingMember}
          onSubmit={handleEdit}
          onCancel={() => { setMode('list'); setEditingMember(null); }}
          submitLabel="Save changes"
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Members</h1>
        <button onClick={() => setMode('add')} className="bg-black text-white px-4 py-2 rounded">
          + Add member
        </button>
      </div>

      <div className="space-y-3">
        {members.length === 0 && <p className="text-gray-500">No members yet.</p>}
        {members.map((m) => (
          <div key={m.id} className="bg-white p-4 rounded shadow flex justify-between items-start">
            <div>
              <p className="font-medium">{m.name} — Flat {m.flatNumber}</p>
              <p className="text-sm text-gray-600">{m.phone} · {m.email}</p>
              {m.familyMembers.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Family: {m.familyMembers.map((f) => `${f.name} (${f.relation})`).join(', ')}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingMember(m); setMode('edit'); }} className="text-sm text-blue-600">Edit</button>
              <button onClick={() => handleRemove(m.id)} className="text-sm text-red-600">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}