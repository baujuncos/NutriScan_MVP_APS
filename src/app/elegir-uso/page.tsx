'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { extractNombreApellido } from '@/lib/roles';
import Button from '@/components/ui/Button';
import AnimatedError from '@/components/ui/AnimatedError';

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

      // If the user already has a profile (e.g. they re-visit this page), redirect accordingly
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
  // supabase and router are stable references created outside the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const { nombre, apellido } = extractNombreApellido(
      user.user_metadata as Record<string, unknown>,
    );

    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      nombre,
      apellido,
      email: user.email ?? '',
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
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Cargando...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white px-4 py-4 flex items-center border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo NutriScan" className="w-8 h-8 text-white" />
          <img src="/tituloNutriScanNEGRO.png" alt="NutriScan" className="h-6" />
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-4 py-12 min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
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
                ? 'border-blue-600 bg-blue-50'
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
                ? 'border-blue-600 bg-blue-50'
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

        <AnimatedError message={serverError} className="mb-4" />

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
    </div>
  );
}
