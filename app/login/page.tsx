'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', { username, password, redirect: false });

    setLoading(false);

    if (result?.error) {
      setError('Invalid username or password');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-4">Building App Login</h1>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <label className="block text-sm mb-1">Username</label>
        <input className="w-full border rounded px-3 py-2 mb-3" value={username}
          onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        <label className="block text-sm mb-1">Password</label>
        <input type="password" className="w-full border rounded px-3 py-2 mb-4" value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        <button type="submit" disabled={loading} className="w-full bg-black text-white rounded py-2 disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}