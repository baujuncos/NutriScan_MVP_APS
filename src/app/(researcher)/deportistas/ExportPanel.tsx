'use client';

import { useState } from 'react';
import { generateExcelAction } from './actions';

type AthleteOption = {
  user_id: string;
  nombre: string;
  apellido: string;
};

/**
 * Compact export control: lets a researcher download the full ExcelJS report
 * for all athletes (or none selected → all). Only athlete data is ever
 * exported — the server action re-filters by role as a safeguard.
 */
export default function ExportPanel({ athletes }: { athletes: AthleteOption[] }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (athletes.length === 0 || loading) return;
    setLoading(true);
    try {
      const result = await generateExcelAction(athletes.map((a) => a.user_id));
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
      a.download = `nutriscan_deportistas_${new Date()
        .toLocaleDateString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '-')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Hubo un error al generar el informe. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={athletes.length === 0 || loading}
      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Generando...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar informe
        </>
      )}
    </button>
  );
}
