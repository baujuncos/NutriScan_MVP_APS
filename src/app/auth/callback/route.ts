import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { determineRoleFromEmail } from '@/lib/roles';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile exists (for Google OAuth new users)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('user_id', user.id)
          .single();

        if (!existingProfile) {
          const role = determineRoleFromEmail(user.email ?? '');
          const metaNombre = user.user_metadata?.full_name ?? '';
          const parts = metaNombre.split(' ');
          const nombre = parts[0] ?? '';
          const apellido = parts.slice(1).join(' ') ?? '';

          await supabase.from('profiles').insert({
            user_id: user.id,
            nombre,
            apellido,
            email: user.email ?? '',
            role,
            physical_completed: false,
            academic_completed: false,
            psychological_completed: false,
          });
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
