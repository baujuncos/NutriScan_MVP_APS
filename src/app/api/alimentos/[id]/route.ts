import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/api-auth';

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedUser();
  if (auth.unauthorized) return auth.unauthorized;

  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('alimentos')
    .select('id_alimento,nombre,categoria,kcal_100g,proteinas_100g,grasas_100g,carbs_100g')
    .eq('id_alimento', parsed.data.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Alimento no encontrado' }, { status: 404 });
  }

  return NextResponse.json(data);
}
