'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type TipoLiquido = 'agua' | 'jugo' | 'gaseosa' | 'infusion' | 'leche' | 'otro';

export async function addHidratacionRegistro(
  tipo: TipoLiquido,
  ml: number
): Promise<{ id: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('hidratacion_registros')
    .insert({ id_usuario: user.id, fecha: today, tipo, ml })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/home');
  return { id: data.id };
}

export async function deleteHidratacionRegistro(
  id: number
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('hidratacion_registros')
    .delete()
    .eq('id', id)
    .eq('id_usuario', user.id);

  if (error) return { error: error.message };

  revalidatePath('/home');
  return { ok: true };
}
