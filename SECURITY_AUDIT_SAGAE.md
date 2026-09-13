# SAGAE — Auditoría de Seguridad del Código Actual

**Fecha:** 2026-09-13  
**Criticidad:** ALTA — Múltiples vulnerabilidades críticas identificadas  
**Impacto:** Datos de menores en riesgo, pérdida de integridad de datos, exposición de credenciales

---

## Resumen Ejecutivo

El análisis de seguridad del código actual de SAGAE (index.html, SAGAE_index_mobile.html, SAGAE_portal_reportes.html) ha identificado **7 vulnerabilidades críticas** y **5 problemas de riesgos altos** que exponen datos sensibles de estudiantes y empleados escolares.

**Recomendación:** No deployar a producción con datos reales hasta resolver los críticos (categorías A y B).

---

## Hallazgos por Criticidad

### 🔴 CRÍTICA - Categoría A: Riesgos de Seguridad de Datos Personales

#### A1. Content Security Policy (CSP) Completamente Permisiva

**Ubicación:** `index.html:5`, `SAGAE_index_mobile.html:4`

**Código problemático:**
```html
<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; connect-src *; font-src * data:;">
```

**Problema:**
- `default-src *` permite CUALQUIER origen
- `'unsafe-inline' 'unsafe-eval'` deshabilita protección contra XSS
- `connect-src *` permite fetchs a cualquier servidor
- Efectivamente **CSP no existe** — es equivalente a no tener CSP

**Riesgo:**
- Inyección de código malicioso (XSS)
- Exfiltración de datos a servidores terceros
- Suplantación de identidad
- Malware inyectado

**Severidad:** CRÍTICA  
**Impacto:** Todos los datos en la aplicación están en riesgo

**Remediación:**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://script.google.com https://www.googleapis.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

**Timeline:** Semana 1 de Phase 0

---

#### A2. XSS Risk Alto — innerHTML sin Sanitización

**Ubicación:** `index.html` (15+ instancias), `SAGAE_index_mobile.html` (35+ instancias)

**Ejemplos:**
```javascript
// SAGAE_index_mobile.html:778
document.getElementById("sheet-body").innerHTML=`...`

// SAGAE_index_mobile.html:1513
listEl.innerHTML=pending.map(t=>tktCardHTML(t)).join("")

// index.html:3128
c.innerHTML+='<button class="btn btn-p" onclick="openActivo(null)">...'

// SAGAE_portal_reportes.html:352
list.innerHTML = _fotosPortalActuales.length ? _fotosPortalActuales.map((f,i)=>`...`
```

**Problema:**
- Si los datos contienen caracteres especiales sin escapar (ej: `<script>`, `onerror=`), se ejecutarán
- Ejemplo ataque: Un usuario malicioso crea un activo con nombre: `<img src=x onerror="alert('XSS')">`
- Ninguna validación/sanitización en frontend

**Riesgo:**
- Robo de tokens JWT (acceso a todos los datos)
- Robo de credenciales
- Suplantación de usuarios
- Modificación de datos en la UI (usuario ve datos falsos)

**Severidad:** CRÍTICA  
**Impacto:** Cualquier usuario puede ejecutar código arbitrario en navegadores de otros usuarios

**Remediación:**
```javascript
// Crear función de sanitización
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Usar textContent en lugar de innerHTML
document.getElementById("sheet-body").textContent = safeString;

// O si necesitas HTML, usar librería como DOMPurify
// <script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
let clean = DOMPurify.sanitize(htmlString);
document.getElementById("sheet-body").innerHTML = clean;
```

**Timeline:** Semana 2-3 de Phase 0 (auditar y reemplazar todos los casos)

---

#### A3. API Key Expuesta en Cliente

**Ubicación:** `index.html:2178`, `SAGAE_index_mobile.html:602`

