import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import LogoutButton from '@/components/auth/LogoutButton';
import EditDataPanel from '@/components/profile/EditDataPanel';
import DeleteAccountAction from '@/components/ui/DeleteAccountAction';
import { calcularEdad } from '@/lib/calculations';
import { todayAR } from '@/lib/date';
import { getInitials } from '@/lib/initials';

export const dynamic = 'force-dynamic';

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
  const today = todayAR();
  const monthStart = today.slice(0, 7) + '-01';
  const [y, m] = today.split('-').map(Number);
  const monthEnd = `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;

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
  const diasDelMes = Number(today.slice(8, 10));
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
            <EditDataPanel
              isAthlete={profile.role === 'deportista_ucc'}
              physicalCompleted={profile.physical_completed}
            />

            {profile.role === 'deportista_ucc' && (
              <div
                className="flex items-center justify-between p-4 rounded-xl border-l-4 opacity-60 cursor-not-allowed"
                style={{ borderColor: '#9ca3af', backgroundColor: '#f9fafb' }}
                aria-disabled="true"
                title="Disponible próximamente"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Repetir valoración psicológica</p>
                    <p className="text-xs text-gray-500 mt-0.5">Disponible próximamente</p>
                  </div>
                </div>
              </div>
            )}
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

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Eliminar cuenta</h2>
          <p className="text-sm text-gray-500 mb-4">
            Esta acción elimina tu cuenta y los datos asociados. Escribí <strong>eliminar</strong> para confirmarlo.
          </p>
          <DeleteAccountAction
            displayName={`${profile.nombre} ${profile.apellido}`}
            userEmail={user.email ?? ''}
          />
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
