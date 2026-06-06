'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { strongPasswordSchema } from '@/lib/password';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordRules from '@/components/ui/PasswordRules';
import AnimatedError from '@/components/ui/AnimatedError';

const schema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es requerido'),
    apellido: z.string().trim().min(1, 'El apellido es requerido'),
    email: z.string().email('Email inválido'),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
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
  const router = useRouter();
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
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched' });

  const passwordValue = watch('password') ?? '';

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          nombre: data.nombre,
          apellido: data.apellido,
          ...(isInvestigador ? { role: 'investigador' } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setError('email', { message: 'Ya existe una cuenta con este email.' });
        return;
      }
      if (res.status === 403 && json?.error === 'INV_CODE_REQUIRED') {
        setServerError(json.message ?? 'Volvé a ingresar el código de investigador.');
        router.push('/register/investigador');
        return;
      }
      if (!res.ok) {
        if (json?.field === 'password') {
          setError('password', { message: json.message });
        } else if (json?.field === 'email') {
          setError('email', { message: json.message });
        } else {
          setServerError(json?.message ?? 'No pudimos crear la cuenta.');
        }
        return;
      }
      setEmailSent(true);
    } catch {
      setServerError('Error de conexión. Intentá de nuevo.');
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    const redirectTo = isInvestigador
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Revisá tu email!</h2>
          <p className="text-gray-600 mb-4">
            Te enviamos un enlace de confirmación. Hacé clic en el enlace para activar tu cuenta y continuar el registro.
          </p>
          <p className="text-sm text-gray-500">
            ¿Ya confirmaste?{' '}
            <Link href="/login" className="font-medium text-blue-700 hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white px-4 py-4 flex items-center border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo NutriScan" className="w-8 h-8 text-white" />
          <img src="/tituloNutriScanNEGRO.png" alt="NutriScan" className="h-6" />
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-4 py-10 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              {isInvestigador ? 'Registro Investigador' : 'Crear Cuenta'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 text-center">
              {isInvestigador ? 'Acceso exclusivo para investigadores UCC' : 'Únete a NutriScan hoy'}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mb-4 w-full"
            loading={googleLoading}
            onClick={handleGoogleAuth}
          >
            <GoogleIcon />
            {isInvestigador ? 'Registrarse con Google como Investigador' : 'Registrarse con Google'}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400">
              <span className="bg-white px-2">o con tu email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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

            <div>
              <Input
                id="password"
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <PasswordRules value={passwordValue} className="mt-2" />
            </div>

            <Input
              id="confirmPassword"
              label="Confirmar Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <AnimatedError message={serverError} className="mb-0" />

            {!isInvestigador && (
              <p className="text-xs text-gray-500">
                Si tu email es <strong>@ucc.edu.ar</strong>, al confirmar tu cuenta podrás elegir cómo
                usarás NutriScan.
              </p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
              {isInvestigador ? 'Acceder como Investigador' : 'Crear Cuenta'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-blue-700 hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
