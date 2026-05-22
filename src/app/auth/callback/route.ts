import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractNombreApellido } from '@/lib/roles';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // 'role' is passed via redirectTo for investigators using Google OAuth
  const roleParam = searchParams.get('role');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          const admin = createAdminClient();
          const { data: existingProfile, error: selectError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('user_id', user.id)
            .maybeSingle();

          if (selectError) {
            console.error('Error al buscar perfil:', selectError.message);
          }

          if (!existingProfile) {
            const email = user.email ?? '';
            const normalizedEmail = email.trim().toLowerCase();
            const isUCC = email.toLowerCase().endsWith('@ucc.edu.ar');
            const { nombre, apellido } = extractNombreApellido(
              user.user_metadata as Record<string, unknown>,
            );
            const { data: duplicated } = await admin
              .from('profiles')
              .select('user_id')
              .ilike('email', normalizedEmail)
              .neq('user_id', user.id)
              .limit(1);

            if ((duplicated ?? []).length > 0) {
              return NextResponse.redirect(`${origin}/login?error=email_exists`);
            }

            if (roleParam === 'investigador') {
              // Investigador via Google must complete additional code after login.
              // Email signup investigators keep regular flow because they already validated before signUp.
              const provider = (user.app_metadata as { provider?: string } | undefined)?.provider;
              if (provider === 'google') {
                return NextResponse.redirect(`${origin}/complete-investigador`);
              }

              await supabase.from('profiles').insert({
                user_id: user.id,
                nombre,
                apellido,
                email,
                role: 'investigador',
                physical_completed: false,
                academic_completed: false,
                psychological_completed: false,
              });
            } else if (isUCC) {
              // UCC users need to choose their usage before the profile is created.
              // Redirect them to the usage-selection screen.
              const forwardedHost = request.headers.get('x-forwarded-host');
              const isLocalEnv = process.env.NODE_ENV === 'development';
              const base = isLocalEnv
                ? origin
                : forwardedHost
                  ? `https://${forwardedHost}`
                  : origin;
              return NextResponse.redirect(`${base}/elegir-uso`);
            } else {
              // Non-UCC users are always 'particular'
              await supabase.from('profiles').insert({
                user_id: user.id,
                nombre,
                apellido,
                email,
                role: 'particular',
                physical_completed: false,
                academic_completed: false,
                psychological_completed: false,
              });
            }
          }
        } catch (e) {
          console.error('Error crítico en el callback:', e);
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
