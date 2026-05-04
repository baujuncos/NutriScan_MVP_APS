import Link from 'next/link';

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-600">
            <span className="text-3xl">🥗</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">NutriScan</h1>
          <p className="mt-2 text-gray-500">
            Tu plataforma nutricional inteligente para deportistas y particulares.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-green-700"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="w-full rounded-lg border border-green-600 px-4 py-3 text-center font-semibold text-green-600 transition-colors hover:bg-green-50"
          >
            Registrarse
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          ¿Eres investigador?{' '}
          <Link href="/register?type=investigador" className="text-green-600 underline">
            Accede aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
