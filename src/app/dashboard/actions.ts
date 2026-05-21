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
type HidraRow = { id_usuario: string; fecha: string; ml_total: number };
type MacroTuple = { kcal: number; prot: number; grasas: number; carbs: number };

const ROLE_LABELS: Record<string, string> = {
  investigador: 'Investigador',
  deportista_ucc: 'Deportista UCC',
  particular: 'Particular',
  administrador: 'Administrador',
};

const MEAL_TYPES = ['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion', 'suplemento'] as const;
const MEAL_LABELS: Record<string, string> = {
  desayuno: 'DESAYUNO', almuerzo: 'ALMUERZO', merienda: 'MERIENDA',
  cena: 'CENA', colacion: 'COLACIÓN', suplemento: 'SUPLEMENTO',
};

// Column layout:
// 1-6   DATOS DEL USUARIO
// 7-16  PERFIL FÍSICO
// 17-23 PERFIL ACADÉMICO / DEPORTIVO
// 24-25 ENCUESTA PSICOLÓGICA
// 26    FECHA
// 27-30 DESAYUNO  (kcal, prot, grasas, carbs)
// 31-34 ALMUERZO
// 35-38 MERIENDA
// 39-42 CENA
// 43-46 COLACIÓN
// 47-50 SUPLEMENTO
// 51    HIDRATACIÓN (ml total)
const TOTAL_COLS = 51;

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
    supabase.from('hidratacion').select('id_usuario, fecha, ml_total').in('id_usuario', userIds).order('fecha', { ascending: true }),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const physMap = new Map(((physRes.data ?? []) as PhysicalRow[]).map((p) => [p.user_id, p]));
  const acadMap = new Map(((acadRes.data ?? []) as AcademicRow[]).map((a) => [a.user_id, a]));
  const survMap = new Map(((survRes.data ?? []) as SurveyRow[]).map((s) => [s.user_id, s]));

  // userId → fecha → tipoIngesta → MacroTuple
  const ingeByUser = new Map<string, Map<string, Map<string, MacroTuple>>>();
  for (const ing of (ingeRes.data ?? []) as IngestaRow[]) {
    if (!ingeByUser.has(ing.id_usuario)) ingeByUser.set(ing.id_usuario, new Map());
    const byDate = ingeByUser.get(ing.id_usuario)!;
    if (!byDate.has(ing.fecha)) byDate.set(ing.fecha, new Map());
    byDate.get(ing.fecha)!.set(ing.tipo, {
      kcal: Number(ing.kcal_total) || 0,
      prot: Number(ing.proteinas_total_g) || 0,
      grasas: Number(ing.grasas_total_g) || 0,
      carbs: Number(ing.carbs_total_g) || 0,
    });
  }

  // userId_fecha → ml total
  const hidraMap = new Map<string, number>();
  for (const h of (hidraRes.data ?? []) as HidraRow[]) {
    hidraMap.set(`${h.id_usuario}_${h.fecha}`, Number(h.ml_total) || 0);
  }

  // Union of all dates per user (ingestas + hidratación)
  const datesByUser = new Map<string, Set<string>>();
  for (const ing of (ingeRes.data ?? []) as IngestaRow[]) {
    if (!datesByUser.has(ing.id_usuario)) datesByUser.set(ing.id_usuario, new Set());
    datesByUser.get(ing.id_usuario)!.add(ing.fecha);
  }
  for (const h of (hidraRes.data ?? []) as HidraRow[]) {
    if (!datesByUser.has(h.id_usuario)) datesByUser.set(h.id_usuario, new Set());
    datesByUser.get(h.id_usuario)!.add(h.fecha);
  }

  // ── Build workbook ──────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NutriScan';

  const ws = wb.addWorksheet('NutriScan Informe', {
    views: [{ state: 'frozen', ySplit: 5 }],
    properties: { defaultRowHeight: 18 },
  });

  // ── Row 1: Title ────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, TOTAL_COLS);
  const r1 = ws.getRow(1);
  r1.height = 36;
  const titleCell = r1.getCell(1);
  titleCell.value = 'NutriScan — Informe de Datos';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A5C' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ── Row 2: Subtitle ─────────────────────────────────────────────────────
  ws.mergeCells(2, 1, 2, TOTAL_COLS);
  const r2 = ws.getRow(2);
  r2.height = 20;
  const subCell = r2.getCell(1);
  subCell.value = `Generado el ${new Date().toLocaleDateString('es-AR')}  ·  ${profiles.length} usuario(s) seleccionado(s)`;
  subCell.font = { italic: true, size: 10, color: { argb: 'FF475569' }, name: 'Calibri' };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F6FF' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ── Row 3: Section headers ───────────────────────────────────────────────
  const SECTIONS = [
    { label: 'DATOS DEL USUARIO',            start: 1,  end: 6,  argb: 'FF1D4ED8' },
    { label: 'PERFIL FÍSICO',                start: 7,  end: 16, argb: 'FF047857' },
    { label: 'PERFIL ACADÉMICO / DEPORTIVO', start: 17, end: 23, argb: 'FF6D28D9' },
    { label: 'ENCUESTA PSICOLÓGICA',         start: 24, end: 25, argb: 'FFB91C1C' },
    { label: 'FECHA',                        start: 26, end: 26, argb: 'FF374151' },
    { label: 'REGISTRO ALIMENTARIO',         start: 27, end: 50, argb: 'FFD97706' },
    { label: 'HIDRATACIÓN',                   start: 51, end: 51, argb: 'FF0891B2' },
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

  // ── Row 4: Meal sub-headers ──────────────────────────────────────────────
  const r4 = ws.getRow(4);
  r4.height = 16;

  // Style fixed sections with a slightly lighter shade
  const SECTION4_FILLS: [number, number, string][] = [
    [1, 6, 'FF1E40AF'], [7, 16, 'FF065F46'], [17, 23, 'FF5B21B6'],
    [24, 25, 'FF991B1B'], [26, 26, 'FF1F2937'], [51, 51, 'FF0E7490'],
  ];
  for (const [start, end, argb] of SECTION4_FILLS) {
    for (let col = start; col <= end; col++) {
      const c = r4.getCell(col);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    }
  }

  // Meal sub-headers spanning 4 cols each (cols 27-50)
  MEAL_TYPES.forEach((meal, idx) => {
    const startCol = 27 + idx * 4;
    const endCol = startCol + 3;
    ws.mergeCells(4, startCol, 4, endCol);
    const c = r4.getCell(startCol);
    c.value = MEAL_LABELS[meal];
    c.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // ── Row 5: Column headers ────────────────────────────────────────────────
  const mealMacroCols = MEAL_TYPES.flatMap(() => ['Kcal', 'Prot (g)', 'Grasas (g)', 'Carbs (g)']);
  const COL_HEADERS = [
    'ID Usuario', 'Nombre', 'Apellido', 'Email', 'Rol', 'Fecha Registro',
    'Peso (kg)', 'Altura (cm)', 'Fecha Nac.', 'Sexo', 'Factor Act.', 'TMB', 'GET (kcal)', 'Meta Prot. (g)', 'Meta Carbs (g)', 'Meta Grasas (g)',
    'Carrera', 'Año', 'Deporte', 'Posición', 'Prácticas/sem', 'Hs Práctica', 'Freq. Competencia',
    'Completada', 'Fecha Encuesta',
    'Fecha',
    ...mealMacroCols,
    'Hidratación (ml)',
  ];

  const COL_HEADER_COLORS = [
    ...Array(6).fill('FF1D4ED8'),
    ...Array(10).fill('FF047857'),
    ...Array(7).fill('FF6D28D9'),
    ...Array(2).fill('FFB91C1C'),
    'FF374151',
    ...Array(24).fill('FFD97706'),
    'FF0891B2',
  ];

  const r5 = ws.getRow(5);
  r5.height = 30;
  COL_HEADERS.forEach((h, i) => {
    const c = r5.getCell(i + 1);
    c.value = h;
    c.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_HEADER_COLORS[i] } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { right: { style: 'thin', color: { argb: 'FF00000030' } } };
  });

  // ── Data rows ────────────────────────────────────────────────────────────
  let ri = 6;
  // Columns 1-25 are "static" per user (profile, physical, academic, survey)
  const STATIC_COLS = 25;

  const applyCell = (
    row: ExcelJS.Row,
    colIdx: number,
    val: ExcelJS.CellValue,
    bg: string,
  ) => {
    const c = row.getCell(colIdx);
    c.value = val;
    c.font = { size: 9, name: 'Calibri' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    c.alignment = { vertical: 'middle' };
    c.border = {
      right: { style: 'hair', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'hair', color: { argb: 'FFD1D5DB' } },
    };
  };

  for (const p of profiles) {
    const phys = physMap.get(p.user_id);
    const acad = acadMap.get(p.user_id);
    const surv = survMap.get(p.user_id);

    const staticVals: ExcelJS.CellValue[] = [
      // usuario (6)
      p.user_id, p.nombre, p.apellido, p.email,
      ROLE_LABELS[p.role] ?? p.role,
      p.created_at?.slice(0, 10) ?? '',
      // físico (10)
      phys?.peso_kg ?? '', phys?.altura_cm ?? '', phys?.fecha_nacimiento ?? '',
      phys?.sexo ?? '', phys?.factor_actividad ?? '', phys?.tmb ?? '',
      phys?.get_kcal ?? '', phys?.proteinas_g ?? '',
      phys?.carbohidratos_g ?? '', phys?.grasas_g ?? '',
      // académico (7)
      acad?.carrera ?? '', acad?.anio ?? '', acad?.deporte ?? '',
      acad?.posicion ?? '', acad?.frecuencia_practicas_semana ?? '',
      acad?.horas_practica ?? '', acad?.frecuencia_competencias ?? '',
      // encuesta (2)
      surv ? 'Sí' : 'No',
      surv?.completed_at?.slice(0, 10) ?? '',
    ];

    const dates = [...(datesByUser.get(p.user_id) ?? new Set())].sort();
    const blockStart = ri;
    const blockSize = Math.max(1, dates.length);

    const writeDateRow = (fecha: string, bg: string) => {
      const row = ws.getRow(ri);
      row.height = 16;

      // Static cols: only write on first row of block; rest left blank (merged later)
      if (ri === blockStart) {
        staticVals.forEach((val, i) => applyCell(row, i + 1, val, bg));
      }

      // Fecha
      applyCell(row, 26, fecha, bg);

      // Meals
      const byTipo = fecha ? ingeByUser.get(p.user_id)?.get(fecha) : undefined;
      MEAL_TYPES.forEach((meal, mIdx) => {
        const base = 27 + mIdx * 4;
        const m = byTipo?.get(meal);
        if (m) {
          applyCell(row, base,     m.kcal,  bg);
          applyCell(row, base + 1, m.prot,  bg);
          applyCell(row, base + 2, m.grasas, bg);
          applyCell(row, base + 3, m.carbs, bg);
        } else {
          for (let c = base; c < base + 4; c++) applyCell(row, c, '', bg);
        }
      });

      // Hydration
      const mlTotal = fecha ? (hidraMap.get(`${p.user_id}_${fecha}`) ?? 0) : 0;
      applyCell(row, 51, mlTotal || '', bg);

      ri++;
    };

    // Alternate user block background: even users get tinted rows
    const userBg = (blockStart % 2 === 0) ? 'FFF8FAFC' : 'FFFFFFFF';

    if (dates.length === 0) {
      writeDateRow('', userBg);
    } else {
      for (const fecha of dates) {
        writeDateRow(fecha, userBg);
      }
    }

    // Merge static cols vertically for this user block
    if (blockSize > 1) {
      const blockEnd = blockStart + blockSize - 1;
      for (let col = 1; col <= STATIC_COLS; col++) {
        ws.mergeCells(blockStart, col, blockEnd, col);
        const cell = ws.getCell(blockStart, col);
        cell.alignment = { vertical: 'middle', wrapText: false };
      }
      // Add a visible separator border at the bottom of each user block
      for (let col = 1; col <= TOTAL_COLS; col++) {
        const cell = ws.getCell(blockStart + blockSize - 1, col);
        cell.border = {
          ...cell.border,
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        };
      }
    }
  }

  // ── Column widths ─────────────────────────────────────────────────────────
  const COL_WIDTHS = [
    34, 13, 13, 28, 14, 13,           // usuario
    9, 9, 13, 6, 11, 7, 11, 14, 14, 13, // físico
    22, 5, 12, 12, 12, 11, 18,         // académico
    10, 13,                             // encuesta
    13,                                 // fecha
    ...Array(24).fill(9) as number[],  // comidas (6 × 4 macros)
    14,                                  // hidratación
  ];
  COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  const buffer = await wb.xlsx.writeBuffer();
  return { xlsx: Buffer.from(buffer as ArrayBuffer).toString('base64') };
}
