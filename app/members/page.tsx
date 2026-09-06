'use client';
import { useEffect, useState } from 'react';
import MemberForm, { MemberFormData } from '@/components/MemberForm';
import ListCard from '@/components/ListCard';
import ListRow from '@/components/ListRow';

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

  useEffect(() => { loadMembers(); }, []);

  async function handleAdd(data: MemberFormData) {
    const res = await fetch('/api/members', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add');
    setMode('list');
    await loadMembers();
  }

  async function handleEdit(data: MemberFormData) {
    if (!editingMember) return;
    const res = await fetch(`/api/members/${editingMember.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
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

  if (loading) return <p className="p-5 text-sm text-[var(--muted)]">Loading members...</p>;

  if (mode === 'add') {
    return (
      <div className="p-5 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold mb-4">Add member</h1>
        <MemberForm onSubmit={handleAdd} onCancel={() => setMode('list')} submitLabel="Add member" />
      </div>
    );
  }

  if (mode === 'edit' && editingMember) {
    return (
      <div className="p-5 max-w-lg mx-auto">
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
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Members</h1>
        <button onClick={() => setMode('add')} className="bg-[var(--primary)] text-white text-sm px-3.5 py-2 rounded-lg">+ Add</button>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No members yet. Add your first one above.</p>
      ) : (
        <ListCard>
          {members.map((m) => (
            <ListRow
              key={m.id}
              title={`${m.name} — Flat ${m.flatNumber}`}
              subtitle={`${m.phone} · ${m.email}`}
              meta={m.familyMembers.length > 0 ? `Family: ${m.familyMembers.map((f) => `${f.name} (${f.relation})`).join(', ')}` : undefined}
              trailing={
                <>
                  <button onClick={() => { setEditingMember(m); setMode('edit'); }} className="text-sm text-[var(--accent)] font-medium">Edit</button>
                  <button onClick={() => handleRemove(m.id)} className="text-sm text-[var(--danger)] font-medium">Remove</button>
                </>
              }
            />
          ))}
        </ListCard>
      )}
    </div>
  );
}