/**
 * Athlete-only data layer for the researcher panel.
 *
 * CRITICAL: every researcher-facing query MUST start from this module.
 * Researchers may NEVER see `particular` (private) users — only athletes
 * (`role === 'deportista_ucc'`). Centralizing the role filter here ensures
 * the restriction can't be forgotten in an individual page or widget.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile } from '@/types';
import {
  athleteWeeklyCompliance,
  getWeekWindow,
  type MealRecord,
  type WeekWindow,
} from './compliance';

/** The role that counts as an "athlete" everywhere in the researcher panel. */
export const ATHLETE_ROLE = 'deportista_ucc' as const;

export type Sexo = 'M' | 'F';
export type Deporte = 'hockey' | 'basquet';

export interface AthleteRecord {
  user_id: string;
  nombre: string;
  apellido: string;
  email: string;
  created_at: string;
  sexo: Sexo | null;
  deporte: Deporte | null;
  posicion: string | null;
  get_kcal: number | null;
  /** Weekly compliance %, 0–100. */
  compliance: number;
}

export interface AthleteData {
  athletes: AthleteRecord[];
  week: WeekWindow;
}

/**
 * Resolve the logged-in researcher, or redirect away.
 * Only `investigador` / `administrador` may stay; anyone else → /home.
 */
export async function getAuthenticatedResearcher(): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/login');
  if (profile.role !== 'investigador' && profile.role !== 'administrador') {
    redirect('/home');
  }

  return profile as Profile;
}

/**
 * Fetch every athlete with their sport/sex/profile data and weekly
 * compliance. This is the data source for the dashboard and the
 * athletes table — both read exclusively athlete users.
 */
export async function getAthleteData(now: Date): Promise<AthleteData> {
  const supabase = await createClient();
  const week = getWeekWindow(now);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, nombre, apellido, email, created_at')
    .eq('role', ATHLETE_ROLE)
    .order('created_at', { ascending: false });

  const athleteProfiles = profiles ?? [];
  const ids = athleteProfiles.map((p) => p.user_id);

  if (ids.length === 0) {
    return { athletes: [], week };
  }

  const [physRes, acadRes, ingeRes] = await Promise.all([
    supabase.from('physical_data').select('user_id, sexo, get_kcal').in('user_id', ids),
    supabase.from('academic_data').select('user_id, deporte, posicion').in('user_id', ids),
    supabase
      .from('ingestas')
      .select('id_usuario, tipo, fecha')
      .in('id_usuario', ids)
      .gte('fecha', week.monday)
      .lte('fecha', week.today),
  ]);

  const physMap = new Map(
    (physRes.data ?? []).map((p) => [p.user_id, p as { user_id: string; sexo: Sexo | null; get_kcal: number | null }]),
  );
  const acadMap = new Map(
    (acadRes.data ?? []).map((a) => [
      a.user_id,
      a as { user_id: string; deporte: Deporte | null; posicion: string | null },
    ]),
  );

  const mealsByUser = new Map<string, MealRecord[]>();
  for (const ing of ingeRes.data ?? []) {
    const row = ing as { id_usuario: string; tipo: string; fecha: string };
    if (!mealsByUser.has(row.id_usuario)) mealsByUser.set(row.id_usuario, []);
    mealsByUser.get(row.id_usuario)!.push({ tipo: row.tipo, fecha: row.fecha });
  }

  const athletes: AthleteRecord[] = athleteProfiles.map((p) => {
    const phys = physMap.get(p.user_id);
    const acad = acadMap.get(p.user_id);
    return {
      user_id: p.user_id,
      nombre: p.nombre,
      apellido: p.apellido,
      email: p.email,
      created_at: p.created_at,
      sexo: phys?.sexo ?? null,
      deporte: acad?.deporte ?? null,
      posicion: acad?.posicion ?? null,
      get_kcal: phys?.get_kcal ?? null,
      compliance: athleteWeeklyCompliance(mealsByUser.get(p.user_id) ?? [], week),
    };
  });

  return { athletes, week };
}
