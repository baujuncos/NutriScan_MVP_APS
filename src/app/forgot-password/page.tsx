'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setSuccess('');

    const checkRes = await fetch('/api/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email }),
    });

    const checkJson = (await checkRes.json()) as { exists?: boolean; error?: string };

    if (!checkRes.ok) {
      setServerError(checkJson.error ?? 'No se pudo validar el email.');
      return;
    }

    if (!checkJson.exists) {
      setServerError('No existe una cuenta registrada con este email.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setServerError('No se pudo enviar el correo de recuperación.');
      return;
    }

    setSuccess('Te enviamos un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h1>
        <p className="mt-2 text-sm text-gray-500">
          Ingresá tu email y te enviaremos un enlace seguro para restablecerla.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input
            id="forgot-email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            error={errors.email?.message}
            {...register('email')}
          />

          {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>}
          {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Enviar enlace de recuperación
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
