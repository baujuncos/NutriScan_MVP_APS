'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { isPasswordStrong } from '@/lib/password';
import Button from '@/components/ui/Button';
import PasswordInput from '@/components/ui/PasswordInput';
import PasswordRules from '@/components/auth/PasswordRules';

const schema = z
  .object({
    password: z.string().min(1, 'La contraseña es requerida'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password') ?? '';

  useEffect(() => {
    const verifyRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setServerError('El enlace de recuperación es inválido o expiró. Solicita uno nuevo.');
        return;
      }

      setReady(true);
    };

    verifyRecoverySession();
  // supabase is a stable client instance for this page lifecycle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setSuccess('');

    const policyRes = await fetch('/api/password-policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: data.password }),
    });

    const policyJson = (await policyRes.json()) as { valid?: boolean; errors?: string[] };

    if (!policyRes.ok || !policyJson.valid || !isPasswordStrong(data.password)) {
      setError('password', {
        message: policyJson.errors?.[0] ?? 'La contraseña no cumple los requisitos mínimos.',
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setServerError('No se pudo restablecer la contraseña. El token puede haber expirado.');
      return;
    }

    setSuccess('Contraseña actualizada correctamente. Redirigiendo al login...');
    setTimeout(() => {
      router.replace('/login');
      router.refresh();
    }, 1200);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Restablecer contraseña</h1>
        <p className="mt-2 text-sm text-gray-500">Elegí una nueva contraseña segura para tu cuenta.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <PasswordInput
            id="reset-password"
            label="Nueva contraseña"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordRules password={passwordValue} />

          <PasswordInput
            id="reset-confirm-password"
            label="Confirmar nueva contraseña"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>}
          {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

          <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={!ready}>
            Guardar nueva contraseña
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          <Link href="/forgot-password" className="font-medium text-blue-600 hover:underline">
            Solicitar un nuevo enlace
          </Link>
        </p>
      </div>
    </main>
  );
}