**Código problemático:**
```javascript
const API="https://script.google.com/macros/s/AKfycbxSA74xU_zCdMuS6GFwbwWcYwW0JxyzlPgb08TWaJPyu8AxthZVzuY9tYbwK6oXxFPU/exec"
```

**Problema:**
- La URL de Google Apps Script es una **llave pública** hardcodeada en el HTML
- Cualquiera que inspeccione el código fuente ve la URL
- Puede ser usada para hacer requests masivos, DoS, o reverse-engineering

**Riesgo:**
- Ataques de negación de servicio (DoS)
- Reverse-engineering de la API
- Uso no autorizado de los recursos de Google Apps Script
- Facturación no controlada

**Severidad:** CRÍTICA  
**Impacto:** Exposición de infraestructura backend

**Remediación:**
```
En Phase 1 (refactor):
- Cambiar de Google Apps Script a backend propio (NestJS)
- API URL expuesta es inevitable, pero el backend debe validar:
  - JWT tokens (no funciona sin autenticación)
  - Rate limiting por usuario
  - CORS restrictivo
```

**Timeline:** Semana 2-3 de Phase 1 (nuevo backend)

---

#### A4. Tokens JWT en localStorage Sin Encriptación

**Ubicación:** `SAGAE_index_mobile.html:1018`, `index.html` (implícito en session object)

**Código problemático:**
```javascript
// SAGAE_index_mobile.html:1018
localStorage.setItem(CACHE_KEY,JSON.stringify({tickets:tks,activos,ts:Date.now()}));

// Session token en global
session={username:resp.username, nombre:resp.nombre, rol:resp.rol, token:resp.token};
```

**Problema:**
- Tokens JWT en localStorage = accesibles a XSS
- Si hay un XSS, el atacante lee: `localStorage.getItem(CACHE_KEY)`
- Tokens sin expiración clara visible
- Sesión global = información sensible en scope global

**Riesgo:**
- Robo de sesión
- Acceso perpetuo a datos del usuario
- Lateral movement (si un usuario es admin, acceso admin)

**Severidad:** CRÍTICA  
**Impacto:** Compromiso de cuentas de usuario

**Remediación:**
```javascript
// Usar sessionStorage en lugar de localStorage (se limpia al cerrar pestaña)
sessionStorage.setItem('jwt_token', resp.token);

// O usar HttpOnly cookies (requiere backend)
// Set-Cookie: jwt_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600

// Implementar refresh tokens
// - Access token: 15 minutos, en sessionStorage
// - Refresh token: 7 días, en HttpOnly cookie

// Reducir scope global
const AuthService = {
  getToken: () => sessionStorage.getItem('jwt_token'),
  setToken: (t) => sessionStorage.setItem('jwt_token', t),
  logout: () => sessionStorage.removeItem('jwt_token'),
};
```

**Timeline:** Semana 3 de Phase 0 + Phase 1

---

#### A5. Passwords en Plaintext en Payloads

**Ubicación:** `SAGAE_index_mobile.html:1288`, `SAGAE_index_mobile.html:2502`, `index.html:2933`

**Código problemático:**
```javascript
// SAGAE_index_mobile.html:1288
resp = await apiPostAsync(null,'procesarLogin',{username:u,password:p,plataforma:'mobile'}, 25000);

// SAGAE_index_mobile.html:2502
await apiPost("usuarios","update",{username:session.username, passwordPlano:p1, mustChange:false, ultimoAcceso:ts()});
```

**Problema:**
- Passwords enviadas en JSON plaintext (aunque por HTTPS)
- Si hay un hombre en el medio (MITM), se ven los passwords
- Logs del servidor pueden contener passwords
- Historial de red del navegador muestra passwords

**Riesgo:**
- Acceso no autorizado a cuentas
- Violación de GDPR/LGPD (datos personales de menores)
- Compromiso de credenciales reutilizadas en otros sistemas

**Severidad:** CRÍTICA  
**Impacto:** Acceso a cuentas de usuarios

