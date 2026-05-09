import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { TIPOS_INGESTA, toIsoDate } from '@/lib/ingestas';

const tipoSchema = z.enum(TIPOS_INGESTA);

const getQuerySchema = z.object({
  fecha: z.string().date().optional(),
  tipo: tipoSchema.optional(),
});

const postBodySchema = z.object({
  tipo: tipoSchema,
  fecha: z.string().date().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth.unauthorized) return auth.unauthorized;

  const parsed = getQuerySchema.safeParse({
    fecha: request.nextUrl.searchParams.get('fecha') ?? undefined,
    tipo: request.nextUrl.searchParams.get('tipo') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fecha = parsed.data.fecha ?? toIsoDate();

  let query = auth.supabase
    .from('ingestas')
    .select(
      'id_ingesta,id_usuario,tipo,fecha,kcal_total,proteinas_total_g,carbs_total_g,grasas_total_g,created_at,items(id_item,id_alimento,tipo_item,cantidad,kcal,proteinas_g,grasas_g,carbs_g,created_at,alimentos(id_alimento,nombre,categoria))',
    )
    .eq('id_usuario', auth.user.id)
    .eq('fecha', fecha)
    .order('created_at', { ascending: false });

  if (parsed.data.tipo) {
    query = query.eq('tipo', parsed.data.tipo);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth.unauthorized) return auth.unauthorized;

  const json = await request.json().catch(() => null);
  const parsed = postBodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = {
    id_usuario: auth.user.id,
    tipo: parsed.data.tipo,
    fecha: parsed.data.fecha ?? toIsoDate(),
  };

  const { data, error } = await auth.supabase
    .from('ingestas')
    .upsert(payload, { onConflict: 'id_usuario,tipo,fecha' })
    .select('id_ingesta,id_usuario,tipo,fecha,kcal_total,proteinas_total_g,carbs_total_g,grasas_total_g,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
