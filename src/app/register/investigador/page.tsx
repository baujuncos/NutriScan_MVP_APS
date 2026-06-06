'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function InvestigadorCodePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Ingresá el código de acceso.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/validate-investigator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.valid) {
        setError(json?.error ?? 'Código incorrecto.');
        setLoading(false);
        return;
      }
      router.push('/register?type=investigador');
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white px-4 py-4 flex items-center border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo NutriScan" className="w-8 h-8 text-white" />
          <img src="/tituloNutriScanNEGRO.png" alt="NutriScan" className="h-6" />
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Acceso para investigadores</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ingresá el código de acceso que recibiste para continuar con tu registro.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              id="invitationCode"
              label="Código de acceso"
              type="password"
              autoComplete="off"
              placeholder="Ingresá tu código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={error || undefined}
              required
            />

            <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
              Continuar
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            ¿No sos investigador?{' '}
            <Link href="/login" className="font-medium text-blue-700 hover:underline">
              Volver al inicio
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
