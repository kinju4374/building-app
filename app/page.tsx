'use client';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

  return (
    <div className="p-5 max-w-lg mx-auto">
      <p className="text-sm text-[var(--muted)] mb-1">Welcome back</p>
      <h1 className="text-2xl font-semibold mb-6">{session?.user?.name}</h1>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-4 py-3.5 inline-flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
        <span className="text-sm">{roleLabel}</span>
      </div>

      <p className="text-sm text-[var(--muted)] mt-8">
        Use the tabs below to manage members, record maintenance, and track expenses.
      </p>
    </div>
  );
}