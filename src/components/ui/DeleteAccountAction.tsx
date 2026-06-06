'use client';

import { useState } from 'react';
import { deleteAccountAction } from '@/app/perfil/actions';
import Modal from '@/components/ui/Modal';
import AnimatedError from '@/components/ui/AnimatedError';

const dangerGradient = {
  backgroundImage: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)',
  boxShadow: '0 0 0 1px rgba(239,68,68,0.18), 0 8px 24px rgba(239,68,68,0.18)',
} as const;

export default function DeleteAccountAction({
  displayName,
  userEmail,
}: {
  displayName?: string;
  userEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError('');
    setLoading(true);
    const result = await deleteAccountAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all"
        style={dangerGradient}
      >
        Eliminar cuenta
      </button>

      <Modal open={open} onClose={() => !loading && setOpen(false)} title="Eliminar cuenta">
        <form action={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Esta acción es permanente e irreversible.</p>
            {displayName && <p className="mt-1">{displayName}, se eliminarán tu cuenta y todos tus datos.</p>}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Confirmá ingresando tu email
            </span>
            <input
              type="email"
              name="email"
              placeholder={userEmail ?? 'tu@email.com'}
              autoComplete="off"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
            />
          </label>

          <AnimatedError message={error} className="mb-0" />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 transition-all"
              style={dangerGradient}
            >
              {loading ? 'Eliminando...' : 'Eliminar definitivamente'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
