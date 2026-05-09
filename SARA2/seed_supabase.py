from __future__ import annotations

import os
from collections import Counter
from pathlib import Path

import pandas as pd
from supabase import Client, create_client

BATCH_SIZE = 100
CSV_PATH = Path(__file__).resolve().parent / 'base_macros.csv'


def get_supabase_client() -> Client:
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not url or not key:
        raise RuntimeError(
            'Faltan variables de entorno. Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.'
        )

    return create_client(url, key)


def load_foods() -> tuple[list[dict[str, object]], Counter[str]]:
    df = pd.read_csv(CSV_PATH, encoding='utf-8-sig', header=None)

    if df.shape[1] < 7:
        raise RuntimeError(f'CSV inválido: se esperaban al menos 7 columnas, llegaron {df.shape[1]}.')

    start = 0
    if df.shape[1] >= 8:
        start = df.shape[1] - 7

    subset = df.iloc[:, start : start + 7].copy()
    subset.columns = [
        'id_alimento',
        'nombre',
        'categoria',
        'kcal_100g',
        'proteinas_100g',
        'grasas_100g',
        'carbs_100g',
    ]

    numeric_cols = ['kcal_100g', 'proteinas_100g', 'grasas_100g', 'carbs_100g']
    for col in numeric_cols:
        subset[col] = pd.to_numeric(subset[col], errors='coerce').fillna(0.0).round(2)

    subset['nombre'] = subset['nombre'].astype(str).str.strip()
    subset['categoria'] = subset['categoria'].astype(str).str.strip()

    foods = subset.to_dict(orient='records')
    distribution = Counter(subset['categoria'])
    return foods, distribution


def upsert_foods(client: Client, foods: list[dict[str, object]]) -> tuple[int, int]:
    total_upserted = 0

    for i in range(0, len(foods), BATCH_SIZE):
        chunk = foods[i : i + BATCH_SIZE]
        response = (
            client.table('alimentos')
            .upsert(chunk, on_conflict='nombre', returning='representation')
            .execute()
        )

        if response.data:
            total_upserted += len(response.data)

    ignored = max(len(foods) - total_upserted, 0)
    return total_upserted, ignored


def main() -> None:
    foods, distribution = load_foods()
    client = get_supabase_client()

    upserted, ignored = upsert_foods(client, foods)

    print('✅ Seed completado')
    print(f'Total procesados: {len(foods)}')
    print(f'Insertados/actualizados: {upserted}')
    print(f'Ignorados: {ignored}')
    print('\nDistribución por categoría:')
    for category, count in sorted(distribution.items()):
        print(f'  - {category}: {count}')


if __name__ == '__main__':
    main()
