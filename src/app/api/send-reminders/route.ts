import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Configuración desde variables de entorno
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FROM_EMAIL = 'no-reply@nutriscan.app.resend.dev'; // Remitente Resend sandbox

// Comidas importantes
const MAIN_MEALS = ['desayuno', 'almuerzo', 'merienda', 'cena'];

export const runtime = 'edge'; // Para Vercel Edge Functions


export async function POST(req: NextRequest) {
  // Solo permitir ejecución por cron (POST)

  // Fecha de hoy (zona local Argentina)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fecha = today.toISOString().slice(0, 10);
 // const fecha = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

  // 1. Traer usuarios particulares y deportistas
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('user_id, nombre, email, role')
    .in('role', ['particular', 'deportista_ucc']);

  if (userError) {
    return NextResponse.json({ error: 'Error consultando usuarios', details: userError }, { status: 500 });
  }

  // 2. Traer ingestas de hoy para todos los usuarios
  const { data: ingestas, error: ingestasError } = await supabase
    .from('ingestas')
    .select('id_usuario, tipo')
    .eq('fecha', fecha);

  if (ingestasError) {
    return NextResponse.json({ error: 'Error consultando ingestas', details: ingestasError }, { status: 500 });
  }

  // 3. Armar recordatorios
  const reminders = users
    ?.map((user) => {
      const comidasHoy = ingestas
        ?.filter((i) => i.id_usuario === user.user_id)
        .map((i) => i.tipo);
      const faltantes = MAIN_MEALS.filter((m) => !comidasHoy?.includes(m));
      if (faltantes.length > 0 && user.email) {
        return {
          email: user.email,
          nombre: user.nombre,
          faltantes,
        };
      }
      return null;
    })
    .filter(Boolean) as { email: string; nombre: string; faltantes: string[] }[];

  // 4. Enviar mails en paralelo
  const results = await Promise.all(
    reminders.map(async ({ email, nombre, faltantes }) => {
      const html = `<p>Hola ${nombre || ''},<br><br>
      Notamos que hoy no registraste todas tus comidas principales en NutriScan.<br>
      Te faltó cargar: <b>${faltantes.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}</b>.<br><br>
      ¡Recordá que un registro completo ayuda a tu salud y a la investigación!<br><br>
      <a href="https://nutriscan.vercel.app/">Ingresar a NutriScan</a>
      <br><br>Equipo NutriScan</p>`;
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'Recordatorio: registrá tus comidas en NutriScan',
          html,
        });
        return { email, status: 'sent' };
      } catch (e) {
        return { email, status: 'error', error: e };
      }
    })
  );

  return NextResponse.json({ sent: results.length, results });
}
