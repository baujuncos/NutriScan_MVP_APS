import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, unauthorized: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }

  return { supabase, user, unauthorized: null };
}
