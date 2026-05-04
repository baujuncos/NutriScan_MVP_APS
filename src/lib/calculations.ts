import { ActivityFactor } from '@/types';

export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

export function calcularTMB(
  sexo: 'M' | 'F',
  pesoKg: number,
  alturaCm: number,
  edad: number,
): number {
  if (sexo === 'M') {
    return 66.47 + 13.75 * pesoKg + 5.003 * alturaCm - 6.755 * edad;
  }
  return 655.1 + 9.563 * pesoKg + 1.85 * alturaCm - 4.676 * edad;
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
