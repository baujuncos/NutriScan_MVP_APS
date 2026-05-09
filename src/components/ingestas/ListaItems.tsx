'use client';

import { useEffect, useState } from 'react';
import { Trash2, UtensilsCrossed } from 'lucide-react';
import { formatOneDecimal } from '@/lib/ingestas';

interface ItemListado {
  id_item: number;
  cantidad: number;
  kcal: number;
  alimentos: { nombre: string; categoria: string | null } | null;
}

export default function ListaItems({
  id_ingesta,
  momentoActivo,
  refreshKey,
  onCambio,
}: {
  id_ingesta: number;
  momentoActivo: string;
  refreshKey: number;
  onCambio: () => void;
}) {
  const [items, setItems] = useState<ItemListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const loadItems = async () => {
      const response = await fetch(`/api/ingestas/${id_ingesta}/items`);

      if (!response.ok) {
        if (!ignore) {
          setItems([]);
          setError('No se pudieron cargar los ítems.');
          setLoading(false);
        }
        return;
      }

      const json = (await response.json()) as { data: ItemListado[] };
      if (!ignore) {
        setError('');
        setItems(json.data ?? []);
        setLoading(false);
      }
    };

    void loadItems();
    return () => {
      ignore = true;
    };
  }, [id_ingesta, refreshKey]);

  const eliminarItem = async (itemId: number) => {
    const response = await fetch(`/api/ingestas/${id_ingesta}/items/${itemId}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('No se pudo eliminar el ítem.');
      return;
    }
    setError('');
    setItems((prev) => prev.filter((item) => item.id_item !== itemId));
    onCambio();
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando ítems...</p>;
  }

  if (items.length === 0) {
    return (
      <>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
          <UtensilsCrossed className="mx-auto mb-2 h-6 w-6 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Sin ítems en {momentoActivo}</p>
          <p className="text-xs text-gray-500">Busca alimentos en SARA2 y agrégalos a esta ingesta.</p>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-2">
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
      {items.map((item) => (
        <div key={item.id_item} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.alimentos?.nombre || 'Alimento'}</p>
            <p className="text-xs text-gray-500">
              {formatOneDecimal(item.cantidad)}g · {formatOneDecimal(item.kcal)} kcal
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => void eliminarItem(item.id_item)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
