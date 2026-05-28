'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { strongPasswordSchema } from '@/lib/password';
import PasswordRules from '@/components/ui/PasswordRules';
import Input from '@/components/ui/Input';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const registerSchema = z
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
  })

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;



function LeftPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #0f2057 0%, #1a3a8a 55%, #1e4fa8 100%)' }}
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
      <div className="absolute top-1/3 -right-12 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 left-1/3 w-56 h-56 rounded-full bg-white/5" />

      <div className="flex items-center gap-3 z-10">
        <img src="/logo.png" alt="Logo NutriScan" className="w-10 h-10" />
        {/* Fondo oscuro: logo de color */}
        <img src="/tituloNutriScan.png" alt="NutriScan" className="h-8" />
      </div>

      <div className="z-10 space-y-6">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          UCC · Nutrición Deportiva
        </div>

        <div>
          <h1 className="text-5xl font-bold leading-tight">
            Tu rendimiento,<br />
            medido <span className="text-green-400">con</span>{' '}
            <span className="text-green-400">ciencia.</span>
          </h1>
          <p className="mt-5 text-white/65 text-base leading-relaxed max-w-sm">
            Registrá comidas e hidratación usando la base de datos nacional SARA2. <br />
            ¡Profesionales usarán los datos recolectados en un proyecto de investigación para conocerte mejor!
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {[
            { value: '50+', label: 'Deportistas' },
            { value: '900+', label: 'Alimentos disponibles' },
            { value: '2', label: 'Equipos UCC' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center min-w-[80px]">
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-white/55 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="z-10 flex items-center gap-2 text-white/40 text-xs">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        Datos protegidos · Uso académico
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError('No se pudo enviar el email. Verificá la dirección ingresada.');
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Revisá tu email</h2>
        <p className="text-sm text-gray-500 mb-6">
          Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña.
        </p>
        <button onClick={onBack} className="text-blue-600 font-medium hover:underline text-sm">
          ← Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver
      </button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">¿Olvidaste tu contraseña?</h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingresá tu email y te enviaremos un enlace para restablecerla.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            placeholder="juanperez@hotmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
          />
        </div>
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 text-sm transition-colors disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Enviar enlace →'}
        </button>
      </form>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setServerError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setServerError('Credenciales inválidas. Verificá tu email y contraseña.');
      return;
    }
    router.push('/');
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setServerError('Error al iniciar sesión con Google.');
      setGoogleLoading(false);
    }
  };

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />;
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido de vuelta</h2>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors disabled:opacity-60 mb-4"
      >
        <GoogleIcon />
        {googleLoading ? 'Redirigiendo...' : 'Continuar con Google'}
      </button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white px-2">o con tu mail</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Mail
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="juanperez@hotmail.com"
            {...register('email')}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-blue-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        {serverError && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 text-sm transition-colors disabled:opacity-60 mt-2"
        >
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión →'}
        </button>
      </form>
    </div>
  );
}

function RegisterFormInline({ onSuccess }: { onSuccess: () => void }) {
  const supabase = createClient();
  const [serverError, setServerError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });

  const passwordValue = watch('password') ?? '';

  const onSubmit = async (data: RegisterData) => {
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
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setError('email', { message: 'Ya existe una cuenta con este email.' });
        return;
      }
      if (!res.ok) {
        if (json?.field === 'password') setError('password', { message: json.message });
        else if (json?.field === 'email') setError('email', { message: json.message });
        else setServerError(json?.message ?? 'No pudimos crear la cuenta.');
        return;
      }
      onSuccess();
    } catch {
      setServerError('Error de conexión. Intentá de nuevo.');
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setServerError('Error al continuar con Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
        <p className="text-sm text-gray-500 mt-1">Únete a NutriScan hoy</p>
      </div>

      <button
        type="button"
        onClick={handleGoogleRegister}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors disabled:opacity-60 mb-4"
      >
        <GoogleIcon />
        {googleLoading ? 'Redirigiendo...' : 'Registrarse con Google'}
      </button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white px-2">o con tu email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input
              type="text"
              placeholder="Juan"
              {...register('nombre')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
            <input
              type="text"
              placeholder="Pérez"
              {...register('apellido')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
            />
            {errors.apellido && <p className="mt-1 text-xs text-red-500">{errors.apellido.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            placeholder="tu@email.com"
            {...register('email')}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <Input
            id="register-password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordRules value={passwordValue} className="mt-2" />
        </div>

        <Input
          id="register-confirm"
          label="Confirmar contraseña"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <p className="text-xs text-gray-500 pt-1">
          Si tu email es <strong>@ucc.edu.ar</strong>, podrás elegir cómo usarás NutriScan al confirmar tu cuenta.
        </p>

        {serverError && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 text-sm transition-colors disabled:opacity-60"
        >
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta →'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [emailSent, setEmailSent] = useState(false);

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Revisá tu email!</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Te enviamos un enlace de confirmación. Hacé clic en el enlace para activar tu cuenta y continuar.
          </p>
          <button
            onClick={() => { setEmailSent(false); setTab('login'); }}
            className="text-blue-600 font-medium hover:underline text-sm"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 sm:px-12 py-12 min-h-screen">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <img src="/logo.png" alt="Logo NutriScan" className="w-9 h-9 text-white" />
          {/* Fondo blanco: logo negro */}
          <img src="/tituloNutriScanNEGRO.png" alt="NutriScan" className="h-7" />
        </div>

        <div className="flex bg-gray-100 rounded-full p-1 mb-8 w-full max-w-sm gap-1">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              tab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Iniciar sesión
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              tab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
            Crear cuenta
          </button>
        </div>

        {tab === 'login' ? (
          <LoginForm />
        ) : (
          <RegisterFormInline onSuccess={() => setEmailSent(true)} />
        )}

        {/* MODIFICACIÓN: Renderizado condicional para mostrar solo en 'register' */}
        {tab === 'register' && (
          <p className="mt-8 text-xs text-gray-400">
            ¿Investigador?{' '}
            <Link href="/register/investigador" className="text-blue-600 hover:underline">
              Registrarse con código de acceso
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