**Remediación (Corto plazo):**
```javascript
// NO LOGS de passwords
console.log({...payload, password: '***'});

// Usar HTTPS siempre (ya están haciéndolo)
// Implementar HSTS header

// Remediación (Largo plazo - Phase 1):
// - Usar hashing en cliente (client-side hashing) + server-side
// - Implementar 2FA obligatorio
// - Usar OAuth/OIDC en lugar de passwords
```

**Timeline:** Ya en uso HTTPS, mejorar en Phase 0 (logging), remediación full en Phase 1

---

### 🟠 ALTA - Categoría B: Ataques de Sesión y Acceso

#### B1. Tokens en URL Query Parameters

**Ubicación:** `SAGAE_index_mobile.html:1027`, `SAGAE_index_mobile.html:1141`, `index.html:2403`

**Código problemático:**
```javascript
// SAGAE_index_mobile.html:1027
const tok = (typeof session!=='undefined' && session && session.token) ? '&session='+encodeURIComponent(session.token) : '';
// Resultado: ?action=responsables&session=eyJhbGc...
```

**Problema:**
- Tokens en URL = guardados en browser history
- Guardados en logs del servidor
- Visibles en referer headers cuando cambias de página
- Pueden ser interceptados en conexiones inseguras

**Riesgo:**
- Tokens expuesto en historial de navegación
- Logs contienen tokens (auditoría débil)
- Referer leaks

**Severidad:** ALTA  
**Impacto:** Sesiones comprometidas

**Remediación:**
```javascript
// Usar Authorization header en lugar de query param
const headers = {
  'Authorization': 'Bearer ' + session.token,
  'Content-Type': 'application/json'
};

fetch(API, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(payload)
});
```

**Timeline:** Semana 2 de Phase 1

---

#### B2. CORS Policy — `mode: 'no-cors'` sin Validación

**Ubicación:** `SAGAE_index_mobile.html:1104`, `index.html:2357`, `SAGAE_portal_reportes.html`

**Código problemático:**
```javascript
// SAGAE_index_mobile.html:1104
await fetch(API,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},
  body: JSON.stringify(securePayload)
});
```

**Problema:**
- `mode: 'no-cors'` = CORS preflight **no se valida**
- Backend puede estar aceptando requests de cualquier origen
- Comentario en código lo reconoce: `// Google Apps Script NO agrega encabezados CORS`

**Riesgo:**
- CSRF (Cross-Site Request Forgery)
- Request forgery desde cualquier sitio malicioso
- Datos expuestos a cross-origin requests

**Severidad:** ALTA  
**Impacto:** CSRF attacks

**Remediación (Actual):**
```javascript
// Usar POST (no GET) + Content-Type: application/json
// Esto requiere preflight CORS en navegador moderno
fetch(API, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(payload),
  credentials: 'include'  // Solo si en mismo origen
});
```

**Remediación (Phase 1):**
```
Backend debe:
- Validar Origin header
- Implementar CORS correctamente
- Requerir tokens JWT (no funciona con CORS abierto)
```

**Timeline:** Semana 1-2 de Phase 1

---

#### B3. Sin CSRF Token

**Ubicación:** Todo el código

**Problema:**
- No hay CSRF tokens en formularios
- Una página maliciosa puede hacer requests en tu nombre (si estás logueado)

**Riesgo:**
- Cambio de contraseña no autorizado
- Modificación de datos
- Acciones en nombre del usuario

**Severidad:** ALTA  
**Impacto:** Modificación no autorizada de datos

**Remediación:**
```html
<!-- En formularios -->
<input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">

<!-- Backend valida -->
if ($_POST['csrf_token'] !== $_SESSION['csrf_token']) {
  throw new Exception('CSRF token inválido');
}
```

**Timeline:** Semana 3 de Phase 0 (implementar en refactor)

---

### 🟡 MEDIA - Categoría C: Problemas de Integridad y Compliance

#### C1. Sin Validación de Entrada en Frontend

