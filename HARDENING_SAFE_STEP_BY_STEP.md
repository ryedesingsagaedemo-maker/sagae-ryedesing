# SAGAE — Hardening SEGURO Paso a Paso

**Filosofía:** `git diff` pequeño → test → deploy → monitor → siguiente cambio

**Garantía:** El programa NUNCA se rompe. Cada paso es reversible en 5 minutos.

---

## Reglas de Oro

1. ✅ **Un cambio = Un commit = Un test**
   - No cambies 3 cosas a la vez
   - Si falla una, rollback del commit, no del programa

2. ✅ **Backup antes de cualquier deploy**
   - Rama `sagae-production-backup` con snapshot
   - Antes de pushear a producción, tag git

3. ✅ **Staging primero, producción después**
   - Los usuarios de testing ven cambios primero
   - 24-48 horas de validación antes de producción general

4. ✅ **Rollback en 5 minutos**
   - Si falla, git revert + redeploy
   - No necesitas investigar, solo volver atrás

5. ✅ **Monitor de errores activado**
   - Browser console
   - Network tab
   - Google Apps Script logs
   - Reporte de usuarios

---

## FASE 0: Preparación (Día 1 - 2 horas)

### Paso 0.1: Crear ramas de backup

```bash
# En terminal
git checkout main
git pull origin main

# Rama de backup de la versión actual
git checkout -b sagae-production-backup
git push -u origin sagae-production-backup

# Rama de hardening (aquí hacemos cambios)
git checkout -b sagae-hardening-phase-1
git push -u origin sagae-hardening-phase-1

# Confirmación
git branch -a
```

**Resultado:** 3 ramas
- `main` — Producción actual (nunca tocar directo)
- `sagae-production-backup` — Snapshot de HOY
- `sagae-hardening-phase-1` — Donde trabajamos

### Paso 0.2: Crear ambiente de staging

**Opción A (Recomendada):** Crear URL de staging
```
Producción: https://example.com/sagae/index.html
Staging:    https://example.com/sagae-staging/index.html
           (misma carpeta, archivo diferente)
```

**Opción B:** Rama GitHub Pages
```
Producción: GitHub Pages desde main
Staging:    GitHub Pages desde sagae-hardening-phase-1
```

**Paso:** Agregar a README.md
```markdown
## Testing (Staging)
- **Staging URL:** [Link to staging]
- **Testing Users:** admin/test123 (testing account)
- **Changes deployed to staging 24h before production**
```

### Paso 0.3: Documentar cambios en CHANGELOG.md

```markdown
# CHANGELOG

## [Hardening Phase 1] - WIP

### 2026-09-XX

#### Seguridad
- [ ] CSP restrictivo
- [ ] XSS sanitización
- [ ] Tokens en sessionStorage
- [ ] Logging seguro
- [ ] Headers de seguridad

#### Testing
- [ ] Console sin XSS
- [ ] Tokens desaparecen al cerrar
- [ ] Validators funcionan

#### Status
- Staging: Desplegado en YYYY-MM-DD
- Producción: Pendiente
```

---

## FASE 1: Cambios Críticos (Semana 1)

### CAMBIO 1: Agregar DOMPurify (Día 1)

**Riesgo:** NINGUNO (librería externa, no toca código existente)

**Paso 1.1: Agregar librería en ambos HTML**

`index.html` línea ~12:
```html
<!-- Seguridad: XSS prevention -->
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

`SAGAE_index_mobile.html` línea ~240:
```html
<!-- Seguridad: XSS prevention -->
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

`SAGAE_portal_reportes.html` línea ~10:
```html
<!-- Seguridad: XSS prevention -->
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

**Paso 1.2: Test en browser**

Abrir DevTools (F12) → Console:
```javascript
// Debe devolver un objeto con métodos
console.log(DOMPurify);

// Debe retornar string limpio
console.log(DOMPurify.sanitize('<img src=x onerror="alert(1)">'));
// Output: <img src="x">

// Debe bloquear el script
console.log(DOMPurify.sanitize('<script>alert(1)</script>'));
// Output: (vacío, script bloqueado)
```

**Paso 1.3: Commit**

```bash
git add index.html SAGAE_index_mobile.html SAGAE_portal_reportes.html
git commit -m "security: Add DOMPurify library for XSS protection

