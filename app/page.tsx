'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="p-8">
      <p>Logged in as: {session?.user?.name} ({(session?.user as any)?.role})</p>
      <button onClick={() => signOut({ callbackUrl: '/login' })} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">
        Sign out
      </button>
      <div className="mt-4">
        <Link href="/members" className="text-blue-600 underline">Manage members</Link>
      </div>
      <div className="mt-4">
        <Link href="/maintenance" className="text-blue-600 underline">Maintenance</Link>
      </div>
      
    </div>
  );
}