import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { roundToTwo } from '@/lib/ingestas';

const bodySchema = z.object({
  id_alimento: z.number().int().positive(),
  cantidad: z.number().min(0.1).max(5000),
});

const alimentoSchema = z.object({
  id_alimento: z.number(),
  nombre: z.string(),
  kcal_100g: z.number().nullable(),
  proteinas_100g: z.number().nullable(),
  grasas_100g: z.number().nullable(),
  carbs_100g: z.number().nullable(),
});

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth.unauthorized) return auth.unauthorized;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id_alimento, cantidad } = parsed.data;

  const { data, error } = await auth.supabase
    .from('alimentos')
    .select('id_alimento,nombre,kcal_100g,proteinas_100g,grasas_100g,carbs_100g')
    .eq('id_alimento', id_alimento)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Alimento no encontrado' }, { status: 404 });
  }

  const alimento = alimentoSchema.parse(data);

  const kcal = roundToTwo(((alimento.kcal_100g ?? 0) * cantidad) / 100);
  const proteinas_g = roundToTwo(((alimento.proteinas_100g ?? 0) * cantidad) / 100);
  const grasas_g = roundToTwo(((alimento.grasas_100g ?? 0) * cantidad) / 100);
  const carbs_g = roundToTwo(((alimento.carbs_100g ?? 0) * cantidad) / 100);

  return NextResponse.json({
    id_alimento: alimento.id_alimento,
    nombre: alimento.nombre,
    cantidad,
    kcal,
    proteinas_g,
    grasas_g,
    carbs_g,
  });
}
