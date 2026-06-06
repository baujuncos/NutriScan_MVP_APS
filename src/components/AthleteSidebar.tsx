'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from '@/components/researcher/Avatar';
import LogoutButton from '@/components/auth/LogoutButton';

function HomeIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />
    </svg>
  );
}

function UtensilsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v0" />
      <path d="M21 15v7" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

const NAV = [
  { href: '/home', label: 'Inicio', Icon: HomeIcon },
  { href: '/alimentacion', label: 'Comidas', Icon: UtensilsIcon },
  { href: '/perfil', label: 'Perfil', Icon: ProfileIcon },
] as const;

interface Props {
  nombre: string;
  apellido: string;
  roleLabel?: string;
}

function SidebarContent({ nombre, apellido, roleLabel }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <img src="/logo.png" alt="NutriScan" className="h-10 w-10 shrink-0" />
        <div className="min-w-0">
          <img src="/tituloNutriScanNEGRO.png" alt="NutriScan" className="h-5" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            pathname === href ||
            (href === '/alimentacion' && pathname.startsWith('/alimentacion'));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className={active ? 'text-white' : 'text-slate-400'}>
                <Icon />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer — identical to researcher sidebar */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar nombre={nombre} apellido={apellido} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {nombre} {apellido}
            </p>
            <p className="truncate text-xs text-slate-400">{roleLabel ?? 'Usuario'}</p>
          </div>
        </div>
        <div className="mt-1 px-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

export default function AthleteSidebar({ nombre, apellido, roleLabel }: Props) {
  return (
    <div className="hidden lg:block">
      <aside
        className="flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white z-40"
        style={{ boxShadow: '2px 0 8px rgba(15,23,42,0.05)' }}
      >
        <SidebarContent nombre={nombre} apellido={apellido} roleLabel={roleLabel} />
      </aside>
    </div>
  );
}
