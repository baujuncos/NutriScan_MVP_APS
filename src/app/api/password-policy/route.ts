import { NextRequest, NextResponse } from 'next/server';
import { getPasswordValidationErrors } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (typeof password !== 'string') {
      return NextResponse.json(
        { valid: false, errors: ['La contraseña es requerida.'] },
        { status: 400 },
      );
    }

    const errors = getPasswordValidationErrors(password);
    return NextResponse.json({ valid: errors.length === 0, errors });
  } catch {
    return NextResponse.json(
      { valid: false, errors: ['No se pudo validar la contraseña.'] },
      { status: 500 },
    );
  }
}
