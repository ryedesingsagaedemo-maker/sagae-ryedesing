# Registro interno de instalaciones — SAGAE

> **Uso interno de RYE Design — no se comparte con las escuelas.** Este
> documento es la única forma de saber, sin adivinar, qué escuela tiene
> qué versión del sistema. Sin esto, aplicar un arreglo como el de hoy
> (el bug de `computeHmacSha1Signature`) a varias instalaciones por
> separado se vuelve caótico — y es fácil dejar una escuela atrás sin
> darse cuenta.
>
> **Actualizar esta tabla cada vez que:** se instala una escuela nueva,
> se propaga un arreglo (ver
> [`PROCESO-PROPAGAR-ARREGLOS.md`](PROCESO-PROPAGAR-ARREGLOS.md)), o
> cambia algún dato de contacto.

## Instalaciones activas

| # | Escuela | Contacto | Cuenta de Google | Fecha de instalación | Versión de `Code.gs` | Dominio del frontend | reCAPTCHA | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | SAGAE RYE 2026 (piloto — colegio PCA) | [nombre del contacto en PCA] · soportepca@pca.edu.pa | ryedesingsagaedemo@gmail.com | 26 jul 2026 (aprox.) | **2026-09-01** — incluye restauración de backups (ver historial abajo) | ryedesingsagaedemo-maker.github.io/sagae-ryedesing | ✅ Activo (`RECAPTCHA_SITE_KEY` registrada para este dominio) | Instalación de referencia — todo se prueba aquí primero |
| 2 | *(sin instalar)* | | | | | | | |
| 3 | *(sin instalar)* | | | | | | | |
| 4 | *(sin instalar)* | | | | | | | |
| 5 | *(sin instalar)* | | | | | | | |

Al instalar una escuela nueva, agrega su fila siguiendo el
[`MANUAL-INSTALACION-SAGAE.md`](MANUAL-INSTALACION-SAGAE.md) y el
[`CHECKLIST-ONBOARDING-ESCUELA.md`](CHECKLIST-ONBOARDING-ESCUELA.md).

## Historial de versiones de `Code.gs`

Como el backend real no vive en git (ver `CLAUDE.md`), no hay números
de versión automáticos — se rastrea por **fecha del cambio más
reciente aplicado**. Esta lista es la referencia para saber qué
significa cada fecha que aparece en la columna "Versión" de arriba.

| Fecha | Qué trae esa versión |
|---|---|
| 2026-08-28 | Verificación en dos pasos (TOTP), cierre de sesión al cambiar contraseña, corrección de "Mi perfil" para roles no-admin |
| 2026-08-30 | Protección anti-bot del portal público (honeypot + reCAPTCHA v3 + límites) |
| 2026-09-01 | reCAPTCHA tolerante cuando el token nunca llega (dispositivos con control parental/MDM); historial de instalación/remoción de licencias en el activo; **restauración de backups** (`restaurarBackupDesdeArchivo`, `restaurarUltimoBackupManual`) |

Cuando se aplique un cambio nuevo al backend, agregar una fila aquí
**antes** de propagarlo (ver el proceso de propagación) — así la fecha
que se pone en el registro de instalaciones siempre corresponde a algo
documentado.

## Dominio del frontend (por qué importa)

Cada instalación, al día de hoy, tiene su **propio hosting** para los
3 archivos HTML (no comparten el repo de GitHub de la instalación
piloto) — ver sección 8 del manual de instalación. El dominio exacto
importa porque:

- Es el que se registra en el admin de reCAPTCHA (si esa instalación
  lo usa) — un dominio mal anotado aquí puede hacer perder tiempo
  después diagnosticando por qué reCAPTCHA "no funciona" en una
  escuela.
- Es donde hay que ir a actualizar los archivos cuando se propaga un
  arreglo que toca el frontend, no solo el backend.
