import { getAthleteData } from '@/lib/researcher/athletes';
import DeportistasClient from './DeportistasClient';

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
    unidad_academica: a.unidad_academica,
    carrera: a.carrera,
    anio: a.anio,
  }));

  return <DeportistasClient athletes={rows} />;
}
