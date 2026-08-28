# Backend de Apps Script

`Code.gs` es una copia de respaldo, para control de versiones, del código
que corre en el proyecto real de Google Apps Script vinculado a la Hoja de
cálculo de SAGAE ("SAGAE RYE 2026"). Apps Script no se integra nativamente
con git, así que este archivo se actualiza a mano cada vez que el código
real cambia — no se despliega automáticamente desde aquí.

**Para desplegar un cambio real:** copia el contenido de `Code.gs`, pégalo
completo en el editor de Apps Script (reemplazando el archivo `Código.gs`
del proyecto), guarda, y crea una nueva versión desde
`Implementar → Administrar implementaciones`.

Incluye:
- CRUD server-side para todas las hojas (activos, tickets, mobiliario, personas, espacios, departamentos, licencias, auditoría, usuarios).
- Autenticación con hash de contraseña por usuario (`S2$salt$hash`), bloqueo por intentos fallidos, sesiones server-side con expiración y una sesión activa por plataforma (web/mobile).
- Verificación en dos pasos (TOTP / Google Authenticator) — RFC 4226/6238.
- Cierre automático de sesiones activas al cambiar la contraseña.
- Notificaciones por correo (tickets, alertas de garantías/licencias).
- Portal público de reportes con límite de tasa.
