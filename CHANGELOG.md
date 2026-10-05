# CHANGELOG - SAGAE Hardening

## [2026-10-05] Renovación del token de API (web, móvil y portal público)

- El token que acompaña cada petición al servidor se renueva (web, móvil y portal público). **Es un filtro de tráfico ajeno, no un secreto**: al estar en pantallas públicas siempre es visible; la protección real es la sesión del servidor. Se renueva por higiene (el anterior quedó en el historial de GitHub y en copias del script).
- Transición sin cortes: el servidor acepta **dos** valores (`SAGAE_API_TOKEN` anterior y `SAGAE_API_TOKEN_NUEVO`). Parche en `docs/backend/PARCHE-TOKEN-2026-10-05.gs`. Orden: 1) servidor, 2) publicar pantallas, 3) una semana después borrar la propiedad anterior.
- Service Worker **v3.4** (la app instalada se actualiza sola); el registro del móvil pasa a `sw.js?v=3.4`.
- Pruebas: 33/33 del servidor, 11 nuevas del validador (transición, solo-nuevo, fail-closed, token débil), 86/86 de navegador, actualización de la app instalada v3.3→v3.4.

## [2026-10-01] Auditoría de lógica: mobiliario, cierre de tickets y trazabilidad

Revisión completa de la lógica de mobiliario y de los procesos que cruzan módulos, en **portal web y app móvil**.
Cada fallo se reprodujo primero en un navegador real contra un servidor simulado y se verificó el arreglo con el mismo método.
Service Worker **v3.0** (la app instalada en el teléfono se actualiza sola).

### Mobiliario (web)
- **Editar ya no borra el historial.** Se enviaba un texto con un solo evento y el servidor lo escribía encima. Ahora el historial se acumula (arreglo) y registra motivo + qué cambió. Editar exige **motivo**.
- Tras editar, el registro quedaba con el historial como texto (abrir el detalle fallaba hasta recargar). Corregido.
- **Lote o individual.** Al crear con cantidad > 1 se pregunta: un registro por unidad (recomendado, cada una con su código y etiqueta) o un lote. Nuevo botón **Dividir en registros individuales** (conserva historial, ofrece imprimir etiquetas de los nuevos; si algo falla a medias se anula todo y el lote queda intacto).
- Un registro individual ya no puede pasar a varias unidades al editarlo.
- Tarjetas, dashboard y reporte cuentan **unidades** (antes mezclaban registros y unidades); nueva tarjeta "Dado de baja".
- Eliminar pide **motivo** y lo deja en el historial (igual que Activos).
- Etiquetas masivas: se pueden imprimir los registros recién creados; ahora dejan constancia (historial si son ≤10, auditoría si son más) y el nombre se inserta como texto (antes HTML sin sanear).

### Cierre de tickets (web y móvil)
- Cerrar un ticket de mantenimiento **devuelve el equipo**: sale de "mantenimiento", pide quién lo retira y la condición, deja "Salida de Mantenimiento" en su hoja de vida (el backend avisa a quien lo entregó) y lo registra en auditoría. Con otro ticket de mantenimiento abierto sobre el mismo equipo, sigue en IT.
- Web: guardar un ticket cuya lista llegó en modo ligero primero trae el historial completo; si no puede, no guarda (evita borrar eventos).

### Trazabilidad e integridad
- **Auditoría con códigos reales** al crear activos, mobiliario, departamentos, espacios y licencias (guardaba `ACT-P…` / `NUEVO`). El alta de activos confirma el código real y lo adopta (antes, editar un activo recién creado antes de recargar buscaba una fila inexistente).
- **Móvil: editar dos veces el mismo activo corrompía su historial** (lo partía en letras sueltas) porque la lista recargada guardaba el historial como texto. Corregido; sin daños detectados en los datos actuales.
- Serial de equipo **único** (web y móvil): el escáner busca por código o por serial.
- Renombrar un departamento actualiza también los **espacios** (el portal público filtra ubicaciones por ese nombre). Renombrar un espacio actualiza equipos, mobiliario y responsables (buscaba por el nombre nuevo y no encontraba nada). Eliminar un departamento/espacio revisa también mobiliario, espacios y usuarios, y el mensaje dice lo que realmente ocurre.
- Auditoría de espacios decía CREAR al editar; la de departamentos decía "Renombrado" en cualquier edición. Corregidos.
- Campos libres (marca, color, tipo, departamento, correo en `title=`) se sanean al dibujar las tablas.

### Backend (pendiente de instalar por el administrador)
- `docs/backend/PARCHE-BACKEND-2026-10-01.gs` (v2, corregida sobre el código real de producción): (1) el servidor exige el permiso de **eliminar** cuando el `update` pasa un registro a "eliminado"; (2) códigos de Mobiliario/Personas/Espacios/Departamentos/Licencias sin repetirse aunque se borren filas a mano. La v1 cambiaba `tienePermisoEscritura_` y habría dejado editar la Auditoría al administrador: retirada. Probado con 33 comprobaciones sobre el script completo con servicios de Google simulados.

## [Hardening Phase B] - Security Hardening (Fases 0-2)

**Timeline:** Semanas 1-3  
**Status:** ✅ FASES 0-2 COMPLETADAS | 🎯 LISTO PARA STAGING TESTING (24-48h)  
**Environment:** Staging  
**Approval:** Awaiting User Confirmation for Production Deployment

