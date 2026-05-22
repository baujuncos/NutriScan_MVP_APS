'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CompleteInvestigadorPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('El código de investigador es obligatorio.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/complete-investigador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const json = (await res.json()) as { ok?: boolean; error?: string };

    if (!res.ok || !json.ok) {
      setError(json.error ?? 'No se pudo completar el registro.');
      setLoading(false);
      return;
    }

    router.replace('/dashboard');
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verificación de Investigador</h1>
          <p className="mt-2 text-sm text-gray-500">
            Para finalizar tu alta con Google, ingresá el código institucional.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            id="investigator-code"
            label="Código de Investigador"
            placeholder="Ingresa tu código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={error || undefined}
          />

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Finalizar registro
          </Button>
        </form>
      </div>
    </main>
  );
}
