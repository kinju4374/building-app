'use client';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="p-8">
      <p>Logged in as: {session?.user?.name} ({(session?.user as any)?.role})</p>
      <button onClick={() => signOut({ callbackUrl: '/login' })} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">
        Sign out
      </button>
    </div>
  );
}