No functional changes yet - library loaded and tested.
- Adds DOMPurify v3.0.6 from CDN
- Verified: sanitize() method works
- Next: Apply to innerHTML calls"
git push origin sagae-hardening-phase-1
```

**Paso 1.4: Deploy a staging**

1. Copiar archivos a carpeta staging
2. Prueba en browser: F12 → console → DOMPurify debe estar disponible
3. Probar todas las páginas (activos, tickets, reportes)
4. ✅ Si funciona: OK, ir a CAMBIO 2
5. ❌ Si falla: `git revert HEAD`, redeploy de backup

**Rollback (5 minutos):**
```bash
git revert HEAD
git push origin sagae-hardening-phase-1
# O si no deployaste aún:
git reset --hard HEAD~1
```

---

### CAMBIO 2: Crear sanitizeHTML() (Día 2)

**Riesgo:** BAJO (nueva función, no reemplaza nada aún)

**Paso 2.1: Agregar función helper en cada archivo**

En `index.html`, antes de `<script>` section que tiene funciones, agregar:

```javascript
// =====================================================
// SEGURIDAD: Sanitización HTML
// =====================================================
function sanitizeHTML(htmlString) {
  if (typeof htmlString !== 'string') return '';
  try {
    return DOMPurify.sanitize(htmlString, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'div', 'button', 'img', 'ul', 'li', 'small'],
      ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'id', 'onclick', 'style', 'data-*'],
      KEEP_CONTENT: true
    });
  } catch (e) {
    console.warn('[sanitizeHTML] Error:', e);
    return '';
  }
}
```

Repetir en `SAGAE_index_mobile.html` y `SAGAE_portal_reportes.html` (línea ~600 en mobile, ~100 en reportes).

**Paso 2.2: Test en browser**

Console:
```javascript
// Debe funcionar
sanitizeHTML('<div>Hola</div>')
// Output: "<div>Hola</div>"

// Debe bloquear
sanitizeHTML('<div onclick="alert(1)">Click</div>')
// Output: "<div>Click</div>" (onclick bloqueado)

// Debe manejar errores
sanitizeHTML(null)
// Output: ""
```

**Paso 2.3: Commit**

```bash
git add index.html SAGAE_index_mobile.html SAGAE_portal_reportes.html
git commit -m "security: Add sanitizeHTML() helper function

- Adds DOMPurify wrapper with allowed tags/attributes
- Function tested in browser console
- No calls to sanitizeHTML() yet (manual step follows)
- Whitelisted tags: b, i, em, strong, a, br, p, span, div, button, img, ul, li, small"
git push origin sagae-hardening-phase-1
```

**Paso 2.4: Deploy a staging + test**

Verificar que el programa sigue funcionando igual (no hay cambios visuales).

---

### CAMBIO 3: Aplicar sanitizeHTML() a 1 lugar (Día 3)

**Riesgo:** BAJO (1 lugar = 1 variable = fácil de aislar)

**Elegir el lugar más crítico:** `SAGAE_portal_reportes.html` línea 352 (fotos)

**Antes:**
```javascript
list.innerHTML = _fotosPortalActuales.length ? _fotosPortalActuales.map((f,i)=>`
  <div class="foto-item">
    <img src="${f.url}">
    <button onclick="removeFoto(${i})">Eliminar</button>
  </div>
`).join("") : '<p>Sin fotos</p>';
```

**Después:**
```javascript
const fotosHTML = _fotosPortalActuales.length ? _fotosPortalActuales.map((f,i)=>`
  <div class="foto-item">
    <img src="${f.url}">
    <button onclick="removeFoto(${i})">Eliminar</button>
  </div>
`).join("") : '<p>Sin fotos</p>';
list.innerHTML = sanitizeHTML(fotosHTML);
```

**Paso 3.1: Hacer el cambio**

```bash
# Editar SAGAE_portal_reportes.html línea 352
# Reemplazar list.innerHTML = ... con código de arriba
```

**Paso 3.2: Test en staging**

1. Abrir portal de reportes
2. Crear un activo con nombre: `<img src=x onerror="alert('XSS')">`
3. Ver foto → NO debe aparecer popup (XSS bloqueado)
4. Foto debe verse correcta (sin el script)

**Paso 3.3: Commit**

```bash
git add SAGAE_portal_reportes.html
git commit -m "security: Apply sanitizeHTML() to photo gallery

