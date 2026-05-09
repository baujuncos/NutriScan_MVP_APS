import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { INGESTA_TIPOS, formatIngestaLabel, type IngestaTipo, isValidDateInput } from '@/lib/nutrition';
import AlimentacionClient from './AlimentacionClient';

export const dynamic = 'force-dynamic';

type AlimentoOption = {
  id_alimento: number;
  nombre: string;
  categoria: string | null;
};

type ItemRow = {
  id_item: number;
  id_alimento: number;
  tipo_item: string;
  cantidad: number | string;
  kcal: number | string;
  proteinas_g: number | string;
  grasas_g: number | string;
  carbs_g: number | string;
  alimentos: { nombre: string; categoria: string | null } | Array<{ nombre: string; categoria: string | null }> | null;
};

type IngestaRow = {
  id_ingesta: number;
  tipo: IngestaTipo;
  fecha: string;
  kcal_total: number | string;
  proteinas_total_g: number | string;
  grasas_total_g: number | string;
  carbs_total_g: number | string;
  items: ItemRow[] | null;
};

function toNum(v: number | string | null | undefined): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

const MEAL_GRADIENT: Record<IngestaTipo, string> = {
  desayuno: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
  almuerzo: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
  merienda: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  cena: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
  colacion: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
  suplemento: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
};

const MEAL_COLOR: Record<IngestaTipo, string> = {
  desayuno: '#f97316',
  almuerzo: '#16a34a',
  merienda: '#d97706',
  cena: '#4f46e5',
  colacion: '#db2777',
  suplemento: '#7c3aed',
};

const MEAL_ICON: Record<IngestaTipo, string> = {
  desayuno: '☀️',
  almuerzo: '🍽️',
  merienda: '🍪',
  cena: '🌙',
  colacion: '🍎',
  suplemento: '💊',
};

export default async function AlimentacionPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; tipo?: string }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const fecha = params.fecha && isValidDateInput(params.fecha) ? params.fecha : today;
  const selectedTipo = (
    params.tipo && INGESTA_TIPOS.includes(params.tipo as IngestaTipo)
      ? params.tipo
      : 'desayuno'
  ) as IngestaTipo;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, role')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/login');
  if (profile.role === 'investigador' || profile.role === 'administrador') redirect('/dashboard');

  const { data: ingestasData } = await supabase
    .from('ingestas')
    .select(`
      id_ingesta, tipo, fecha,
      kcal_total, proteinas_total_g, grasas_total_g, carbs_total_g,
      items(id_item, id_alimento, tipo_item, cantidad, kcal, proteinas_g, grasas_g, carbs_g,
        alimentos(nombre, categoria))
    `)
    .eq('id_usuario', user.id)
    .eq('fecha', fecha);

  const { data: alimentosData } = await supabase
    .from('alimentos')
    .select('id_alimento, nombre, categoria')
    .order('nombre', { ascending: true })
    .limit(1000);

  const ingestas = (ingestasData ?? []) as IngestaRow[];
  const alimentos = (alimentosData ?? []) as AlimentoOption[];

  const ingestaByTipo = new Map<IngestaTipo, IngestaRow>();
  ingestas.forEach((i) => ingestaByTipo.set(i.tipo, i));

  const totalKcal = ingestas.reduce((a, i) => a + toNum(i.kcal_total), 0);

  const selectedIngesta = ingestaByTipo.get(selectedTipo) ?? null;
  const selectedKcal = toNum(selectedIngesta?.kcal_total);
  const selectedItems = selectedIngesta?.items?.length ?? 0;

  const gradient = MEAL_GRADIENT[selectedTipo];
  const accentColor = MEAL_COLOR[selectedTipo];
  const icon = MEAL_ICON[selectedTipo];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top bar */}
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

      {/* Meal banner */}
      <div className="mx-4 mt-4 rounded-2xl text-white p-5" style={{ background: gradient }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Registro de comidas</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>{icon}</span>
              <span>{formatIngestaLabel(selectedTipo)}</span>
            </h2>
            <p className="text-sm text-white/70 mt-0.5">
              {selectedItems === 0 ? 'Sin registros aún' : `${selectedItems} ítem${selectedItems !== 1 ? 's' : ''} cargado${selectedItems !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
          >
            🔥 {Math.round(selectedKcal)} kcal
          </div>
        </div>

        {/* Daily total sub-line */}
        {totalKcal > 0 && (
          <p className="text-xs text-white/60 mt-2">
            Total del día: {Math.round(totalKcal)} kcal
          </p>
        )}
      </div>

      {/* Meal type tabs */}
      <div className="overflow-x-auto px-4 py-3">
        <div className="flex gap-2 min-w-max">
          {INGESTA_TIPOS.map((tipo) => {
            const isActive = tipo === selectedTipo;
            const hasItems = (ingestaByTipo.get(tipo)?.items?.length ?? 0) > 0;
            return (
              <Link
                key={tipo}
                href={`/alimentacion?fecha=${fecha}&tipo=${tipo}`}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border"
                style={
                  isActive
                    ? {
                        backgroundColor: accentColor,
                        borderColor: accentColor,
                        color: 'white',
                      }
                    : {
                        backgroundColor: 'white',
                        borderColor: '#e5e7eb',
                        color: '#6b7280',
                      }
                }
              >
                <span className="text-base leading-none">{MEAL_ICON[tipo]}</span>
                <span>{formatIngestaLabel(tipo)}</span>
                {hasItems && !isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: MEAL_COLOR[tipo] }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Date picker */}
      <div className="px-4 pb-2">
        <form className="flex items-center gap-2">
          <input type="hidden" name="tipo" value={selectedTipo} />
          <input
            name="fecha"
            type="date"
            defaultValue={fecha}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="submit"
            className="rounded-xl bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            Ver
          </button>
        </form>
      </div>

      {/* Client component: search + add + items */}
      <div className="px-4 pt-2 pb-4">
        <AlimentacionClient
          alimentos={alimentos}
          ingesta={selectedIngesta}
          tipoIngesta={selectedTipo}
          fecha={fecha}
        />
      </div>

      <BottomNav />
    </div>
  );
}
