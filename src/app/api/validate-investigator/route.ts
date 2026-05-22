import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Código requerido.' }, { status: 400 });
    }

    const validCode = process.env.INVITATION_CODE_INVESTIGADOR;

    if (!validCode) {
      console.error('INVITATION_CODE_INVESTIGADOR env var not set');
      return NextResponse.json(
        { valid: false, error: 'Error de configuración del servidor.' },
        { status: 500 },
      );
    }

    const isValid = code.trim() === validCode.trim();

    return NextResponse.json({ valid: isValid });
  } catch {
    return NextResponse.json({ valid: false, error: 'Error del servidor.' }, { status: 500 });
  }
}
