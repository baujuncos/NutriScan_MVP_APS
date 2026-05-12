import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import LogoutButton from '@/components/auth/LogoutButton';
import Link from 'next/link';
import { calcularEdad } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function getRoleLabel(role: string): string {
  if (role === 'deportista_ucc') return 'Deportista UCC';
  if (role === 'particular') return 'Usuario Particular';
  return role;
}

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, apellido, role, physical_completed, academic_completed, psychological_completed')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/login');
  if (profile.role === 'investigador') redirect('/dashboard');

  const { data: physicalData } = await supabase
    .from('physical_data')
    .select('fecha_nacimiento, peso_kg, altura_cm, sexo, factor_actividad, get_kcal')
    .eq('user_id', user.id)
    .single();

  const { data: academicData } = await supabase
    .from('academic_data')
    .select('carrera, anio, deporte, posicion, frecuencia_practicas_semana')
    .eq('user_id', user.id)
    .single();

  // Monthly stats
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const { count: ingestasCount } = await supabase
    .from('ingestas')
    .select('*', { count: 'exact', head: true })
    .eq('id_usuario', user.id)
    .gte('fecha', monthStart)
    .lte('fecha', monthEnd);

  const { count: suplementosCount } = await supabase
    .from('ingestas')
    .select('*', { count: 'exact', head: true })
    .eq('id_usuario', user.id)
    .eq('tipo', 'suplemento')
    .gte('fecha', monthStart)
    .lte('fecha', monthEnd);

  const { data: diasRegistro } = await supabase
    .from('ingestas')
    .select('fecha')
    .eq('id_usuario', user.id)
    .gte('fecha', monthStart)
    .lte('fecha', monthEnd);

  const diasUnicos = new Set((diasRegistro ?? []).map((r: { fecha: string }) => r.fecha)).size;
  const diasDelMes = now.getDate();
  const cumplimiento = diasDelMes > 0 ? Math.round((diasUnicos / diasDelMes) * 100) : 0;

  const edad = physicalData?.fecha_nacimiento ? calcularEdad(physicalData.fecha_nacimiento) : null;
  const initials = getInitials(profile.nombre, profile.apellido);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top bar */}
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo NutriScan" className="w-8 h-8 text-white" />
          <img src="/tituloNutriScanNEGRO.png" alt="NutriScan" className="h-6" />
        </div>
        <LogoutButton />
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* Profile header card */}
        <div
          className="rounded-2xl text-white p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #1e6b4f 100%)' }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-1/2 w-32 h-32 rounded-full bg-white/5" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold">{profile.nombre} {profile.apellido}</h1>
              {academicData ? (
                <p className="text-sm text-white/70 mt-0.5 truncate">
                  {academicData.carrera}
                  {academicData.anio ? ` · Ingreso ${academicData.anio}` : ''}
                </p>
              ) : (
                <p className="text-sm text-white/70 mt-0.5">{getRoleLabel(profile.role)}</p>
              )}
              {academicData?.deporte && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs font-medium">
                  <span>{academicData.deporte}</span>
                  {academicData.posicion && (
                    <>
                      <span className="text-white/50">·</span>
                      <span>{academicData.posicion}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <StatCell
              value={academicData?.frecuencia_practicas_semana ? `${academicData.frecuencia_practicas_semana}x/sem` : '—'}
              label="Frecuencia"
            />
            <StatCell
              value={academicData?.anio ? String(academicData.anio) : '—'}
              label="Ingreso"
            />
            <StatCell
              value={edad !== null ? String(edad) : '—'}
              label="Edad"
            />
          </div>
        </div>

        {/* Información personal */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Información personal
          </h2>

          <div className="space-y-2">
            {profile.role === 'deportista_ucc' && (
              <Link
                href="/encuesta-psicologica"
                className="flex items-center justify-between p-4 rounded-xl border-l-4 transition-colors hover:bg-gray-50"
                style={{ borderColor: '#3b82f6', backgroundColor: '#eff6ff' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.psychological_completed ? 'Repetir Valoración Psicológica' : 'Completar Valoración Psicológica'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Escala Likert · 25 ítems</p>
                  </div>
                </div>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )}

            <Link
              href="/perfil-fisico"
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${profile.physical_completed ? 'bg-green-100' : 'bg-gray-200'}`}>
                  {profile.physical_completed ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Editar datos físicos</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {physicalData
                      ? `${physicalData.peso_kg}kg · ${physicalData.altura_cm}cm · ${Math.round(physicalData.get_kcal ?? 0)} kcal/día`
                      : 'Información básica · 6 ítems'}
                  </p>
                </div>
              </div>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Resumen del mes */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Resumen del mes</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Comidas registradas"
              value={String(ingestasCount ?? 0)}
              subtitle={`${diasUnicos} días este mes`}
              subtitleColor="text-green-600"
            />
            <StatCard
              title="Suplementos"
              value={String(suplementosCount ?? 0)}
              subtitle="registros"
            />
            <StatCard
              title="Días con registro"
              value={String(diasUnicos)}
              subtitle={`de ${diasDelMes} días`}
            />
            <StatCard
              title="Cumplimiento"
              value={`${cumplimiento}%`}
              subtitle={cumplimiento >= 80 ? 'Excelente' : cumplimiento >= 50 ? 'Regular' : 'Mejorar'}
              subtitleColor={cumplimiento >= 80 ? 'text-green-600' : cumplimiento >= 50 ? 'text-amber-600' : 'text-red-500'}
            />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center py-4 px-2">
      <div className="flex items-center gap-1 mb-1">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  subtitleColor = 'text-gray-400',
}: {
  title: string;
  value: string;
  subtitle: string;
  subtitleColor?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-500 leading-tight">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className={`text-xs mt-0.5 font-medium ${subtitleColor}`}>{subtitle}</p>
    </div>
  );
}
