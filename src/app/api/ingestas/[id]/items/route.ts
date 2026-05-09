import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { roundToTwo, TIPOS_ITEM } from '@/lib/ingestas';

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });

const postBodySchema = z.object({
  id_alimento: z.number().int().positive(),
  cantidad: z.number().min(0.1).max(5000),
  tipo_item: z.enum(TIPOS_ITEM),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedUser();
  if (auth.unauthorized) return auth.unauthorized;

  const params = await context.params;
  const parsedParams = paramsSchema.safeParse(params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: parsedParams.error.flatten() }, { status: 400 });
  }

  const ingestaId = parsedParams.data.id;

  const { data: ingesta, error: ingestaError } = await auth.supabase
    .from('ingestas')
    .select('id_ingesta')
    .eq('id_ingesta', ingestaId)
    .eq('id_usuario', auth.user.id)
    .maybeSingle();

  if (ingestaError) {
    return NextResponse.json({ error: ingestaError.message }, { status: 500 });
  }

  if (!ingesta) {
    return NextResponse.json({ error: 'Ingesta no encontrada' }, { status: 404 });
  }

  const { data, error } = await auth.supabase
    .from('items')
    .select(
      'id_item,id_ingesta,id_alimento,tipo_item,cantidad,kcal,proteinas_g,grasas_g,carbs_g,created_at,alimentos(id_alimento,nombre,categoria)',
    )
    .eq('id_ingesta', ingestaId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedUser();
  if (auth.unauthorized) return auth.unauthorized;

  const params = await context.params;
  const parsedParams = paramsSchema.safeParse(params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: parsedParams.error.flatten() }, { status: 400 });
  }

  const json = await request.json().catch(() => null);
  const parsedBody = postBodySchema.safeParse(json);

  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.flatten() }, { status: 400 });
  }

  const ingestaId = parsedParams.data.id;

  const { data: ingesta, error: ingestaError } = await auth.supabase
    .from('ingestas')
    .select('id_ingesta')
    .eq('id_ingesta', ingestaId)
    .eq('id_usuario', auth.user.id)
    .maybeSingle();

  if (ingestaError) {
    return NextResponse.json({ error: ingestaError.message }, { status: 500 });
  }

  if (!ingesta) {
    return NextResponse.json({ error: 'Ingesta no encontrada' }, { status: 404 });
  }

  const { data: alimento, error: alimentoError } = await auth.supabase
    .from('alimentos')
    .select('id_alimento,kcal_100g,proteinas_100g,grasas_100g,carbs_100g')
    .eq('id_alimento', parsedBody.data.id_alimento)
    .maybeSingle();

  if (alimentoError) {
    return NextResponse.json({ error: alimentoError.message }, { status: 500 });
  }

  if (!alimento) {
    return NextResponse.json({ error: 'Alimento no encontrado' }, { status: 404 });
  }

  const cantidad = parsedBody.data.cantidad;

  const payload = {
    id_ingesta: ingestaId,
    id_alimento: parsedBody.data.id_alimento,
    tipo_item: parsedBody.data.tipo_item,
    cantidad,
    kcal: roundToTwo(((alimento.kcal_100g ?? 0) * cantidad) / 100),
    proteinas_g: roundToTwo(((alimento.proteinas_100g ?? 0) * cantidad) / 100),
    grasas_g: roundToTwo(((alimento.grasas_100g ?? 0) * cantidad) / 100),
    carbs_g: roundToTwo(((alimento.carbs_100g ?? 0) * cantidad) / 100),
  };

  const { data, error } = await auth.supabase
    .from('items')
    .insert(payload)
    .select('id_item,id_ingesta,id_alimento,tipo_item,cantidad,kcal,proteinas_g,grasas_g,carbs_g,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
