'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UserCircle, UtensilsCrossed } from 'lucide-react';

const ITEMS = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/comidas', label: 'Comidas', icon: UtensilsCrossed },
  { href: '/perfil', label: 'Perfil', icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium ${
                active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
