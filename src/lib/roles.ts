import { UserRole } from '@/types';

export function determineRoleFromEmail(email: string): UserRole {
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain === 'ucc.edu.ar') {
    return 'deportista_ucc';
  }
  return 'particular';
}

/**
 * Extracts nombre and apellido from Supabase user metadata.
 * Supports both email-based signup (metadata.nombre / metadata.apellido)
 * and Google OAuth (metadata.full_name).
 */
export function extractNombreApellido(userMetadata: Record<string, unknown>): {
  nombre: string;
  apellido: string;
} {
  const metaNombre = (userMetadata?.nombre as string) || (userMetadata?.full_name as string) || '';
  const metaApellido = (userMetadata?.apellido as string) || '';
  const nombre =
    metaNombre.includes(' ') && !metaApellido ? metaNombre.split(' ')[0] : metaNombre;
  const apellido =
    metaApellido || (metaNombre.includes(' ') ? metaNombre.split(' ').slice(1).join(' ') : '');
  return { nombre, apellido };
}
