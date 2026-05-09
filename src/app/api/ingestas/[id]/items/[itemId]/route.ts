import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/api-auth';

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await getAuthenticatedUser();
  if (auth.unauthorized) return auth.unauthorized;

  const params = await context.params;
  const parsedParams = paramsSchema.safeParse(params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: parsedParams.error.flatten() }, { status: 400 });
  }

  const { id, itemId } = parsedParams.data;

  const { data: item, error: itemError } = await auth.supabase
    .from('items')
    .select('id_item, id_ingesta, ingestas!inner(id_usuario)')
    .eq('id_item', itemId)
    .eq('id_ingesta', id)
    .eq('ingestas.id_usuario', auth.user.id)
    .maybeSingle();

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  if (!item) {
    return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
  }

  const { error } = await auth.supabase.from('items').delete().eq('id_item', itemId).eq('id_ingesta', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
