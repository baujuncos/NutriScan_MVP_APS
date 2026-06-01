'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';

interface ResearcherShellProps {
  nombre: string;
  apellido: string;
  children: React.ReactNode;
}

/**
 * App chrome for the researcher panel: fixed sidebar on desktop, a mobile
 * top bar + drawer on small screens, and the scrollable content area.
 */
export default function ResearcherShell({ nombre, apellido, children }: ResearcherShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        nombre={nombre}
        apellido={apellido}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <img src="/logo.png" alt="NutriScan" className="h-7 w-7" />
          <span className="text-sm font-semibold text-slate-900">Panel Investigador</span>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