**Ubicación:** Múltiples input fields

**Problema:**
- Los inputs aceptan cualquier cosa (ej: campos de email, números sin validación)
- Se confía completamente en backend, pero frontend no tiene defensa primera línea

**Riesgo:**
- Inyección de malware en datos
- Bypass de restricciones de negocio
- DoS (enviar requests muy grandes)

**Severidad:** MEDIA  
**Impacto:** Garbage in → Garbage out

**Remediación:**
```javascript
// Validación básica en frontend
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateNumero(num) {
  return /^\d+$/.test(num) && num.length <= 20;
}

// Mostrar error al usuario
if (!validateEmail(input.value)) {
  showError("Email inválido");
  return false;
}
```

**Timeline:** Semana 3-4 de Phase 0

---

#### C2. Sin Rate Limiting en Frontend

**Ubicación:** Todo el código

**Problema:**
- Usuario puede hacer mil requests por segundo
- Sin throttling o debouncing

**Riesgo:**
- DoS al backend
- Consumo masivo de cuota de Google Apps Script
- Carga innecesaria

**Severidad:** MEDIA  
**Impacto:** Disponibilidad

**Remediación:**
```javascript
// Implementar debounce/throttle
function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const saveActivo = debounce(() => {
  apiPostAsync(...);
}, 500);

// O en backend (Phase 1)
// Rate limit: 100 requests/minuto por usuario
```

**Timeline:** Semana 2 de Phase 0 (frontend), Semana 2 de Phase 1 (backend)

---

#### C3. Sin Audit Logging Completo

**Ubicación:** No existe en actual

**Problema:**
- No hay registro de quién hizo qué
- Imposible investigar brechas de seguridad
- No compliance con GDPR/LGPD (requisito legal)

**Riesgo:**
- No se puede rastrear cambios maliciosos
- No hay evidencia forense
- Violación de leyes de datos personales

**Severidad:** MEDIA  
**Impacto:** Compliance, investigación post-breach

**Remediación:**
```
En Phase 1:
- Tabla AUDITORIA con todos los cambios
- Quién (usuario_id)
- Qué (tabla, registro, cambio)
- Cuándo (timestamp)
- Dónde (IP, user-agent)
- Por qué (motivo del cambio)
```

**Timeline:** Semana 3 de Phase 1

---

#### C4. Sin Encriptación de Datos Sensibles en DB

**Ubicación:** Datos de estudiantes (nombres, cédulas, etc.)

**Problema:**
- Google Sheets = datos plaintext
- Si alguien accede a la Sheet, ve todo

**Riesgo:**
- Violación de privacidad de menores (GDPR Artículo 8)
- Exposición de datos personales

**Severidad:** MEDIA  
**Impacto:** Compliance, privacidad

**Remediación:**
```
En Phase 1 (PostgreSQL):
- Encryption at rest (pgcrypto)
- Encryption in transit (TLS 1.3)
- Encryptación de columnas sensibles (PII)

CREATE EXTENSION pgcrypto;
UPDATE personas SET cedula = pgp_sym_encrypt(cedula, 'secret_key');
```

**Timeline:** Semana 3 de Phase 1

---

#### C5. Sin HTTPS Enforcement

**Ubicación:** No hay HSTS header

**Problema:**
- Primera conexión puede ser HTTP
- MITM puede interceptar en transición HTTP → HTTPS

**Riesgo:**
- Downgrades a HTTP
- Cookies robadas

**Severidad:** MEDIA  
**Impacto:** Sesiones comprometidas

**Remediación:**
```html
<meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains">
```

