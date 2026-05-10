import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import LogoutButton from '@/components/auth/LogoutButton';
import Link from 'next/link';
import { type IngestaTipo } from '@/lib/nutrition';
import HidratacionCard from './HidratacionCard';

export const dynamic = 'force-dynamic';

type ItemSnippet = {
  id_item: number;
  kcal: number | string;
  alimentos: { nombre: string } | Array<{ nombre: string }> | null;
};

type IngestaRow = {
  id_ingesta: number;
  tipo: string;
  kcal_total: number | string;
  proteinas_total_g: number | string;
  grasas_total_g: number | string;
  carbs_total_g: number | string;
  items: ItemSnippet[] | null;
};

function toNum(v: number | string | null | undefined): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

function mealLabel(tipo: string): string {
  if (tipo === 'colacion') return 'Colaciones';
  if (tipo === 'suplemento') return 'Suplementos';
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function getAlimentoName(item: ItemSnippet): string | undefined {
  if (Array.isArray(item.alimentos)) return item.alimentos[0]?.nombre;
  return (item.alimentos as { nombre: string } | null)?.nombre;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, role')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/login');
  if (profile.role === 'investigador') redirect('/dashboard');

  const { data: physicalData } = await supabase
    .from('physical_data')
    .select('get_kcal, proteinas_g, carbohidratos_g, grasas_g')
    .eq('user_id', user.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);

  const { data: ingestasData } = await supabase
    .from('ingestas')
    .select(`
      id_ingesta, tipo, kcal_total, proteinas_total_g, grasas_total_g, carbs_total_g,
      items(id_item, kcal, alimentos(nombre))
    `)
    .eq('id_usuario', user.id)
    .eq('fecha', today);

  const { data: hidratacionData } = await supabase
    .from('hidratacion')
    .select('ml_total')
    .eq('id_usuario', user.id)
    .eq('fecha', today)
    .single();

  const mlHoy = hidratacionData?.ml_total ?? 0;

  const ingestas = (ingestasData ?? []) as IngestaRow[];

  const totalKcal = ingestas.reduce((a, i) => a + toNum(i.kcal_total), 0);
  const totalProte = ingestas.reduce((a, i) => a + toNum(i.proteinas_total_g), 0);
  const totalCarbs = ingestas.reduce((a, i) => a + toNum(i.carbs_total_g), 0);
  const totalGrasas = ingestas.reduce((a, i) => a + toNum(i.grasas_total_g), 0);

  const metaKcal = toNum(physicalData?.get_kcal) || 2000;
  const metaProte = toNum(physicalData?.proteinas_g) || 100;
  const metaCarbs = toNum(physicalData?.carbohidratos_g) || 250;
  const metaGrasas = toNum(physicalData?.grasas_g) || 70;

  const pctKcal = Math.min(100, Math.round((totalKcal / metaKcal) * 100));

  const mealStatusList: IngestaTipo[] = ['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion'];
  const completedMeals = new Set(
    ingestas.filter((i) => (i.items?.length ?? 0) > 0).map((i) => i.tipo)
  );
  const loadedCount = mealStatusList.filter((t) => completedMeals.has(t)).length;

  const recentIngestas = ingestas
    .filter((i) => (i.items?.length ?? 0) > 0)
    .slice(0, 3);

  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pctKcal / 100) * circ;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-base">NutriScan</span>
        </div>
        <LogoutButton />
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-5">
        <div>
          <p className="text-base text-gray-600">Hola, {profile.nombre} 🔥</p>
          <h1 className="text-2xl font-bold text-gray-900">Tu día en NutriScan</h1>
        </div>

        {/* Calorie progress card */}
        <div
          className="rounded-2xl text-white p-5"
          style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #1b7a5e 100%)' }}
        >
          <div className="flex items-center gap-5">
            {/* SVG circular progress */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                <circle
                  cx="44" cy="44" r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="8"
                />
                <circle
                  cx="44" cy="44" r={r}
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-xl font-bold leading-none">{pctKcal}%</span>
                <span className="text-xs text-white/60 mt-0.5">META</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/65 uppercase tracking-wider font-semibold">Calorías hoy</p>
              <p className="text-3xl font-bold mt-0.5 leading-tight">
                {Math.round(totalKcal)}{' '}
                <span className="text-base font-normal text-white/55">
                  / {Math.round(metaKcal)} kcal
                </span>
              </p>
              <p className="text-sm text-white/65 mt-1 flex items-center gap-1">
                🔥 Faltan {Math.max(0, Math.round(metaKcal - totalKcal))} kcal
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <MacroBar label="CARBS" current={totalCarbs} target={metaCarbs} color="#f59e0b" unit="g" />
            <MacroBar label="PROTEÍNAS" current={totalProte} target={metaProte} color="#ef4444" unit="g" />
            <MacroBar label="GRASAS" current={totalGrasas} target={metaGrasas} color="#8b5cf6" unit="g" />
          </div>
        </div>

        {/* Meal status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Estado de carga</h2>
            <span className="text-sm text-gray-400">{loadedCount}/5 cargados</span>
          </div>
          <div className="space-y-2">
            {mealStatusList.map((tipo) => {
              const done = completedMeals.has(tipo);
              return (
                <div
                  key={tipo}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    done ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {done ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        </svg>
                      </div>
                    )}
                    <span className={`text-sm font-medium ${done ? 'text-green-800' : 'text-gray-600'}`}>
                      {mealLabel(tipo)}
                    </span>
                  </div>
                  {!done && (
                    <Link
                      href={`/alimentacion?tipo=${tipo}&fecha=${today}`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Cargar
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hydration */}
        <HidratacionCard initialMl={mlHoy} />

        {/* Recent meals */}
        {recentIngestas.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Últimas comidas</h2>
              <Link href="/alimentacion" className="text-sm text-blue-600 font-medium">
                Ver todas ›
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentIngestas.map((ingesta) => {
                const itemNames = (ingesta.items ?? [])
                  .map(getAlimentoName)
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(' + ');
                const kcal = Math.round(toNum(ingesta.kcal_total));
                return (
                  <div key={ingesta.id_ingesta} className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {itemNames || mealLabel(ingesta.tipo)}
                      </p>
                      <p className="text-xs text-gray-400">{mealLabel(ingesta.tipo)}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-bold text-gray-900">{kcal}</p>
                      <p className="text-xs text-gray-400">KCAL</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recentIngestas.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-gray-400 text-sm">Aún no registraste comidas hoy.</p>
            <Link
              href="/alimentacion"
              className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Empezar a registrar →
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function MacroBar({
  label,
  current,
  target,
  color,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60 w-20 flex-shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-white/55 w-[72px] text-right flex-shrink-0">
        {Math.round(current)}/{Math.round(target)}{unit}
      </span>
    </div>
  );
}
