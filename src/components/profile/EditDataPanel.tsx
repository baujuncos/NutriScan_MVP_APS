'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import PhysicalForm, { PhysicalInitialData } from './PhysicalForm';
import AcademicForm, { AcademicInitialData } from './AcademicForm';

interface EditDataPanelProps {
  isAthlete: boolean;
  physicalCompleted: boolean;
}

type Pane = null | 'physical' | 'academic';

export default function EditDataPanel({ isAthlete, physicalCompleted }: EditDataPanelProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState<Pane>(null);
  const [physical, setPhysical] = useState<PhysicalInitialData | null>(null);
  const [academic, setAcademic] = useState<AcademicInitialData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open === null) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      if (open === 'physical') {
        const { data } = await supabase
          .from('physical_data')
          .select('peso_kg, altura_cm, fecha_nacimiento, sexo, factor_actividad')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled) setPhysical(data ?? null);
      } else {
        const { data } = await supabase
          .from('academic_data')
          .select(
            'unidad_academica, carrera, anio, deporte, posicion, frecuencia_practicas_semana, horas_practica, frecuencia_competencias',
          )
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled) setAcademic(data ?? null);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  const onSaved = () => {
    setOpen(null);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen('physical')}
        className="flex items-center justify-between w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${physicalCompleted ? 'bg-green-100' : 'bg-gray-200'}`}>
            {physicalCompleted ? (
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
            <p className="text-sm font-semibold text-gray-900">Editar datos</p>
            <p className="text-xs text-gray-500 mt-0.5">Peso, altura, fecha de nacimiento y actividad</p>
          </div>
        </div>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {isAthlete && (
        <button
          type="button"
          onClick={() => setOpen('academic')}
          className="flex items-center justify-between w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Editar datos académicos</p>
              <p className="text-xs text-gray-500 mt-0.5">Unidad, carrera, deporte y posición</p>
            </div>
          </div>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      <Modal open={open === 'physical'} onClose={() => setOpen(null)} title="Editar datos">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : (
          <PhysicalForm initialData={physical} onSaved={onSaved} submitLabel="Guardar cambios" />
        )}
      </Modal>

      <Modal open={open === 'academic'} onClose={() => setOpen(null)} title="Editar datos académicos">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : (
          <AcademicForm initialData={academic} onSaved={onSaved} submitLabel="Guardar cambios" />
        )}
      </Modal>
    </>
  );
}
