'use client';
import { useState } from 'react';

export type FamilyMember = { name: string; relation: string };

export type MemberFormData = {
  name: string;
  flatNumber: string;
  phone: string;
  email: string;
  familyMembers: FamilyMember[];
};

export default function MemberForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: {
  initialData?: MemberFormData;
  onSubmit: (data: MemberFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [flatNumber, setFlatNumber] = useState(initialData?.flatNumber || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(initialData?.familyMembers || []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function addFamilyMember() {
    setFamilyMembers([...familyMembers, { name: '', relation: '' }]);
  }

  function updateFamilyMember(index: number, field: keyof FamilyMember, value: string) {
    const updated = [...familyMembers];
    updated[index][field] = value;
    setFamilyMembers(updated);
  }

  function removeFamilyMember(index: number) {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !flatNumber.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        flatNumber: flatNumber.trim(),
        phone: phone.trim(),
        email: email.trim(),
        familyMembers: familyMembers.filter((f) => f.name.trim() && f.relation.trim()),
      });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-lg">
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <label className="block text-sm mb-1">Name *</label>
      <input className="w-full border rounded px-3 py-2 mb-3" value={name} onChange={(e) => setName(e.target.value)} required />

      <label className="block text-sm mb-1">Flat number *</label>
      <input className="w-full border rounded px-3 py-2 mb-3" value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} required />

      <label className="block text-sm mb-1">Phone *</label>
      <input className="w-full border rounded px-3 py-2 mb-3" value={phone} onChange={(e) => setPhone(e.target.value)} required />

      <label className="block text-sm mb-1">Email *</label>
      <input type="email" className="w-full border rounded px-3 py-2 mb-4" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Family members</label>
          <button type="button" onClick={addFamilyMember} className="text-sm text-blue-600">+ Add</button>
        </div>
        {familyMembers.map((fm, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              placeholder="Name"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={fm.name}
              onChange={(e) => updateFamilyMember(i, 'name', e.target.value)}
            />
            <input
              placeholder="Relation (e.g. Spouse)"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={fm.relation}
              onChange={(e) => updateFamilyMember(i, 'relation', e.target.value)}
            />
            <button type="button" onClick={() => removeFamilyMember(i)} className="text-red-600 text-sm px-2">✕</button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">
          Cancel
        </button>
      </div>
    </form>
  );
}