// Unicode combining diacritical marks (U+0300 to U+036F).
const COMBINING_MARKS = /[̀-ͯ]/g;

export function getInitials(
  nombre?: string | null,
  apellido?: string | null,
): string {
  const firstToken = (s?: string | null): string =>
    (s ?? '')
      .normalize('NFD')
      .replace(COMBINING_MARKS, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] ?? '';

  const a = firstToken(nombre).charAt(0).toUpperCase();
  const b = firstToken(apellido).charAt(0).toUpperCase();
  const initials = `${a}${b}`;
  return initials || '?';
}
