'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

type Usage = 'deportista_ucc' | 'particular';

export default function ElegirUsoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [selectedUsage, setSelectedUsage] = useState<Usage | null>(null);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      // If the user already has a profile (e.g. they re-visit this page), redirect to onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, physical_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        router.replace(profile.physical_completed ? '/home' : '/perfil-fisico');
        return;
      }

      // Ensure this page is only accessible to @ucc.edu.ar users
      const isUCC = (user.email ?? '').toLowerCase().endsWith('@ucc.edu.ar');
      if (!isUCC) {
        router.replace('/perfil-fisico');
        return;
      }

      setCheckingAuth(false);
    };

    checkUser();
  }, [router, supabase]);

  const handleSubmit = async () => {
    if (!selectedUsage) return;
    setLoading(true);
    setServerError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const email = user.email ?? '';
    const metaNombre: string =
      (user.user_metadata?.nombre as string) ||
      (user.user_metadata?.full_name as string) ||
      '';
    const metaApellido: string = (user.user_metadata?.apellido as string) || '';
    const nombre = metaNombre.includes(' ') && !metaApellido
      ? metaNombre.split(' ')[0]
      : metaNombre;
    const apellido =
      metaApellido ||
      (metaNombre.includes(' ') ? metaNombre.split(' ').slice(1).join(' ') : '');

    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      nombre,
      apellido,
      email,
      role: selectedUsage,
      physical_completed: false,
      academic_completed: false,
      psychological_completed: false,
    });

    if (error) {
      setServerError('Error al guardar tu selección. Intenta nuevamente.');
      setLoading(false);
      return;
    }

    router.push('/perfil-fisico');
    router.refresh();
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <p className="text-gray-500">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600">
            <span className="text-2xl">🎓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¿Cómo vas a usar NutriScan?</h2>
          <p className="mt-2 text-sm text-gray-500">
            Esta selección determina las funcionalidades disponibles para tu cuenta.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedUsage('deportista_ucc')}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              selectedUsage === 'deportista_ucc'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏅</span>
              <div>
                <p className="font-semibold text-gray-900">
                  Intervenciones interdisciplinarias en atletas universitarios
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Acceso completo al perfil deportivo y encuesta psicológica.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedUsage('particular')}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              selectedUsage === 'particular'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-semibold text-gray-900">Uso particular</p>
                <p className="mt-1 text-sm text-gray-500">
                  Seguimiento nutricional personal básico.
                </p>
              </div>
            </div>
          </button>
        </div>

        {serverError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
        )}

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!selectedUsage}
          loading={loading}
          onClick={handleSubmit}
        >
          Continuar →
        </Button>
      </div>
    </main>
  );
}
