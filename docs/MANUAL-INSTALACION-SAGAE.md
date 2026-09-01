# Manual de instalación — SAGAE

**Versión del manual:** 1.0 — 1 de septiembre de 2026
**Basado en:** el `Code.gs` real en producción, con 2FA, restauración de
backup y protección anti-bot del portal ya incluidos — no la
reconstrucción vieja hecha desde el frontend.

> Este es el manual **completo y detallado**. Para una instalación rápida
> sin releer todo esto cada vez, usa
> [`CHECKLIST-ONBOARDING-ESCUELA.md`](CHECKLIST-ONBOARDING-ESCUELA.md)
> como lista de verificación — este documento es la referencia de fondo
> para cuando algo no sale como se espera, o para la primera vez que
> alguien nuevo hace una instalación.

---

## Índice

0. [Antes de empezar](#0-antes-de-empezar)
1. [Cuenta de Google de la escuela](#1-cuenta-de-google-de-la-escuela)
2. [Crear el Spreadsheet y las 9 hojas](#2-crear-el-spreadsheet-y-las-9-hojas)
3. [Crear el proyecto de Apps Script](#3-crear-el-proyecto-de-apps-script)
4. [Configurar las Script Properties](#4-configurar-las-script-properties)
5. [Implementar como aplicación web](#5-implementar-como-aplicación-web)
6. [Instalar los 3 triggers automáticos](#6-instalar-los-3-triggers-automáticos)
7. [Crear el primer usuario admin](#7-crear-el-primer-usuario-admin-el-paso-especial)
8. [Configurar el frontend](#8-configurar-el-frontend)
9. [reCAPTCHA en el portal público (opcional)](#9-recaptcha-en-el-portal-público-opcional)
10. [Proteger la Hoja de cálculo](#10-proteger-la-hoja-de-cálculo)
11. [Pruebas de aceptación](#11-pruebas-de-aceptación-no-saltarse-esto)
12. [Entregables legales](#12-entregables-legales)
13. [Apéndice A — Las 9 hojas y sus columnas](#apéndice-a--las-9-hojas-y-sus-columnas)
14. [Apéndice B — Problemas comunes ya resueltos una vez](#apéndice-b--problemas-comunes-ya-resueltos-una-vez)

---

## 0. Antes de empezar

**Lo que necesitas tener a mano:**
- La copia más reciente y probada de `Code.gs` (pídesela al dueño del
  proyecto directamente — por decisión de seguridad, no vive en GitHub;
  ver `CLAUDE.md`).
- Los 5 archivos del frontend: `index.html`, `SAGAE_index_mobile.html`,
  `SAGAE_portal_reportes.html`, `manifest.json`, `sw.js`.
- Una cuenta de Google propiedad **de la escuela** (no de RYE Design) —
  el modelo es una cuenta = una escuela = una Hoja = un Apps Script,
  replicado por instalación.
- El acuerdo de responsabilidad de datos firmado con la escuela **antes**
  de este punto — ver sección 12. No cargues datos reales de personas
  sin eso firmado.

**Tiempo estimado:** 45–60 minutos para alguien que ya lo hizo antes;
la primera vez, cuenta con 90 minutos y no tener prisa en el paso 7.

---

## 1. Cuenta de Google de la escuela

1. [ ] Iniciar sesión con la cuenta de Google de la escuela (no la tuya).
2. [ ] Activar verificación en dos pasos en esa cuenta: **Cuenta de
       Google → Seguridad → Verificación en dos pasos**. Esto protege
       Drive, la Hoja y el proyecto de Apps Script — es distinto del 2FA
       de la app que se activa más adelante en el paso 7.

> 💡 **Por qué esto va primero:** todo lo demás (la Hoja, el Script,
> los datos) vive dentro de esta cuenta. Si la cuenta se compromete,
> todo lo demás da igual.

---

## 2. Crear el Spreadsheet y las 9 hojas

1. [ ] Crear un Google Sheet nuevo. Nómbralo algo reconocible, por
       ejemplo `SAGAE — [Nombre de la escuela]`.
2. [ ] Crear **9 pestañas** con estos nombres **exactos** (mayúsculas y
       todo — el código busca el nombre literal, no es flexible):

   ```
   Activos
   Tickets
   Auditoria
   Usuarios
   Mobiliario
   Licencias
   Personas
   Espacios
   Departamentos
   ```

3. [ ] Borrar la hoja "Hoja 1" / "Sheet1" que Google crea por defecto,
       una vez que las 9 de arriba ya existen.

> ⚠️ **No hace falta escribir los encabezados a mano en 8 de las 9
> hojas.** El backend los crea solo la primera vez que cada hoja recibe
> un dato por la API (función `ensureHeaders`). **La única excepción es
> "Usuarios"** — ver el paso 7, porque el primer usuario se crea
> saltándose la API.

> 💡 **La lista completa de columnas de cada hoja está en el
> [Apéndice A](#apéndice-a--las-9-hojas-y-sus-columnas)** — solo
> necesitas consultarla para escribir a mano el encabezado de
> "Usuarios" en el paso 7, o si algún día quieres verificar que el
> esquema no se corrompió.

---

## 3. Crear el proyecto de Apps Script

1. [ ] Desde el propio Spreadsheet: **Extensiones → Apps Script**. Esto
       crea un proyecto **vinculado (bound)** a esta Hoja específica —
       es importante que sea así, porque el código usa
       `SpreadsheetApp.getActiveSpreadsheet()` para saber a cuál Hoja
       escribir, sin necesitar un ID hardcodeado.
2. [ ] Nombra el proyecto igual que el Spreadsheet, para no confundirte
       después con otras instalaciones.
3. [ ] Borra el contenido de ejemplo del archivo `Código.gs` y pega el
       `Code.gs` real completo que te compartió el dueño del proyecto.
4. [ ] Guarda (ícono de disco o Ctrl+S).

> ⚠️ **No mezclar código de otra instalación.** Si vas a copiar y pegar
> desde otra escuela ya instalada, asegúrate de llevar la versión más
> reciente, no una copia vieja con bugs ya corregidos en otro lado —
> ver el registro interno de instalaciones (pendiente, punto 3 del plan
> de venta) para saber cuál es la versión vigente.

---

## 4. Configurar las Script Properties

En el editor de Apps Script: **⚙️ Configuración del proyecto →
Propiedades del script → Agregar propiedad del script**.

| Propiedad | Obligatoria | Qué es | Valor |
|---|---|---|---|
| `SAGAE_API_TOKEN` | **Sí** | Filtro de tráfico obviamente ajeno — no es la autorización real (esa vive en la sesión), pero sin ella el backend rechaza toda petición, incluso el login. | Genera uno nuevo y único para esta escuela — ver abajo. |
| `RECAPTCHA_SECRET_KEY` | No — solo si vas a proteger el portal público con reCAPTCHA (ver sección 9) | Clave privada de verificación de Google reCAPTCHA. | La que te da [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) al registrar el dominio de esta instalación. |
| `DOMINIO_INSTITUCIONAL` | No — opcional | Si el correo de quien reporta no termina en este dominio, el ticket se crea igual pero queda marcado como "Correo externo" para revisarlo con más cuidado. No bloquea nada. | El dominio de correo de esta escuela, sin `@` (ej. `pca.edu.pa`). |

**Cómo generar un `SAGAE_API_TOKEN` nuevo:** cualquier cadena
suficientemente larga y aleatoria sirve — por ejemplo, en la consola del
navegador: `crypto.randomUUID().replace(/-/g,'').toUpperCase()`. Guárdalo
también en el registro interno de instalaciones — lo vas a necesitar
otra vez en el paso 8.

> ⚠️ **No reutilices el token de otra escuela.** Cada instalación es
> independiente; reutilizar el token no rompe nada técnicamente hoy,
> pero mezcla el "radio de explosión" de las instalaciones si alguna
> vez uno se filtra.

---

## 5. Implementar como aplicación web

1. [ ] **Implementar → Nueva implementación**.
2. [ ] Tipo: **Aplicación web**.
3. [ ] Descripción: algo como `v1 - instalación inicial`.
4. [ ] Ejecutar como: **Yo** (la cuenta de la escuela).
5. [ ] Quién tiene acceso: **Cualquier usuario** (así el portal público
       y la app funcionan sin que cada visitante tenga una cuenta de
       Google — la seguridad real está en la sesión y el `API_TOKEN`,
       no en esta configuración).
6. [ ] Implementar. Google va a pedir autorizar permisos la primera vez
       — es tu propio script, dale "Permitir" / "Ir a [nombre del
       proyecto] (no seguro)" si aparece esa advertencia (es normal,
       solo significa que Google no lo revisó, no que sea peligroso).
7. [ ] **Copiar la URL de implementación web** — termina en `/exec`.
       La necesitas en el paso 8.

> ⚠️ **Cada vez que cambies el código después de hoy, tienes que crear
> una "Nueva versión"** de esta misma implementación (no una
> implementación nueva desde cero) para que el cambio llegue a
> producción — **Implementar → Administrar implementaciones → ✏️ →
> Versión: Nueva versión → Implementar**. Guardar el archivo en el
> editor NO es suficiente por sí solo.

---

## 6. Instalar los 3 triggers automáticos

En el editor de Apps Script, selecciona cada función del dropdown y
dale "Ejecutar", **una por una**:

| Función | Qué hace | Frecuencia |
|---|---|---|
| `instalarTriggerBackup` | Respaldo diario de las 9 hojas a Drive (JSON, 30 días de retención) | Diario, 2:00am hora Panamá |
| `instalarTriggerNotificaciones` | Procesa la cola de avisos por correo (ticket nuevo, cambio de estado, etc.) | Cada 1 minuto |
| `instalarTriggerAlertas` | Revisa vencimientos: deadlines de tickets, garantías de activos, licencias por paquete | Diario, 8:00am hora Panamá |

> 💡 **Por qué esto no es opcional:** `instalarTriggerAlertas` existía
> en el código desde antes, pero durante mucho tiempo **nunca se
> ejecutó automáticamente** en la instalación piloto porque nadie corrió
> el instalador — quedó como código muerto sin que nadie lo notara. No
> asumas que "ya debe estar instalado"; confírmalo en cada instalación
> nueva.

**Cómo confirmar que quedaron instalados:** menú del editor de Apps
Script → reloj ⏰ "Disparadores" (columna izquierda) — deberías ver los
3 exactamente una vez cada uno. Si ves alguno duplicado o de una versión
vieja del código, bórralo y vuelve a correr el instalador correspondiente
(cada instalador borra sus propios duplicados antes de crear el nuevo,
así que simplemente volver a ejecutarlo es seguro).

---

## 7. Crear el primer usuario admin (el paso especial)

Este es el único paso de todo el proceso que **no tiene un botón en la
app** — es intencional: crear un usuario normalmente requiere ya estar
autenticado como admin, y el primer admin todavía no existe. Se rompe
ese círculo escribiendo directamente en la Hoja, por esta única vez.

### 7.1 — Escribir el encabezado de "Usuarios" a mano

En la pestaña **Usuarios**, fila 1, escribe estas columnas en este
orden exacto (el orden en sí no le importa al código — busca por
nombre, no por posición — pero mantenerlo ordenado ayuda a leer la hoja
después):

```
username | passHash | mustChange | rol | nombre | email | tel | depto | cargo | estado | fechaCreacion | ultimoAcceso | sessionToken | totpSecret | totpEnabled
```

> ⚠️ **Las últimas dos columnas (`totpSecret`, `totpEnabled`) NO
> aparecen en la lista oficial de columnas que trae el código
> (`HEADERS.usuarios`)** — se agregaron a mano en la instalación piloto
> para soportar 2FA, y el código las usa (`totpEnabled`, `totpSecret`)
> pero nunca las va a crear solo. **Si las olvidas, la app no truena de
> inmediato — truena en el momento exacto en que alguien intenta activar
> el 2FA**, con un error confuso de columna indefinida. Agrégalas ahora
> y ahórrate ese diagnóstico.

### 7.2 — Escribir la fila del primer admin

Fila 2, con estos valores (ajusta usuario/nombre/correo a los reales):

| Columna | Valor de ejemplo | Nota |
|---|---|---|
| `username` | `admin` | Lo que se escribe para iniciar sesión |
| `passHash` | *(ver dos opciones abajo)* | |
| `mustChange` | `TRUE` | Fuerza a cambiar la contraseña en el primer login — recomendado |
| `rol` | `admin` | Exacto, en minúsculas |
| `nombre` | `Administrador` | Se muestra en pantalla y en correos |
| `email` | correo real del admin | Recibe las notificaciones de backup, alertas, etc. |
| `estado` | `activo` | Cualquier valor que no sea exactamente `inactivo` funciona, pero sé explícito |
| `fechaCreacion` | fecha de hoy | Informativo |
| *(el resto)* | dejar en blanco | Se llenan solos con el uso |

**Dos formas de llenar `passHash` — elige una:**

- **Opción rápida (recomendada):** escribe la contraseña **en texto
  plano** directamente en `passHash`, por ejemplo
  `MiContraseñaTemporal2026!`. El sistema tiene una migración
  automática: en el **primer login exitoso**, si detecta que el hash
  guardado no empieza con `S2$` (formato seguro real), lo reemplaza
  automáticamente por un hash con sal — sin que nadie tenga que hacer
  nada más. Eso sí: hasta que ese primer login ocurra, la contraseña
  queda visible en texto plano en la Hoja — hazlo y entra de inmediato,
  no lo dejes así por días.
- **Opción más cautelosa:** genera el hash tú mismo antes de escribirlo,
  para no dejar nunca texto plano ni un segundo. En el editor de Apps
  Script, crea una función temporal, ejecútala una vez, copia el
  resultado del registro de ejecución, y bórrala:
  ```js
  function _generarHashTemporal_() {
    Logger.log(hashPassSeguro_("MiContraseñaTemporal2026!"));
  }
  ```
  Pega el resultado (empieza con `S2$...`) directamente en `passHash`.

### 7.3 — Probar el login

Abre la URL de implementación web (o el frontend ya apuntando a ella,
si ya hiciste el paso 8) e inicia sesión con ese usuario. Si usaste la
opción rápida, verifica después en la Hoja que `passHash` ya cambió a
formato `S2$...` — así confirmas que la migración corrió.

---

## 8. Configurar el frontend

En los **3 archivos HTML** (`index.html`, `SAGAE_index_mobile.html`,
`SAGAE_portal_reportes.html`), busca y actualiza estas dos constantes
— deben quedar **idénticas en los 3 archivos**:

```js
const API = "https://script.google.com/macros/s/TU_ID_DE_IMPLEMENTACION/exec";
const API_TOKEN = "EL_MISMO_TOKEN_QUE_PUSISTE_EN_SCRIPT_PROPERTIES";
```

- `API` → la URL que copiaste en el paso 5.
- `API_TOKEN` → el mismo valor exacto de `SAGAE_API_TOKEN` del paso 4.

Luego:

1. [ ] Sube los 5 archivos (los 3 HTML + `manifest.json` + `sw.js`) al
       hosting de esta instalación (GitHub Pages u otro).
2. [ ] Actualiza el nombre/logo de la institución donde corresponda en
       pantalla (login, encabezados, portal público) si esta escuela
       tiene su propia identidad visual.
3. [ ] Confirma que `manifest.json` y `sw.js` apuntan a las rutas
       correctas si el hosting no queda en la raíz del dominio.

> 💡 Si copiaste estos archivos desde otra instalación ya funcionando,
> **revisa los tres** — es fácil actualizar `API`/`API_TOKEN` en uno y
> olvidar los otros dos, y el síntoma es confuso (una pantalla funciona,
> otra dice "conectando..." para siempre).

---

## 9. reCAPTCHA en el portal público (opcional)

Solo si esta instalación va a usar la protección anti-bot del portal
de reportes (recomendado si el portal es público, no solo de uso
interno):

1. [ ] Entra a [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
       con la cuenta de la escuela.
2. [ ] Crea un sitio nuevo, tipo **reCAPTCHA v3**.
3. [ ] Agrega el **dominio real** donde va a vivir
       `SAGAE_portal_reportes.html` (el dominio exacto, sin `https://`
       — por ejemplo `nombreescuela.github.io`, no solo el nombre de
       cuenta).
4. [ ] Copia la **Site key** → pégala en `RECAPTCHA_SITE_KEY` dentro de
       `SAGAE_portal_reportes.html`.
5. [ ] Copia la **Secret key** → pégala como `RECAPTCHA_SECRET_KEY` en
       las Script Properties (paso 4) — nunca en el HTML, esa sí debe
       quedar privada.

> ⚠️ **Advertencia real de la instalación piloto:** algunos celulares
> con apps de control parental/MDM (Securly, GoGuardian, Bark, etc.)
> bloquean por completo el script de Google reCAPTCHA, sin importar la
> red (wifi o datos móviles). El sistema **ya está diseñado para no
> bloquear un reporte real en ese caso** — si el token nunca llega, deja
> pasar el envío en vez de rechazarlo, apoyándose en el campo trampa
> (honeypot) y los límites por dispositivo como respaldo. No es un bug
> si ves eso pasar — es la decisión de diseño ya tomada.

---

## 10. Proteger la Hoja de cálculo

Esto está documentado en el propio encabezado de `Code.gs` — se repite
aquí para que no se pierda en medio del código:

1. [ ] **Datos → Proteger hojas y rangos** — proteger la hoja ENTERA de
       cada una de las 9 pestañas, con excepción de que solo la propia
       ejecución del script (no personas humanas) pueda editar.
2. [ ] Bloquear la **Fila 1** (encabezados) en las 9 hojas — sin
       excepciones, nadie debe poder cambiar un nombre de columna sin
       darse cuenta de que rompe el sistema.
3. [ ] **Archivo → Historial de versiones → Activar** — permite
       recuperar cualquier versión anterior ante un error humano, sin
       tener que llegar hasta el backup diario.
4. [ ] Si vas a compartir la Hoja con alguien más de la escuela, hazlo
       siempre en modo **Comentarista** o **Lector**, nunca Editor —
       el único con acceso de Editor debe ser la cuenta dueña.

---

## 11. Pruebas de aceptación (no saltarse esto)

Antes de darle la instalación por terminada:

- [ ] **Login** con el admin creado en el paso 7, en el portal web y en
      la app móvil.
- [ ] **2FA**: activar TOTP desde "Mi perfil" con Google Authenticator
      (o similar) y confirmar que pide el código en el siguiente login.
- [ ] **Ticket de prueba** desde el portal público — confirmar que
      aparece de inmediato en el panel web y que llega la notificación
      por correo.
- [ ] **Backup manual**: ejecutar `backupManual()` desde el editor,
      confirmar que aparece el archivo en la carpeta
      `SAGAE_Backups_[nombre de la Hoja]` en Drive.
- [ ] **Restauración**: ejecutar `restaurarUltimoBackupManual()` una
      vez, confirmar que llega el correo con el link a un Spreadsheet
      nuevo y que el resumen de registros coincide con lo esperado (ver
      sección 6.4 de `SAGAE-DOCUMENTACION-TECNICA.md` para el
      procedimiento completo, ya confirmado funcionando en la
      instalación piloto).
- [ ] **Permisos por rol**: crear un usuario no-admin y confirmar que
      no ve ni puede tocar lo que su rol no permite (ver la tabla de
      roles en `SAGAE-DOCUMENTACION-TECNICA.md`).

---

## 12. Entregables legales

- [ ] Aviso de privacidad entregado a la escuela para que lo publique:
      [`docs/legal/AVISO-DE-PRIVACIDAD-PLANTILLA.md`](legal/AVISO-DE-PRIVACIDAD-PLANTILLA.md)
- [ ] Acuerdo de responsabilidad de datos firmado por ambas partes:
      [`docs/legal/ACUERDO-DE-RESPONSABILIDAD-DE-DATOS-PLANTILLA.md`](legal/ACUERDO-DE-RESPONSABILIDAD-DE-DATOS-PLANTILLA.md)

Esto debe estar firmado **antes** de cargar datos reales de personas —
no después, aunque la instalación técnica ya esté lista.

---

## Apéndice A — Las 9 hojas y sus columnas

Copiado directamente de la constante `HEADERS` en `Code.gs` — si algún
día una hoja "se ve rara", esta es la fuente de verdad para comparar.

| Hoja | Columnas |
|---|---|
| **Activos** | `codigo, nombre, tipo, estado, marca, modelo, serial, ubicacion, asignado, asignadoEmail, asignadoCargo, responsableEspacioEmail, depto, compra, garantia, valor, vida, obs, foto, historial, fechaCreacion` |
| **Tickets** | `codigo, titulo, activoId, activoNombre, resp, tipo, prior, estado, avance, dead, proy, desc, foto, historial, fechaCreacion, fotos` |
| **Auditoria** | `ts, usuario, nombre, rol, accion, tipo, codigo, detalle` |
| **Usuarios** | `username, passHash, mustChange, rol, nombre, email, tel, depto, cargo, estado, fechaCreacion, ultimoAcceso, sessionToken` **+ `totpSecret, totpEnabled`** (agregadas a mano, ver sección 7.1) |
| **Mobiliario** | `codigo, nombre, tipo, cantidad, condicion, ubicacion, depto, material, color, valor, foto, obs, estado, historial, fechaCreacion` |
| **Licencias** | `codigo, nombre, proveedor, planVersion, claveLicencia, fechaInicio, fechaVencimiento, costoAnual, cantidadTotal, estado, obs, instalaciones, historial, fechaCreacion` |
| **Personas** | `codigo, nombre, cargo, depto, email, tel, espacioResponsable, obs, estado, fechaCreacion` |
| **Espacios** | `codigo, nombre, tipo, depto, ubicacion, responsableNombre, responsableEmail, capacidad, obs, estado, fechaCreacion` |
| **Departamentos** | `codigo, nombre, desc, responsable, estado, fechaCreacion` |

Prefijos de código automáticos generados por el backend (no se escriben
a mano, salvo el primer usuario del paso 7): `ACT-####` (Activos),
`TKT-####` (Tickets), `MOB-####` (Mobiliario), `LIC-####` (Licencias),
`PER-####` (Personas), `ESP-####` (Espacios), `DEP-###` (Departamentos).

---

## Apéndice B — Problemas comunes (ya resueltos una vez)

Cosas que salieron mal en la instalación piloto, para no repetirlas:

| Síntoma | Causa real | Ya corregido en este `Code.gs` |
|---|---|---|
| "Mi perfil" en blanco / cambio de contraseña falla en silencio para roles distintos de admin | El frontend buscaba al usuario en un arreglo que solo se carga completo para admins | ✅ Sí — acción `mi_perfil` propia |
| Activar 2FA da "Código incorrecto" siempre | Se usó un nombre de método de Apps Script que no existe (`computeHmacSha1Signature`) en un intento anterior | ✅ Sí — usa `Utilities.computeHmacSignature(...HMAC_SHA_1...)`, el real |
| Portal público rechaza un reporte real con "Demasiados reportes enviados..." | Puede ser el campo trampa (honeypot) autocompletado por el navegador, **o** el token de reCAPTCHA que nunca llegó (dispositivo con control parental/MDM que bloquea el script de Google) | ✅ Sí — honeypot con nombre no genérico + `readonly` hasta el foco; reCAPTCHA no bloquea si el token nunca llega |
| Activar 2FA truena con un error de columna indefinida | Faltan las columnas `totpSecret`/`totpEnabled` en la hoja Usuarios — no las crea nadie solo | Ver sección 7.1 de este manual — agrégalas al escribir el encabezado |
| Las alertas de vencimiento (garantías, licencias, deadlines) nunca llegan | El trigger `instalarTriggerAlertas` nunca se ejecutó — el código existía pero estaba "muerto" sin disparador | Ver sección 6 — confírmalo explícitamente, no lo asumas |
