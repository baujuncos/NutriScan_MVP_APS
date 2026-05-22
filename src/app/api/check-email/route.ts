import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      return NextResponse.json({ exists: false, error: 'Email requerido.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('email', normalizedEmail)
      .limit(1);

    if (error) {
      return NextResponse.json(
        { exists: false, error: 'No se pudo validar el email en este momento.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ exists: (data ?? []).length > 0 });
  } catch {
    return NextResponse.json(
      { exists: false, error: 'No se pudo procesar la solicitud.' },
      { status: 500 },
    );
  }
}
