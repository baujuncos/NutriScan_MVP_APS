import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';

export default async function HomePage() {
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

  // Investigators go to dashboard
  if (profile.role === 'investigador') redirect('/dashboard');

  const { data: physicalData } = await supabase
    .from('physical_data')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const getRoleLabel = (role: string) => {
    if (role === 'deportista_ucc') return 'Deportista UCC';
    if (role === 'particular') return 'Usuario Particular';
    return role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
              <span className="text-lg">🥗</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">NutriScan</h1>
              <p className="text-xs text-gray-500">{getRoleLabel(profile.role)}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Welcome card */}
        <div className="mb-6 rounded-2xl bg-green-600 p-6 text-white">
          <h2 className="text-2xl font-bold">
            ¡Hola, {profile.nombre}! 👋
          </h2>
          <p className="mt-1 opacity-90">Tu plan nutricional para hoy</p>
        </div>

        {physicalData ? (
          <>
            {/* Nutritional summary */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <NutriCard label="Meta Calórica" value={`${physicalData.get_kcal}`} unit="kcal" color="green" />
              <NutriCard label="Proteínas" value={`${physicalData.proteinas_g}`} unit="g" color="blue" />
              <NutriCard label="Carbohidratos" value={`${physicalData.carbohidratos_g}`} unit="g" color="yellow" />
              <NutriCard label="Grasas" value={`${physicalData.grasas_g}`} unit="g" color="orange" />
            </div>

            {/* Macro distribution */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Distribución de Macronutrientes</h3>
              <MacroBar label="Proteínas (15%)" value={physicalData.proteinas_g * 4} total={physicalData.get_kcal} color="bg-blue-500" />
              <MacroBar label="Carbohidratos (55%)" value={physicalData.carbohidratos_g * 4} total={physicalData.get_kcal} color="bg-yellow-400" />
              <MacroBar label="Grasas (30%)" value={physicalData.grasas_g * 9} total={physicalData.get_kcal} color="bg-orange-400" />
            </div>

            {/* Physical data summary */}
            <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Tu Perfil Físico</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoItem label="Peso" value={`${physicalData.peso_kg} kg`} />
                <InfoItem label="Altura" value={`${physicalData.altura_cm} cm`} />
                <InfoItem label="Sexo" value={physicalData.sexo === 'M' ? 'Masculino' : 'Femenino'} />
                <InfoItem label="TMB" value={`${physicalData.tmb} kcal`} />
                <InfoItem label="GET" value={`${physicalData.get_kcal} kcal`} />
                <InfoItem
                  label="Actividad"
                  value={getActividadLabel(physicalData.factor_actividad)}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm text-center text-gray-500">
            No se encontraron datos físicos.
          </div>
        )}
      </main>
    </div>
  );
}

function NutriCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
  };
  const textMap: Record<string, string> = {
    green: 'text-green-700',
    blue: 'text-blue-700',
    yellow: 'text-yellow-700',
    orange: 'text-orange-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${textMap[color]}`}>{value}</p>
      <p className="text-xs text-gray-400">{unit}</p>
    </div>
  );
}

function MacroBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = Math.round((value / total) * 100);
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{pct}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-100">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function getActividadLabel(factor: number): string {
  if (factor === 1.2) return 'Sedentario';
  if (factor === 1.375) return 'Ligero';
  if (factor === 1.55) return 'Moderado';
  if (factor === 1.725) return 'Intenso';
  return String(factor);
}

