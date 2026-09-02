# SAGAE — Documentación técnica completa

Última actualización: 2026-08-31 (restauración de backups)

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
- Límite por "dispositivo": 3 reportes / 5 min — es la más débil de
  las tres capas de esta lista. Frena el doble clic accidental, no a
  alguien decidido a evadirla (detalle del mecanismo y su debilidad:
  preguntarle directamente al desarrollador, no documentado aquí a
  propósito).
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
    detectó en producción (30 de agosto de 2026, colegio PCA) en un
    celular donde el script de Google reCAPTCHA nunca lograba cargar —
    sin importar cuánto se espere del lado del cliente (se probó una
    espera de hasta 6s), y sin ser un tema de red: falló igual por wifi y
    por datos móviles, y persistió en pestaña de incógnito (descarta
    caché). Todo apunta a que es el **dispositivo**, no la red — ese
    celular tampoco permite tomar capturas de pantalla, lo cual es típico
    de una app de control parental/MDM instalada en el equipo (Securly,
    GoGuardian, Bark, Family Link, etc.) que filtra tráfico sin importar
    cómo se conecte. Bloquear el envío en ese caso dejaría sin poder
    reportar a esa persona sin importar la red que use. El honeypot y los
    límites por dispositivo/global quedan como la defensa anti-bot activa
    para ese escenario — es una protección más débil que la completa,
    aceptada a propósito para no bloquear reportes reales.
  - **Pendiente, no bloqueante:** identificar qué app de control tiene
    ese dispositivo específico y, si aplica, pedir que permita los
    dominios `google.com/recaptcha` y `gstatic.com` en su lista blanca,
    para recuperar la protección completa de reCAPTCHA ahí sin tocar
    código.
- **Marca de correo externo** (agregada el 1 de septiembre de 2026) —
  opcional, desactivada por defecto. Si se configura la Script Property
  `DOMINIO_INSTITUCIONAL` (ej. `pca.edu.pa`), cualquier reporte cuyo
  correo no termine en ese dominio **se crea igual** (nunca se bloquea
  ni se pierde), pero queda marcado con `⚠️ [Correo externo]` al
  inicio del título y con un evento de alerta en su historial, para que
  el equipo técnico lo revise con más cuidado antes de actuar — sin
  descartar reportes reales de padres de familia o proveedores externos.

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

### 6.4 Respaldo automático y restauración
Diario, automático, a Google Drive, con rotación de los últimos 30
respaldos y aviso por correo (éxito o falla).

**Restauración (agregada el 31 de agosto de 2026):** antes solo existía
la creación del respaldo — no había ninguna forma de recuperarlo. Ahora
`restaurarBackupDesdeArchivo(nombreArchivo)` (o `restaurarUltimoBackupManual`
para correrlo a mano desde el editor de Apps Script, como ya se hace con
`backupManual`) restaura un backup elegido — o el más reciente, por
defecto — en un **Spreadsheet completamente nuevo**. **Nunca escribe
sobre la Hoja en producción**, solo la lee para reconciliar el esquema
de columnas actual contra el del backup (por si cambió desde que se
generó). Al terminar, manda un correo a los administradores con el link
a la copia nueva, el conteo de filas restauradas por hoja, y cualquier
advertencia (columnas nuevas o eliminadas desde ese backup).
**Confirmado en producción el 1 de septiembre de 2026:** ejecutado en
la instalación actual — restauró las 9 hojas completas en ~12 segundos,
sin ninguna advertencia de esquema, sin tocar la Hoja real.

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

### 7.1 Entrada/salida de mantenimiento — un solo camino, gestionado por el ticket

**Versión final (2026-09).** Antes de esto hubo una versión intermedia
donde editar el activo, el modal "Registrar mantenimiento" y los
tickets podían los tres marcar "entrada a mantenimiento" — se descartó
esa versión porque, aunque las tres avisaban correctamente por correo,
seguía habiendo tres puertas distintas para lo mismo y no era obvio
para el usuario cuál usar. El diseño final deja **un solo camino real**:

