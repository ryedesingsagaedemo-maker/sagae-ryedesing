# Checklist de onboarding — nueva instalación de SAGAE

> Lista corta de verificación para repetir la instalación en una escuela
> nueva **sin saltarse pasos de seguridad** por ir rápido. No reemplaza
> el manual detallado (pendiente de actualizar al backend real — punto 1
> de "Primera etapa" en `docs/PLAN-VENTA-SAGAE.md`) — es el resumen
> operativo para marcar mientras se instala.
>
> Imprime esto o cópialo como una tarea nueva por cada escuela, y ve
> marcando cada casilla en orden. No pases a la siguiente fase con
> casillas sin marcar.

---

## Fase A — Antes de tocar nada técnico (con la escuela)

- [ ] Firmado el **acuerdo de responsabilidad de datos** con la escuela
      (`docs/legal/ACUERDO-DE-RESPONSABILIDAD-DE-DATOS-PLANTILLA.md`)
- [ ] Entregado el **aviso de privacidad** (`docs/legal/AVISO-DE-PRIVACIDAD-PLANTILLA.md`)
      para que la escuela lo publique hacia su propia comunidad
- [ ] Definido quién es el **contacto/admin principal** de la escuela
      (nombre, correo, teléfono)
- [ ] Definido el **nombre de la institución** tal como debe aparecer en
      el sistema (logo, encabezados, correos de notificación)

## Fase B — Cuenta de Google de la escuela

- [ ] Verificación en dos pasos (2FA) **activada en la cuenta de Google**
      de la escuela (Drive/Sheets/Apps Script) — no confundir con el 2FA
      propio de la app, este protege la cuenta dueña de todo
- [ ] Confirmado que **solo esa cuenta** tiene acceso de Editor a la Hoja
      de cálculo — nadie más agregado como colaborador
- [ ] Correo de la cuenta anotado para el registro interno (Fase F)

## Fase C — Backend (Google Sheet + Apps Script)

- [ ] Hoja de cálculo nueva creada, con las 9 hojas y sus encabezados
      (Activos, Mobiliario, Tickets, Licencias, Personas, Espacios,
      Departamentos, Usuarios, Auditoría)
- [ ] Proyecto de Apps Script vinculado a esa Hoja, con la versión **más
      reciente y probada** de `Code.gs` pegada (confirmar contra el
      registro de instalaciones cuál es la última versión estable)
- [ ] Script Properties configuradas — **cada escuela tiene las suyas
      propias, nunca se copian de otra instalación**:
      `RECAPTCHA_SECRET_KEY` (si esta instalación va a usar el portal
      público con protección anti-bot) y `DOMINIO_INSTITUCIONAL` (ej.
      `pca.edu.pa`, sin la `@` — si esta escuela quiere marcar como
      "correo externo" los reportes que no vengan de su propio dominio;
      opcional, no bloquea nada si no se configura)
- [ ] Implementado como aplicación web (**Implementar → Nueva
      implementación**), URL de despliegue copiada
- [ ] Triggers instalados desde la barra "Sistema" del panel de
      Auditoría (o manualmente desde el editor): backup automático
      diario, cola de notificaciones, alertas de vencimiento
- [ ] `API_TOKEN` **nuevo y único para esta escuela** generado — nunca
      reutilizar el token de otra instalación

## Fase D — Frontend

- [ ] `index.html`, `SAGAE_index_mobile.html`, `SAGAE_portal_reportes.html`,
      `manifest.json`, `sw.js` copiados a la ubicación de hosting de esta
      instalación
- [ ] Constante `API` (URL de despliegue de Apps Script) y `API_TOKEN`
      actualizados en los 3 archivos HTML
- [ ] Si el portal público usa reCAPTCHA: dominio real de esta
      instalación registrado en [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin),
      `RECAPTCHA_SITE_KEY` actualizado en `SAGAE_portal_reportes.html`
- [ ] Nombre/logo de la institución confirmado en pantalla (login,
      encabezados, portal público)

## Fase E — Primer usuario y prueba en vivo

- [ ] Primer usuario admin creado, con **contraseña fuerte** (no el
      mínimo de 6 caracteres — usar algo largo y único para esta
      instalación)
- [ ] 2FA (TOTP / Google Authenticator) activado en esa cuenta admin
      desde "Mi perfil"
- [ ] Inicio de sesión de prueba confirmado en el **portal web** y en la
      **app móvil**
- [ ] Ticket de prueba creado desde el **portal público** y notificación
      de correo confirmada
- [ ] `backupManual()` ejecutado una vez y archivo confirmado en la
      carpeta de Drive correspondiente
- [ ] (Recomendado en la primera instalación de cada lote, no
      obligatorio cada vez) `restaurarUltimoBackupManual()` probado al
      menos una vez, siguiendo el mismo procedimiento ya confirmado en
      la instalación piloto

## Fase F — Cierre

- [ ] Instalación agregada al **registro interno** (punto 3 de "Primera
      etapa"): escuela, cuenta de Google, versión de `Code.gs`, fecha,
      contacto
- [ ] Implementaciones viejas "Sin título" archivadas en "Gestionar
      implementaciones" del editor de Apps Script
- [ ] Confirmado con el contacto de la escuela que el aviso de
      privacidad ya está publicado hacia su comunidad
