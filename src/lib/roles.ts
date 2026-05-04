import { UserRole } from '@/types';

export function determineRoleFromEmail(email: string): UserRole {
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain === 'ucc.edu.ar') {
    return 'deportista_ucc';
  }
  return 'particular';
}
