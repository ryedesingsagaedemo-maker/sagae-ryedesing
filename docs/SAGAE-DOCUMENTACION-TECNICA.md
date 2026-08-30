# SAGAE — Documentación técnica completa

Última actualización: 2026-08-30 (reCAPTCHA tolerante a redes filtradas)

Este documento es la referencia de memoria del proyecto: qué hace cada
parte de SAGAE, cómo está protegido, y qué límites de capacidad tiene
tal como existe hoy. Se actualiza cada vez que algo cambia — no se
duplica en otro lado. Complementa a `docs/PLAN-VENTA-SAGAE.md` (el
roadmap de negocio) y a `apps-script/README.md`... salvo que ese
archivo ya no existe en el repositorio a propósito (ver sección 6.6).

## 1. Arquitectura general

SAGAE son cuatro piezas que comparten datos en tiempo real:

| Componente | Qué es | Para quién |
|---|---|---|
| Portal web (`index.html`) | Administración completa: inventario, tickets, usuarios, reportes | Admin, inventario, consultor |
| App móvil (`SAGAE_index_mobile.html`) | PWA instalable, enfocada en el trabajo diario del técnico | Técnicos |
| Portal público (`SAGAE_portal_reportes.html`) | Formulario abierto, sin usuario ni contraseña | Cualquier persona de la institución |
| Backend (Apps Script + Google Sheets) | Guarda los datos, valida permisos, calcula seguridad, envía correos | Invisible — el motor detrás de las otras tres |

No hay servidor propio: el backend vive en Google Apps Script, la base
de datos es una Hoja de cálculo de Google.

## 2. Portal web — módulos

- **Dashboard** — resumen de KPIs (activos operativos, tickets urgentes, etc.).
- **Departamentos** — catálogo de áreas de la institución (solo admin).
- **Personas** — directorio de personal y beneficiarios.
- **Espacios** — catálogo de aulas/oficinas con responsable y capacidad.
- **Inventario de activos** — registro de equipos tecnológicos, con "hoja de vida" (historial completo), código de barras/QR imprimible, y baja de activos sin perder su historial.
- **Mobiliario** — registro de mobiliario (por cantidad/condición, no por serie individual), con su propia ficha de detalle e historial.
- **Licencias** — control de licencias de software, alimenta las alertas de vencimiento.
- **Tickets** — bandeja de solicitudes de mantenimiento/soporte, con "expediente completo" imprimible.
- **Kanban** — la misma información de Tickets en tablero visual (Abierto/Progreso/Revisión/Cerrado).
- **Usuarios** — administración de cuentas (solo admin): rol, forzar cambio de contraseña, restablecer 2FA de otro usuario.
- **Reportes** — panel de analítica (tickets e inventario, filtrable por fecha).
- **Auditoría** — bitácora inmutable de acciones (quién, qué, cuándo).
- **Mi perfil** — autoservicio: cambiar contraseña, activar/desactivar 2FA propio.

## 3. App móvil — pantallas

- **Inicio** — resumen del día del técnico.
- **Tickets** — lista/edición rápida, "Tomar este ticket", contador de nuevos.
- **Inventario** — búsqueda y edición completa de activos (incluye reasignar responsable).
- **Mantenimientos** — vista consolidada del historial de mantenimiento de todos los activos.
- **Reportes** — estadísticas personales del técnico.
- **Escáner de código de barras/QR** — cámara del celular, busca en Activos y Mobiliario, abre la hoja de vida.

**Mobiliario es de solo consulta desde el móvil** — no se edita ahí a propósito, esa parte queda reservada al portal web.

## 4. Portal público de reportes

Formulario anónimo: nombre, correo, departamento, ubicación, tipo,
título, descripción (mín. 20 caracteres), prioridad, hasta 5 fotos. Al
enviarlo, genera un ticket real (código `TKT-XXXX`) visible de
inmediato en el portal web y en la app de técnicos.

