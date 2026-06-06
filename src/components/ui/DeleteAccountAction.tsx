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
        className="inline-flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        <span>Borrar cuenta</span>
      </button>

      <Modal open={open} onClose={() => !loading && setOpen(false)} title="Eliminar cuenta">
        <form action={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Esta acción es permanente e irreversible.</p>
            {displayName && <p className="mt-1">{displayName}, se eliminarán tu cuenta y todos tus datos.</p>}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Confirmá ingresando tu mail
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
