export const TIPOS_INGESTA = [
  'desayuno',
  'almuerzo',
  'merienda',
  'cena',
  'colaciones',
  'suplementos',
] as const;

export type TipoIngesta = (typeof TIPOS_INGESTA)[number];

export const TIPOS_ITEM = ['solido', 'liquido', 'en polvo'] as const;
export type TipoItem = (typeof TIPOS_ITEM)[number];

export const MOMENTOS = [
  { id: 'desayuno', label: 'Desayuno', icon: 'Sun', color: '#F97316' },
  { id: 'almuerzo', label: 'Almuerzo', icon: 'UtensilsCrossed', color: '#EAB308' },
  { id: 'merienda', label: 'Merienda', icon: 'Cookie', color: '#22C55E' },
  { id: 'cena', label: 'Cena', icon: 'Moon', color: '#3B82F6' },
  { id: 'colaciones', label: 'Colaciones', icon: 'Apple', color: '#A855F7' },
  { id: 'suplementos', label: 'Suplementos', icon: 'Pill', color: '#14B8A6' },
] as const;

export const MOMENTOS_SIN_SUPLEMENTOS = MOMENTOS.filter((momento) => momento.id !== 'suplementos');

export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatOneDecimal(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

export function toIsoDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
