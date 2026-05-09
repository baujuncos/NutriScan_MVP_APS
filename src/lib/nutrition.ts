export const INGESTA_TIPOS = [
  'desayuno',
  'almuerzo',
  'merienda',
  'cena',
  'colacion',
  'suplemento',
] as const;

export const ITEM_TIPOS = ['solido', 'liquido', 'en polvo'] as const;

export type IngestaTipo = (typeof INGESTA_TIPOS)[number];
export type ItemTipo = (typeof ITEM_TIPOS)[number];

export function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function toFixed2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatIngestaLabel(tipo: IngestaTipo): string {
  if (tipo === 'colacion') return 'Colaciones';
  if (tipo === 'suplemento') return 'Suplementos';
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}
