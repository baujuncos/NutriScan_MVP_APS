'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PencilLine } from 'lucide-react';
import BottomNav from '@/components/navigation/BottomNav';
import { createClient } from '@/lib/supabase/client';

export default function PerfilPage() {
  const supabase = useMemo(() => createClient(), []);
  const [nombreCompleto, setNombreCompleto] = useState('Usuario NutriScan');
  const [carrera, setCarrera] = useState('Carrera no informada');
  const [deporte, setDeporte] = useState('Sin deporte');
  const [posicion, setPosicion] = useState('');

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [{ data: profile }, { data: academic }] = await Promise.all([
        supabase.from('profiles').select('nombre,apellido').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('academic_data')
          .select('carrera,anio,deporte,posicion,frecuencia_practicas_semana')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (profile) {
        setNombreCompleto(`${profile.nombre} ${profile.apellido}`.trim());
      }

      if (academic) {
        setCarrera(`${academic.carrera} · ${academic.anio}° año`);
        setDeporte(academic.deporte);
        setPosicion(academic.posicion);
      }
    };

    void load();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-24 pt-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-2xl bg-gradient-to-r from-[#1B3A6B] to-[#22C55E] p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
              {nombreCompleto
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((chunk) => chunk[0]?.toUpperCase())
                .join('')}
            </div>
            <div>
              <h1 className="text-xl font-bold">{nombreCompleto}</h1>
              <p className="text-sm text-white/90">{carrera}</p>
              <p className="text-xs text-white/80">
                {deporte} {posicion ? `· ${posicion}` : ''}
              </p>
            </div>
          </div>
        </section>

        <button className="w-full rounded-2xl bg-[#1B3A6B] px-4 py-3 text-sm font-semibold text-white shadow-sm">
          Repetir Valoración Psicológica
        </button>

        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" /> Editar datos físicos
        </button>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Resumen del mes</h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div className="rounded-xl bg-gray-50 p-3">Comidas: --</div>
            <div className="rounded-xl bg-gray-50 p-3">Suplementos: --</div>
            <div className="rounded-xl bg-gray-50 p-3">Hidratación: --</div>
            <div className="rounded-xl bg-gray-50 p-3">Cumplimiento: --</div>
          </div>
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500">
            <PencilLine className="h-3.5 w-3.5" /> Completa más registros para ver métricas detalladas.
          </p>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}
