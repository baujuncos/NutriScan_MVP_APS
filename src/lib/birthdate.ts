const MIN_AGE = 13;
const MAX_AGE = 100;

function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const [y, m, d] = trimmed.split('-').map(Number);
  if (!y || !m || !d) return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  return date;
}

function calculateAgeInYears(dateUtc: Date, now: Date): number {
  const year = now.getUTCFullYear() - dateUtc.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dateUtc.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dateUtc.getUTCDate())) {
    return year - 1;
  }
  return year;
}

export function validateBirthdate(value: string): { valid: boolean; message?: string } {
  const parsed = parseDateOnly(value);
  if (!parsed) {
    return { valid: false, message: 'Fecha inválida. Usa el formato correcto.' };
  }

  const now = new Date();
  const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (parsed.getTime() > nowUtc.getTime()) {
    return { valid: false, message: 'La fecha de nacimiento no puede ser futura.' };
  }

  const age = calculateAgeInYears(parsed, nowUtc);
  if (age < MIN_AGE) {
    return { valid: false, message: `Debes tener al menos ${MIN_AGE} años.` };
  }

  if (age > MAX_AGE) {
    return { valid: false, message: `La edad máxima permitida es ${MAX_AGE} años.` };
  }

  return { valid: true };
}
