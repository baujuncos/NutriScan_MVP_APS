'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { INGESTA_TIPOS, ITEM_TIPOS, isValidDateInput, toFixed2 } from '@/lib/nutrition';

function getStringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function addItemAction(formData: FormData) {
  const fecha = getStringField(formData, 'fecha');
  const tipoIngesta = getStringField(formData, 'tipo_ingesta');
  const tipoItem = getStringField(formData, 'tipo_item');
  const alimentoIdRaw = getStringField(formData, 'id_alimento');
  const cantidadRaw = getStringField(formData, 'cantidad');

  if (!isValidDateInput(fecha)) redirect('/alimentacion');
  if (!INGESTA_TIPOS.includes(tipoIngesta as (typeof INGESTA_TIPOS)[number])) {
    redirect(`/alimentacion?fecha=${fecha}`);
  }
  if (!ITEM_TIPOS.includes(tipoItem as (typeof ITEM_TIPOS)[number])) {
    redirect(`/alimentacion?fecha=${fecha}`);
  }

  const idAlimento = Number.parseInt(alimentoIdRaw, 10);
  const cantidad = Number.parseFloat(cantidadRaw);

  if (!Number.isFinite(idAlimento) || idAlimento <= 0 || !Number.isFinite(cantidad) || cantidad <= 0) {
    redirect(`/alimentacion?fecha=${fecha}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: alimento, error: alimentoError } = await supabase
    .from('alimentos')
    .select('id_alimento')
    .eq('id_alimento', idAlimento)
    .single();

  if (alimentoError || !alimento) {
    redirect(`/alimentacion?fecha=${fecha}`);
  }

  const { error: upsertError } = await supabase.from('ingestas').upsert(
    [
      {
        id_usuario: user.id,
        fecha,
        tipo: tipoIngesta,
      },
    ],
    { onConflict: 'id_usuario,fecha,tipo' },
  );

  if (upsertError) {
    redirect(`/alimentacion?fecha=${fecha}`);
  }

  const { data: ingesta, error: ingestaError } = await supabase
    .from('ingestas')
    .select('id_ingesta')
    .eq('id_usuario', user.id)
    .eq('fecha', fecha)
    .eq('tipo', tipoIngesta)
    .single();

  if (ingestaError || !ingesta) {
    redirect(`/alimentacion?fecha=${fecha}`);
  }

  const { error: insertError } = await supabase.from('items').insert({
    id_ingesta: ingesta.id_ingesta,
    id_alimento: idAlimento,
    tipo_item: tipoItem,
    cantidad: toFixed2(cantidad),
  });

  if (insertError) {
    redirect(`/alimentacion?fecha=${fecha}`);
  }

  revalidatePath('/alimentacion');
  redirect(`/alimentacion?fecha=${fecha}`);
}

export async function deleteItemAction(formData: FormData) {
  const fecha = getStringField(formData, 'fecha');
  const idItemRaw = getStringField(formData, 'id_item');
  const idItem = Number.parseInt(idItemRaw, 10);

  if (!isValidDateInput(fecha) || !Number.isFinite(idItem) || idItem <= 0) {
    redirect('/alimentacion');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: existingItem, error: existingItemError } = await supabase
    .from('items')
    .select('id_item')
    .eq('id_item', idItem)
    .single();

  if (existingItemError || !existingItem) {
    redirect(`/alimentacion?fecha=${fecha}`);
  }

  const { error: deleteError } = await supabase.from('items').delete().eq('id_item', idItem);

  if (deleteError) {
    redirect(`/alimentacion?fecha=${fecha}`);
  }

  revalidatePath('/alimentacion');
  redirect(`/alimentacion?fecha=${fecha}`);
}
