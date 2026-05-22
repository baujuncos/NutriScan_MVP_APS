export function buildInitials(nombre?: string | null, apellido?: string | null): string {
  const cleanNombre = (nombre ?? '').trim();
  const cleanApellido = (apellido ?? '').trim();

  const firstNombre = cleanNombre.split(/\s+/).filter(Boolean)[0] ?? '';
  const firstApellido = cleanApellido.split(/\s+/).filter(Boolean)[0] ?? '';

  const letterNombre = firstNombre.charAt(0);
  const letterApellido = firstApellido.charAt(0);

  const initials = `${letterNombre}${letterApellido}`.toUpperCase();

  if (initials) return initials;

  const fallback = cleanNombre || cleanApellido;
  return fallback ? fallback.charAt(0).toUpperCase() : '?';
}
