'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import BuscadorAlimentos from '@/components/alimentos/BuscadorAlimentos';
import ListaItems from '@/components/ingestas/ListaItems';
import ResumenMacros from '@/components/ingestas/ResumenMacros';
import BottomNav from '@/components/navigation/BottomNav';
import { MOMENTOS, toIsoDate } from '@/lib/ingestas';

interface IngestaActual {
  id_ingesta: number;
  kcal_total: number;
  proteinas_total_g: number;
  carbs_total_g: number;
  grasas_total_g: number;
}

export default function ComidasPage() {
  const [momentoActivo, setMomentoActivo] = useState<string>('desayuno');
  const [ingestaActual, setIngestaActual] = useState<IngestaActual | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const momento = useMemo(
    () => MOMENTOS.find((item) => item.id === momentoActivo) ?? MOMENTOS[0],
    [momentoActivo],
  );

  useEffect(() => {
    let ignore = false;

    const syncIngesta = async () => {
      const fecha = toIsoDate();
      const response = await fetch(`/api/ingestas?fecha=${fecha}&tipo=${momentoActivo}`);

      if (!response.ok) {
        if (!ignore) {
          setIngestaActual(null);
          setLoading(false);
        }
        return;
      }

      const json = (await response.json()) as { data: IngestaActual[] };
      const existente = json.data?.[0];

      if (existente) {
        if (!ignore) {
          setIngestaActual(existente);
          setLoading(false);
        }
        return;
      }

      const created = await fetch('/api/ingestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: momentoActivo, fecha }),
      });

      if (!created.ok) {
        if (!ignore) {
          setIngestaActual(null);
          setLoading(false);
        }
        return;
      }

      const ingesta = (await created.json()) as IngestaActual;
      if (!ignore) {
        setIngestaActual(ingesta);
        setLoading(false);
      }
    };

    void syncIngesta();
    return () => {
      ignore = true;
    };
  }, [momentoActivo, refreshKey]);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-24 pt-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <header
          className="rounded-2xl p-5 text-white shadow-sm"
          style={{ backgroundColor: momento.color }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Registro de comidas</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">{momento.label}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
              <Flame className="h-4 w-4" /> {ingestaActual?.kcal_total ?? 0} kcal
            </span>
          </div>
        </header>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {MOMENTOS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMomentoActivo(item.id)}
              className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: momentoActivo === item.id ? item.color : '#f3f4f6',
                color: momentoActivo === item.id ? '#fff' : '#6b7280',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {ingestaActual ? (
          <ResumenMacros
            kcal_total={ingestaActual.kcal_total ?? 0}
            proteinas_g={ingestaActual.proteinas_total_g ?? 0}
            carbs_g={ingestaActual.carbs_total_g ?? 0}
            grasas_g={ingestaActual.grasas_total_g ?? 0}
          />
        ) : null}

        {ingestaActual ? (
          <BuscadorAlimentos
            momentoActivo={momentoActivo}
            id_ingesta={ingestaActual.id_ingesta}
            onAlimentoAgregado={() => setRefreshKey((prev) => prev + 1)}
          />
        ) : null}

        {loading ? (
          <p className="text-sm text-gray-500">Cargando ingesta...</p>
        ) : ingestaActual ? (
          <ListaItems
            id_ingesta={ingestaActual.id_ingesta}
            momentoActivo={momentoActivo}
            refreshKey={refreshKey}
            onCambio={() => setRefreshKey((prev) => prev + 1)}
          />
        ) : (
          <p className="text-sm text-red-600">No se pudo cargar la ingesta actual.</p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
