
# Configuración de recordatorio automático por email con Nodemailer y Gmail

Este instructivo te guía para que el recordatorio diario de comidas funcione correctamente en tu proyecto NutriScan usando Nodemailer y una cuenta de Gmail personal.

---

## 1. Variables de entorno necesarias

Debes agregar estas variables en tu proyecto (local o en Vercel):

| Nombre                | Descripción                                 |
|-----------------------|---------------------------------------------|
| GMAIL_USER            | Dirección de Gmail que enviará los mails    |
| GMAIL_PASS            | Contraseña de aplicación de Gmail           |
| NEXT_PUBLIC_SUPABASE_URL | URL de tu proyecto Supabase              |
| SUPABASE_SERVICE_ROLE_KEY | Service Role Key de Supabase            |

**¿Dónde encontrarlas?**
- **GMAIL_USER:** Tu dirección de Gmail (ej: tunombre@gmail.com)
- **GMAIL_PASS:** Debe ser una "contraseña de aplicación" generada en https://myaccount.google.com/apppasswords (no tu contraseña normal)
- **NEXT_PUBLIC_SUPABASE_URL:** En el panel de Supabase, sección API, campo "Project URL".
- **SUPABASE_SERVICE_ROLE_KEY:** En el panel de Supabase, sección API, campo "Service Role Key".

**Cómo agregarlas:**
1. Ve a tu proyecto en https://vercel.com/dashboard (o tu entorno local)
2. Settings > Environment Variables
3. Agrega cada variable con su valor correspondiente.

---

## 2. Configurar el cron en Vercel

1. Ve a **Settings > Cron Jobs** en tu proyecto de Vercel.
2. Haz click en **Add Cron Job**.
3. Configura así:
   - **Path:** `/api/send-reminders`
   - **Schedule:** `0 2 * * *`  (esto es todos los días a las 23:00 hora Argentina, UTC-3)
   - **Region:** us-east-1 (o la que uses por defecto)

---

## 3. Probar manualmente (opcional)

Puedes hacer un POST a `/api/send-reminders` desde Postman, curl o tu navegador para probar el endpoint antes de esperar al cron.

---

## 4. Notas importantes

- El remitente de los mails será tu cuenta de Gmail configurada en `GMAIL_USER`.
- Debes usar una contraseña de aplicación de Gmail, no tu contraseña normal.
- Si tienes 2FA en tu cuenta de Google, es obligatorio usar contraseña de aplicación.
- El endpoint `/api/send-reminders` envía mails solo a usuarios "particular" y "deportista_ucc" que no hayan registrado todas las comidas principales del día.
- Si necesitas cambiar el horario, ajusta el campo **Schedule** en el cron job.
- No compartas tu contraseña de aplicación ni la subas al repositorio.

---

¿Dudas? Consultá este archivo o pedí ayuda a tu equipo técnico.
