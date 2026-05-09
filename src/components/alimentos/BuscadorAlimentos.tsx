'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import ModalAgregarAlimento from '@/components/alimentos/ModalAgregarAlimento';

interface AlimentoResultado {
  id_alimento: number;
  nombre: string;
  categoria: string | null;
  kcal_100g: number | null;
  proteinas_100g: number | null;
  grasas_100g: number | null;
  carbs_100g: number | null;
}

export default function BuscadorAlimentos({
  momentoActivo,
  id_ingesta,
  onAlimentoAgregado,
}: {
  momentoActivo: string;
  id_ingesta: number;
  onAlimentoAgregado: () => void;
}) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<AlimentoResultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alimentoSeleccionado, setAlimentoSeleccionado] = useState<AlimentoResultado | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setResultados([]);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const term = query.trim();
      if (term.length < 2) {
        setResultados([]);
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/alimentos/buscar?q=${encodeURIComponent(term)}`);

      if (!response.ok) {
        setResultados([]);
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { data: AlimentoResultado[] };
      setResultados(data.data ?? []);
      setLoading(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  const dropdownVisible = useMemo(() => query.trim().length >= 2, [query]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none ring-0 placeholder:text-gray-400 focus:border-[var(--color-primary)]"
          placeholder="Buscar en SARA2: arroz, pollo, banana..."
        />
      </div>

      {dropdownVisible ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {loading ? <p className="px-4 py-3 text-sm text-gray-500">Buscando...</p> : null}
          {!loading && resultados.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Sin resultados</p>
          ) : null}
          {!loading
            ? resultados.map((resultado) => (
                <button
                  key={resultado.id_alimento}
                  type="button"
                  onClick={() => {
                    setAlimentoSeleccionado(resultado);
                    setModalAbierto(true);
                    setResultados([]);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{resultado.nombre}</p>
                    <p className="text-xs text-gray-500">{resultado.categoria || 'Sin categoría'}</p>
                  </div>
                  <p className="whitespace-nowrap text-xs text-gray-500">{resultado.kcal_100g ?? 0} kcal/100g</p>
                </button>
              ))
            : null}
        </div>
      ) : null}

      {modalAbierto && alimentoSeleccionado ? (
        <ModalAgregarAlimento
          alimento={alimentoSeleccionado}
          momentoActivo={momentoActivo}
          id_ingesta={id_ingesta}
          onAgregado={onAlimentoAgregado}
          onCerrar={() => setModalAbierto(false)}
        />
      ) : null}
    </div>
  );
}