O en backend:
```javascript
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

**Timeline:** Semana 1 de Phase 0

---

## Matriz de Riesgos

| Riesgo | ID | Severidad | Exploitabilidad | Impacto | Remediación |
|--------|----|-----------|-|-|-|
| CSP permisiva | A1 | CRÍTICA | Alta | Total (XSS) | Phase 0 W1 |
| XSS sin sanitización | A2 | CRÍTICA | Alta | Robo sesión | Phase 0 W2-3 |
| API Key expuesta | A3 | CRÍTICA | Alta | DoS, infra | Phase 1 W2-3 |
| Tokens en localStorage | A4 | CRÍTICA | Alta | Robo sesión | Phase 0 W3 |
| Passwords plaintext | A5 | CRÍTICA | Media | Acceso no auth | Phase 0 + Phase 1 |
| Tokens en URL | B1 | ALTA | Alta | Sesión en history | Phase 1 W2 |
| CORS no-cors | B2 | ALTA | Alta | CSRF | Phase 0 + Phase 1 |
| Sin CSRF token | B3 | ALTA | Alta | Modificación datos | Phase 0 W3 |
| Sin validación input | C1 | MEDIA | Alta | Data corruption | Phase 0 W3-4 |
| Sin rate limit | C2 | MEDIA | Alta | DoS | Phase 0-1 |
| Sin audit logging | C3 | MEDIA | Media | No compliance | Phase 1 W3 |
| Datos sin encriptar | C4 | MEDIA | Media | Privacidad | Phase 1 W3 |
| Sin HSTS | C5 | MEDIA | Media | MITM | Phase 0 W1 |

---

## Plan de Remediación Integrado

### Phase 0 (Semana 1 - Antes de Launch Actual)

**Prioritario - Implementar ahora:**
- [ ] Cambiar CSP a restrictivo (A1)
- [ ] Agregar HSTS header (C5)
- [ ] Validación de entrada básica (C1)
- [ ] Logging seguro (no passwords) (A5)

**Requiere cambio de arquitectura:**
- [ ] Tokens en sessionStorage, no localStorage (A4)
- [ ] Implementar CSRF tokens (B3)
- [ ] Remover API Key de cliente (A3) ← **No es posible con Apps Script**

### Phase 1 (Semana 2-3 - Nuevo Backend)

**Crítico:**
- [ ] Backend con JWT + validación de tokens (A2, A3)
- [ ] Sanitización server-side de todos los inputs (A2)
- [ ] CORS restrictivo (B2)
- [ ] Tokens en Authorization header (B1)
- [ ] Rate limiting (C2)
- [ ] Audit logging completo (C3)

### Phase 2-3 (Encriptación y Compliance)

- [ ] Encriptación de datos sensibles en DB (C4)
- [ ] 2FA obligatorio para admin (A4)
- [ ] Penetration testing externo
- [ ] Legal review (GDPR, LGPD)

---

## Recomendación Final

**NO es seguro deployar SAGAE actual a producción con datos reales de estudiantes.**

**Opción A (Recomendada):** Continuar con **SAGAE_REFACTOR_PLAN.md**
- Backend nuevo + frontend seguro
- Arquitectura moderna
- Compliance por diseño

**Opción B (Parche Temporal):** Arreglar A1-A5 en código actual
- Ej: Cambiar CSP, tokens a sessionStorage, sanitización
- Viable para 2-4 semanas más
- No recomendado para producción de largo plazo

**Opción C (Cuarentena):** Mantener en staging hasta Phase 1 completa
- Datos de prueba solo
- No información real de estudiantes

---

## Checklist de Próximos Pasos

- [ ] Revisar hallazgos con stakeholders
- [ ] Decidir entre Opción A/B/C
- [ ] Si A: proceder con SAGAE_REFACTOR_PLAN.md + Phase 0
- [ ] Si B: crear tickets de seguridad, priorizar A1-A5
- [ ] Si C: comunicar a usuarios (no hay datos nuevos hasta Phase 1)
- [ ] Auditoría de seguridad externa (recomendado antes de producción)
- [ ] Legal review de GDPR/LGPD compliance

---

**Auditoría preparada:** 2026-09-13  
**Próxima revisión:** 2026-09-20 (o después de implementar remediaciones)
