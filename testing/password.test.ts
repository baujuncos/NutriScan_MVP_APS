import { describe, it, expect } from 'vitest';
import { checkPassword, isPasswordStrong, strongPasswordSchema } from '@/lib/password';

// ─────────────────────────────────────────────────────────────────────────────
// checkPassword — devuelve un objeto con 4 checks de seguridad
//   Reglas: ≥8 caracteres, mayúscula, minúscula, dígito
// ─────────────────────────────────────────────────────────────────────────────
describe('checkPassword', () => {
  it('falla todos los checks con string vacío', () => {
    const result = checkPassword('');
    expect(result.length).toBe(false);
    expect(result.upper).toBe(false);
    expect(result.lower).toBe(false);
    expect(result.digit).toBe(false);
  });

  it('pasa todos los checks con contraseña fuerte', () => {
    const result = checkPassword('Segura123');
    expect(result.length).toBe(true);
    expect(result.upper).toBe(true);
    expect(result.lower).toBe(true);
    expect(result.digit).toBe(true);
  });

  it('falla length con menos de 8 caracteres', () => {
    expect(checkPassword('Ab1cDe').length).toBe(false);
  });

  it('pasa length exactamente con 8 caracteres', () => {
    expect(checkPassword('Ab1cDefg').length).toBe(true);
  });

  it('falla upper cuando no hay mayúsculas', () => {
    expect(checkPassword('minuscula123').upper).toBe(false);
  });

  it('falla lower cuando no hay minúsculas', () => {
    expect(checkPassword('MAYUSCULA123').lower).toBe(false);
  });

  it('falla digit cuando no hay dígitos', () => {
    expect(checkPassword('SinNumero').digit).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isPasswordStrong — true sólo si los 4 checks son true
// ─────────────────────────────────────────────────────────────────────────────
describe('isPasswordStrong', () => {
  it('retorna true para contraseña que cumple todos los requisitos', () => {
    expect(isPasswordStrong('Contrasenia1')).toBe(true);
  });

  it('retorna false si falta la mayúscula', () => {
    expect(isPasswordStrong('contrasenia1')).toBe(false);
  });

  it('retorna false si falta la minúscula', () => {
    expect(isPasswordStrong('CONTRASENIA1')).toBe(false);
  });

  it('retorna false si falta el dígito', () => {
    expect(isPasswordStrong('Contrasenia')).toBe(false);
  });

  it('retorna false si tiene menos de 8 caracteres', () => {
    expect(isPasswordStrong('Ab1cDe')).toBe(false);
  });

  it('retorna false con string vacío', () => {
    expect(isPasswordStrong('')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// strongPasswordSchema — esquema Zod con mensajes de error en español
// ─────────────────────────────────────────────────────────────────────────────
describe('strongPasswordSchema (Zod)', () => {
  it('valida correctamente una contraseña fuerte', () => {
    const result = strongPasswordSchema.safeParse('Deportista2025');
    expect(result.success).toBe(true);
  });

  it('falla con mensaje en español cuando tiene menos de 8 caracteres', () => {
    const result = strongPasswordSchema.safeParse('Ab1cD');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      expect(messages.some((m) => m.includes('8'))).toBe(true);
    }
  });

  it('falla con mensaje en español cuando falta mayúscula', () => {
    const result = strongPasswordSchema.safeParse('sinmayuscula1');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      expect(messages.some((m) => /may[uú]scula/i.test(m))).toBe(true);
    }
  });

  it('falla con mensaje en español cuando falta minúscula', () => {
    const result = strongPasswordSchema.safeParse('SINMINUSCULA1');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      expect(messages.some((m) => /min[uú]scula/i.test(m))).toBe(true);
    }
  });

  it('falla con mensaje en español cuando falta número', () => {
    const result = strongPasswordSchema.safeParse('SinNumeroEstaContrasenia');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      expect(messages.some((m) => /n[uú]mero/i.test(m))).toBe(true);
    }
  });
});
