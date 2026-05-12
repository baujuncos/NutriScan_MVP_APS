import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import ExportPanel from './ExportPanel';

export default async function DashboardPage() {
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

  // Fetch all users data for investigators
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: allPhysical } = await supabase
    .from('physical_data')
    .select('*');

  const { data: allAcademic } = await supabase
    .from('academic_data')
    .select('*');

  const { data: allSurveys } = await supabase
    .from('psychological_surveys')
    .select('user_id, completed_at');

  const totalUsers = allProfiles?.length ?? 0;
  const uccUsers = allProfiles?.filter((p) => p.role === 'deportista_ucc').length ?? 0;
  const particularUsers = allProfiles?.filter((p) => p.role === 'particular').length ?? 0;
  const completedPhysical = allPhysical?.length ?? 0;
  const completedSurveys = allSurveys?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo NutriScan" className="h-10 w-10" />
            <img src="/tituloNutriScanNEGRO.png" alt="NutriScan" className="h-8" />
            <span className="text-xs text-gray-500 ml-2">Panel de Investigador</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {profile.nombre} {profile.apellido}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Total Usuarios" value={totalUsers} color="blue" />
          <StatCard label="Deportistas UCC" value={uccUsers} color="green" />
          <StatCard label="Particulares" value={particularUsers} color="purple" />
          <StatCard label="Perfil Físico" value={completedPhysical} color="orange" />
          <StatCard label="Encuestas" value={completedSurveys} color="pink" />
        </div>

        {/* Export panel */}
        <ExportPanel
          users={(allProfiles ?? []).map((p) => ({
            user_id: p.user_id,
            nombre: p.nombre,
            apellido: p.apellido,
            email: p.email,
            role: p.role,
          }))}
        />

        {/* Users table */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden mt-6">
          <div className="border-b px-6 py-4">
            <h3 className="font-semibold text-gray-900">Usuarios Registrados</h3>
            <p className="text-sm text-gray-500">{totalUsers} usuarios en total</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Rol</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Perfil Físico</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Académico</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Encuesta</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(allProfiles ?? []).map((p) => {
                  const phys = allPhysical?.find((ph) => ph.user_id === p.user_id);
                  const acad = allAcademic?.find((a) => a.user_id === p.user_id);
                  const surv = allSurveys?.find((s) => s.user_id === p.user_id);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.nombre} {p.apellido}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={p.role} />
                      </td>
                      <td className="px-4 py-3">
                        {phys ? (
                          <span className="text-green-600">
                            ✓ {phys.get_kcal} kcal
                          </span>
                        ) : (
                          <span className="text-gray-400">Pendiente</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {acad ? (
                          <span className="text-green-600">✓ {acad.deporte}</span>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {surv ? (
                          <span className="text-green-600">✓ Completada</span>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(p.created_at).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!allProfiles || allProfiles.length === 0) && (
              <div className="py-8 text-center text-gray-400">No hay usuarios registrados aún.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const badges: Record<string, string> = {
    investigador: 'bg-blue-100 text-blue-700',
    deportista_ucc: 'bg-green-100 text-green-700',
    particular: 'bg-gray-100 text-gray-700',
    administrador: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    investigador: 'Investigador',
    deportista_ucc: 'Deportista UCC',
    particular: 'Particular',
    administrador: 'Admin',
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${badges[role] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[role] ?? role}
    </span>
  );
}