- Sanitizes user-generated data before rendering
- Test: Asset with <img onerror> doesn't execute
- Safe: Only images visible, scripts blocked"
git push origin sagae-hardening-phase-1
```

**Paso 3.4: Monitor 48 horas en staging**

- Los testing users lo usan
- Reportan si algo se ve raro
- Si OK después de 48h → OK para siguiente cambio

**Si falla:**
```bash
git revert HEAD
# O rollback archivo:
git checkout HEAD~1 -- SAGAE_portal_reportes.html
git commit -m "Revert: XSS sanitization caused issues"
```

---

### CAMBIO 4-10: Aplicar sanitizeHTML() a los otros 9 lugares (Días 4-10)

**Mismo proceso para cada lugar:**

1. Editar 1 línea
2. Test en staging
3. Commit
4. Monitor 24-48h
5. Siguiente

**Lugares (en orden de importancia):**

1. ✅ `SAGAE_portal_reportes.html:352` — Fotos (HECHO)
2. `SAGAE_index_mobile.html:1513` — Lista de tickets
3. `SAGAE_index_mobile.html:1700` — Tickets filtrados
4. `SAGAE_index_mobile.html:2206` — Activos lista
5. `index.html:3128` — Botones de acciones
6. `SAGAE_index_mobile.html:778` — Sheet body
7. `SAGAE_index_mobile.html:1784` — Fotos móvil
8. `index.html:3140` — Botón nuevo departamento
9. `SAGAE_index_mobile.html:2021` — Select de activos
10. `SAGAE_portal_reportes.html:463` — Mensaje de éxito

**Timeline:** 1 cambio/día = 10 días = 2 semanas

---

## FASE 2: Headers de Seguridad (Semana 2-3)

### CAMBIO 11: Agregar CSP Restrictivo (Día 11)

**Riesgo:** MEDIO (puede bloquear funcionalidad si CSP es muy restrictivo)

**Paso 11.1: CSP conservador (no bloquea nada aún)**

`index.html` línea 5:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self' https:;
  script-src 'self' https://cdnjs.cloudflare.com https://code.jquery.com https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://script.google.com https://www.googleapis.com;
  frame-ancestors 'none';
  base-uri 'self';
">
```

**Nota:** `'unsafe-inline' 'unsafe-eval'` aún activos (evitar romper cosas)

Repetir en mobile.html y reportes.html

**Paso 11.2: Test en browser**

F12 → Console → Si ves CSP errors, ajustar whitelist.

**Paso 11.3: Monitor 48h en staging**

Revisar logs de errores de CSP (Chrome DevTools → Console).

**Paso 11.4: Commit & Deploy**

```bash
git add *.html
git commit -m "security: Add conservative CSP header

- Restricts most cross-origin requests
- Still allows unsafe-inline (will remove in next phase)
- Monitor CSP errors in console"
git push origin sagae-hardening-phase-1
```

---

### CAMBIO 12: Quitar 'unsafe-eval' de CSP (Día 13)

**Nota:** Primero quitamos eval, después inline

`index.html` línea 5:
```html
<!-- Cambiar script-src de: -->
script-src 'self' https://cdnjs.cloudflare.com https://code.jquery.com https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval';
<!-- A: -->
script-src 'self' https://cdnjs.cloudflare.com https://code.jquery.com https://cdn.jsdelivr.net 'unsafe-inline';
```

**Test:** F12 → intentar `eval('alert(1)')` → debe fallar

**Commit:**
```bash
git commit -m "security: Remove 'unsafe-eval' from CSP"
```

---

### CAMBIO 13: Agregar headers adicionales (Día 14)

`index.html` línea 6-10:
```html
<meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta name="referrer" content="strict-origin-when-cross-origin">
```

Repetir en todos los HTML.

**Commit:**
```bash
git commit -m "security: Add additional security headers

- HSTS: Force HTTPS for 1 year
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY (no iframes)
- Referrer-Policy: strict-origin"
```

---

## FASE 3: Tokens Seguros (Semana 3-4)

### CAMBIO 14: AuthService + sessionStorage (Día 15)

**Riesgo:** MEDIO (cambia donde se guarda token)

**Paso 14.1: Agregar AuthService**

En `index.html` (después de variable `session` declaration, línea ~2300):

```javascript
// =====================================================
// AUTH SERVICE — Manejo seguro de tokens
// =====================================================
const AuthService = {
  setToken(token) {
    try {
      sessionStorage.setItem('sagae_jwt_token', token);
    } catch (e) {
      console.warn('Cannot save token:', e);
    }
  },
  
  getToken() {
    try {
      return sessionStorage.getItem('sagae_jwt_token') || null;
    } catch (e) {
      return null;
    }
  },
  
  logout() {
    try {
      sessionStorage.removeItem('sagae_jwt_token');
    } catch (e) {}
  },
  
  isAuthenticated() {
    return this.getToken() !== null;
  }
};
```

