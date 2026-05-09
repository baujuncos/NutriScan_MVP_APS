'use client';

import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { formatOneDecimal, TipoItem } from '@/lib/ingestas';

interface AlimentoDetalle {
  id_alimento: number;
  nombre: string;
  categoria: string | null;
  kcal_100g: number | null;
  proteinas_100g: number | null;
  grasas_100g: number | null;
  carbs_100g: number | null;
}

interface Calculado {
  kcal: number;
  proteinas_g: number;
  grasas_g: number;
  carbs_g: number;
}

const colorMomento: Record<string, string> = {
  desayuno: '#F97316',
  almuerzo: '#EAB308',
  merienda: '#22C55E',
  cena: '#3B82F6',
  colaciones: '#A855F7',
  suplementos: '#14B8A6',
};

export default function ModalAgregarAlimento({
  alimento,
  momentoActivo,
  id_ingesta,
  onAgregado,
  onCerrar,
}: {
  alimento: AlimentoDetalle;
  momentoActivo: string;
  id_ingesta: number;
  onAgregado: () => void;
  onCerrar: () => void;
}) {
  const [cantidad, setCantidad] = useState<number>(100);
  const [calculado, setCalculado] = useState<Calculado | null>(null);
  const [tipoItem, setTipoItem] = useState<TipoItem>('solido');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCerrar();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCerrar]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!cantidad || cantidad <= 0) {
        setCalculado(null);
        return;
      }

      const response = await fetch('/api/alimentos/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_alimento: alimento.id_alimento, cantidad }),
      });

      if (!response.ok) {
        setCalculado(null);
        return;
      }

      const data = (await response.json()) as Calculado;
      setCalculado(data);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [alimento.id_alimento, cantidad]);

  const referencia = useMemo(
    () => [
      { label: 'kcal', value: alimento.kcal_100g ?? 0 },
      { label: 'proteínas', value: alimento.proteinas_100g ?? 0 },
      { label: 'grasas', value: alimento.grasas_100g ?? 0 },
      { label: 'carbs', value: alimento.carbs_100g ?? 0 },
    ],
    [alimento],
  );

  const handleAgregar = async () => {
    setError('');
    setLoading(true);

    const response = await fetch(`/api/ingestas/${id_ingesta}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_alimento: alimento.id_alimento,
        cantidad,
        tipo_item: tipoItem,
      }),
    });

    if (!response.ok) {
      setError('No se pudo agregar el alimento.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onAgregado();
    onCerrar();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{alimento.nombre}</h3>
            <p className="text-sm text-gray-500">{alimento.categoria || 'Sin categoría'}</p>
          </div>
          <button type="button" onClick={onCerrar} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-xs font-medium text-gray-500">POR 100G</p>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {referencia.map((item) => (
            <div key={item.label} className="rounded-xl bg-gray-100 px-3 py-2 text-sm">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="font-semibold text-gray-800">{formatOneDecimal(item.value)}</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-800">Cantidad (gramos / ml)</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCantidad((prev) => Math.max(10, prev - 10))}
              className="rounded-lg border border-gray-200 p-2 text-gray-700"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={(event) => setCantidad(Math.max(1, Number(event.target.value || 0)))}
              className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm text-gray-900"
            />
            <button
              type="button"
              onClick={() => setCantidad((prev) => prev + 10)}
              className="rounded-lg border border-gray-200 p-2 text-gray-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="tipo_item" className="mb-2 block text-sm font-medium text-gray-800">
            Tipo de ítem
          </label>
          <select
            id="tipo_item"
            value={tipoItem}
            onChange={(event) => setTipoItem(event.target.value as TipoItem)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          >
            <option value="solido">Sólido</option>
            <option value="liquido">Líquido</option>
            <option value="en polvo">En polvo</option>
          </select>
        </div>

        <div className="mb-4 rounded-xl bg-gray-50 p-3">
          <p className="mb-2 text-sm font-medium text-gray-800">Aporte estimado</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 sm:grid-cols-4">
            <p>kcal: {formatOneDecimal(calculado?.kcal ?? 0)}</p>
            <p>P: {formatOneDecimal(calculado?.proteinas_g ?? 0)}g</p>
            <p>G: {formatOneDecimal(calculado?.grasas_g ?? 0)}g</p>
            <p>C: {formatOneDecimal(calculado?.carbs_g ?? 0)}g</p>
          </div>
        </div>

        {error ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          onClick={handleAgregar}
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: colorMomento[momentoActivo] ?? '#1B3A6B' }}
        >
          {loading ? 'Agregando...' : `Agregar a ${momentoActivo}`}
        </button>
      </div>
    </div>
  );
}
