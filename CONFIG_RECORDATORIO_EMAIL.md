# Configuración de recordatorio automático por email con Resend y Supabase en Vercel

Este instructivo te guía para que el recordatorio diario de comidas funcione correctamente en tu proyecto NutriScan desplegado en Vercel.

---

## 1. Variables de entorno necesarias

Debes agregar estas variables en tu proyecto de Vercel:

| Nombre                        | Descripción                                      |
|-------------------------------|--------------------------------------------------|
| RESEND_API_KEY                | API Key de tu cuenta Resend                      |
| NEXT_PUBLIC_SUPABASE_URL      | URL de tu proyecto Supabase                      |
| SUPABASE_SERVICE_ROLE_KEY     | Service Role Key de Supabase (NO la anon key)    |

**¿Dónde encontrarlas?**
- **RESEND_API_KEY:** Entra a https://resend.com/api-keys y copia tu clave.
- **NEXT_PUBLIC_SUPABASE_URL:** En el panel de Supabase, sección API, campo "Project URL".
- **SUPABASE_SERVICE_ROLE_KEY:** En el panel de Supabase, sección API, campo "Service Role Key".

**Cómo agregarlas:**
1. Ve a tu proyecto en https://vercel.com/dashboard
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

- El remitente de los mails será `no-reply@nutriscan.app.resend.dev` (sandbox de Resend, funciona sin dominio propio).
- El endpoint `/api/send-reminders` ya está listo para producción y envía mails solo a usuarios "particular" y "deportista_ucc" que no hayan registrado todas las comidas principales del día.
- Si necesitas cambiar el horario, ajusta el campo **Schedule** en el cron job.

---

¿Dudas? Consultá este archivo o pedí ayuda a tu equipo técnico.