**Protección contra abuso (agregada el 29-30 de agosto de 2026):**
- Límite por "dispositivo": 3 reportes / 5 min — **es fácil de evadir**
  (el ID de dispositivo lo genera el propio navegador, un script puede
  inventar uno nuevo por request). Frena el doble clic accidental, no
  a un atacante decidido.
- Límite global: 200 reportes/hora, del lado del servidor — este sí es
  real, pero es un presupuesto compartido: un atacante que lo agota
  también bloquea a usuarios legítimos el resto de esa hora.
- **Campo trampa (honeypot)** — un input invisible para una persona
  real; un bot que rellena el formulario a ciegas lo completa, y el
  envío se descarta en silencio (frontend y backend lo validan por
  separado).
- **reCAPTCHA v3 invisible** — activo desde el 30 de agosto de 2026 con
  clave real (`RECAPTCHA_SITE_KEY` en el frontend, `RECAPTCHA_SECRET_KEY`
  como propiedad del script en el backend). Si `RECAPTCHA_SECRET_KEY` no
  está configurada, esta capa no bloquea nada.
  - **Cuando el token de reCAPTCHA sí llega**, se verifica el puntaje
    contra Google con el mismo rigor de siempre (umbral 0.5) — un puntaje
    bajo sí bloquea el envío.
  - **Cuando el token nunca llega, se deja pasar** (no bloquea). Se
    detectó en producción (30 de agosto de 2026, colegio PCA) que redes
    escolares filtradas/dispositivos administrados (MDM) a veces impiden
    por completo que el navegador descargue el script de Google
    reCAPTCHA — sin importar cuánto se espere del lado del cliente
    (se probó una espera de hasta 6s, y persistió incluso en pestaña de
    incógnito, descartando caché). Bloquear en ese caso dejaría sin poder
    reportar a cualquier persona real en esa red. El honeypot y los
    límites por dispositivo/global quedan como la defensa anti-bot activa
    para ese escenario — es una protección más débil que la completa,
    aceptada a propósito para no bloquear reportes reales.
  - **Pendiente, no bloqueante:** pedirle a IT del colegio afectado que
    permita los dominios `google.com/recaptcha` y `gstatic.com` en su
    filtro de red, para recuperar la protección completa de reCAPTCHA ahí
    sin tocar código.

## 5. Roles y permisos

| Módulo | Admin | Técnico | Consultor | Inventario |
|---|---|---|---|---|
| Departamentos | edita | — | — | — |
| Personas / Espacios / Activos / Mobiliario / Licencias | edita | edita | solo ver | edita |
| Tickets / Kanban | edita | edita | solo ver | — |
| Auditoría | ve | — | ve | — |
| Usuarios | administra | — | — | — |
| Eliminar registros | sí | — | — | — |

Esta regla se aplica dos veces — en la pantalla y, de forma
independiente, dentro del servidor — así que no basta con ocultar un
botón para saltarla.

## 6. Seguridad

### 6.1 Login
Contraseña con hash + sal única por usuario, verificada solo en el
servidor. Bloqueo tras 5 intentos fallidos, 5 minutos, del lado del
servidor (no se salta recargando la página).

### 6.2 Verificación en dos pasos (2FA de la app)
TOTP estándar (Google Authenticator, Authy, Microsoft Authenticator),
RFC 4226/6238, implementado y verificado en producción el 28 de agosto
de 2026. Cada usuario lo activa desde "Mi perfil"; un admin puede
restablecerlo si alguien pierde su teléfono.

### 6.3 Sesiones
Sesión server-side con expiración de 30 minutos (se renueva con uso),
una sesión activa por plataforma (web/móvil). Cambiar la contraseña
cierra de inmediato cualquier sesión abierta con la clave anterior.

### 6.4 Respaldo automático
Diario, automático, a Google Drive, con rotación de los últimos 30
respaldos y aviso por correo (éxito o falla).

### 6.5 Auditoría
Bitácora permanente de acciones, no editable desde la aplicación.

