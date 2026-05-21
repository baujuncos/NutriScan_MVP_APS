'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { todayAR } from '@/lib/date';

export async function updateHidratacion(delta: number): Promise<{ ml: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const today = todayAR();

  const { data: current } = await supabase
    .from('hidratacion')
    .select('ml_total')
    .eq('id_usuario', user.id)
    .eq('fecha', today)
    .single();

  const newMl = Math.max(0, (current?.ml_total ?? 0) + delta);

  const { error } = await supabase
    .from('hidratacion')
    .upsert(
      { id_usuario: user.id, fecha: today, ml_total: newMl, updated_at: new Date().toISOString() },
      { onConflict: 'id_usuario,fecha' }
    );

  if (error) return { error: error.message };

  revalidatePath('/home');
  return { ml: newMl };
}
