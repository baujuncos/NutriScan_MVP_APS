'use client';

import { useState, useEffect, useRef } from 'react';
import { generateExcelAction } from './actions';

type UserRow = {
  user_id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
};

const ROLE_LABELS: Record<string, string> = {
  investigador: 'Investigador',
  deportista_ucc: 'Deportista UCC',
  particular: 'Particular',
  administrador: 'Admin',
};

const ROLE_COLORS: Record<string, string> = {
  investigador: 'bg-blue-100 text-blue-700',
  deportista_ucc: 'bg-green-100 text-green-700',
  particular: 'bg-gray-100 text-gray-700',
  administrador: 'bg-red-100 text-red-700',
};

export default function ExportPanel({ users }: { users: UserRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allSelected = users.length > 0 && selected.size === users.length;
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(users.map((u) => u.user_id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleExport() {
    if (selected.size === 0 || loading) return;
    setLoading(true);
    try {
      const result = await generateExcelAction([...selected]);
      if ('error' in result) {
        alert(`Error: ${result.error}`);
        return;
      }
      const binary = atob(result.xlsx);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutriscan_informe_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Hubo un error al generar el informe. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden mt-6">
      <div className="border-b px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Exportar Informe CSV</h3>
          <p className="text-sm text-gray-500">
            {selected.size === 0
              ? 'Seleccioná los usuarios a incluir en el informe'
              : `${selected.size} usuario${selected.size !== 1 ? 's' : ''} seleccionado${selected.size !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={selected.size === 0 || loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Excel
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr
                key={u.user_id}
                onClick={() => toggle(u.user_id)}
                className={`cursor-pointer transition-colors ${
                  selected.has(u.user_id) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(u.user_id)}
                    onChange={() => toggle(u.user_id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {u.nombre} {u.apellido}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-8 text-center text-gray-400">No hay usuarios registrados aún.</div>
        )}
      </div>
    </div>
  );
}
