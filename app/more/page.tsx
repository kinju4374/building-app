'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { ClipboardList, LogOut, ChevronRight } from 'lucide-react';

export default function MorePage() {
  const { data: session } = useSession();

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-1">More</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        Signed in as {session?.user?.name} · {(session?.user as any)?.role}
      </p>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden mb-6">
        <Link href="/audit" className="flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-3 text-sm">
            <ClipboardList size={18} color="var(--muted)" />
            Audit report
          </span>
          <ChevronRight size={16} color="var(--muted)" />
        </Link>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-2 text-sm text-[var(--danger)] px-4 py-3 w-full bg-[var(--surface)] rounded-xl border border-[var(--border)]"
      >
        <LogOut size={18} />
        Sign out
      </button>
    </div>
  );
}