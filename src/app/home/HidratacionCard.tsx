'use client';

import { useState, useTransition } from 'react';
import { addHidratacionRegistro, deleteHidratacionRegistro, type TipoLiquido } from './actions';

const META_ML = 2500;
const GLASS_ML = 250;
const TOTAL_GLASSES = META_ML / GLASS_ML; // 10

const TIPO_OPTIONS: { value: TipoLiquido; label: string; emoji: string }[] = [
  { value: 'agua',     label: 'Agua',         emoji: '💧' },
  { value: 'jugo',     label: 'Jugo',         emoji: '🥤' },
  { value: 'gaseosa',  label: 'Gaseosa',      emoji: '🫧' },
  { value: 'infusion', label: 'Infusión / Té', emoji: '🍵' },
  { value: 'leche',    label: 'Leche',        emoji: '🥛' },
  { value: 'otro',     label: 'Otro',         emoji: '🫙'  },
];

type Registro = { id: number; tipo: TipoLiquido; ml: number };

export default function HidratacionCard({
  registros: initialRegistros,
  mlDeComidas,
}: {
  registros: Registro[];
  mlDeComidas: Record<TipoLiquido, number>;
}) {
  const [registros, setRegistros] = useState<Registro[]>(initialRegistros);
  const [tipo, setTipo] = useState<TipoLiquido>('agua');
  const [pending, startTransition] = useTransition();

  const mlAguaRegistros = registros.filter((r) => r.tipo === 'agua').reduce((s, r) => s + r.ml, 0);
  const mlAgua = mlAguaRegistros + mlDeComidas.agua;
  const mlTotal = registros.reduce((s, r) => s + r.ml, 0) + Object.values(mlDeComidas).reduce((s, v) => s + v, 0);
  const glasses = Math.floor(mlAgua / GLASS_ML);
  const filledSegments = Math.min(TOTAL_GLASSES, glasses);

  function handleAdd(ml: number) {
    const tempId = -(Date.now());
    setRegistros((prev) => [...prev, { id: tempId, tipo, ml }]);
    startTransition(async () => {
      const result = await addHidratacionRegistro(tipo, ml);
      if ('error' in result) {
        setRegistros((prev) => prev.filter((r) => r.id !== tempId));
      } else {
        setRegistros((prev) =>
          prev.map((r) => (r.id === tempId ? { ...r, id: result.id } : r))
        );
      }
    });
  }

  function handleDelete(id: number) {
    setRegistros((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteHidratacionRegistro(id);
    });
  }

  const vasosDelTipo = Math.round(
    registros.filter((r) => r.tipo === tipo).reduce((s, r) => s + r.ml, 0) / GLASS_ML
  );

  function handleRemove() {
    const last = [...registros].reverse().find((r) => r.tipo === tipo);
    if (last) handleDelete(last.id);
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="16" viewBox="0 0 14 16" fill="#3b82f6">
              <path d="M7 0 C7 0 0 7 0 11 C0 14.31 3.13 16 7 16 C10.87 16 14 14.31 14 11 C14 7 7 0 7 0 Z" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">Hidratación</h2>
        </div>
        <span className="text-sm text-gray-400">{Math.floor(mlAgua / GLASS_ML)}/{TOTAL_GLASSES} vasos de agua</span>
      </div>

      {/* Segmented progress */}
      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: TOTAL_GLASSES }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-2 rounded-full transition-all duration-300"
            style={{
              background:
                i < filledSegments
                  ? 'linear-gradient(90deg, #60a5fa, #3b82f6)'
                  : '#e5e7eb',
            }}
          />
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-blue-600">{mlAgua} ml de agua</span>
        <span className="text-xs text-gray-400">
          meta: {META_ML} ml · {Math.min(100, Math.round((mlAgua / META_ML) * 100))}%
          {mlTotal > mlAgua && (
            <span className="text-gray-300"> · {mlTotal} ml totales</span>
          )}
        </span>
      </div>

      {/* Type selector + add buttons */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoLiquido)}
          disabled={pending}
          className="flex-1 py-2 px-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-700 disabled:opacity-50"
        >
          {TIPO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.emoji} {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleRemove}
          disabled={pending || vasosDelTipo === 0}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-lg font-bold disabled:opacity-40 transition-opacity hover:bg-gray-200"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-gray-800">{vasosDelTipo}</span>
        <button
          onClick={() => handleAdd(GLASS_ML)}
          disabled={pending}
          className="w-9 h-9 flex items-center justify-center rounded-full text-white text-lg font-bold disabled:opacity-60 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
        >
          +
        </button>
      </div>

      {/* 1 vaso reference */}
      <p className="text-xs text-gray-400 text-right mb-3 -mt-1">1 vaso = 250 ml</p>

      {/* Per-type summary list */}
      <div className="space-y-1.5">
        {TIPO_OPTIONS.map((opt) => {
          const t = opt.value as TipoLiquido;
          const tipoMlRegistros = registros
            .filter((r) => r.tipo === t)
            .reduce((s, r) => s + r.ml, 0);
          const tipoMlComidas = mlDeComidas[t] ?? 0;
          const tipoMlTotal = tipoMlRegistros + tipoMlComidas;
          const tipoVasos = Math.round(tipoMlTotal / GLASS_ML);
          const hasManual = tipoMlRegistros > 0;
          const hasAny = tipoMlTotal > 0;
          const isSelected = tipo === t;

          return (
            <div
              key={opt.value}
              className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                hasAny
                  ? isSelected
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50'
                  : 'bg-gray-50 opacity-40'
              }`}
            >
              <span className="text-xs text-gray-700 font-medium">
                {opt.emoji} {opt.label}
              </span>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-xs text-gray-500">
                    {tipoVasos} {tipoVasos === 1 ? 'vaso' : 'vasos'} · {tipoMlTotal} ml
                  </span>
                  {tipoMlComidas > 0 && (
                    <span className="block text-[10px] text-blue-400">
                      🍽 +{tipoMlComidas} ml de comidas
                    </span>
                  )}
                </div>

                {hasManual && (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => {
                        const last = [...registros].reverse().find((r) => r.tipo === t);
                        if (last) handleDelete(last.id);
                      }}
                      disabled={pending}
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-bold disabled:opacity-40 hover:bg-gray-300 transition-colors"
                    >
                      −
                    </button>
                    <button
                      onClick={() => {
                        const tempId = -(Date.now());
                        setRegistros((prev) => [...prev, { id: tempId, tipo: t, ml: GLASS_ML }]);
                        startTransition(async () => {
                          const result = await addHidratacionRegistro(t, GLASS_ML);
                          if ('error' in result) {
                            setRegistros((prev) => prev.filter((r) => r.id !== tempId));
                          } else {
                            setRegistros((prev) =>
                              prev.map((r) => (r.id === tempId ? { ...r, id: result.id } : r))
                            );
                          }
                        });
                      }}
                      disabled={pending}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-white text-xs font-bold disabled:opacity-60 transition-colors"
                      style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Liquids from meals total banner */}
      {Object.values(mlDeComidas).some((v) => v > 0) && (
        <div className="flex items-center gap-1.5 mt-3 px-3 py-2 bg-blue-50 rounded-xl">
          <svg width="12" height="12" viewBox="0 0 14 16" fill="#60a5fa">
            <path d="M7 0 C7 0 0 7 0 11 C0 14.31 3.13 16 7 16 C10.87 16 14 14.31 14 11 C14 7 7 0 7 0 Z" />
          </svg>
          <span className="text-xs text-blue-600">
            +{Object.values(mlDeComidas).reduce((s, v) => s + v, 0)} ml incluidos desde comidas del día
          </span>
        </div>
      )}
    </div>
  );
}