- **El ticket (Tipo = Mantenimiento) es el único lugar que cambia
  `activo.estado` a/desde `'mantenimiento'`.** Dos acciones separadas,
  cada una un momento real distinto:
  - **Crear el ticket** vinculado a un activo — solo significa "se
    reportó/solicitó". NO marca el activo en mantenimiento todavía
    (a propósito: el momento de crear el ticket casi nunca coincide
    con el momento real en que el equipo llega a manos de IT).
  - **"📥 Confirmar recepción del equipo"** — botón aparte dentro del
    ticket ya creado (`confirmarRecepcionMantenimiento()` en
    `index.html`; `confirmarRecepcionMantenimientoMobile()` en
    `SAGAE_index_mobile.html`), visible solo si el ticket es de
    mantenimiento, está vinculado a un activo, y ese activo **no** está
    ya en mantenimiento. El técnico lo pulsa cuando tiene el equipo
    físicamente en sus manos — ese clic es el verdadero momento de
    entrada, y es el único disparador de `marcarEntradaMantenimiento()`.
    Junto al botón hay un campo **"¿Quién entrega el equipo?"** (nombre
    + correo), sugerido por defecto con el asignado registrado del
    activo pero editable — cubre el caso de que otra persona sea quien
    físicamente lo lleve a IT, para que el correo de aviso le llegue a
    quien corresponde y no siempre al dueño registrado. También se
    puede adjuntar una foto opcional del estado del equipo en ese
    momento, que queda ligada al evento `Entrada a Mantenimiento` en el
    historial del activo (visible ahí, no se envía por correo).
  - **Cerrar el ticket** (`estado` → `cerrado`) con el checkbox "✅
    Marcar el equipo vinculado como devuelto de mantenimiento"
    (marcado por defecto), el campo simétrico **"¿A quién se le
    entrega el equipo de vuelta?"** (mismo patrón que el de entrada), el
    campo **"Condición del equipo al devolver"**, y una foto opcional
    (misma lógica: queda en el historial del activo, no en el correo) —
    dispara `marcarSalidaMantenimiento()`.
    **El estado final del activo depende de la condición elegida, no
    siempre es `'activo'`:** si la condición es "No se pudo reparar" o
    "Reemplazado por equipo nuevo", el activo pasa a `estado:'descarte'`
    en vez de reactivarse — la lógica entiende que ese equipo ya no
    vuelve a servicio. Cualquier otra condición ("Reparado — funciona
    correctamente", "Reparado con observaciones", "Sin reparación —
    pieza pendiente") lo regresa a `estado:'activo'`. Esta regla vive
    dentro de `marcarSalidaMantenimiento()` (y su espejo
    `marcarSalidaMantenimientoMobile()`), no en la pantalla que la
    llama, así que aplica siempre sin importar desde dónde se cierre el
    ticket.
- **"Editar activo" ya NO permite tocar el campo Estado hacia/desde
  `mantenimiento` a mano** — `saveActivo()` (web) y el guardado de
  activo en `SAGAE_index_mobile.html` bloquean esa transición
  específica con un mensaje que remite al ticket vinculado. El resto de
  transiciones de estado (activo↔disponible↔descarte) se sigue editando
  libremente ahí.
- **El modal "Registrar mantenimiento" (`saveMant()`) es solo bitácora.**
  Cualquier tipo elegido ahí (incluido "Entrega de equipo") se agrega
  al historial como una nota de trabajo, pero **ya no cambia el estado
  del activo ni dispara entrada/salida** — eso solo pasa por el ticket.
  Esa pantalla tiene su propia galería de fotos ("Fotos del ticket" /
  "Fotos generales del ticket" en el ticket, y las del evento de
  bitácora en el modal de mantenimiento) que es **distinta** de las
  fotos de entrada/salida: las generales documentan el caso pero no
  quedan ligadas a ningún evento del historial del activo; las de
  entrada/salida sí. La UI lo aclara con una nota corta en cada campo
  de foto, precisamente para que no se confundan.

`marcarEntradaMantenimiento()` / `marcarSalidaMantenimiento()` (en
`index.html`, arriba de `openActivo()`) y sus espejos
`marcarEntradaMantenimientoMobile()` / `marcarSalidaMantenimientoMobile()`
(en `SAGAE_index_mobile.html`) siguen siendo las únicas funciones que
escriben `Entrada a Mantenimiento` / `Salida de Mantenimiento` en el
historial del activo y que cambian su `estado` — cada una tiene un
único llamador por plataforma (el botón de confirmar recepción, y el
cierre del ticket, respectivamente). Los nombres de campo son
idénticos entre la versión web y la móvil a propósito, para que un
evento creado desde el celular se lea igual de bien si el mismo activo
se abre después en la web, y viceversa. El backend sigue disparando el
correo mirando el **último** evento del historial del activo
(`despacharNotificacion_` en `Code.gs`); las fotos nunca viajan por
correo (`compactarEventoHistorial_` las descarta a propósito antes de
encolar la notificación), solo quedan guardadas en el historial del
activo.

**Trazabilidad:** cada paso queda registrado dos veces — una vez en el
historial del **activo** (vía las funciones centrales, que es lo que
alimenta el Expediente del activo y el reporte de mantenimientos) y
otra vez en el historial del **ticket** (evento `'📥 Equipo recibido
por IT'` al confirmar recepción, más el evento normal de cierre). Nada
de lo que le pasa a un activo por esta vía queda sin anotar en su
propio historial.

Se corrigió de paso un bug preexistente en `openTicket()`: el campo
Tipo del ticket nunca se rellenaba al abrir un ticket para editar
(quedó accidentalmente dentro de un comentario de JS), así que guardar
cualquier cambio en un ticket de mantenimiento sin tocar el dropdown
Tipo lo reescribía en silencio a "Incidencia". Ya corregido.

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
