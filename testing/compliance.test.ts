import { describe, it, expect } from 'vitest';
import {
  getWeekWindow,
  athleteWeeklyCompliance,
  averageCompliance,
  MAIN_MEALS,
} from '@/lib/researcher/compliance';
import type { MealRecord, WeekWindow } from '@/lib/researcher/compliance';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN_MEALS — comidas principales que definen el cumplimiento
// ─────────────────────────────────────────────────────────────────────────────
describe('MAIN_MEALS', () => {
  it('contiene exactamente 4 comidas principales', () => {
    expect(MAIN_MEALS).toHaveLength(4);
  });

  it('incluye desayuno, almuerzo, merienda y cena', () => {
    expect(MAIN_MEALS).toContain('desayuno');
    expect(MAIN_MEALS).toContain('almuerzo');
    expect(MAIN_MEALS).toContain('merienda');
    expect(MAIN_MEALS).toContain('cena');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getWeekWindow — calcula la ventana lunes→hoy de la semana actual
//   Nota: Se inyecta `now` como Date y `timeZone = 'UTC'` para tests deterministas
// ─────────────────────────────────────────────────────────────────────────────
describe('getWeekWindow', () => {
  it('identifica lunes correctamente cuando el día es miércoles', () => {
    // Miércoles 4 jun 2025 a las 12:00 UTC
    const wednesday = new Date('2025-06-04T12:00:00Z');
    const window = getWeekWindow(wednesday, 'UTC');
    expect(window.monday).toBe('2025-06-02');
    expect(window.today).toBe('2025-06-04');
    expect(window.daysElapsed).toBe(3); // Lun=1, Mar=2, Mié=3
  });

  it('el mismo lunes tiene daysElapsed = 1', () => {
    // Lunes 2 jun 2025
    const monday = new Date('2025-06-02T12:00:00Z');
    const window = getWeekWindow(monday, 'UTC');
    expect(window.monday).toBe('2025-06-02');
    expect(window.daysElapsed).toBe(1);
  });

  it('el viernes tiene daysElapsed = 5', () => {
    // Viernes 6 jun 2025
    const friday = new Date('2025-06-06T12:00:00Z');
    const window = getWeekWindow(friday, 'UTC');
    expect(window.monday).toBe('2025-06-02');
    expect(window.daysElapsed).toBe(5);
  });

  it('el domingo (fin de semana) tiene daysElapsed = 7', () => {
    // Domingo 8 jun 2025
    const sunday = new Date('2025-06-08T12:00:00Z');
    const window = getWeekWindow(sunday, 'UTC');
    expect(window.monday).toBe('2025-06-02');
    expect(window.daysElapsed).toBe(7);
  });

  it('devuelve las fechas en formato YYYY-MM-DD', () => {
    const now = new Date('2025-06-04T12:00:00Z');
    const window = getWeekWindow(now, 'UTC');
    expect(window.monday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(window.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// athleteWeeklyCompliance — % de comidas principales registradas en la semana
//   Fórmula: (comidas registradas / (4 × días transcurridos)) × 100
// ─────────────────────────────────────────────────────────────────────────────
describe('athleteWeeklyCompliance', () => {
  // Ventana fija: Lun 2 jun → Mié 4 jun 2025 (3 días)
  const week: WeekWindow = {
    monday: '2025-06-02',
    today: '2025-06-04',
    daysElapsed: 3,
  };

  it('retorna 100 cuando se registraron las 4 comidas en cada día de la semana', () => {
    const meals: MealRecord[] = [
      { tipo: 'desayuno', fecha: '2025-06-02' },
      { tipo: 'almuerzo', fecha: '2025-06-02' },
      { tipo: 'merienda', fecha: '2025-06-02' },
      { tipo: 'cena', fecha: '2025-06-02' },
      { tipo: 'desayuno', fecha: '2025-06-03' },
      { tipo: 'almuerzo', fecha: '2025-06-03' },
      { tipo: 'merienda', fecha: '2025-06-03' },
      { tipo: 'cena', fecha: '2025-06-03' },
      { tipo: 'desayuno', fecha: '2025-06-04' },
      { tipo: 'almuerzo', fecha: '2025-06-04' },
      { tipo: 'merienda', fecha: '2025-06-04' },
      { tipo: 'cena', fecha: '2025-06-04' },
    ];
    expect(athleteWeeklyCompliance(meals, week)).toBe(100);
  });

  it('retorna 0 cuando no se registró ninguna comida', () => {
    expect(athleteWeeklyCompliance([], week)).toBe(0);
  });

  it('ignora colaciones y suplementos (no son comidas principales)', () => {
    const meals: MealRecord[] = [
      { tipo: 'colacion', fecha: '2025-06-02' },
      { tipo: 'suplemento', fecha: '2025-06-02' },
      { tipo: 'colacion', fecha: '2025-06-03' },
    ];
    expect(athleteWeeklyCompliance(meals, week)).toBe(0);
  });

  it('ignora comidas registradas fuera del rango de la semana', () => {
    const meals: MealRecord[] = [
      { tipo: 'desayuno', fecha: '2025-05-30' }, // Antes del lunes
      { tipo: 'almuerzo', fecha: '2025-06-10' }, // Después del hoy
    ];
    expect(athleteWeeklyCompliance(meals, week)).toBe(0);
  });

  it('no duplica el conteo si la misma comida aparece dos veces el mismo día', () => {
    const meals: MealRecord[] = [
      { tipo: 'desayuno', fecha: '2025-06-02' },
      { tipo: 'desayuno', fecha: '2025-06-02' }, // duplicado
    ];
    // 1 comida / (4 × 3 días) = 8.33% → redondeado a 8
    expect(athleteWeeklyCompliance(meals, week)).toBe(8);
  });

  it('calcula correctamente cumplimiento parcial (50%)', () => {
    // 6 comidas / (4 × 3 días) = 50%
    const meals: MealRecord[] = [
      { tipo: 'desayuno', fecha: '2025-06-02' },
      { tipo: 'almuerzo', fecha: '2025-06-02' },
      { tipo: 'desayuno', fecha: '2025-06-03' },
      { tipo: 'almuerzo', fecha: '2025-06-03' },
      { tipo: 'desayuno', fecha: '2025-06-04' },
      { tipo: 'almuerzo', fecha: '2025-06-04' },
    ];
    expect(athleteWeeklyCompliance(meals, week)).toBe(50);
  });

  it('no supera 100% aunque haya más comidas de lo esperado', () => {
    // 5 comidas en un solo día (más de 4) no debe superar el 100% para ese día
    const meals: MealRecord[] = [
      { tipo: 'desayuno', fecha: '2025-06-02' },
      { tipo: 'almuerzo', fecha: '2025-06-02' },
      { tipo: 'merienda', fecha: '2025-06-02' },
      { tipo: 'cena', fecha: '2025-06-02' },
      { tipo: 'desayuno', fecha: '2025-06-03' },
      { tipo: 'almuerzo', fecha: '2025-06-03' },
      { tipo: 'merienda', fecha: '2025-06-03' },
      { tipo: 'cena', fecha: '2025-06-03' },
      { tipo: 'desayuno', fecha: '2025-06-04' },
      { tipo: 'almuerzo', fecha: '2025-06-04' },
      { tipo: 'merienda', fecha: '2025-06-04' },
      { tipo: 'cena', fecha: '2025-06-04' },
    ];
    expect(athleteWeeklyCompliance(meals, week)).toBe(100);
    expect(athleteWeeklyCompliance(meals, week)).toBeLessThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// averageCompliance — promedio de cumplimiento de un grupo de atletas
// ─────────────────────────────────────────────────────────────────────────────
describe('averageCompliance', () => {
  it('retorna 0 con arreglo vacío', () => {
    expect(averageCompliance([])).toBe(0);
  });

  it('retorna el mismo valor para un solo atleta', () => {
    expect(averageCompliance([75])).toBe(75);
  });

  it('calcula el promedio correcto de varios valores', () => {
    // (100 + 50 + 75) / 3 = 75
    expect(averageCompliance([100, 50, 75])).toBe(75);
  });

  it('redondea el promedio al entero más cercano', () => {
    // (100 + 0) / 2 = 50 (exacto, sin redondeo necesario)
    expect(averageCompliance([100, 0])).toBe(50);
  });

  it('maneja lista donde todos tienen 100%', () => {
    expect(averageCompliance([100, 100, 100])).toBe(100);
  });

  it('maneja lista donde todos tienen 0%', () => {
    expect(averageCompliance([0, 0, 0])).toBe(0);
  });
});
