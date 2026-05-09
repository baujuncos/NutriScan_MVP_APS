import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/api-auth';

const querySchema = z.object({
  q: z.string().trim().min(2, 'El término de búsqueda debe tener al menos 2 caracteres'),
  categoria: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth.unauthorized) return auth.unauthorized;

  const parsed = querySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? '',
    categoria: request.nextUrl.searchParams.get('categoria') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { q, categoria, limit } = parsed.data;

  let query = auth.supabase
    .from('alimentos')
    .select('id_alimento,nombre,categoria,kcal_100g,proteinas_100g,grasas_100g,carbs_100g')
    .ilike('nombre', `%${q}%`)
    .limit(limit)
    .order('nombre', { ascending: true });

  if (categoria) {
    query = query.ilike('categoria', `%${categoria}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
