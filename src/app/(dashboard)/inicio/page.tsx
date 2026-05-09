'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Flame, Minus, Plus } from 'lucide-react';
import BottomNav from '@/components/navigation/BottomNav';
import { MOMENTOS_SIN_SUPLEMENTOS, formatOneDecimal, toIsoDate } from '@/lib/ingestas';
import { createClient } from '@/lib/supabase/client';

interface IngestaDia {
  id_ingesta: number;
  tipo: string;
  kcal_total: number;
  proteinas_total_g: number;
  carbs_total_g: number;
  grasas_total_g: number;
  created_at: string;
}

export default function InicioPage() {
  const supabase = useMemo(() => createClient(), []);
  const [ingestas, setIngestas] = useState<IngestaDia[]>([]);
  const [objetivoKcal, setObjetivoKcal] = useState(2000);
  const [objetivoProteinas, setObjetivoProteinas] = useState(80);
  const [objetivoCarbs, setObjetivoCarbs] = useState(280);
  const [objetivoGrasas, setObjetivoGrasas] = useState(65);
  const [nombre, setNombre] = useState('');
  const [vasos, setVasos] = useState(0);

  useEffect(() => {
    const load = async () => {
      const fecha = toIsoDate();
      const response = await fetch(`/api/ingestas?fecha=${fecha}`);
      if (response.ok) {
        const json = (await response.json()) as { data: IngestaDia[] };
        setIngestas(json.data ?? []);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [{ data: profile }, { data: physical }] = await Promise.all([
        supabase.from('profiles').select('nombre').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('physical_data')
          .select('get_kcal,proteinas_g,carbohidratos_g,grasas_g')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (profile?.nombre) setNombre(profile.nombre);
      if (physical?.get_kcal) setObjetivoKcal(physical.get_kcal);
      if (physical?.proteinas_g) setObjetivoProteinas(physical.proteinas_g);
      if (physical?.carbohidratos_g) setObjetivoCarbs(physical.carbohidratos_g);
      if (physical?.grasas_g) setObjetivoGrasas(physical.grasas_g);
    };

    void load();
  }, [supabase]);

  const kcalTotal = ingestas.reduce((acc, item) => acc + Number(item.kcal_total ?? 0), 0);
  const proteinasTotal = ingestas.reduce((acc, item) => acc + Number(item.proteinas_total_g ?? 0), 0);
  const carbsTotal = ingestas.reduce((acc, item) => acc + Number(item.carbs_total_g ?? 0), 0);
  const grasasTotal = ingestas.reduce((acc, item) => acc + Number(item.grasas_total_g ?? 0), 0);

  const porcentajeMeta = Math.min(100, Math.round((kcalTotal / Math.max(objetivoKcal, 1)) * 100));
  const faltanKcal = Math.max(objetivoKcal - kcalTotal, 0);

  const ultimasComidas = ingestas
    .filter((ingesta) => Number(ingesta.kcal_total) > 0)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-24 pt-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <header>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Hola, {nombre || 'deportista'} 👋</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Tu día en NutriScan</p>
        </header>

        <section className="rounded-2xl p-5 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #22C55E 100%)' }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-white/80">Calorías hoy</p>
              <p className="text-xl font-bold">{formatOneDecimal(kcalTotal)} / {formatOneDecimal(objetivoKcal)} kcal</p>
              <p className="text-sm text-white/90">⚡ Faltan {formatOneDecimal(faltanKcal)} kcal</p>
            </div>
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray={`${porcentajeMeta}, 100`}
                  pathLength="100"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{porcentajeMeta}%</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <MacroRow label="CARBS" actual={carbsTotal} objetivo={objetivoCarbs} color="bg-yellow-300" />
            <MacroRow label="PROTEÍNAS" actual={proteinasTotal} objetivo={objetivoProteinas} color="bg-rose-300" />
            <MacroRow label="GRASAS" actual={grasasTotal} objetivo={objetivoGrasas} color="bg-purple-300" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Estado de carga</h2>
          <div className="space-y-2">
            {MOMENTOS_SIN_SUPLEMENTOS.map((momento) => {
              const total = ingestas.find((i) => i.tipo === momento.id)?.kcal_total ?? 0;
              const completado = Number(total) > 0;
              return (
                <div
                  key={momento.id}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                    completado ? 'bg-[#F0FDF4]' : 'bg-gray-50'
                  }`}
                >
                  <p className="text-sm text-gray-700">{momento.label}</p>
                  {completado ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> Completo
                    </span>
                  ) : (
                    <a href="/comidas" className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      Cargar
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Hidratación</h2>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg border border-gray-200 p-2" onClick={() => setVasos((v) => Math.max(0, v - 1))}>
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex-1 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700">{vasos} / 8 vasos</div>
            <button type="button" className="rounded-lg border border-gray-200 p-2" onClick={() => setVasos((v) => Math.min(8, v + 1))}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 h-2 rounded-full bg-blue-100">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(vasos / 8) * 100}%` }} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Últimas comidas</h2>
          <div className="space-y-2">
            {ultimasComidas.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Circle className="h-4 w-4" /> Aún no hay comidas cargadas hoy.
              </div>
            ) : (
              ultimasComidas.map((ingesta) => (
                <div key={ingesta.id_ingesta} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{ingesta.tipo}</p>
                    <p className="text-xs text-gray-500">{new Date(ingesta.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
                    <Flame className="h-4 w-4" /> {formatOneDecimal(Number(ingesta.kcal_total))} kcal
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}

function MacroRow({
  label,
  actual,
  objetivo,
  color,
}: {
  label: string;
  actual: number;
  objetivo: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((actual / Math.max(objetivo, 1)) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-white/90">
        <span>{label}</span>
        <span>
          {formatOneDecimal(actual)}g / {formatOneDecimal(objetivo)}g
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/30">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