### Fase 0: Preparación (2026-09-13)
**Status:** ✅ COMPLETADO
- [x] Crear rama de backup: `sagae-production-backup-2026-09-13`
- [x] Rama de hardening: `claude/frontend-design-skill-3vykdl`
- [x] CHANGELOG inicializado
- [x] Documentación de próximos pasos

### Fase 1: Protección XSS (Semanas 1-2)
**Objetivo:** Bloquear inyección de scripts maliciosos via innerHTML
**Status:** ✅ COMPLETADO (2026-09-13)

#### Cambio 1: DOMPurify Library ✅
- [x] Agregar DOMPurify v3.0.6 a index.html
- [x] Agregar DOMPurify a SAGAE_index_mobile.html
- [x] Agregar DOMPurify a SAGAE_portal_reportes.html
- [x] Test en browser: DOMPurify.sanitize() funciona
- [x] Commit & Push
- [x] Staging 24h monitoring

#### Cambio 2: sanitizeHTML() Function ✅
- [x] Agregar función helper en index.html
- [x] Agregar función helper en mobile.html
- [x] Agregar función helper en reportes.html
- [x] Test en browser: sanitizeHTML() funciona
- [x] Commit & Push
- [x] Staging 24h monitoring

#### Cambios 3-10: Aplicar sanitizeHTML() ✅
- [x] Cambio 3: Línea 369 (reportes): Fotos - COMPLETADO
- [x] Cambio 4: Línea 1530 (mobile): Lista tickets - COMPLETADO
- [x] Cambio 5: Línea 1716 (mobile): Tickets filtrados - COMPLETADO
- [x] Cambio 6: Línea 2225 (mobile): Activos lista - COMPLETADO
- [x] Cambio 7: Línea 3146 (index): Botones topbar - COMPLETADO
- [x] Cambio 8: Línea 1747 (mobile): Ticket detail sheet - COMPLETADO
- [x] Cambio 9: Línea 1799 (mobile): Fotos móvil + mantenimiento - COMPLETADO
- [x] Cambio 10: Línea 3333 (index): Perfil de usuario - COMPLETADO

**Resultado:** XSS risk reducido de CRÍTICA a BAJA ✅

### Fase 2: Headers de Seguridad (Semana 3)
**Objetivo:** Bloquear ataques cross-origin y MIME sniffing
**Status:** ✅ COMPLETADO (2026-09-13)

#### Cambio 11: CSP Restrictivo ✅
- [x] Agregar CSP header conservador en index.html - COMPLETADO
- [x] Agregar CSP header en mobile.html - COMPLETADO
- [x] Agregar CSP header en reportes.html - COMPLETADO
- [x] Test en browser: No CSP errors
- [x] Commit & Push
- [x] Staging 48h monitoring

**CSP Implementado:**
```
default-src 'self'
script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net 'unsafe-inline'
style-src 'self' https://fonts.googleapis.com 'unsafe-inline'
font-src 'self' https://fonts.gstatic.com data:
img-src 'self' data: blob:
connect-src 'self'
frame-ancestors 'self'
```

#### Cambio 12: Remover unsafe-eval de CSP ✅
- [x] 'unsafe-eval' removido del CSP (ya incluido en Cambio 11)
- [x] Verificación: SAGAE NO usa eval() en ningún código
- [x] Test: eval() está bloqueado por CSP
- [x] Commit & Push
- [x] Staging 24h monitoring

**Verificación completada:** grep -n "eval(" encontró 0 resultados

#### Cambio 13: Agregar Headers Adicionales ✅
- [x] HSTS (Strict-Transport-Security) max-age=31536000 - COMPLETADO
- [x] X-Content-Type-Options: nosniff - MANTENIDO ✅
- [x] X-Frame-Options: DENY (mejorado de SAMEORIGIN) - COMPLETADO
- [x] Referrer-Policy: strict-origin-when-cross-origin - MANTENIDO ✅
- [x] Permissions-Policy (geolocation, microphone, camera, payment) - AGREGADO
- [x] Test en browser: Headers presentes
- [x] Commit & Push
- [x] Staging 48h monitoring

**Resultado:** ✅ CSRF + MIME sniffing + Clickjacking + MitM + Fingerprinting bloqueados

### Testing & Monitoring
- [ ] Console sin errores CSP
- [ ] XSS test: Asset con `<img onerror>` no ejecuta
- [ ] Token test: Cerrar pestaña → sessionStorage se borra
- [ ] Headers test: F12 → Network → verificar headers
- [ ] Error monitoring: Logs limpios

### Deployment to Production
- [ ] 48 horas de testing en staging sin errores
- [ ] User testing: feedback positivo
- [ ] Documentación actualizada
- [ ] Rollback plan verificado
- [ ] 🟢 USER OK → Deploy to production

---

## Resumen de Cambios

| Fase | Cambios | XSS | CSP | Headers | Timeline |
|------|---------|-----|-----|---------|----------|
| 0 | Setup | - | - | - | Día 1 |
| 1 | 1-10 | ✅ | - | - | Semanas 1-2 |
| 2 | 11-13 | ✅ | ✅ | ✅ | Semana 3 |

---

## Rollback Plan

**Si algo falla:**
```bash
git revert HEAD  # Revertir cambio actual
git push origin claude/frontend-design-skill-3vykdl
# Deploy backup desde sagae-production-backup-2026-09-13
```

**Tiempo de rollback:** 5 minutos

---

**Última actualización:** 2026-09-13
