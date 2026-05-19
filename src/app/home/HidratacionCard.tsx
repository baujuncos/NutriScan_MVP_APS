'use client';

import { useState, useTransition } from 'react';
import { updateHidratacion } from './actions';

const META_ML = 2500;
const GLASS_ML = 250;
const TOTAL_GLASSES = META_ML / GLASS_ML; // 10

export default function HidratacionCard({ initialMl }: { initialMl: number }) {
  const [ml, setMl] = useState(initialMl);
  const [pending, startTransition] = useTransition();

  function handle(delta: number) {
    const optimistic = Math.max(0, ml + delta);
    setMl(optimistic);
    startTransition(async () => {
      const result = await updateHidratacion(delta);
      if ('ml' in result) setMl(result.ml);
    });
  }

  const glasses = Math.floor(ml / GLASS_ML);
  const filledSegments = Math.min(TOTAL_GLASSES, glasses);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg width="17" height="20" viewBox="0 0 14 16" fill="#3b82f6">
              <path d="M7 0 C7 0 0 7 0 11 C0 14.31 3.13 16 7 16 C10.87 16 14 14.31 14 11 C14 7 7 0 7 0 Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">Hidratación</p>
            <p className="text-sm text-gray-400">{ml} ml de {META_ML} ml</p>
          </div>
        </div>

        {/* Counter controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handle(-GLASS_ML)}
            disabled={pending || ml === 0}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg leading-none hover:bg-gray-200 disabled:opacity-40 transition-colors"
          >
            −
          </button>
          <span className="text-xl font-bold text-gray-900 w-5 text-center tabular-nums">
            {glasses}
          </span>
          <button
            onClick={() => handle(GLASS_ML)}
            disabled={pending}
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

    </div>
  );
}
