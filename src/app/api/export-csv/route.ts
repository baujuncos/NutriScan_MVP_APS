import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ProfileRow = {
  user_id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
  created_at: string;
};

type PhysicalRow = {
  user_id: string;
  peso_kg: number | null;
  altura_cm: number | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  factor_actividad: number | null;
  tmb: number | null;
  get_kcal: number | null;
  proteinas_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
};

type AcademicRow = {
  user_id: string;
  carrera: string | null;
  anio: number | null;
  deporte: string | null;
  posicion: string | null;
  frecuencia_practicas_semana: number | null;
  horas_practica: number | null;
  frecuencia_competencias: string | null;
};

type SurveyRow = {
  user_id: string;
  completed_at: string | null;
};

type IngestaRow = {
  id_ingesta: number;
  id_usuario: string;
  tipo: string;
  fecha: string;
  kcal_total: number;
  proteinas_total_g: number;
  grasas_total_g: number;
  carbs_total_g: number;
};

type HidratacionRow = {
  id_usuario: string;
  fecha: string;
  ml_total: number;
};

function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!myProfile || (myProfile.role !== 'investigador' && myProfile.role !== 'administrador')) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const userIdsParam = req.nextUrl.searchParams.get('userIds');
  if (!userIdsParam) return NextResponse.json({ error: 'userIds requerido' }, { status: 400 });

  const selectedIds = userIdsParam.split(',').filter(Boolean);
  if (selectedIds.length === 0) return NextResponse.json({ error: 'Sin usuarios seleccionados' }, { status: 400 });

  const [profilesRes, physRes, acadRes, survRes, ingeRes, hidraRes] = await Promise.all([
    supabase.from('profiles').select('user_id, nombre, apellido, email, role, created_at').in('user_id', selectedIds).order('created_at', { ascending: false }),
    supabase.from('physical_data').select('user_id, peso_kg, altura_cm, fecha_nacimiento, sexo, factor_actividad, tmb, get_kcal, proteinas_g, carbohidratos_g, grasas_g').in('user_id', selectedIds),
    supabase.from('academic_data').select('user_id, carrera, anio, deporte, posicion, frecuencia_practicas_semana, horas_practica, frecuencia_competencias').in('user_id', selectedIds),
    supabase.from('psychological_surveys').select('user_id, completed_at').in('user_id', selectedIds),
    supabase.from('ingestas').select('id_ingesta, id_usuario, tipo, fecha, kcal_total, proteinas_total_g, grasas_total_g, carbs_total_g').in('id_usuario', selectedIds).order('fecha', { ascending: true }),
    supabase.from('hidratacion').select('id_usuario, fecha, ml_total').in('id_usuario', selectedIds),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const physicals = (physRes.data ?? []) as PhysicalRow[];
  const academics = (acadRes.data ?? []) as AcademicRow[];
  const surveys = (survRes.data ?? []) as SurveyRow[];
  const ingestas = (ingeRes.data ?? []) as IngestaRow[];
  const hidratacion = (hidraRes.data ?? []) as HidratacionRow[];

  const physMap = new Map(physicals.map((p) => [p.user_id, p]));
  const acadMap = new Map(academics.map((a) => [a.user_id, a]));
  const survMap = new Map(surveys.map((s) => [s.user_id, s]));

  const ingeMap = new Map<string, IngestaRow[]>();
  for (const ing of ingestas) {
    const list = ingeMap.get(ing.id_usuario) ?? [];
    list.push(ing);
    ingeMap.set(ing.id_usuario, list);
  }

  const hidraMap = new Map<string, number>();
  for (const h of hidratacion) {
    hidraMap.set(`${h.id_usuario}_${h.fecha}`, h.ml_total);
  }

  const headers = [
    'id_usuario', 'nombre', 'apellido', 'email', 'rol', 'fecha_registro',
    'peso_kg', 'altura_cm', 'fecha_nacimiento', 'sexo', 'factor_actividad',
    'tmb', 'get_kcal', 'meta_proteinas_g', 'meta_carbs_g', 'meta_grasas_g',
    'carrera', 'anio_carrera', 'deporte', 'posicion',
    'frecuencia_practicas_semana', 'horas_practica', 'frecuencia_competencias',
    'encuesta_completada', 'encuesta_fecha_completada',
    'fecha_ingesta', 'tipo_ingesta',
    'kcal_ingesta', 'proteinas_g_ingesta', 'grasas_g_ingesta', 'carbs_g_ingesta',
    'ml_agua_dia',
  ];

  const rows: string[] = [headers.join(',')];

  for (const p of profiles) {
    const phys = physMap.get(p.user_id);
    const acad = acadMap.get(p.user_id);
    const surv = survMap.get(p.user_id);
    const userIngestas = ingeMap.get(p.user_id) ?? [];

    const profileCols = [
      esc(p.user_id), esc(p.nombre), esc(p.apellido), esc(p.email),
      esc(p.role), esc(p.created_at?.slice(0, 10)),
    ];

    const physCols = [
      esc(phys?.peso_kg), esc(phys?.altura_cm), esc(phys?.fecha_nacimiento),
      esc(phys?.sexo), esc(phys?.factor_actividad), esc(phys?.tmb),
      esc(phys?.get_kcal), esc(phys?.proteinas_g),
      esc(phys?.carbohidratos_g), esc(phys?.grasas_g),
    ];

    const acadCols = [
      esc(acad?.carrera), esc(acad?.anio), esc(acad?.deporte),
      esc(acad?.posicion), esc(acad?.frecuencia_practicas_semana),
      esc(acad?.horas_practica), esc(acad?.frecuencia_competencias),
    ];

    const survCols = [
      surv ? 'Sí' : 'No',
      esc(surv?.completed_at?.slice(0, 10)),
    ];

    if (userIngestas.length === 0) {
      rows.push([...profileCols, ...physCols, ...acadCols, ...survCols, '', '', '', '', '', '', ''].join(','));
    } else {
      for (const ing of userIngestas) {
        const mlAgua = hidraMap.get(`${p.user_id}_${ing.fecha}`) ?? '';
        rows.push([
          ...profileCols, ...physCols, ...acadCols, ...survCols,
          esc(ing.fecha), esc(ing.tipo),
          esc(ing.kcal_total), esc(ing.proteinas_total_g),
          esc(ing.grasas_total_g), esc(ing.carbs_total_g),
          esc(mlAgua),
        ].join(','));
      }
    }
  }

  const csv = '﻿' + rows.join('\n'); // BOM for Excel UTF-8
  const filename = `nutriscan_informe_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