### 6.6 El backend no vive en GitHub — a propósito
El código de Apps Script (`Code.gs`) se agregó brevemente al
repositorio (28 de agosto) y se retiró (29 de agosto) por decisión
explícita del dueño del proyecto — el repositorio es **público**, y
tener el backend ahí exponía toda la lógica de seguridad del servidor
a cualquiera en internet. Se eliminó del checkout actual **y del
historial completo de git** (reescrito con `git filter-repo`, no solo
borrado). Si se necesita ver o modificar el backend real, hay que
pedírselo al dueño del proyecto directamente — no reintroducirlo en el
repo sin que lo pida.

### 6.7 Seguridad de la cuenta de GitHub (29 de agosto de 2026)
- La cuenta de GitHub no usa contraseña propia — entra exclusivamente
  con "Sign in with Google". Verificado que **tiene 2FA propio de
  GitHub activado** además de eso (no se hereda automáticamente de
  Google).
- Rama `main` protegida con un ruleset activo: bloquea borrado
  (`Restrict deletions`) y reescritura de historial
  (`Block force pushes`), sin excepciones en la lista de bypass.
- Colaboradores del repositorio: solo la cuenta dueña, nadie más tiene
  acceso de escritura.
- Se escaneó todo el árbol actual y el historial completo (todas las
  ramas) por patrones de API keys, tokens y llaves privadas — no se
  encontró ninguno. El único token presente (`SAGAE_API_TOKEN`) es
  deliberadamente público (vive en el HTML de las tres apps) — es un
  filtro de tráfico de bajo valor, no una credencial real; la
  autorización real nunca sale del servidor.

## 7. Notificaciones automáticas

Por correo, en cola en segundo plano (no bloquea la respuesta al
usuario): ticket nuevo, cambio de estado/responsable, solicitud de
repuestos, activo entra/sale de mantenimiento, garantía/licencia/fecha
límite por vencer, resultado del respaldo diario.

**Límite real a tener en cuenta:** una cuenta de Gmail normal (no
Workspace) tiene cuota de **100 correos/día** vía `MailApp`. Cada
ticket notifica a varios destinatarios (no un correo, uno por
destinatario) — en un día con mucho movimiento, esa cuota se puede
agotar antes que cualquier otro límite del sistema. El ticket se sigue
creando igual (el envío de correo está en un try/catch que no bloquea
la operación), pero el aviso falla en silencio hasta la medianoche.
Si hace falta más margen, la cuenta de Google Workspace sube esa cuota
a 1,500/día sin tocar código.

## 8. Base de datos — 9 hojas

Activos, Mobiliario, Tickets, Licencias, Personas, Espacios,
Departamentos, Usuarios, Auditoría. Sin índice real (Sheets no lo
tiene) — cada lectura escanea la hoja completa (`getDataRange()`); solo
Usuarios tiene caché (10 min). Suficiente para el volumen de una
escuela, no pensado para miles de filas por hoja.

## 9. Límite de concurrencia conocido

Crear un ticket usa `LockService.getScriptLock()` — las escrituras se
sirven **una a la vez**, en fila (hasta 8 segundos de espera antes de
devolver "ocupado"). Es intencional (evita códigos duplicados), y para
el volumen real de una escuela no debería notarse — pero es el techo
real de cuántas creaciones simultáneas aguanta el sistema, no miles
por segundo.

## 10. Aplicación web progresiva (PWA)

Solo la app móvil (`start_url` en `manifest.json`): instalable en la
pantalla de inicio, pantalla completa, accesos directos a "Mis
Tickets" e "Inventario", caché con verificación de versión nueva,
notificaciones push con botón "Ver ticket".

## 11. Meta / indexado en buscadores

No hay `robots.txt` en el proyecto ni etiquetas `noindex` — tanto el
portal público (correcto, debe ser indexable) como `index.html` (el
panel de administración) son indexables por Google por defecto. No es
grave por sí solo (login con 2FA, bloqueo por intentos), pero es
exposición innecesaria — pendiente agregar un `robots.txt` que
desaliente indexar el panel de admin.

## 12. Contacto

RYE Design — `ryedesingsagaedemo@gmail.com` — 6424-5495 — WhatsApp
6225-1042.