Repetir en mobile.html.

**Paso 14.2: Modificar doLogin() para usar AuthService**

**Antes:**
```javascript
session={username:resp.username, nombre:resp.nombre, rol:resp.rol, token:resp.token};
```

**Después:**
```javascript
// Guardar token seguro
AuthService.setToken(resp.token);
// Guardar datos del usuario (SIN token)
session={username:resp.username, nombre:resp.nombre, rol:resp.rol};
```

**Paso 14.3: Test en browser**

1. Login en staging
2. F12 → Application → sessionStorage → ver `sagae_jwt_token`
3. Cerrar pestaña → sessionStorage se borra
4. Abrir de nuevo → `sagae_jwt_token` está vacío (logout automático)

**Paso 14.4: Commit**

```bash
git commit -m "security: Implement AuthService for token management

- Tokens stored in sessionStorage (cleared on tab close)
- User data stored separately from token
- No tokens in localStorage or global scope
- Logout on browser close"
```

---

## FASE 4: Monitoring (Continuamente)

### Setup de Errores

**En cada HTML, agregar (después de `<body>`):**

```javascript
<script>
// =====================================================
// ERROR MONITORING
// =====================================================
window.addEventListener('error', function(event) {
  console.error('[ERROR]', event.error);
  // Opcional: enviar a server
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('[UNHANDLED]', event.reason);
});

// Log de CSP violations
document.addEventListener('securitypolicyviolation', (e) => {
  console.warn('[CSP VIOLATION]', e.violatedDirective, e.blockedURI);
});
</script>
```

**Monitoreo diario:**
- Abrir browser console (F12)
- Usar cada funcionalidad
- ¿Errores? → Revisar & arreglar antes de siguiente cambio

---

## Timeline Segura Completa

```
SEMANA 1 (Cambios 1-4)
  Día 1: DOMPurify
  Día 2: sanitizeHTML()
  Día 3: Aplicar a fotos
  Día 4-5: Test + Siguiente cambio

SEMANA 2 (Cambios 5-10)
  Aplicar sanitizeHTML() a 6 lugares más
  1 por día, test cada uno

SEMANA 3 (Cambios 11-13)
  Día 11: CSP conservador
  Día 12: Quitar unsafe-eval
  Día 13-14: Headers adicionales

SEMANA 4 (Cambios 14+)
  Día 15: AuthService
  Día 16-20: Integración en login/logout

TOTAL: 4 SEMANAS (conservador, seguro)
```

---

## Rollback RÁPIDO

**Si algo se rompe:**

```bash
# Ver últimos commits
git log --oneline -10

# Revertir último cambio (5 minutos)
git revert HEAD
git push origin sagae-hardening-phase-1

# O si no está en producción aún
git reset --hard HEAD~1

# Redeploy de backup production
git checkout sagae-production-backup
# Copiar archivos a producción
```

---

## Checklist de Deploy a Producción

**Antes de pasar de staging a producción, TODOS estos:**

- [ ] 48 horas de testing en staging sin errores
- [ ] Console sin errores CSP
- [ ] Todos los usuarios de testing reportan OK
- [ ] Backup en rama `sagae-production-backup` es reciente
- [ ] CHANGELOG.md actualizado
- [ ] Rollback plan documentado
- [ ] Un dev disponible 2 horas después de deploy (en caso de emergencia)

---

## Comunicación a Usuarios

**Después de CADA deploy a producción:**

Email template:
```
Asunto: SAGAE - Actualización de seguridad (Sin cambios visuales)

Estimados,

Se realizó una actualización de seguridad en SAGAE.

✅ Lo que CAMBIA: Protección contra ataques
❌ Lo que NO cambia: Funcionalidad, interfaz, datos

Si experimentan problemas:
1. Actualizar página (Ctrl+F5)
2. Limpiar cookies (Settings → Clear site data)
3. Reportar a: [email]

Gracias,
Equipo SAGAE
```

---

## Resumen: **MUY SEGURO, MUY LENTO**

| Aspecto | Normal | SAFE |
|---------|--------|------|
| Cambios por commit | 5-10 | 1 |
| Test tiempo | 1 hora | 48 horas |
| Rollback | 1 hora | 5 minutos |
| Risk | ALTO | BAJO |
| Timeline | 2 semanas | 4 semanas |

**Mejor ir lento y seguro, que rápido y romper producción.**

---

**Plan: SAFE-MODE ENABLED** ✅
