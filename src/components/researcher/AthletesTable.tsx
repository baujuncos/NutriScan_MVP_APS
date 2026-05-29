'use client';

import { useMemo, useState } from 'react';
import Avatar from './Avatar';

export interface AthleteRow {
  user_id: string;
  nombre: string;
  apellido: string;
  email: string;
  created_at: string;
  sexo: 'M' | 'F' | null;
  deporte: 'hockey' | 'basquet' | null;
  compliance: number;
}

const DEPORTE_BADGE: Record<string, string> = {
  basquet: 'bg-blue-50 text-blue-700',
  hockey: 'bg-emerald-50 text-emerald-700',
};
const DEPORTE_LABELS: Record<string, string> = {
  basquet: 'Básquet',
  hockey: 'Hockey',
};
const SEXO_LABELS: Record<string, string> = { F: 'Femenino', M: 'Masculino' };

function complianceTone(pct: number): string {
  if (pct >= 80) return 'bg-emerald-50 text-emerald-700';
  if (pct >= 50) return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
}

export default function AthletesTable({ athletes }: { athletes: AthleteRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter((a) =>
      `${a.nombre} ${a.apellido} ${a.email}`.toLowerCase().includes(q),
    );
  }, [athletes, query]);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Deportistas</h2>
          <p className="text-sm text-slate-400">
            {athletes.length} deportista{athletes.length !== 1 ? 's' : ''} registrado
            {athletes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative sm:w-64">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar deportista..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Deportista</th>
              <th className="px-5 py-3 font-medium">Deporte</th>
              <th className="px-5 py-3 font-medium">Sexo</th>
              <th className="px-5 py-3 font-medium">Registro</th>
              <th className="px-5 py-3 text-right font-medium">Cumplimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((a) => (
              <tr key={a.user_id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar nombre={a.nombre} apellido={a.apellido} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {a.nombre} {a.apellido}
                      </p>
                      <p className="truncate text-xs text-slate-400">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {a.deporte ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        DEPORTE_BADGE[a.deporte] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {DEPORTE_LABELS[a.deporte] ?? a.deporte}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {a.sexo ? SEXO_LABELS[a.sexo] : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {new Date(a.created_at).toLocaleDateString('es-AR')}
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${complianceTone(a.compliance)}`}
                  >
                    {a.compliance}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            {athletes.length === 0
              ? 'No hay deportistas registrados aún.'
              : 'No se encontraron deportistas con esa búsqueda.'}
          </div>
        )}
      </div>
    </div>
  );
}
