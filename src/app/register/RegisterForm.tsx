'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { isPasswordStrong } from '@/lib/password';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import PasswordRules from '@/components/auth/PasswordRules';

const schema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    apellido: z.string().min(1, 'El apellido es requerido'),
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    invitationCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const isInvestigador = searchParams.get('type') === 'investigador';
  const supabase = createClient();

  const [serverError, setServerError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password') ?? '';

  const onSubmit = async (data: FormData) => {
    setServerError('');

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

    if (checkJson.exists) {
      setError('email', { message: 'Ya existe una cuenta registrada con este email' });
      return;
    }

    if (isInvestigador) {
      const code = data.invitationCode?.trim() ?? '';
      if (!code) {
        setError('invitationCode', { message: 'El código de investigador es obligatorio.' });
        return;
      }

      const res = await fetch('/api/validate-investigator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as { valid?: boolean };
      if (!json.valid) {
        setError('invitationCode', { message: 'Código de investigador inválido.' });
        return;
      }
    }

    const callbackUrl = isInvestigador
      ? `${window.location.origin}/auth/callback?role=investigador`
      : `${window.location.origin}/auth/callback`;

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
        },
        emailRedirectTo: callbackUrl,
      },
    });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already')) {
        setError('email', { message: 'Ya existe una cuenta registrada con este email' });
      } else {
        setServerError(signUpError.message);
      }
      return;
    }

    setEmailSent(true);
  };

  const handleGoogleAuth = async (role?: 'investigador') => {
    setGoogleLoading(true);

    const redirectTo =
      role === 'investigador'
        ? `${window.location.origin}/auth/callback?role=investigador`
        : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      setServerError('Error al continuar con Google.');
      setGoogleLoading(false);
    }
  };

  if (emailSent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Revisa tu email!</h2>
          <p className="text-gray-600 mb-4">
            Te enviamos un enlace de confirmación. Haz clic en el enlace para activar tu cuenta y
            continuar el registro.
          </p>
          <p className="text-sm text-gray-500">
            ¿Ya confirmaste?{' '}
            <Link href="/login" className="font-medium text-green-600 hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center px-4 py-8 ${
        isInvestigador
          ? 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
          : 'bg-gradient-to-br from-green-50 to-emerald-100'
      }`}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700">
              <span className="text-2xl">🥗</span>
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            {isInvestigador ? 'Registro Investigador' : 'Crear Cuenta'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isInvestigador
              ? 'Acceso exclusivo para investigadores UCC'
              : 'Únete a NutriScan hoy'}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mb-4 w-full"
          loading={googleLoading}
          onClick={() => handleGoogleAuth(isInvestigador ? 'investigador' : undefined)}
        >
          <GoogleIcon />
          {isInvestigador ? 'Continuar con Google como Investigador' : 'Registrarse con Google'}
        </Button>

        {isInvestigador && (
          <p className="mb-4 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Si continuás con Google, después del login deberás ingresar tu código institucional para completar el alta.
          </p>
        )}

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-2">o con tu email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="nombre"
              label="Nombre"
              placeholder="Juan"
              error={errors.nombre?.message}
              {...register('nombre')}
            />
            <Input
              id="apellido"
              label="Apellido"
              placeholder="Pérez"
              error={errors.apellido?.message}
              {...register('apellido')}
            />
          </div>

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder={isInvestigador ? 'investigador@ucc.edu.ar' : 'tu@email.com'}
            error={errors.email?.message}
            {...register('email')}
          />

          <PasswordInput
            id="password"
            label="Contraseña"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordRules password={passwordValue} />

          <PasswordInput
            id="confirmPassword"
            label="Confirmar Contraseña"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {isInvestigador && (
            <Input
              id="invitationCode"
              label="Código de Investigador"
              type="password"
              placeholder="Ingresa tu código de acceso"
              error={errors.invitationCode?.message}
              {...register('invitationCode')}
            />
          )}

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}

          {!isInvestigador && (
            <p className="text-xs text-gray-500">
              Si tu email es <strong>@ucc.edu.ar</strong>, al confirmar tu cuenta podrás elegir cómo
              usarás NutriScan.
            </p>
          )}

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            {isInvestigador ? 'Acceder como Investigador' : 'Crear Cuenta'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-green-600 hover:underline">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
