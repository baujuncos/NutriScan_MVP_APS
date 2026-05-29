import { getAthleteData } from '@/lib/researcher/athletes';
import AthletesTable from '@/components/researcher/AthletesTable';
import ExportPanel from './ExportPanel';

export const dynamic = 'force-dynamic';

export default async function DeportistasPage() {
  const { athletes } = await getAthleteData(new Date());

  const rows = athletes.map((a) => ({
    user_id: a.user_id,
    nombre: a.nombre,
    apellido: a.apellido,
    email: a.email,
    created_at: a.created_at,
    sexo: a.sexo,
    deporte: a.deporte,
    compliance: a.compliance,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Deportistas</h1>
          <p className="mt-1 text-sm text-slate-500">Cohorte de deportistas UCC registrados</p>
        </div>
        <ExportPanel athletes={rows.map((r) => ({ user_id: r.user_id, nombre: r.nombre, apellido: r.apellido }))} />
      </header>

      <AthletesTable athletes={rows} />
    </div>
  );
}
