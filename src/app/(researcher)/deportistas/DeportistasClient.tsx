'use client';

import { useState } from 'react';
import AthletesTable, { type AthleteRow } from '@/components/researcher/AthletesTable';
import ExportPanel from './ExportPanel';
import AthleteDetailModal from '@/components/researcher/AthleteDetailModal';

interface Props {
  athletes: AthleteRow[];
}

export default function DeportistasClient({ athletes }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalAthlete, setModalAthlete] = useState<AthleteRow | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Deportistas
          </h1>
          <p className="mt-1 text-sm text-slate-500">Cohorte de deportistas UCC registrados</p>
        </div>
        <ExportPanel selectedIds={selectedIds} />
      </header>

      <AthletesTable
        athletes={athletes}
        onSelectionChange={setSelectedIds}
        onRowClick={setModalAthlete}
      />

      <AthleteDetailModal
        athlete={modalAthlete}
        onClose={() => setModalAthlete(null)}
      />
    </div>
  );
}
