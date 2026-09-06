'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Wallet, Receipt, MoreHorizontal } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/maintenance', label: 'Dues', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/more', label: 'More', icon: MoreHorizontal },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around max-w-lg mx-auto">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5">
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} color={isActive ? 'var(--accent)' : 'var(--muted)'} />
              <span className="text-[11px]" style={{ color: isActive ? 'var(--accent)' : 'var(--muted)', fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}