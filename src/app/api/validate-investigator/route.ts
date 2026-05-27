import { NextRequest, NextResponse } from 'next/server';
import { INV_CODE_COOKIE } from '@/app/api/register/route';

const COOKIE_MAX_AGE_SECONDS = 60 * 15; // 15 minutes

export async function POST(request: NextRequest) {
  let body: { code?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, error: 'Cuerpo inválido.' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code) {
    return NextResponse.json(
      { valid: false, error: 'Ingresá el código de acceso.' },
      { status: 400 },
    );
  }

  const validCode = process.env.INVITATION_CODE_INVESTIGADOR?.trim();
  if (!validCode) {
    console.error('INVITATION_CODE_INVESTIGADOR env var not set');
    return NextResponse.json(
      { valid: false, error: 'Error de configuración del servidor.' },
      { status: 500 },
    );
  }

  if (code !== validCode) {
    return NextResponse.json(
      { valid: false, error: 'Código incorrecto.' },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ valid: true });
  res.cookies.set(INV_CODE_COOKIE, validCode, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
