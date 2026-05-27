import { z } from 'zod';

export interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
}

export function checkPassword(value: string): PasswordChecks {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    digit: /\d/.test(value),
  };
}

export function isPasswordStrong(value: string): boolean {
  const c = checkPassword(value);
  return c.length && c.upper && c.lower && c.digit;
}

export const strongPasswordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .refine((v) => /[A-Z]/.test(v), 'Debe incluir al menos una mayúscula')
  .refine((v) => /[a-z]/.test(v), 'Debe incluir al menos una minúscula')
  .refine((v) => /\d/.test(v), 'Debe incluir al menos un número');
