'use server';

import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

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
type SurveyRow = { user_id: string; completed_at: string | null };
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
type HidratacionRow = { id_usuario: string; fecha: string; ml_total: number };

const ROLE_LABELS: Record<string, string> = {
  investigador: 'Investigador',
  deportista_ucc: 'Deportista UCC',
  particular: 'Particular',
  administrador: 'Administrador',
};

export async function generateExcelAction(
  userIds: string[]
): Promise<{ xlsx: string } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: myProfile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single();

  if (!myProfile || (myProfile.role !== 'investigador' && myProfile.role !== 'administrador')) {
    return { error: 'Acceso denegado' };
  }
  if (userIds.length === 0) return { error: 'Sin usuarios seleccionados' };

  const [profilesRes, physRes, acadRes, survRes, ingeRes, hidraRes] = await Promise.all([
    supabase.from('profiles').select('user_id, nombre, apellido, email, role, created_at').in('user_id', userIds).order('created_at', { ascending: false }),
    supabase.from('physical_data').select('user_id, peso_kg, altura_cm, fecha_nacimiento, sexo, factor_actividad, tmb, get_kcal, proteinas_g, carbohidratos_g, grasas_g').in('user_id', userIds),
    supabase.from('academic_data').select('user_id, carrera, anio, deporte, posicion, frecuencia_practicas_semana, horas_practica, frecuencia_competencias').in('user_id', userIds),
    supabase.from('psychological_surveys').select('user_id, completed_at').in('user_id', userIds),
    supabase.from('ingestas').select('id_ingesta, id_usuario, tipo, fecha, kcal_total, proteinas_total_g, grasas_total_g, carbs_total_g').in('id_usuario', userIds).order('fecha', { ascending: true }),
    supabase.from('hidratacion').select('id_usuario, fecha, ml_total').in('id_usuario', userIds),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const physMap = new Map(((physRes.data ?? []) as PhysicalRow[]).map((p) => [p.user_id, p]));
  const acadMap = new Map(((acadRes.data ?? []) as AcademicRow[]).map((a) => [a.user_id, a]));
  const survMap = new Map(((survRes.data ?? []) as SurveyRow[]).map((s) => [s.user_id, s]));

  const ingeMap = new Map<string, IngestaRow[]>();
  for (const ing of (ingeRes.data ?? []) as IngestaRow[]) {
    const list = ingeMap.get(ing.id_usuario) ?? [];
    list.push(ing);
    ingeMap.set(ing.id_usuario, list);
  }
  const hidraMap = new Map<string, number>();
  for (const h of (hidraRes.data ?? []) as HidratacionRow[]) {
    hidraMap.set(`${h.id_usuario}_${h.fecha}`, h.ml_total);
  }

  // ── Build workbook ────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NutriScan';

  const ws = wb.addWorksheet('NutriScan Informe', {
    views: [{ state: 'frozen', ySplit: 4 }],
    properties: { defaultRowHeight: 18 },
  });

  const TOTAL_COLS = 32;

  // Row 1 — Title
  ws.mergeCells(1, 1, 1, TOTAL_COLS);
  const r1 = ws.getRow(1);
  r1.height = 36;
  const titleCell = r1.getCell(1);
  titleCell.value = 'NutriScan — Informe de Datos';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A5C' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 2 — Subtitle
  ws.mergeCells(2, 1, 2, TOTAL_COLS);
  const r2 = ws.getRow(2);
  r2.height = 20;
  const subCell = r2.getCell(1);
  subCell.value = `Generado el ${new Date().toLocaleDateString('es-AR')}  ·  ${profiles.length} usuario(s) seleccionado(s)`;
  subCell.font = { italic: true, size: 10, color: { argb: 'FF475569' }, name: 'Calibri' };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F6FF' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 3 — Section headers
  const SECTIONS = [
    { label: 'DATOS DEL USUARIO',             start: 1,  end: 6,  argb: 'FF1D4ED8' },
    { label: 'PERFIL FÍSICO',                 start: 7,  end: 16, argb: 'FF047857' },
    { label: 'PERFIL ACADÉMICO / DEPORTIVO',  start: 17, end: 23, argb: 'FF6D28D9' },
    { label: 'ENCUESTA PSICOLÓGICA',          start: 24, end: 25, argb: 'FFB91C1C' },
    { label: 'REGISTRO ALIMENTARIO',          start: 26, end: 31, argb: 'FFD97706' },
    { label: 'HIDRATACIÓN',                   start: 32, end: 32, argb: 'FF0891B2' },
  ];

  const r3 = ws.getRow(3);
  r3.height = 18;
  for (const s of SECTIONS) {
    if (s.start !== s.end) ws.mergeCells(3, s.start, 3, s.end);
    const c = r3.getCell(s.start);
    c.value = s.label;
    c.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.argb } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Row 4 — Column headers
  const COL_HEADERS = [
    'ID Usuario', 'Nombre', 'Apellido', 'Email', 'Rol', 'Fecha Registro',
    'Peso (kg)', 'Altura (cm)', 'Fecha Nac.', 'Sexo', 'Factor Act.', 'TMB', 'GET (kcal)', 'Meta Prot. (g)', 'Meta Carbs (g)', 'Meta Grasas (g)',
    'Carrera', 'Año', 'Deporte', 'Posición', 'Prácticas/sem', 'Hs Práctica', 'Freq. Competencia',
    'Encuesta', 'Fecha Encuesta',
    'Fecha Ingesta', 'Tipo Ingesta', 'Kcal', 'Proteínas (g)', 'Grasas (g)', 'Carbs (g)',
    'Agua (ml)',
  ];

  const COL_SECTION_COLOR = [
    ...Array(6).fill('FF1D4ED8'),
    ...Array(10).fill('FF047857'),
    ...Array(7).fill('FF6D28D9'),
    ...Array(2).fill('FFB91C1C'),
    ...Array(6).fill('FFD97706'),
    'FF0891B2',
  ];

  const r4 = ws.getRow(4);
  r4.height = 30;
  COL_HEADERS.forEach((h, i) => {
    const c = r4.getCell(i + 1);
    c.value = h;
    c.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_SECTION_COLOR[i] } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { right: { style: 'thin', color: { argb: 'FF00000030' } } };
  });

  // Data rows
  let ri = 5;
  for (const p of profiles) {
    const phys = physMap.get(p.user_id);
    const acad = acadMap.get(p.user_id);
    const surv = survMap.get(p.user_id);
    const ingestas = ingeMap.get(p.user_id) ?? [];

    const profileVals: ExcelJS.CellValue[] = [
      p.user_id, p.nombre, p.apellido, p.email,
      ROLE_LABELS[p.role] ?? p.role,
      p.created_at?.slice(0, 10) ?? '',
    ];
    const physVals: ExcelJS.CellValue[] = [
      phys?.peso_kg ?? '', phys?.altura_cm ?? '', phys?.fecha_nacimiento ?? '',
      phys?.sexo ?? '', phys?.factor_actividad ?? '', phys?.tmb ?? '',
      phys?.get_kcal ?? '', phys?.proteinas_g ?? '',
      phys?.carbohidratos_g ?? '', phys?.grasas_g ?? '',
    ];
    const acadVals: ExcelJS.CellValue[] = [
      acad?.carrera ?? '', acad?.anio ?? '', acad?.deporte ?? '',
      acad?.posicion ?? '', acad?.frecuencia_practicas_semana ?? '',
      acad?.horas_practica ?? '', acad?.frecuencia_competencias ?? '',
    ];
    const survVals: ExcelJS.CellValue[] = [
      surv ? 'Sí' : 'No',
      surv?.completed_at?.slice(0, 10) ?? '',
    ];

    const writeRow = (ingeVals: ExcelJS.CellValue[], agua: ExcelJS.CellValue) => {
      const row = ws.getRow(ri);
      row.height = 16;
      const bg = ri % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
      const allVals = [...profileVals, ...physVals, ...acadVals, ...survVals, ...ingeVals, agua];
      allVals.forEach((val, i) => {
        const c = row.getCell(i + 1);
        c.value = val;
        c.font = { size: 9, name: 'Calibri' };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        c.alignment = { vertical: 'middle' };
        c.border = {
          right: { style: 'hair', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'hair', color: { argb: 'FFD1D5DB' } },
        };
      });
      ri++;
    };

    if (ingestas.length === 0) {
      writeRow(['', '', '', '', '', ''], '');
    } else {
      for (const ing of ingestas) {
        const agua = hidraMap.get(`${p.user_id}_${ing.fecha}`) ?? '';
        writeRow([
          ing.fecha, ing.tipo,
          ing.kcal_total, ing.proteinas_total_g, ing.grasas_total_g, ing.carbs_total_g,
        ], agua);
      }
    }
  }

  // Column widths
  const COL_WIDTHS = [
    34, 13, 13, 28, 14, 13,
    9,  9,  13, 6,  11, 7, 11, 14, 14, 13,
    22, 5,  12, 12, 12, 11, 18,
    10, 13,
    13, 13, 8, 13, 11, 11,
    10,
  ];
  COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  const buffer = await wb.xlsx.writeBuffer();
  return { xlsx: Buffer.from(buffer as ArrayBuffer).toString('base64') };
}
