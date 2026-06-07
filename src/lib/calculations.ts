import { ActivityFactor } from '@/types';
import { ageOn, parseDateLocal } from './dates';

export function calcularEdad(fechaNacimiento: string): number {
  const nacimiento = parseDateLocal(fechaNacimiento);
  if (!nacimiento) return 0;
  return ageOn(nacimiento, new Date());
}

// Harris-Benedict revised equation constants (Roza & Shizgal, 1984)
const HB_MALE = { base: 66.47, weight: 13.75, height: 5.003, age: 6.755 };
const HB_FEMALE = { base: 655.1, weight: 9.563, height: 1.85, age: 4.676 };

export function calcularTMB(
  sexo: 'M' | 'F',
  pesoKg: number,
  alturaCm: number,
  edad: number,
): number {
  if (sexo === 'M') {
    return HB_MALE.base + HB_MALE.weight * pesoKg + HB_MALE.height * alturaCm - HB_MALE.age * edad;
  }
  return HB_FEMALE.base + HB_FEMALE.weight * pesoKg + HB_FEMALE.height * alturaCm - HB_FEMALE.age * edad;
}

export function calcularGET(tmb: number, factorActividad: ActivityFactor): number {
  return tmb * factorActividad;
}

export function calcularMacros(getKcal: number) {
  const proteinasKcal = getKcal * 0.15;
  const carbosKcal = getKcal * 0.55;
  const grasasKcal = getKcal * 0.30;

  return {
    proteinas_g: Math.round(proteinasKcal / 4),
    carbohidratos_g: Math.round(carbosKcal / 4),
    grasas_g: Math.round(grasasKcal / 9),
  };
}

export function calcularPerfilNutricional(
  sexo: 'M' | 'F',
  pesoKg: number,
  alturaCm: number,
  fechaNacimiento: string,
  factorActividad: ActivityFactor,
) {
  const edad = calcularEdad(fechaNacimiento);
  const tmb = calcularTMB(sexo, pesoKg, alturaCm, edad);
  const getKcal = calcularGET(tmb, factorActividad);
  const macros = calcularMacros(getKcal);

  return {
    tmb: Math.round(tmb),
    get_kcal: Math.round(getKcal),
    ...macros,
  };
}

export function calcularKcalRestantes(meta: number, consumido: number): number {
  return Math.max(0, Math.round(meta - consumido));
}
