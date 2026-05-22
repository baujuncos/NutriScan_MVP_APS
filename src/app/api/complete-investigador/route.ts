import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractNombreApellido } from '@/lib/roles';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autenticado.' }, { status: 401 });
  }

  try {
    const { code } = await request.json();
    const submittedCode = typeof code === 'string' ? code.trim() : '';
    const validCode = process.env.INVITATION_CODE_INVESTIGADOR?.trim() ?? '';

    if (!submittedCode) {
      return NextResponse.json({ ok: false, error: 'Código de investigador requerido.' }, { status: 400 });
    }

    if (!validCode || submittedCode !== validCode) {
      return NextResponse.json({ ok: false, error: 'Código de investigador inválido.' }, { status: 400 });
    }

    const email = (user.email ?? '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: 'No se encontró un email válido.' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: duplicated } = await admin
      .from('profiles')
      .select('user_id')
      .ilike('email', email)
      .neq('user_id', user.id)
      .limit(1);

    if ((duplicated ?? []).length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Ya existe una cuenta registrada con este email.' },
        { status: 409 },
      );
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingProfile && existingProfile.role !== 'investigador') {
      return NextResponse.json(
        { ok: false, error: 'Tu cuenta ya fue configurada con otro tipo de perfil.' },
        { status: 409 },
      );
    }

    const { nombre, apellido } = extractNombreApellido(user.user_metadata as Record<string, unknown>);

    const payload = {
      user_id: user.id,
      nombre,
      apellido,
      email,
      role: 'investigador' as const,
      physical_completed: false,
      academic_completed: false,
      psychological_completed: false,
    };

    const { error } = existingProfile
      ? await supabase.from('profiles').update(payload).eq('user_id', user.id)
      : await supabase.from('profiles').insert(payload);

    if (error) {
      return NextResponse.json(
        { ok: false, error: 'No se pudo completar el registro de investigador.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'No se pudo completar el registro.' },
      { status: 500 },
    );
  }
}
