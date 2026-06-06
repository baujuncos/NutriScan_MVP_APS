'use client';

import { useState, useTransition } from 'react';
import { updateHidratacion } from './actions';

const META_ML = 2500;
const GLASS_ML = 250;
const TOTAL_GLASSES = META_ML / GLASS_ML; // 10

function formatVasos(ml: number): string {
  if (ml === 0) return '0 vasos';
  const ratio = ml / GLASS_ML;
  const whole = Math.floor(ratio);
  const frac = ratio - whole;

  const fracs: { val: number; str: string }[] = [
    { val: 0,    str: ''    },
    { val: 1/4,  str: '1/4' },
    { val: 1/3,  str: '1/3' },
    { val: 1/2,  str: '1/2' },
    { val: 2/3,  str: '2/3' },
    { val: 3/4,  str: '3/4' },
  ];

  let nearest = fracs[0];
  let minDiff = Math.abs(frac - fracs[0].val);
  for (const f of fracs) {
    const diff = Math.abs(frac - f.val);
    if (diff < minDiff) { minDiff = diff; nearest = f; }
  }

  const fracStr = nearest.str;

  if (!fracStr) return whole === 1 ? '1 vaso' : `${whole} vasos`;
  if (whole === 0) return `${fracStr} vaso`;
  return `${whole} y ${fracStr} vasos`;
}

export default function HidratacionCard({ initialMl }: { initialMl: number }) {
  const [ml, setMl] = useState(initialMl);
  const [pending, startTransition] = useTransition();
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState('');
  const [editTotal, setEditTotal] = useState(false);
  const [editInput, setEditInput] = useState('');

  function handle(delta: number) {
    const optimistic = Math.max(0, ml + delta);
    setMl(optimistic);
    startTransition(async () => {
      const result = await updateHidratacion(delta);
      if ('ml' in result) setMl(result.ml);
    });
  }

  function handleManual() {
    const value = parseInt(manualInput, 10);
    if (isNaN(value) || value <= 0) {
      setManualError('Ingresá un número mayor a 0');
      return;
    }
    if (value > 5000) {
      setManualError('Máximo 5000 ml');
      return;
    }
    setManualError('');
    setManualInput('');
    handle(value);
  }

  function startEdit() {
    setEditInput(String(ml));
    setEditTotal(true);
  }

  function confirmEdit() {
    const value = parseInt(editInput, 10);
    setEditTotal(false);
    if (isNaN(value) || value < 0) return;
    const clamped = Math.min(value, 10000);
    const delta = clamped - ml;
    if (delta !== 0) handle(delta);
  }

  const glasses = Math.floor(ml / GLASS_ML);
  const filledSegments = Math.min(TOTAL_GLASSES, glasses);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg width="17" height="20" viewBox="0 0 14 16" fill="#3b82f6">
              <path d="M7 0 C7 0 0 7 0 11 C0 14.31 3.13 16 7 16 C10.87 16 14 14.31 14 11 C14 7 7 0 7 0 Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">Hidratación</p>

            {editTotal ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmEdit();
                    if (e.key === 'Escape') setEditTotal(false);
                  }}
                  autoFocus
                  className="w-20 py-0.5 px-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700"
                />
                <span className="text-xs text-gray-400">ml</span>
                <button
                  onClick={confirmEdit}
                  className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white ml-0.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setEditTotal(false)}
                  className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-gray-400">
                  {ml} ml · {formatVasos(ml)}
                </p>
                <button
                  onClick={startEdit}
                  disabled={pending}
                  title="Editar total"
                  className="text-gray-300 hover:text-blue-400 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Counter controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handle(-GLASS_ML)}
            disabled={pending || ml === 0 || editTotal}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg leading-none hover:bg-gray-200 disabled:opacity-40 transition-colors"
          >
            −
          </button>
          <div className="flex flex-col items-center w-8">
            <span className="text-xl font-bold text-gray-900 tabular-nums leading-none">{glasses}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">{glasses === 1 ? 'vaso' : 'vasos'}</span>
          </div>
          <button
            onClick={() => handle(GLASS_ML)}
            disabled={pending || editTotal}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xl leading-none disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Segmented progress bar */}
      <div className="flex gap-1.5 mt-4">
        {Array.from({ length: TOTAL_GLASSES }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-2 rounded-full transition-all duration-300"
            style={{
              background: i < filledSegments
                ? 'linear-gradient(90deg, #60a5fa, #3b82f6)'
                : '#e5e7eb',
            }}
          />
        ))}
      </div>

      {/* Reference + manual input */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2">1 vaso = 250 ml</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={5000}
            value={manualInput}
            onChange={(e) => { setManualInput(e.target.value); setManualError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleManual()}
            placeholder="Ingresar ml exactos"
            disabled={pending || editTotal}
            className="flex-1 py-2 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-700 placeholder-gray-400 disabled:opacity-50"
          />
          <button
            onClick={handleManual}
            disabled={pending || manualInput === '' || editTotal}
            className="px-4 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}
          >
            Agregar
          </button>
        </div>
        {manualError && (
          <p className="text-xs text-red-400 mt-1">{manualError}</p>
        )}
      </div>
    </div>
  );
}
