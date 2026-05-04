export type UserRole = 'investigador' | 'deportista_ucc' | 'particular' | 'administrador';

export type ActivityFactor = 1.2 | 1.375 | 1.55 | 1.725;

export interface Profile {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: UserRole;
  physical_completed: boolean;
  academic_completed: boolean;
  psychological_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhysicalData {
  id: string;
  user_id: string;
  peso_kg: number;
  altura_cm: number;
  fecha_nacimiento: string;
  sexo: 'M' | 'F';
  factor_actividad: ActivityFactor;
  tmb: number;
  get_kcal: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  created_at: string;
  updated_at: string;
}

export interface AcademicData {
  id: string;
  user_id: string;
  carrera: string;
  anio: number;
  deporte: 'hockey' | 'basquet';
  posicion: string;
  frecuencia_practicas_semana: number;
  horas_practica: number;
  frecuencia_competencias: string;
  created_at: string;
  updated_at: string;
}

export interface PsychologicalSurvey {
  id: string;
  user_id: string;
  respuestas: number[]; // 25 values 0-5
  completed_at: string;
  created_at: string;
}
