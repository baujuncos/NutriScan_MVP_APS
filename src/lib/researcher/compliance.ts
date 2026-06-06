/**
 * Weekly meal-compliance math for the researcher panel.
 *
 * Compliance is defined as the 4 MAIN meals per day (desayuno, almuerzo,
 * merienda, cena) logged so far this week, divided by the expected amount
 * up to the current moment of the week (4 meals × days elapsed, incl. today).
 *
 * This module is the single source of truth reused by the KPIs, charts,
 * ranking and athletes table so every widget reports the same number.
 */

export const MAIN_MEALS = ['desayuno', 'almuerzo', 'merienda', 'cena'] as const;
export type MainMeal = (typeof MAIN_MEALS)[number];

const ARG_TZ = 'America/Argentina/Buenos_Aires';

export interface WeekWindow {
  /** Monday of the current week, YYYY-MM-DD (Argentina time). */
  monday: string;
  /** Today, YYYY-MM-DD (Argentina time). */
  today: string;
  /** Days elapsed Monday→today inclusive (1 = Monday, 7 = Sunday). */
  daysElapsed: number;
}

export interface MealRecord {
  tipo: string;
  fecha: string; // YYYY-MM-DD
}

/** Format a Date as YYYY-MM-DD in the given timezone. */
function ymdInTz(date: Date, timeZone: string): string {
  // en-CA renders dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Compute the current week window (Monday → today) in Argentina time.
 * `now` is injected so callers compute "today" once and stay consistent
 * across every widget on a page.
 */
export function getWeekWindow(now: Date, timeZone: string = ARG_TZ): WeekWindow {
  const todayStr = ymdInTz(now, timeZone);
  const [y, m, d] = todayStr.split('-').map(Number);
  // Anchor the date in UTC so weekday arithmetic is timezone-safe.
  const todayUtc = new Date(Date.UTC(y, m - 1, d));
  const dow = todayUtc.getUTCDay(); // 0 = Sunday … 6 = Saturday
  const diffToMonday = (dow + 6) % 7; // Monday → 0, Sunday → 6
  const mondayUtc = new Date(todayUtc);
  mondayUtc.setUTCDate(todayUtc.getUTCDate() - diffToMonday);

  return {
    monday: mondayUtc.toISOString().slice(0, 10),
    today: todayStr,
    daysElapsed: diffToMonday + 1,
  };
}

function isMainMeal(tipo: string): tipo is MainMeal {
  return (MAIN_MEALS as readonly string[]).includes(tipo);
}

/**
 * Weekly compliance percentage (0–100, rounded) for a single athlete.
 * `meals` may contain any meal types/dates; only main meals within the
 * week window are counted, capped at 4 per day.
 */
export function athleteWeeklyCompliance(meals: MealRecord[], week: WeekWindow): number {
  const expected = 4 * week.daysElapsed;
  if (expected <= 0) return 0;

  const mainMealsPerDay = new Map<string, Set<string>>();
  for (const meal of meals) {
    if (!isMainMeal(meal.tipo)) continue;
    if (meal.fecha < week.monday || meal.fecha > week.today) continue;
    if (!mainMealsPerDay.has(meal.fecha)) mainMealsPerDay.set(meal.fecha, new Set());
    mainMealsPerDay.get(meal.fecha)!.add(meal.tipo);
  }

  let logged = 0;
  for (const meals of mainMealsPerDay.values()) {
    logged += Math.min(meals.size, 4);
  }

  return Math.round(Math.min(logged / expected, 1) * 100);
}

/** Average of a list of compliance values, rounded. Returns 0 when empty. */
export function averageCompliance(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / values.length);
}
