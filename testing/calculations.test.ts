import { describe, it, expect } from 'vitest';
import {
  calcularTMB,
  calcularGET,
  calcularMacros,
  calcularEdad,
  calcularPerfilNutricional,
  calcularKcalRestantes,
} from '@/lib/calculations';
import type { ActivityFactor } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// calcularTMB — Ecuación de Harris-Benedict revisada (Roza & Shizgal, 1984)
//   Hombre : 66.47 + (13.75 × kg) + (5.003 × cm) − (6.755 × años)
//   Mujer  : 655.1 + (9.563 × kg) + (1.85  × cm) − (4.676 × años)
// ─────────────────────────────────────────────────────────────────────────────
describe('calcularTMB', () => {
  it('aplica correctamente la ecuación de Harris-Benedict para hombre', () => {
    // 66.47 + 13.75*70 + 5.003*175 − 6.755*25 = 1735.62
    const result = calcularTMB('M', 70, 175, 25);
    expect(result).toBeCloseTo(1735.62, 1);
  });

  it('aplica correctamente la ecuación de Harris-Benedict para mujer', () => {
    // 655.1 + 9.563*60 + 1.85*160 − 4.676*25 = 1407.98
    const result = calcularTMB('F', 60, 160, 25);
    expect(result).toBeCloseTo(1407.98, 1);
  });

  it('la TMB masculina es siempre mayor que la femenina con mismos parámetros', () => {
    const male = calcularTMB('M', 70, 175, 30);
    const female = calcularTMB('F', 70, 175, 30);
    expect(male).toBeGreaterThan(female);
  });

  it('mayor peso corporal incrementa la TMB', () => {
    const light = calcularTMB('M', 60, 175, 25);
    const heavy = calcularTMB('M', 90, 175, 25);
    expect(heavy).toBeGreaterThan(light);
  });

  it('mayor edad reduce la TMB', () => {
    const young = calcularTMB('M', 70, 175, 20);
    const old = calcularTMB('M', 70, 175, 60);
    expect(old).toBeLessThan(young);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularGET — Gasto Energético Total = TMB × Factor de Actividad
// ─────────────────────────────────────────────────────────────────────────────
describe('calcularGET', () => {
  it('multiplica TMB por factor sedentario (1.2)', () => {
    expect(calcularGET(2000, 1.2)).toBeCloseTo(2400, 0);
  });

  it('multiplica TMB por factor ligero (1.375)', () => {
    expect(calcularGET(2000, 1.375)).toBeCloseTo(2750, 0);
  });

  it('multiplica TMB por factor moderado (1.55)', () => {
    expect(calcularGET(2000, 1.55)).toBeCloseTo(3100, 0);
  });

  it('multiplica TMB por factor muy activo (1.725)', () => {
    expect(calcularGET(2000, 1.725)).toBeCloseTo(3450, 0);
  });

  it('un factor de actividad mayor siempre produce un GET mayor', () => {
    const tmb = 1800;
    expect(calcularGET(tmb, 1.725)).toBeGreaterThan(calcularGET(tmb, 1.2));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularMacros — Distribución calórica: 15% proteínas / 55% carbos / 30% grasas
//   Proteínas y carbos: 4 kcal/g  |  Grasas: 9 kcal/g
// ─────────────────────────────────────────────────────────────────────────────
describe('calcularMacros', () => {
  it('distribuye macros correctamente para 2000 kcal', () => {
    const result = calcularMacros(2000);
    // Proteínas: 2000*0.15/4 = 75 g
    expect(result.proteinas_g).toBe(75);
    // Carbohidratos: 2000*0.55/4 = 275 g
    expect(result.carbohidratos_g).toBe(275);
    // Grasas: 2000*0.30/9 ≈ 66.67 → redondeado a 67 g
    expect(result.grasas_g).toBe(67);
  });

  it('distribuye macros correctamente para 2500 kcal', () => {
    const result = calcularMacros(2500);
    expect(result.proteinas_g).toBe(94);     // 2500*0.15/4 ≈ 93.75 → 94
    expect(result.carbohidratos_g).toBe(344); // 2500*0.55/4 ≈ 343.75 → 344
    expect(result.grasas_g).toBe(83);         // 2500*0.30/9 ≈ 83.33 → 83
  });

  it('devuelve enteros (redondeados) para todas las macros', () => {
    const result = calcularMacros(1800);
    expect(Number.isInteger(result.proteinas_g)).toBe(true);
    expect(Number.isInteger(result.carbohidratos_g)).toBe(true);
    expect(Number.isInteger(result.grasas_g)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularEdad — Calcula edad a partir de fecha de nacimiento (string ISO)
// ─────────────────────────────────────────────────────────────────────────────
describe('calcularEdad', () => {
  it('calcula correctamente la edad de alguien que cumple años hoy', () => {
    const today = new Date();
    const year = today.getFullYear() - 30;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    expect(calcularEdad(`${year}-${month}-${day}`)).toBe(30);
  });

  it('devuelve 0 si la fecha tiene formato inválido', () => {
    expect(calcularEdad('no-es-fecha')).toBe(0);
    expect(calcularEdad('')).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularPerfilNutricional — Integración completa de TMB + GET + Macros
// ─────────────────────────────────────────────────────────────────────────────
describe('calcularPerfilNutricional', () => {
  it('devuelve todos los campos del perfil nutricional', () => {
    const today = new Date();
    const year = today.getFullYear() - 25;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fechaNacimiento = `${year}-${month}-${day}`;

    const result = calcularPerfilNutricional('M', 75, 178, fechaNacimiento, 1.55 as ActivityFactor);

    expect(result).toHaveProperty('tmb');
    expect(result).toHaveProperty('get_kcal');
    expect(result).toHaveProperty('proteinas_g');
    expect(result).toHaveProperty('carbohidratos_g');
    expect(result).toHaveProperty('grasas_g');
  });

  it('el GET siempre es mayor que la TMB', () => {
    const today = new Date();
    const year = today.getFullYear() - 25;
    const fechaNacimiento = `${year}-01-01`;

    const result = calcularPerfilNutricional('F', 60, 165, fechaNacimiento, 1.375 as ActivityFactor);
    expect(result.get_kcal).toBeGreaterThan(result.tmb);
  });

  it('todos los valores son enteros positivos', () => {
    const today = new Date();
    const year = today.getFullYear() - 22;
    const fechaNacimiento = `${year}-03-15`;

    const result = calcularPerfilNutricional('M', 80, 180, fechaNacimiento, 1.2 as ActivityFactor);
    expect(Number.isInteger(result.tmb)).toBe(true);
    expect(Number.isInteger(result.get_kcal)).toBe(true);
    expect(result.tmb).toBeGreaterThan(0);
    expect(result.get_kcal).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularKcalRestantes — kcal que le faltan al usuario para alcanzar su meta diaria
//   Extraído de home/page.tsx: Math.max(0, Math.round(metaKcal - totalKcal))
// ─────────────────────────────────────────────────────────────────────────────
describe('calcularKcalRestantes', () => {
  it('devuelve exactamente 1197 con meta 2119 kcal y 922 kcal consumidas', () => {
    expect(calcularKcalRestantes(2119, 922)).toBe(1197);
  });

  it('devuelve 0 cuando se superó la meta (nunca retorna negativo)', () => {
    expect(calcularKcalRestantes(2000, 2500)).toBe(0);
  });

  it('devuelve 0 cuando se alcanzó la meta exacta', () => {
    expect(calcularKcalRestantes(2000, 2000)).toBe(0);
  });

  it('devuelve la meta completa cuando no se consumió nada', () => {
    expect(calcularKcalRestantes(2119, 0)).toBe(2119);
  });

  it('redondea el resultado al entero más cercano', () => {
    // meta 2000.7, consumido 999.3 → diferencia 1001.4 → redondeado a 1001
    expect(calcularKcalRestantes(2000.7, 999.3)).toBe(1001);
  });
});
