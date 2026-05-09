'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

const PREGUNTAS = [
  'Suelo tener problemas para concentrarme mientras compito.',
  'Tengo una gran confianza en mi técnica.',
  'Me llevo muy bien con otros miembros de mi equipo.',
  'En la mayoría de las competiciones confío en que lo haré bien.',
  'Cuando lo hago mal, suelo perder la concentración.',
  'Me importa más mi propio rendimiento que el rendimiento del equipo.',
  'Cuando cometo un error, me cuesta olvidarlo para concentrarme rápidamente en lo que tengo que hacer.',
  'Durante mi actuación en una competición, mi atención parece fluctuar una y otra vez entre lo que tengo que hacer y otras cosas.',
  'Me gusta trabajar con mis compañeros de equipo.',
  'Tengo frecuentes dudas respecto a mis posibilidades de hacerlo bien en una competición.',
  'Cuando comienzo haciéndolo mal, mi confianza baja rápidamente.',
  'Pienso que el espíritu de equipo es muy importante.',
  'Cuando me preparo para participar en una prueba (o para jugar un partido), intento imaginarme lo que veré, haré o notaré cuando la situación sea real.',
  'Cuando cometo un error en una competición me pongo muy ansioso.',
  'En este momento lo más importante en mi vida es hacerlo bien en mi deporte.',
  'Mi deporte es toda mi vida.',
  'Tengo fe en mí mismo/a.',
  'Cuando cometo un error durante una competición suele preocuparme lo que piensen otras personas como el entrenador, los compañeros de equipo o algún espectador.',
  'Creo que el aporte específico de todos los miembros de un equipo es sumamente importante para la obtención del éxito del equipo.',
  'No vale la pena dedicar tanto tiempo y esfuerzo como yo le dedico al deporte.',
  'A menudo pierdo la concentración durante una competición por preocuparme o ponerme a pensar en el resultado final.',
  'Suelo aceptar bien las críticas e intento aprender de ellas.',
  'Me cuesta aceptar que se destaque más la labor de otros miembros del equipo que la mía.',
  'Suelo establecer objetivos prioritarios antes de cada sesión de entrenamiento.',
  'Suelo confiar en mí mismo/a aun en los momentos más difíciles de una competición.',
];

const LIKERT_LABELS = ['0', '1', '2', '3', '4', '5'];
const LIKERT_DESC = ['Nunca', '', '', '', '', 'Siempre'];

export default function EncuestaPsicologicaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [respuestas, setRespuestas] = useState<(number | null)[]>(Array(PREGUNTAS.length).fill(null));
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (idx: number, value: number) => {
    const updated = [...respuestas];
    updated[idx] = value;
    setRespuestas(updated);
  };

  const allAnswered = respuestas.every((r) => r !== null);

  const onSubmit = async () => {
    if (!allAnswered) {
      setServerError('Por favor responde todas las preguntas.');
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error: surveyError } = await supabase.from('psychological_surveys').upsert({
      user_id: user.id,
      respuestas: respuestas as number[],
      completed_at: new Date().toISOString(),
    });

    if (surveyError) {
      setServerError('Error al guardar la encuesta. Intente nuevamente.');
      setIsSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ psychological_completed: true })
      .eq('user_id', user.id);

    if (profileError) {
      setServerError('Error al actualizar el perfil. Intente nuevamente.');
      setIsSubmitting(false);
      return;
    }

    router.push('/inicio');
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
              3
            </div>
            <span className="text-sm text-gray-500">Fase 3 de 3</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Encuesta Psicológica Deportiva</h2>
          <p className="mt-1 text-sm text-gray-500">
            Responde cada afirmación en una escala del 0 al 5, donde 0 es &quot;Nunca&quot; y 5 es &quot;Siempre&quot;.
          </p>
        </div>

        {/* Likert scale header */}
        <div className="mb-6 flex items-center justify-end gap-1">
          <span className="text-xs text-gray-400 mr-2">Nunca</span>
          {LIKERT_LABELS.map((l) => (
            <span key={l} className="w-10 text-center text-xs font-semibold text-gray-600">
              {l}
            </span>
          ))}
          <span className="text-xs text-gray-400 ml-2">Siempre</span>
        </div>

        <div className="flex flex-col gap-4">
          {PREGUNTAS.map((pregunta, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-gray-700 flex-1">
                  <span className="font-semibold text-green-700">{idx + 1}. </span>
                  {pregunta}
                </p>
                <div className="flex gap-1 shrink-0">
                  {[0, 1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelect(idx, val)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        respuestas[idx] === val
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-white border border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
                      }`}
                      title={LIKERT_DESC[val] || String(val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm text-gray-500">
            {respuestas.filter((r) => r !== null).length} / {PREGUNTAS.length} respondidas
          </p>

          {serverError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}

          <Button
            type="button"
            size="lg"
            loading={isSubmitting}
            disabled={!allAnswered}
            onClick={onSubmit}
            className="w-full"
          >
            Finalizar Encuesta y Continuar →
          </Button>
        </div>
      </div>
    </main>
  );
}
