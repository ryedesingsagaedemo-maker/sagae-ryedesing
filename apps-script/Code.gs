// ══════════════════════════════════════════════════════════════════════
// SAGAE — Sistema de Activos y Gestión Administrativa Educativa
// Desarrollado por RYE Design
//
// ── PROTECCIÓN DE GOOGLE SHEETS (aplicar manualmente) ────────────────
// 1. En el Spreadsheet: Datos → Proteger hojas y rangos
//    - Proteger la hoja ENTERA de cada pestaña (Activos, Tickets, etc.)
//    - Excepción: solo la cuenta de servicio del Apps Script puede editar
//    - El administrador humano SOLO puede leer, no editar celdas directamente
// 2. Bloquear fila de encabezados (Fila 1) en todas las hojas:
//    - Seleccionar Fila 1 → Botón derecho → Ver más acciones → Proteger rango
//    - Sin excepciones — nadie puede cambiar los nombres de columnas
// 3. Activar historial de versiones: Archivo → Historial de versiones → activar
//    - Permite recuperar cualquier versión anterior en caso de error humano
// 4. Compartir el Spreadsheet SOLO en modo "Comentarista" o "Lector" para
//    los usuarios humanos. NUNCA compartir como "Editor" excepto el admin TI.
// ─────────────────────────────────────────────────────────────────────
// Desarrollado por RYE Design
// Apps Script v2.0 — Con notificaciones por correo electrónico
// ══════════════════════════════════════════════════════════════════════

const SHEETS = {
  activos:    "Activos",
  tickets:    "Tickets",
  auditoria:  "Auditoria",
  usuarios:   "Usuarios",
  mobiliario: "Mobiliario",
  licencias:  "Licencias",
  personas:      "Personas",
  espacios:      "Espacios",
  departamentos: "Departamentos"
};

const HEADERS = {
  activos:   ["codigo","nombre","tipo","estado","marca","modelo","serial","ubicacion","asignado","asignadoEmail","asignadoCargo","responsableEspacioEmail","depto","compra","garantia","valor","vida","obs","foto","historial","fechaCreacion"],
  tickets:   ["codigo","titulo","activoId","activoNombre","resp","tipo","prior","estado","avance","dead","proy","desc","foto","historial","fechaCreacion","fotos"],
  auditoria: ["ts","usuario","nombre","rol","accion","tipo","codigo","detalle"],
  usuarios:  ["username","passHash","mustChange","rol","nombre","email","tel","depto","cargo","estado","fechaCreacion","ultimoAcceso","sessionToken"],
  mobiliario: ["codigo","nombre","tipo","cantidad","condicion","ubicacion","depto","material","color","valor","foto","obs","estado","historial","fechaCreacion"],
  licencias: ["codigo","nombre","proveedor","planVersion","claveLicencia","fechaInicio","fechaVencimiento","costoAnual","cantidadTotal","estado","obs","instalaciones","historial","fechaCreacion"],
  personas:  ["codigo","nombre","cargo","depto","email","tel","espacioResponsable","obs","estado","fechaCreacion"],
  espacios:  ["codigo","nombre","tipo","depto","ubicacion","responsableNombre","responsableEmail","capacidad","obs","estado","fechaCreacion"],
  departamentos: ["codigo","nombre","desc","responsable","estado","fechaCreacion"]
};

// ── COLOR CORPORATIVO SAGAE ────────────────────────────────────────────
const COLOR_GOLD  = "#B8960C";
const COLOR_BLACK = "#1C1C1C";
const COLOR_BG    = "#FDF8E1";

// ── UTILIDADES ────────────────────────────────────────────────────────
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}

// ══════════════════════════════════════════════════════════════════════
// SESIONES SERVER-SIDE (CacheService) — reemplaza sessionToken en Sheets
// ══════════════════════════════════════════════════════════════════════
const SESSION_TTL_SECONDS = 1800; // 30 min, deslizante
const PREAUTH_TTL_SECONDS = 300;  // 5 min para ingresar el código TOTP tras la contraseña

const PERMS_SERVER = {
  admin:      {departamentos:true, personas:true, espacios:true, activos:true, tickets:true, kanban:true, auditoria:true, usuarios:true, mobiliario:true, licencias:true, edit:true,  delete:true},
  tecnico:    {departamentos:false,personas:true, espacios:true, activos:true, tickets:true, kanban:true, auditoria:false,usuarios:false,mobiliario:true, licencias:true, edit:true,  delete:false},
  consultor:  {departamentos:false,personas:true, espacios:true, activos:true, tickets:true, kanban:true, auditoria:true, usuarios:false,mobiliario:true, licencias:true, edit:false, delete:false},
  inventario: {departamentos:false,personas:true, espacios:true, mobiliario:true,activos:true,tickets:false,kanban:false, auditoria:false,usuarios:false,licencias:true, edit:true,  delete:false}
};

function sha256Hex_(str) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return bytes.map(b => ((b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))).join('');
}

function randomHex_(numChars) {
  let out = '';
  while (out.length < numChars) out += Utilities.getUuid().replace(/-/g, '');
  return out.slice(0, numChars);
}

function hashPassSeguro_(password) {
  const saltHex = randomHex_(32);
  const hashHex = sha256Hex_(saltHex + password);
  return 'S2$' + saltHex + '$' + hashHex;
}

function verificarPassword_(inputPassword, storedHash) {
  if (!storedHash) return false;
  if (storedHash.indexOf('S2$') === 0) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const hashHex = sha256Hex_(parts[1] + inputPassword);
    return hashHex === parts[2];
  }
  return storedHash === inputPassword;
}

function generarSessionToken_() {
  return randomHex_(48);
}

// ── Sesión única, con alcance POR PLATAFORMA ──────────────────────────────
// Antes, la sesión activa se guardaba bajo una sola clave 'activeToken_<user>'
// compartida entre TODAS las plataformas. Esto significaba que si un técnico
// (o un admin usando la misma cuenta) abría la app móvil mientras seguía
// con una sesión abierta en el panel web —o viceversa—, la sesión más nueva
// invalidaba silenciosamente a la anterior: eso es lo que se reportó como
// "la app se cierra de la nada".
//
// Ahora se permite UNA sesión activa por plataforma ('web' y 'mobile' son
// independientes), pero se sigue bloqueando el caso que sí es un riesgo de
// seguridad real: dos sesiones simultáneas en la MISMA plataforma con la
// misma cuenta (p. ej. dos personas usando el mismo usuario y contraseña
// desde dos celulares). Esto es una decisión de política de seguridad —
// Licdo. Corpas debe confirmar que este comportamiento es el deseado antes
// de producción; si se prefiere volver a "una sola sesión en cualquier
// dispositivo", basta con usar siempre la clave 'activeToken_' + username
// sin el sufijo de plataforma (comportamiento anterior).
function _plataformaValida_(p) {
  return (p === 'mobile') ? 'mobile' : 'web'; // por defecto: 'web'
}

function crearSesion_(username, rol, nombre, plataforma) {
  const cache = CacheService.getScriptCache();
  const token = generarSessionToken_();
  const plat = _plataformaValida_(plataforma);
  const data = JSON.stringify({ username: username, rol: rol, nombre: nombre, ts: Date.now(), plataforma: plat });
  cache.put('session_' + token, data, SESSION_TTL_SECONDS);
  cache.put('activeToken_' + plat + '_' + username, token, SESSION_TTL_SECONDS);
  return token;
}

function validarSesion_(token) {
  if (!token) return null;
  const cache = CacheService.getScriptCache();
  const raw = cache.get('session_' + token);
  if (!raw) return null;
  let info;
  try { info = JSON.parse(raw); } catch (e) { return null; }
  const plat = _plataformaValida_(info.plataforma);
  const activo = cache.get('activeToken_' + plat + '_' + info.username);
  if (activo !== token) return null;
  cache.put('session_' + token, raw, SESSION_TTL_SECONDS);
  cache.put('activeToken_' + plat + '_' + info.username, token, SESSION_TTL_SECONDS);
  return info;
}

function cerrarSesion_(token) {
  if (!token) return;
  const cache = CacheService.getScriptCache();
  const raw = cache.get('session_' + token);
  if (raw) {
    try {
      const info = JSON.parse(raw);
      const plat = _plataformaValida_(info.plataforma);
      cache.remove('activeToken_' + plat + '_' + info.username);
    } catch (e) {}
  }
  cache.remove('session_' + token);
}

// ══════════════════════════════════════════════════════════════════════
// VERIFICACIÓN EN DOS PASOS (TOTP — Google Authenticator / Authy / etc.)
// Implementación estándar RFC 4226 (HOTP) + RFC 6238 (TOTP), verificada
// contra los 10 vectores de prueba oficiales de la RFC 4226 Apéndice D.
// ══════════════════════════════════════════════════════════════════════
const TOTP_ALFABETO32_ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function _base32Encode_(bytes) {
  let bits = '';
  bytes.forEach(b => { bits += (b < 0 ? b + 256 : b).toString(2).padStart(8, '0'); });
  let out = '';
  let i = 0;
  for (; i + 5 <= bits.length; i += 5) {
    out += TOTP_ALFABETO32_[parseInt(bits.substring(i, i + 5), 2)];
  }
  const resto = bits.length - i;
  if (resto > 0) {
    out += TOTP_ALFABETO32_[parseInt(bits.substring(i).padEnd(5, '0'), 2)];
  }
  return out;
}

function _base32Decode_(base32) {
  const limpio = String(base32 || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < limpio.length; i++) {
    const val = TOTP_ALFABETO32_.indexOf(limpio[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return bytes;
}

// Genera un secreto de 10 bytes (16 caracteres base32) — mismo tamaño que
// usa Google Authenticator por defecto. Reutiliza randomHex_(), la misma
// fuente de aleatoriedad (Utilities.getUuid()) ya usada para las sales de
// contraseñas en este archivo.
function generarSecretoTOTP_() {
  const hex = randomHex_(20);
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substr(i, 2), 16));
  return _base32Encode_(bytes);
}

// Utilities.computeHmacSignature espera cada byte en rango de "byte" con
// signo de Java (-128..127). _base32Decode_ y el contador producen bytes
// SIN signo (0..255) — hay que convertir 128..255 a su equivalente negativo
// antes de llamarla, o la firma HMAC sale mal.
function _aFirmado_(b) { return b > 127 ? b - 256 : b; }

function _hotp_(secretBase32, contador) {
  const keyBytes = _base32Decode_(secretBase32).map(_aFirmado_);
  const msgBytes = [];
  let c = contador;
  for (let i = 7; i >= 0; i--) {
    msgBytes[i] = _aFirmado_(c & 0xff);
    c = Math.floor(c / 256);
  }
  // Nota: NO existe Utilities.computeHmacSha1Signature() en Apps Script —
  // ese nombre no es real. El método correcto es el genérico
  // computeHmacSignature(algoritmo, valor, clave).
  const hmac = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_1, msgBytes, keyBytes);
  const u = b => (b < 0 ? b + 256 : b);
  const offset = u(hmac[19]) & 0xf;
  const codigo = ((u(hmac[offset]) & 0x7f) << 24)
               | ((u(hmac[offset + 1]) & 0xff) << 16)
               | ((u(hmac[offset + 2]) & 0xff) << 8)
               | (u(hmac[offset + 3]) & 0xff);
  return String(codigo % 1000000).padStart(6, '0');
}

// Tolerancia de ±1 paso (±30s) para compensar pequeños desfases de reloj
// entre el teléfono del usuario y el servidor — igual que hacen Google,
// GitHub, etc.
function verificarTOTP_(secretBase32, codigo, ventana) {
  if (!secretBase32) return false;
  const codigoLimpio = String(codigo || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(codigoLimpio)) return false;
  const win = (ventana === undefined) ? 1 : ventana;
  const contadorActual = Math.floor(Date.now() / 1000 / 30);
  for (let i = -win; i <= win; i++) {
    if (_hotp_(secretBase32, contadorActual + i) === codigoLimpio) return true;
  }
  return false;
}

// Devuelve la ficha del usuario dueño de la sesión — y solo esa. La hoja
// "usuarios" completa está restringida a admins (puedeLeerHoja_), así que
// un técnico/consultor/inventario nunca recibía su propio nombre, correo,
// etc. en "Mi perfil" (el arreglo usuarios del cliente quedaba vacío para
// esos roles). Esto no es una ampliación de acceso: solo expone la fila
// propia de quien ya tiene una sesión válida, igual que totp_generar/
// activar/desactivar.
function miPerfil_(sesion) {
  const hallazgo = _filaUsuarioPorUsername_(sesion.username);
  if (!hallazgo) return { ok: false, error: "NOT_FOUND" };
  const obj = {};
  Object.keys(hallazgo.idx).forEach(h => { obj[h] = hallazgo.row[hallazgo.idx[h]]; });
  return { ok: true, usuario: despojarCamposSensibles_(obj) };
}

function totpGenerar_(sesion) {
  const secret = generarSecretoTOTP_();
  const emisor = 'SAGAE';
  const otpauthUrl = 'otpauth://totp/' + encodeURIComponent(emisor + ':' + sesion.username) +
    '?secret=' + secret + '&issuer=' + encodeURIComponent(emisor) + '&algorithm=SHA1&digits=6&period=30';
  return { ok: true, secret: secret, otpauthUrl: otpauthUrl };
}

function _filaUsuarioPorUsername_(username) {
  const sheet = getSheet(SHEETS.usuarios);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idx = {};
  headers.forEach((h, i) => { idx[h] = i; });
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idx.username] || '').trim().toLowerCase() === username.toLowerCase()) {
      return { sheet: sheet, idx: idx, rowNum: i + 1, row: rows[i] };
    }
  }
  return null;
}

function totpActivar_(sesion, payload) {
  const secret = String(payload.secret || '').trim();
  const codigo = String(payload.codigo || '').trim();
  if (!secret || !codigo) return { ok: false, error: "MISSING_FIELDS" };
  if (!verificarTOTP_(secret, codigo)) {
    return { ok: false, error: "INVALID_TOTP", message: "El código no coincide. Verifica la hora de tu teléfono e intenta de nuevo." };
  }

  const hallazgo = _filaUsuarioPorUsername_(sesion.username);
  if (!hallazgo) return { ok: false, error: "NOT_FOUND" };

  hallazgo.sheet.getRange(hallazgo.rowNum, hallazgo.idx.totpSecret + 1).setValue(secret);
  hallazgo.sheet.getRange(hallazgo.rowNum, hallazgo.idx.totpEnabled + 1).setValue(true);
  invalidarCacheUsuarios_();
  return { ok: true };
}

function totpDesactivar_(sesion) {
  const hallazgo = _filaUsuarioPorUsername_(sesion.username);
  if (!hallazgo) return { ok: false, error: "NOT_FOUND" };

  hallazgo.sheet.getRange(hallazgo.rowNum, hallazgo.idx.totpSecret + 1).setValue('');
  hallazgo.sheet.getRange(hallazgo.rowNum, hallazgo.idx.totpEnabled + 1).setValue(false);
  invalidarCacheUsuarios_();
  return { ok: true };
}

function procesarLoginTOTP_(payload) {
  const preAuthToken = String(payload.preAuthToken || '');
  const codigo = String(payload.codigo || '').trim();
  if (!preAuthToken || !codigo) return { ok: false, error: "MISSING_FIELDS" };

  const cache = CacheService.getScriptCache();
  const raw = cache.get('preauth_' + preAuthToken);
  if (!raw) return { ok: false, error: "PREAUTH_EXPIRADO" };

  let info;
  try { info = JSON.parse(raw); } catch (e) { return { ok: false, error: "PREAUTH_EXPIRADO" }; }
  const username = info.username;

  if (estaBloqueado_(username)) {
    return { ok: false, error: "BLOCKED", message: "Demasiados intentos fallidos. Espera 5 minutos." };
  }

  const hallazgo = _filaUsuarioPorUsername_(username);
  if (!hallazgo || hallazgo.row[hallazgo.idx.estado] === 'inactivo') {
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  const secret = hallazgo.row[hallazgo.idx.totpSecret];
  if (!secret || !verificarTOTP_(secret, codigo)) {
    registrarIntentoFallido_(username);
    return { ok: false, error: "INVALID_TOTP", message: "Código incorrecto." };
  }
  limpiarIntentos_(username);

  // Token de un solo uso — se consume aquí para que no sirva dos veces.
  cache.remove('preauth_' + preAuthToken);

  const rol = hallazgo.row[hallazgo.idx.rol];
  const nombre = hallazgo.row[hallazgo.idx.nombre];
  const mustChange = hallazgo.row[hallazgo.idx.mustChange] || false;
  const token = crearSesion_(username, rol, nombre, info.plataforma);

  try {
    if (hallazgo.idx.ultimoAcceso !== undefined) {
      hallazgo.sheet.getRange(hallazgo.rowNum, hallazgo.idx.ultimoAcceso + 1).setValue(
        Utilities.formatDate(new Date(), "America/Panama", "yyyy-MM-dd HH:mm:ss")
      );
    }
  } catch (e) {}

  return { ok: true, token: token, rol: rol, nombre: nombre, username: username, mustChange: mustChange };
}

// ── Normaliza el campo "resp" de un ticket para comparaciones de identidad ──
// "", "—" y "sin asignar" (cualquier capitalización) se consideran
// equivalentes a "sin responsable". Cualquier otro valor se devuelve tal cual.
// Se usa tanto para decidir si un ticket está libre como para detectar si el
// responsable cambió entre que el cliente leyó el ticket y que el servidor
// procesó la solicitud de "Tomar ticket".
function _respNormalizado_(v) {
  const s = String(v || '').trim();
  if (s === '' || s === '—' || s.toLowerCase() === 'sin asignar') return null;
  return s;
}

function intentosLoginKey_(username) { return 'loginfail_' + username.toLowerCase(); }

function estaBloqueado_(username) {
  const n = parseInt(CacheService.getScriptCache().get(intentosLoginKey_(username)) || '0', 10);
  return n >= 5;
}

function registrarIntentoFallido_(username) {
  const cache = CacheService.getScriptCache();
  const key = intentosLoginKey_(username);
  const n = parseInt(cache.get(key) || '0', 10) + 1;
  cache.put(key, String(n), 300);
}

function limpiarIntentos_(username) {
  CacheService.getScriptCache().remove(intentosLoginKey_(username));
}

function tienePermisoEscritura_(rol, sheetName, action) {
  if (sheetName === 'auditoria' && action === 'insert') return true;
  const p = PERMS_SERVER[rol];
  if (!p || p[sheetName] !== true) return false;
  if (action === 'insert' || action === 'update') return p.edit === true;
  if (action === 'delete_logical') return p.delete === true;
  return false;
}

function puedeLeerHoja_(rol, sheetName) {
  if (sheetName === 'departamentos' || sheetName === 'espacios') return true;
  const p = PERMS_SERVER[rol];
  if (!p) return false;
  if (sheetName === 'usuarios') return rol === 'admin';
  if (sheetName === 'auditoria') return p.auditoria === true;
  return true;
}

function despojarCamposSensibles_(obj) {
  if (obj && typeof obj === 'object') {
    delete obj.passHash;
    delete obj.sessionToken;
    delete obj.totpSecret; // la semilla de 2FA nunca debe salir del servidor
  }
  return obj;
}

// ══════════════════════════════════════════════════════════════════════
// GALERÍA DE FOTOS DEL TICKET (seguimiento) — máximo 5 por ticket
// ══════════════════════════════════════════════════════════════════════
const MAX_FOTOS_TICKET = 5;

// Si la hoja de Tickets fue creada antes de esta función, le falta la
// columna "fotos" en el encabezado físico. Se agrega sola, una sola vez,
// sin necesidad de que nadie edite el Google Sheets a mano.
function asegurarColumnaFotos_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return; // hoja vacía, ensureHeaders se encarga
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headerRow.indexOf('fotos') === -1) {
    sheet.getRange(1, lastCol + 1).setValue('fotos');
  }
}

// Migra automáticamente el campo legacy "foto" (una sola URL) al nuevo
// formato de galería, SOLO para mostrarlo al cliente — no reescribe nada
// en la hoja. Así ningún ticket viejo pierde su foto original.
function migrarFotosTicket_(obj) {
  let fotos = [];
  if (Array.isArray(obj.fotos)) {
    fotos = obj.fotos;
  } else if (obj.fotos && typeof obj.fotos === 'string') {
    try { fotos = JSON.parse(obj.fotos); } catch (e) { fotos = []; }
  }
  if ((!fotos || fotos.length === 0) && obj.foto && obj.foto !== '—' && obj.foto !== '') {
    fotos = [{
      url: obj.foto,
      fecha: obj.fechaCreacion || '',
      usuario: 'Desconocido',
      estado: obj.estado || '',
      nota: 'Foto original (migrada automáticamente)'
    }];
  }
  obj.fotos = fotos;
  return obj;
}

// ── CACHÉ DE USUARIOS (rendimiento) ──────────────────────────────────
// Antes, cada notificación llamaba getAdminEmails() + getResponsableEmail()
// y CADA UNA releía la hoja Usuarios completa. Un solo guardado de ticket
// podía provocar 3-4 lecturas completas de esa hoja, todas dentro del
// tiempo que el usuario estaba esperando frente a la pantalla.
// Ahora se cachea 10 minutos. La caché se invalida explícitamente cuando
// se inserta o actualiza un usuario (ver invalidarCacheUsuarios_).
const CACHE_USUARIOS_KEY = 'sagae_usuarios_v1';
const CACHE_USUARIOS_TTL = 600; // 10 minutos

function invalidarCacheUsuarios_() {
  try { CacheService.getScriptCache().remove(CACHE_USUARIOS_KEY); } catch (e) {}
}

function getAllUsuarios() {
  // 1) Intentar caché
  try {
    const hit = CacheService.getScriptCache().get(CACHE_USUARIOS_KEY);
    if (hit) return JSON.parse(hit);
  } catch (e) { /* caché no disponible: seguir con lectura directa */ }

  const sheet = getSheet(SHEETS.usuarios);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const lista = rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  }).filter(u => u.estado === "activo" && u.email && u.email !== "");

  // 2) Guardar en caché SOLO los campos que las notificaciones necesitan.
  //    NUNCA se cachea passHash — dato sensible, no debe salir de la hoja.
  try {
    const seguro = lista.map(u => ({
      username: u.username, nombre: u.nombre, email: u.email,
      rol: u.rol, estado: u.estado, depto: u.depto, cargo: u.cargo
    }));
    CacheService.getScriptCache().put(CACHE_USUARIOS_KEY, JSON.stringify(seguro), CACHE_USUARIOS_TTL);
    return seguro;
  } catch (e) {
    return lista;
  }
}

function getAdminEmails() {
  return getAllUsuarios().filter(u => u.rol === "admin").map(u => u.email);
}

// Emails de todos los técnicos activos
function getTecnicoEmails() {
  return getAllUsuarios()
    .filter(u => (u.rol === "tecnico" || u.rol === "admin") && u.estado !== "inactivo")
    .map(u => u.email)
    .filter(Boolean);
}

function getResponsableEmail(nombreResponsable) {
  if (!nombreResponsable) return null;
  const u = getAllUsuarios().find(u =>
    u.nombre && u.nombre.toLowerCase().trim() === nombreResponsable.toLowerCase().trim()
  );
  return u ? u.email : null;
}


// ──────────────────────────────────────────────────────────────────
// UTILIDAD: Extraer correo del reportador desde la descripción
// El portal público guarda: "--- Reportado por: Nombre (correo) | ..."
// ──────────────────────────────────────────────────────────────────
function getReportadorEmail(desc) {
  if (!desc || typeof desc !== "string") return null;
  // Buscar patrón: (correo@dominio.com)
  const match = desc.match(/Reportado por:[^(]*\(([^)@]+@[^)]+)\)/i);
  if (match && match[1]) {
    const email = match[1].trim();
    // Validar que sea un correo real
    if (email.includes("@") && email.includes(".")) return email;
  }
  return null;
}

function getReportadorNombre(desc) {
  if (!desc || typeof desc !== "string") return null;
  const match = desc.match(/Reportado por:\s*([^(]+)\(/i);
  return match ? match[1].trim() : null;
}

function prioridadLabel(prior) {
  const map = { urgente: "🔴 URGENTE", importante: "🟡 IMPORTANTE", normal: "🟢 NORMAL" };
  return map[prior] || prior || "—";
}

function estadoLabel(estado) {
  const map = { abierto: "📂 Abierto", progreso: "⚙️ En progreso", revision: "🔍 En revisión", cerrado: "✅ Cerrado" };
  return map[estado] || estado || "—";
}

// ── PLANTILLA HTML DE CORREO ──────────────────────────────────────────
function buildEmailHtml(titulo, subtitulo, filas, nota) {
  const filasHtml = filas.map(([label, value]) => `
    <tr>
      <td style="padding:8px 12px;background:#f5f0dc;font-size:12px;font-weight:600;color:#8B6914;width:140px;border-bottom:1px solid #e8e0c0">${label}</td>
      <td style="padding:8px 12px;font-size:12px;color:#1a1a1a;border-bottom:1px solid #e8e0c0">${value || '—'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#111111;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;background:#141414;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px">
    <!-- HEADER -->
    <div style="background:#1C1C1C;padding:24px 28px;border-bottom:3px solid #B8960C">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:28px;font-weight:900;color:#B8960C;letter-spacing:-1px">SAGAE</div>
        <div>
          <div style="font-size:11px;color:#8B7D5A;letter-spacing:.1em;text-transform:uppercase">Sistema de Activos y Gestión Administrativa Educativa</div>
          <div style="font-size:9px;color:#5A5040;letter-spacing:.1em;text-transform:uppercase;margin-top:2px">Desarrollado por RYE Design</div>
        </div>
      </div>
    </div>
    <!-- TÍTULO -->
    <div style="padding:20px 28px 16px;background:#1a1a1a;border-bottom:1px solid #2A2A1E">
      <div style="font-size:18px;font-weight:700;color:#F5F0DC;margin-bottom:4px">${titulo}</div>
      <div style="font-size:12px;color:#8B7D5A">${subtitulo}</div>
    </div>
    <!-- CONTENIDO -->
    <div style="padding:20px 28px">
      <table style="width:100%;border-collapse:collapse;background:#FDF8E1;border-radius:8px;overflow:hidden;border:1px solid #e8e0c0">
        ${filasHtml}
      </table>
      ${nota ? `<div style="margin-top:16px;padding:12px 16px;background:#1C1C1C;border-left:4px solid #B8960C;border-radius:0 8px 8px 0">
        <div style="font-size:11px;color:#C9B882;line-height:1.6">${nota}</div>
      </div>` : ''}
    </div>
    <!-- FOOTER -->
    <div style="padding:16px 28px;background:#0D0D0D;border-top:1px solid #2A2A1E;text-align:center">
      <div style="font-size:10px;color:#5A5040">SAGAE · Sistema de Activos y Gestión Administrativa Educativa · Desarrollado por RYE Design</div>
      <div style="font-size:10px;color:#3A3A2E;margin-top:3px">Este es un correo automático — No responder directamente</div>
    </div>
  </div>
</body>
</html>`;
}

// ── ENVÍO DE CORREOS ──────────────────────────────────────────────────

function notificarTicketNuevo(ticket) {
  try {
    const admins = getAdminEmails();
    const respEmail = getResponsableEmail(ticket.resp);
    // Incluir al reportador si el ticket viene del portal público
    const reportadorEmail = getReportadorEmail(ticket.desc);
    const destinatarios = [...new Set([...admins, respEmail, reportadorEmail].filter(Boolean))];
    if (!destinatarios.length) return;

    // Nota especial si es del portal público
    const esPortal = reportadorEmail !== null;
    const reportadorNombre = esPortal ? getReportadorNombre(ticket.desc) : null;

    const html = buildEmailHtml(
      "📋 Nuevo ticket asignado",
      `Se ha creado el ticket ${ticket.codigo} en el sistema SAGAE`,
      [
        ["Código",       ticket.codigo],
        ["Título",       ticket.titulo],
        ["Tipo",         ticket.tipo],
        ["Prioridad",    prioridadLabel(ticket.prior)],
        ["Estado",       estadoLabel(ticket.estado)],
        ["Responsable",  ticket.resp],
        ["Activo",       ticket.activoNombre || "Sin activo"],
        ["Proyecto",     ticket.proy],
        ["Deadline",     ticket.dead],
        ["Descripción",  ticket.desc],
        ["Creado",       ticket.fechaCreacion],
      ],
      ticket.prior === "urgente"
        ? `⚠️ Este ticket tiene prioridad URGENTE. Por favor atenderlo a la brevedad posible.${esPortal ? ` Reportado por: ${reportadorNombre}.` : ""}`
        : `Por favor revisar el sistema SAGAE para más detalles y actualizaciones.${esPortal ? ` Este ticket fue creado desde el Portal de Reportes por ${reportadorNombre}.` : ""}`
    );

    destinatarios.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: `[SAGAE] ${prioridadLabel(ticket.prior)} — Nuevo ticket ${ticket.codigo}: ${ticket.titulo}`,
        htmlBody: html
      });
    });
  } catch(e) {
    Logger.log("Error notificarTicketNuevo: " + e.message);
  }
}

function notificarCambioEstado(ticket, estadoAnterior) {
  try {
    const admins = getAdminEmails();
    const respEmail = getResponsableEmail(ticket.resp);
    // Incluir al reportador en actualizaciones de estado
    const reportadorEmail = getReportadorEmail(ticket.desc);
    const reportadorNombre = reportadorEmail ? getReportadorNombre(ticket.desc) : null;
    // Todos los técnicos para que vean el progreso del ticket
    const todosTecnicosE = getTecnicoEmails();
    const destinatarios = [...new Set([...admins, ...todosTecnicosE, respEmail, reportadorEmail].filter(Boolean))];
    if (!destinatarios.length) return;

    // Mensaje especial de cierre para el reportador
    const esCierre = ticket.estado === "cerrado";
    const notaBase = esCierre
      ? "✅ El ticket ha sido marcado como CERRADO. El problema ha sido resuelto."
      : "El estado de tu reporte ha sido actualizado en el sistema SAGAE.";
    const notaReportador = reportadorEmail
      ? (esCierre
          ? `${notaBase} ${reportadorNombre ? `Gracias ${reportadorNombre} por tu reporte.` : ""} Si el problema persiste, puedes crear un nuevo reporte en el portal.`
          : `${notaBase} ${reportadorNombre ? `Hola ${reportadorNombre},` : ""} el equipo técnico está trabajando en tu caso.`)
      : notaBase;

    const html = buildEmailHtml(
      esCierre ? "✅ Tu reporte ha sido resuelto" : "🔄 Actualización de tu reporte",
      `El ticket ${ticket.codigo} — ${ticket.titulo}`,
      [
        ["Código",          ticket.codigo],
        ["Título",          ticket.titulo],
        ["Estado anterior", estadoLabel(estadoAnterior)],
        ["Estado actual",   estadoLabel(ticket.estado)],
        ["Avance",          (ticket.avance || 0) + "%"],
        ["Técnico responsable", ticket.resp],
        ["Prioridad",       prioridadLabel(ticket.prior)],
        ["Deadline",        ticket.dead || "—"],
        ["Actualizado",     new Date().toLocaleString("es-PA")],
      ],
      notaReportador
    );

    destinatarios.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: esCierre
          ? `[SAGAE] ✅ Resuelto — Tu reporte ${ticket.codigo}: ${ticket.titulo}`
          : `[SAGAE] Actualización — ${ticket.codigo}: ${estadoLabel(estadoAnterior)} → ${estadoLabel(ticket.estado)}`,
        htmlBody: html
      });
    });
  } catch(e) {
    Logger.log("Error notificarCambioEstado: " + e.message);
  }
}


// ──────────────────────────────────────────────────────────────────
// NOTIFICACIÓN: Cambio de responsable (asignación de ticket)
// ──────────────────────────────────────────────────────────────────
function notificarCambioResponsable(ticket, respAnterior) {
  try {
    const admins       = getAdminEmails();
    const respNuevoEmail    = getResponsableEmail(ticket.resp);
    const respAnteriorEmail = getResponsableEmail(respAnterior);
    // Todos los técnicos del sistema para que sepan quién tomó el ticket
    const todosTecnicos = getTecnicoEmails();
    // Reportador del portal público
    const reportadorEmail  = getReportadorEmail(ticket.desc);
    const reportadorNombre = reportadorEmail ? getReportadorNombre(ticket.desc) : null;
    const esPortal = reportadorEmail !== null;

    // Destinatarios completos: admins + todos los técnicos + reportador portal
    const destinatarios = [...new Set([
      ...admins,
      ...todosTecnicos,
      respNuevoEmail,
      respAnteriorEmail,
      reportadorEmail
    ].filter(Boolean))];

    if (!destinatarios.length) return;

    // Nota personalizada según si es reportador del portal o técnico interno
    const notaReportador = esPortal
      ? `Hola${reportadorNombre ? " " + reportadorNombre : ""}, el técnico **${ticket.resp}** se ha asignado tu reporte y comenzará a atenderlo pronto. Te notificaremos cada vez que haya un avance.`
      : `El técnico **${ticket.resp}** tomó este ticket. Estado: ${estadoLabel(ticket.estado)}.`;

    const cuerpo = buildEmailHtml(
      `👤 ${ticket.resp} tomó el ticket ${ticket.codigo}`,
      `Ticket ${ticket.codigo} — ${ticket.titulo}`,
      [
        ["Código",               ticket.codigo],
        ["Título",               ticket.titulo],
        ["Técnico que lo tomó",  ticket.resp],
        ["Responsable anterior", respAnterior || "Sin asignar"],
        ["Estado actual",        estadoLabel(ticket.estado)],
        ["Prioridad",            prioridadLabel(ticket.prior)],
        ["Tipo",                 ticket.tipo || "—"],
        ["Activo vinculado",     ticket.activoNombre || "—"],
        ["Deadline",             ticket.dead || "—"],
        ["Avance actual",        (ticket.avance || 0) + "%"],
        ["Fecha de asignación",  new Date().toLocaleString("es-PA")],
      ],
      notaReportador
    );

    MailApp.sendEmail({
      to: destinatarios.join(","),
      subject: `[SAGAE] 👤 ${ticket.resp} tomó el ticket ${ticket.codigo}: ${ticket.titulo}`,
      htmlBody: cuerpo
    });

    Logger.log("notificarCambioResponsable enviado a: " + destinatarios.join(", "));
  } catch(e) {
    Logger.log("Error notificarCambioResponsable: " + e.message);
  }
}

function notificarMantenimiento(activo, mantenimiento) {
  try {
    const admins = getAdminEmails();
    // El técnico que registró el mantenimiento sí tiene correo en el sistema
    const tecnicoEmail = getResponsableEmail(mantenimiento.tec || mantenimiento.usuario || "");
    // El correo del responsable del equipo se captura en el modal al momento del retiro
    const emailResponsable = (mantenimiento.emailResp && mantenimiento.emailResp.includes("@"))
      ? mantenimiento.emailResp : "";
    const destinatarios = [...new Set([...admins, tecnicoEmail, emailResponsable].filter(Boolean))];
    if (!destinatarios.length) return;

    const html = buildEmailHtml(
      "🔧 Equipo en Mantenimiento — " + activo.codigo,
      `El equipo <strong>${activo.nombre}</strong> ha sido ingresado al Departamento de IT para mantenimiento.`,
      [
        ["Activo",          activo.nombre],
        ["Código",          activo.codigo],
        ["Tipo de equipo",  activo.tipo || "—"],
        ["Departamento",    activo.depto || "—"],
        ["Asignado a",      activo.asignado || "—"],
        ["Tipo de mantenimiento", mantenimiento.tipo],
        ["Descripción / Motivo",  mantenimiento.desc],
        ["Técnico responsable",   mantenimiento.tec || mantenimiento.usuario || "—"],
        ["Fecha de ingreso",      mantenimiento.fecha],
        ["Costo estimado",        mantenimiento.costo ? "$" + mantenimiento.costo : "Por determinar"],
        ["Registrado por",        mantenimiento.usuario],
      ],
      "El equipo permanecerá en IT hasta que el mantenimiento sea completado. Se le notificará cuando esté listo para ser devuelto."
    );

    destinatarios.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: `[SAGAE] 🔧 Equipo en Mantenimiento — ${activo.codigo}: ${activo.nombre}`,
        htmlBody: html
      });
    });
  } catch(e) {
    Logger.log("Error notificarMantenimiento: " + e.message);
  }
}

// Nueva función: notificar ENTRADA a mantenimiento por cambio de estado
function notificarEntradaMantenimiento(activo, tecnico, motivo, emailResp) {
  try {
    const admins = getAdminEmails();
    const tecnicoEmail = getResponsableEmail(tecnico || "");
    const emailResponsable = (emailResp && emailResp.includes("@")) ? emailResp : "";
    // También notificar al responsable del espacio donde está el equipo
    const emailEspacio = (activo.responsableEspacioEmail && activo.responsableEspacioEmail.includes("@"))
      ? activo.responsableEspacioEmail : "";
    const destinatarios = [...new Set([...admins, tecnicoEmail, emailResponsable, emailEspacio].filter(Boolean))];
    if (!destinatarios.length) return;

    const html = buildEmailHtml(
      "🔧 Equipo ingresado a IT para Mantenimiento",
      `El equipo <strong>${activo.nombre}</strong> ha sido marcado como <strong>EN MANTENIMIENTO</strong> en el sistema SAGAE.`,
      [
        ["Activo",              activo.nombre],
        ["Código",              activo.codigo],
        ["Tipo de equipo",      activo.tipo || "—"],
        ["Departamento origen", activo.depto || "—"],
        ["Asignado a",          activo.asignado || "—"],
        ["Técnico responsable", tecnico || "—"],
        ["Motivo",              motivo || "Sin especificar"],
        ["Fecha de ingreso",    new Date().toLocaleString("es-PA")],
        ["Ubicación temporal",  "Departamento de Tecnología (IT)"],
      ],
      "El equipo permanecerá en custodia del Departamento de IT durante el mantenimiento. " +
      "Recibirá un correo de notificación cuando el equipo esté listo para ser devuelto. " +
      "Para consultas sobre el estado del mantenimiento, contacte al Departamento de Tecnología."
    );

    destinatarios.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: `[SAGAE] 🔧 EQUIPO EN IT — ${activo.codigo}: ${activo.nombre}`,
        htmlBody: html
      });
    });
  } catch(e) {
    Logger.log("Error notificarEntradaMantenimiento: " + e.message);
  }
}

// Nueva función: notificar SALIDA de mantenimiento (equipo devuelto)
function notificarSalidaMantenimiento(activo, tecnico, motivo, nuevoEstado, emailResp) {
  try {
    const admins = getAdminEmails();
    const tecnicoEmail = getResponsableEmail(tecnico || "");
    const emailResponsable = (emailResp && emailResp.includes("@")) ? emailResp : "";
    const emailEspacio = (activo.responsableEspacioEmail && activo.responsableEspacioEmail.includes("@"))
      ? activo.responsableEspacioEmail : "";
    const destinatarios = [...new Set([...admins, tecnicoEmail, emailResponsable, emailEspacio].filter(Boolean))];
    if (!destinatarios.length) return;

    const html = buildEmailHtml(
      "✅ Equipo devuelto de Mantenimiento",
      `El equipo <strong>${activo.nombre}</strong> ha completado el mantenimiento y está listo para ser devuelto.`,
      [
        ["Activo",              activo.nombre],
        ["Código",              activo.codigo],
        ["Tipo de equipo",      activo.tipo || "—"],
        ["Departamento",        activo.depto || "—"],
        ["Devuelto a",          activo.asignado || "—"],
        ["Técnico responsable", tecnico || "—"],
        ["Trabajo realizado",   motivo || "Mantenimiento completado"],
        ["Nuevo estado",        nuevoEstado || "activo"],
        ["Fecha de devolución", new Date().toLocaleString("es-PA")],
      ],
      "El equipo ha sido devuelto y está disponible nuevamente. " +
      "El historial completo del mantenimiento quedó registrado en el sistema SAGAE."
    );

    destinatarios.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: `[SAGAE] ✅ EQUIPO DEVUELTO — ${activo.codigo}: ${activo.nombre}`,
        htmlBody: html
      });
    });
  } catch(e) {
    Logger.log("Error notificarSalidaMantenimiento: " + e.message);
  }
}


// Días antes del vencimiento en los que se envía recordatorio.
// Al usar hitos puntuales (en vez de "<= N") se evita reenviar el mismo
// correo todos los días mientras el registro esté dentro del rango.
const HITOS_DEADLINE_TICKET = [3, 1, 0];
const HITOS_GARANTIA_ACTIVO = [30, 15, 7, 3, 1, 0];

function verificarDeadlines() {
  try {
    const sheet = getSheet(SHEETS.tickets);
    if (!sheet || sheet.getLastRow() < 2) return;

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    rows.slice(1).forEach(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i]; });

      if (obj.estado === "cerrado" || obj.estado === "eliminado") return;
      if (!obj.dead || obj.dead === "—") return;

      const deadline = new Date(obj.dead);
      deadline.setHours(0,0,0,0);
      const diffDias = Math.round((deadline - hoy) / (1000 * 60 * 60 * 24));

      // Notificar solo en hitos puntuales antes del vencimiento, y luego
      // un recordatorio semanal mientras siga vencido (no todos los días).
      const esHito = HITOS_DEADLINE_TICKET.includes(diffDias);
      const esRecordatorioVencido = diffDias < 0 && Math.abs(diffDias) % 7 === 0;
      if (!esHito && !esRecordatorioVencido) return;

      const admins = getAdminEmails();
      const respEmail = getResponsableEmail(obj.resp);
      const destinatarios = [...new Set([...admins, respEmail].filter(Boolean))];
      if (!destinatarios.length) return;

      const alertLabel = diffDias < 0
        ? `⛔ VENCIDO hace ${Math.abs(diffDias)} día(s)`
        : diffDias === 0
        ? "🚨 VENCE HOY"
        : `⚠️ Vence en ${diffDias} día(s)`;

      const html = buildEmailHtml(
        "⏰ Alerta de deadline",
        `El ticket ${obj.codigo} requiere atención urgente`,
        [
          ["Alerta",      alertLabel],
          ["Código",      obj.codigo],
          ["Título",      obj.titulo],
          ["Responsable", obj.resp],
          ["Estado",      estadoLabel(obj.estado)],
          ["Avance",      (obj.avance || 0) + "%"],
          ["Deadline",    obj.dead],
          ["Prioridad",   prioridadLabel(obj.prior)],
        ],
        diffDias < 0
          ? `⛔ Este ticket tiene su deadline VENCIDO. Por favor actualizar el estado en el sistema SAGAE inmediatamente.`
          : `Por favor atender este ticket antes del ${obj.dead} para cumplir con el plazo establecido.`
      );

      destinatarios.forEach(email => {
        MailApp.sendEmail({
          to: email,
          subject: `[SAGAE] ${alertLabel} — ${obj.codigo}: ${obj.titulo}`,
          htmlBody: html
        });
      });
    });
  } catch(e) {
    Logger.log("Error verificarDeadlines: " + e.message);
  }
}

// ── ALERTAS DE GARANTÍAS Y LICENCIAS DE SOFTWARE PRÓXIMAS A VENCER ─────
// Revisa TODOS los activos (equipos con garantía y licencias de software,
// que comparten el mismo campo "garantia" usado como fecha de vencimiento
// o renovación) y notifica por correo en hitos puntuales antes de vencer,
// más un recordatorio mensual mientras siga vencido.
function verificarGarantias() {
  try {
    const sheet = getSheet(SHEETS.activos);
    if (!sheet || sheet.getLastRow() < 2) return;

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    rows.slice(1).forEach(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i]; });

      if (obj.estado === "eliminado" || obj.estado === "descarte") return;
      if (!obj.garantia || obj.garantia === "—") return;

      const venc = new Date(obj.garantia);
      if (isNaN(venc.getTime())) return;
      venc.setHours(0,0,0,0);
      const diffDias = Math.round((venc - hoy) / (1000 * 60 * 60 * 24));

      const esHito = HITOS_GARANTIA_ACTIVO.includes(diffDias);
      const esRecordatorioVencido = diffDias < 0 && Math.abs(diffDias) % 30 === 0;
      if (!esHito && !esRecordatorioVencido) return;

      const admins = getAdminEmails();
      const respEmail = (obj.asignadoEmail && obj.asignadoEmail.includes("@"))
        ? obj.asignadoEmail
        : getResponsableEmail(obj.asignado);
      const espacioEmail = (obj.responsableEspacioEmail && obj.responsableEspacioEmail.includes("@"))
        ? obj.responsableEspacioEmail : "";
      const destinatarios = [...new Set([...admins, respEmail, espacioEmail].filter(Boolean))];
      if (!destinatarios.length) return;

      const esLicencia = obj.tipo === "Software";
      const etiqueta = esLicencia ? "Licencia de software" : "Garantía de equipo";

      const alertLabel = diffDias < 0
        ? `⛔ VENCIDA hace ${Math.abs(diffDias)} día(s)`
        : diffDias === 0
        ? "🚨 VENCE HOY"
        : `⚠️ Vence en ${diffDias} día(s)`;

      const html = buildEmailHtml(
        `⏰ Alerta de ${etiqueta.toLowerCase()}`,
        `${etiqueta} próxima a vencer: ${obj.nombre}`,
        [
          ["Alerta",   alertLabel],
          ["Código",   obj.codigo],
          ["Nombre",   obj.nombre],
          ["Tipo",     esLicencia ? "💿 Licencia de software" : obj.tipo],
          [esLicencia ? "Proveedor" : "Marca / Modelo", (obj.marca||"—") + (obj.modelo? " " + obj.modelo : "")],
          [esLicencia ? "Costo anual" : "Valor de compra", obj.valor ? "$" + obj.valor : "—"],
          ["Asignado a / Depto", (obj.asignado||"—") + " — " + (obj.depto||"—")],
          [esLicencia ? "Vence / debe renovarse" : "Garantía vence", obj.garantia],
        ],
        diffDias < 0
          ? `⛔ Este registro está VENCIDO. Por favor gestionar la renovación o actualizar su estado en el sistema SAGAE.`
          : `Por favor gestionar la renovación antes del ${obj.garantia} para evitar interrupciones de servicio.`
      );

      destinatarios.forEach(email => {
        MailApp.sendEmail({
          to: email,
          subject: `[SAGAE] ${alertLabel} — ${etiqueta}: ${obj.codigo} ${obj.nombre}`,
          htmlBody: html
        });
      });
    });
  } catch(e) {
    Logger.log("Error verificarGarantias: " + e.message);
  }
}

// Ejecuta ambas verificaciones manualmente (botón "Probar ahora" del panel admin)
function ejecutarAlertasManual() {
  verificarDeadlines();
  verificarGarantias();
  verificarLicenciasPaquete();
  return "Alertas revisadas y enviadas (si correspondía)";
}

// ── ALERTAS DE PAQUETES DE LICENCIA PRÓXIMOS A VENCER ───────────────
// A diferencia de verificarGarantias() (que revisa activos individuales),
// esto revisa la hoja "Licencias" — paquetes que pueden estar instalados
// en varios equipos a la vez (campo "instalaciones", JSON). El correo
// incluye la lista de equipos afectados para que se sepa el impacto real
// de que la licencia venza.
function verificarLicenciasPaquete() {
  try {
    const sheet = getSheet(SHEETS.licencias);
    if (!sheet || sheet.getLastRow() < 2) return;

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    rows.slice(1).forEach(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i]; });

      if (obj.estado === "eliminado" || obj.estado === "cancelada") return;
      if (!obj.fechaVencimiento || obj.fechaVencimiento === "—") return;

      const venc = new Date(obj.fechaVencimiento);
      if (isNaN(venc.getTime())) return;
      venc.setHours(0,0,0,0);
      const diffDias = Math.round((venc - hoy) / (1000 * 60 * 60 * 24));

      const esHito = HITOS_GARANTIA_ACTIVO.includes(diffDias);
      const esRecordatorioVencido = diffDias < 0 && Math.abs(diffDias) % 30 === 0;
      if (!esHito && !esRecordatorioVencido) return;

      const admins = getAdminEmails();
      if (!admins.length) return;

      let instalaciones = [];
      try { instalaciones = JSON.parse(obj.instalaciones || "[]"); } catch(e) { instalaciones = []; }
      const cantidadTotal = parseInt(obj.cantidadTotal) || 0;
      const usadas = instalaciones.length;
      const listaEquipos = instalaciones.length
        ? instalaciones.map(i => `${i.activoCodigo || "?"} — ${i.activoNombre || "—"}`).join("<br>")
        : "Sin equipos registrados con esta licencia instalada";

      const alertLabel = diffDias < 0
        ? `⛔ VENCIDA hace ${Math.abs(diffDias)} día(s)`
        : diffDias === 0
        ? "🚨 VENCE HOY"
        : `⚠️ Vence en ${diffDias} día(s)`;

      const html = buildEmailHtml(
        "⏰ Alerta de licencia de software (paquete)",
        `La licencia ${obj.nombre} está próxima a vencer o renovar`,
        [
          ["Alerta",            alertLabel],
          ["Código",            obj.codigo],
          ["Nombre / Paquete",  obj.nombre],
          ["Proveedor",         obj.proveedor || "—"],
          ["Plan / Versión",    obj.planVersion || "—"],
          ["Cupos usados",      cantidadTotal ? `${usadas} de ${cantidadTotal}` : `${usadas} (sin límite registrado)`],
          ["Costo anual",       obj.costoAnual ? "$" + obj.costoAnual : "—"],
          ["Vence / renovar",   obj.fechaVencimiento],
          ["Equipos con esta licencia instalada", listaEquipos],
        ],
        diffDias < 0
          ? `⛔ Esta licencia está VENCIDA y afecta a ${usadas} equipo(s). Por favor gestionar la renovación cuanto antes.`
          : `Por favor gestionar la renovación antes del ${obj.fechaVencimiento}. Afecta a ${usadas} equipo(s) actualmente.`
      );

      admins.forEach(email => {
        MailApp.sendEmail({
          to: email,
          subject: `[SAGAE] ${alertLabel} — Licencia: ${obj.codigo} ${obj.nombre} (${usadas} equipo(s))`,
          htmlBody: html
        });
      });
    });
  } catch(e) {
    Logger.log("Error verificarLicenciasPaquete: " + e.message);
  }
}

// Instalador del trigger diario de alertas (deadlines de tickets +
// garantías/licencias de activos). Antes de este cambio, verificarDeadlines
// existía pero NUNCA se ejecutaba automáticamente porque no tenía trigger
// instalado — quedaba como código muerto. Se corrige aquí.
function instalarTriggerAlertas() {
  ["verificarDeadlines", "verificarGarantias", "verificarLicenciasPaquete"].forEach(fn => {
    ScriptApp.getProjectTriggers().forEach(t => {
      if (t.getHandlerFunction() === fn) ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger(fn)
      .timeBased()
      .everyDays(1)
      .atHour(13) // 13:00 UTC = 8:00am Panamá
      .create();
  });
  Logger.log("Triggers de alertas instalados: verificarDeadlines + verificarGarantias, diario 8am Panamá");
  return "Triggers de alertas instalados (diario 8:00am Panamá)";
}

// ══════════════════════════════════════════════════════════════════════
// API PRINCIPAL
// ══════════════════════════════════════════════════════════════════════


// ── SOLICITUD DE COMPRA DE PIEZAS ────────────────────────────────────
function notificarSolicitudPiezasTicket(ticket, solicitud, tecnicoEmail) {
  try {
    const admins = getAdminEmails();
    const emailCompras = solicitud.emailCompras || "";
    const destinatarios = [...new Set([...admins, emailCompras, tecnicoEmail].filter(Boolean))];
    if (!destinatarios.length) return;

    const urgenciaLabel = {urgente:"🔴 URGENTE", importante:"🟡 Importante", normal:"🟢 Normal"}[solicitud.urgencia] || solicitud.urgencia;

    const htmlCompras = buildEmailHtml(
      "🛒 Solicitud de Compra de Piezas — Ticket " + ticket.codigo,
      `El técnico <strong>${solicitud.usuario}</strong> necesita piezas para atender el ticket <strong>${ticket.titulo}</strong>.`,
      [
        ["Ticket",              ticket.codigo],
        ["Título",              ticket.titulo],
        ["Activo vinculado",    ticket.activoNombre || "—"],
        ["Técnico solicitante", solicitud.usuario],
        ["Piezas necesarias",   solicitud.piezas || solicitud.desc],
        ["Urgencia",            urgenciaLabel],
        ["Presupuesto estimado", solicitud.presupuesto ? "$" + solicitud.presupuesto : "Por definir"],
        ["Fecha de solicitud",  solicitud.fecha],
        ["Estado",              "⏳ Pendiente de aprobación"],
      ],
      "Por favor responda a este correo indicando el estado de la solicitud: aprobada, rechazada o en proceso. " +
      "Su respuesta quedará registrada en el historial del ticket en el sistema SAGAE."
    );

    destinatarios.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: `[SAGAE] 🛒 ${urgenciaLabel} — Solicitud de Piezas para ticket ${ticket.codigo}`,
        htmlBody: htmlCompras
      });
    });
  } catch(e) {
    Logger.log("Error notificarSolicitudPiezasTicket: " + e.message);
  }
}

function notificarSolicitudPiezas(activo, solicitud, tecnicoEmail) {
  try {
    const admins = getAdminEmails();
    const emailCompras = solicitud.emailCompras || "";
    const destinatarios = [...new Set([...admins, emailCompras, tecnicoEmail].filter(Boolean))];
    if (!destinatarios.length) return;

    const urgenciaLabel = {urgente:"🔴 URGENTE", importante:"🟡 Importante", normal:"🟢 Normal"}[solicitud.urgencia] || solicitud.urgencia;

    const htmlCompras = buildEmailHtml(
      "🛒 Solicitud de Compra de Piezas — " + activo.codigo,
      `El técnico <strong>${solicitud.usuario}</strong> necesita piezas para el mantenimiento del equipo <strong>${activo.nombre}</strong>.`,
      [
        ["Activo",              activo.nombre],
        ["Código",              activo.codigo],
        ["Tipo de equipo",      activo.tipo || "—"],
        ["Departamento",        activo.depto || "—"],
        ["Técnico solicitante", solicitud.usuario],
        ["Piezas necesarias",   solicitud.piezas || solicitud.desc],
        ["Urgencia",            urgenciaLabel],
        ["Presupuesto estimado", solicitud.presupuesto ? "$" + solicitud.presupuesto : "Por definir"],
        ["Fecha de solicitud",  solicitud.fecha],
        ["Estado",              "⏳ Pendiente de aprobación"],
      ],
      "Por favor responda a este correo indicando el estado de la solicitud: aprobada, rechazada o en proceso. " +
      "Su respuesta quedará registrada en el historial del activo en el sistema SAGAE."
    );

    destinatarios.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: `[SAGAE] 🛒 ${urgenciaLabel} — Solicitud de Piezas para ${activo.codigo}: ${activo.nombre}`,
        htmlBody: htmlCompras
      });
    });
  } catch(e) {
    Logger.log("Error notificarSolicitudPiezas: " + e.message);
  }
}


// ════════════════════════════════════════════════════════════════
// HASH SEGURO en GAS — SHA-256 con salt
// Usado al crear usuarios masivamente o importar desde script
// ════════════════════════════════════════════════════════════════
function hashPassGAS(password) {
  const saltBytes = [];
  for(let i = 0; i < 16; i++) saltBytes.push(Math.floor(Math.random()*256));
  const saltHex = saltBytes.map(b => b.toString(16).padStart(2,'0')).join('');
  const toHash  = saltHex + password;
  const bytes   = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, toHash, Utilities.Charset.UTF_8);
  const hashHex = bytes.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2,'0')).join('');
  return 'S2$' + saltHex + '$' + hashHex;
}

function verificarPasswordGAS(inputPassword, storedHash) {
  if(!storedHash) return false;
  if(storedHash.startsWith('S2$')) {
    const parts = storedHash.split('$');
    if(parts.length !== 3) return false;
    const saltHex = parts[1];
    const toHash  = saltHex + inputPassword;
    const bytes   = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, toHash, Utilities.Charset.UTF_8);
    const hashHex = bytes.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2,'0')).join('');
    return hashHex === parts[2];
  }
  // Legacy hash check
  let h = 0;
  for(let i = 0; i < inputPassword.length; i++){
    h = ((h<<5)-h)+inputPassword.charCodeAt(i); h|=0;
  }
  const legacyHash = 'H' + Math.abs(h).toString(16);
  return storedHash === legacyHash || storedHash === inputPassword;
}

// ════════════════════════════════════════════════════════════════
// AUTENTICACIÓN API — Token secreto en Script Properties
// Configurar en Apps Script: Archivo > Propiedades del proyecto
// El cliente lo envía en cada request como payload._apiToken. Ver la nota
// completa junto a validarApiToken(), abajo, sobre qué protege y qué no.
// ════════════════════════════════════════════════════════════════
// Este token es SOLO un filtro de "tráfico obviamente ajeno" (defensa en
// profundidad) — la autorización real ahora vive en la sesión server-side
// (ver validarSesion_). Por eso ya no es grave que siga en el HTML público:
// sin una sesión válida, este token por sí solo NO permite leer ni escribir
// nada sensible.
// Configurar en Apps Script → Configuración del proyecto → Propiedades del script:
//   SAGAE_API_TOKEN = SAGAE-7F2A9C41E8B6D053A1C4F9082EB37A65
function validarApiToken(payload) {
  try {
    const expected = PropertiesService.getScriptProperties().getProperty('SAGAE_API_TOKEN');
    // Fail-closed: si no está configurado o falla la lectura, se RECHAZA.
    if (!expected) return false;
    return !!(payload && payload._apiToken === expected);
  } catch (e) {
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════
// COLA ASÍNCRONA DE NOTIFICACIONES  (corrección de lentitud de guardado)
// ══════════════════════════════════════════════════════════════════════
// PROBLEMA CORREGIDO: hasta esta versión, MailApp.sendEmail se ejecutaba
// DENTRO del doPost, en bucle, un correo por destinatario. Como el cliente
// espera (fetch en modo no-cors) a que el servidor termine TODA su
// ejecución, el usuario estaba esperando literalmente a que Google
// terminara de enviar los correos: 8-25 segundos por guardado. Esa espera
// sin señal visual es lo que llevaba a hacer clic varias veces y duplicar
// tickets.
//
// AHORA: el guardado solo ENCOLA el evento (operación de milisegundos) y
// responde de inmediato. Un disparador de tiempo procesa la cola cada
// minuto y envía los correos fuera de la sesión del usuario.
//
// EFECTO VISIBLE PARA EL USUARIO: las notificaciones por correo pueden
// llegar hasta ~60 segundos después de la acción, en lugar de al instante.
// Decisión aprobada por el Licdo. Rosario Corpas. Para volver al
// comportamiento anterior basta con poner esta constante en false —
// no se requiere ningún otro cambio.
const NOTIFICACIONES_ASINCRONAS = true;

// Máximo de notificaciones despachadas por ejecución del disparador.
// Apps Script corta las ejecuciones a los 6 minutos; con 20 correos por
// ciclo de 1 minuto queda margen de sobra y se respeta la cuota diaria.
const MAX_NOTIF_POR_CICLO = 20;

// Encola un evento de notificación. Se guarda SOLO lo mínimo necesario
// (tipo, hoja, código y datos escalares del evento) — nunca el registro
// completo ni fotos, para no exceder el límite de tamaño de las
// propiedades del script y para que el correo se arme con el estado real
// del registro al momento del envío.
function encolarNotificacion_(evento) {
  if (!NOTIFICACIONES_ASINCRONAS) {
    try { despacharNotificacion_(evento); } catch (e) { Logger.log("Notif sincrona: " + e.message); }
    return;
  }
  try {
    PropertiesService.getScriptProperties()
      .setProperty('notif_' + Date.now() + '_' + Utilities.getUuid().slice(0, 8), JSON.stringify(evento));
  } catch (e) {
    // Si la cola falla, se intenta el envío directo para NO perder el aviso.
    Logger.log("Error encolando notificación: " + e.message);
    try { despacharNotificacion_(evento); } catch (e2) { Logger.log("Fallback sincrono falló: " + e2.message); }
  }
}

// Copia un evento de historial dejando fuera los campos pesados (fotos).
// Ninguna plantilla de correo usa las fotos del evento; incluirlas solo
// haría que la cola creciera sin necesidad.
function compactarEventoHistorial_(h) {
  if (!h || typeof h !== 'object') return {};
  const copia = {};
  Object.keys(h).forEach(k => {
    if (k === 'fotos') return;
    const v = h[k];
    if (v === null || v === undefined) return;
    if (typeof v === 'object') return;
    copia[k] = v;
  });
  return copia;
}

// Lee un registro por su código (columna A) y lo devuelve como objeto.
// Se usa al despachar la notificación para que el correo refleje el
// estado REAL guardado, no el que venía en el POST original.
function leerRegistroPorCodigo_(sheetName, codigo) {
  try {
    const sheet = getSheet(SHEETS[sheetName]);
    const headers = HEADERS[sheetName];
    if (!sheet || !headers || sheet.getLastRow() < 2) return null;
    const claves = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < claves.length; i++) {
      if (String(claves[i][0]) === String(codigo)) {
        const fila = sheet.getRange(i + 2, 1, 1, headers.length).getValues()[0];
        const obj = {};
        headers.forEach((h, j) => { obj[h] = fila[j]; });
        if (typeof obj.historial === 'string') {
          try { obj.historial = JSON.parse(obj.historial); } catch (e) { obj.historial = []; }
        }
        return obj;
      }
    }
  } catch (e) {
    Logger.log("leerRegistroPorCodigo_ error: " + e.message);
  }
  return null;
}

// Entrega efectiva de un evento encolado a la plantilla de correo correcta.
function despacharNotificacion_(ev) {
  if (!ev || !ev.tipo) return;
  const extra = ev.extra || {};
  const obj = ev.snapshot || leerRegistroPorCodigo_(ev.sheet, ev.codigo);
  if (!obj) { Logger.log("Notificación descartada, registro no encontrado: " + ev.codigo); return; }

  switch (ev.tipo) {
    case 'ticket_nuevo':
      notificarTicketNuevo(obj);
      break;
    case 'ticket_estado':
      notificarCambioEstado(obj, extra.estadoAnterior);
      break;
    case 'ticket_resp':
      notificarCambioResponsable(obj, extra.respAnterior);
      break;
    case 'ticket_piezas':
      notificarSolicitudPiezasTicket(obj, extra.solicitud || {}, getResponsableEmail(extra.usuario || ""));
      break;
    case 'activo_piezas':
      notificarSolicitudPiezas(obj, extra.solicitud || {}, getResponsableEmail(extra.usuario || ""));
      break;
    case 'activo_mant':
      notificarMantenimiento(obj, extra.solicitud || {});
      break;
    case 'activo_mant_entrada':
      notificarEntradaMantenimiento(obj, extra.tecnico, extra.motivo, extra.emailResp || "");
      break;
    case 'activo_mant_salida':
      notificarSalidaMantenimiento(obj, extra.tecnico, extra.motivo, extra.estado, extra.emailResp || "");
      break;
    default:
      Logger.log("Tipo de notificación desconocido: " + ev.tipo);
  }
}

// Procesa la cola. Instalado como disparador cada 1 minuto.
// Cada elemento se BORRA antes de intentar el envío: es preferible perder
// un aviso puntual (queda registrado en el log) a reenviar el mismo correo
// muchas veces si dos ejecuciones del disparador llegaran a solaparse.
function procesarColaNotificaciones() {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { return; } // otro ciclo ya está corriendo

  try {
    const props = PropertiesService.getScriptProperties();
    const todas = props.getProperties();
    const claves = Object.keys(todas).filter(k => k.indexOf('notif_') === 0).sort();
    let procesadas = 0;

    for (let i = 0; i < claves.length && procesadas < MAX_NOTIF_POR_CICLO; i++) {
      const k = claves[i];
      let ev = null;
      try { ev = JSON.parse(todas[k]); } catch (e) { ev = null; }
      props.deleteProperty(k);
      if (!ev) continue;
      try {
        despacharNotificacion_(ev);
      } catch (e) {
        Logger.log("Error despachando notificación " + k + ": " + e.message);
      }
      procesadas++;
    }
    if (procesadas > 0) Logger.log("Cola de notificaciones: " + procesadas + " enviada(s).");
  } finally {
    lock.releaseLock();
  }
}

// Instalador del disparador de la cola (ejecutar una sola vez, o desde el
// panel de administración con la acción install_notif_trigger).
function instalarTriggerNotificaciones() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "procesarColaNotificaciones") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("procesarColaNotificaciones")
    .timeBased()
    .everyMinutes(1)
    .create();
  Logger.log("Trigger de cola de notificaciones instalado (cada 1 minuto).");
  return "Trigger de notificaciones instalado (cada 1 minuto)";
}

// Diagnóstico: cuántos avisos hay pendientes en la cola en este momento.
function estadoColaNotificaciones() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const pendientes = Object.keys(props).filter(k => k.indexOf('notif_') === 0).length;
  const instalado = ScriptApp.getProjectTriggers()
    .some(t => t.getHandlerFunction() === "procesarColaNotificaciones");
  return { ok: true, pendientes: pendientes, triggerInstalado: instalado, asincrono: NOTIFICACIONES_ASINCRONAS };
}

// ══════════════════════════════════════════════════════════════════════
// IDEMPOTENCIA DE ESCRITURAS  (corrección de tickets duplicados)
// ══════════════════════════════════════════════════════════════════════
// El cliente no puede leer la respuesta de un POST (Apps Script no envía
// encabezados CORS en POST), así que nunca sabe con certeza si una
// escritura llegó a completarse. Si el usuario vuelve a pulsar Guardar, o
// si el cliente reintenta por tiempo agotado, el mismo insert llegaba dos
// veces y se creaban dos filas con códigos distintos — imposibles de
// detectar como duplicados después.
//
// Ahora cada operación de escritura viaja con un _opId único que el
// cliente genera UNA sola vez y reutiliza en todos sus reintentos. El
// servidor recuerda el resultado de ese _opId durante 10 minutos: si el
// mismo _opId vuelve a llegar, devuelve el resultado anterior SIN volver
// a escribir. Un clic repetido ya no puede crear un segundo ticket.
const OP_TTL_SEGUNDOS = 600; // 10 minutos

function resultadoOperacionPrevia_(opId) {
  if (!opId) return null;
  try {
    const hit = CacheService.getScriptCache().get('op_' + opId);
    return hit ? JSON.parse(hit) : null;
  } catch (e) { return null; }
}

function recordarOperacion_(opId, resultado) {
  if (!opId) return resultado;
  try {
    CacheService.getScriptCache().put('op_' + opId, JSON.stringify(resultado), OP_TTL_SEGUNDOS);
  } catch (e) { /* sin caché la protección se degrada, no rompe el guardado */ }
  return resultado;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { sheet: sheetName, action, payload } = data;

    // ── VALIDAR TOKEN DE API (gate mínimo de "es nuestra app") ────
    // Este token YA NO es la fuente de autorización real — solo filtra
    // tráfico obviamente ajeno. La autorización real es la sesión.
    if(!validarApiToken(payload)) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── LOGIN — no requiere sesión previa ──────────────────────────
    // Nota: el POST puede llegar en modo 'no-cors' (el cliente no puede
    // leer esta respuesta directamente — ver enviarRespuesta_ arriba).
    // Por eso el resultado también se guarda en caché bajo _requestId,
    // y el cliente lo recupera con un GET inmediatamente después.
    if (action === "procesarLogin") {
      return enviarRespuesta_(procesarLogin_(payload), payload._requestId);
    }
    // Segundo paso del login cuando el usuario tiene 2FA activado —
    // tampoco requiere sesión previa: todavía no la tiene.
    if (action === "procesarLoginTOTP") {
      return enviarRespuesta_(procesarLoginTOTP_(payload), payload._requestId);
    }
    if (action === "session_check") {
      const info = validarSesion_(payload._sessionToken);
      const resultado = info
        ? { ok: true, rol: info.rol, nombre: info.nombre, username: info.username }
        : { ok: false, error: "SESSION_INVALID" };
      return enviarRespuesta_(resultado, payload._requestId);
    }
    if (action === "cerrar_sesion") {
      cerrarSesion_(payload._sessionToken);
      return enviarRespuesta_({ ok: true }, payload._requestId);
    }

    // ── PORTAL PÚBLICO — ticket restringido, con límite de tasa ────
    if (action === "crear_ticket_publico") {
      return enviarRespuesta_(crearTicketPublico_(payload), payload._requestId);
    }

    // ── SUBIDA DE FOTOS ──────────────────────────────────────────
    // El portal público sube fotos ANTES de que exista sesión (junto con
    // el reporte). El resto de la app sí debe estar autenticada.
    if (action === "uploadFoto") {
      if (payload.origen !== "portal") {
        const infoFoto = validarSesion_(payload._sessionToken);
        if (!infoFoto) {
          return enviarRespuesta_({ ok: false, error: "SESSION_INVALID" }, payload._requestId);
        }
      }
      const result = subirFotoADrive(payload);
      return enviarRespuesta_(result, payload._requestId);
    }

    // ── A partir de aquí TODA acción requiere sesión válida ────────
    const sesion = validarSesion_(payload._sessionToken);
    if (!sesion) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "SESSION_INVALID" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── "MI PERFIL" — ficha propia, disponible para cualquier rol ──
    if (action === "mi_perfil") {
      return enviarRespuesta_(miPerfil_(sesion), payload._requestId);
    }

    // ── VERIFICACIÓN EN DOS PASOS — gestión desde "Mi perfil" ──────
    // Requieren sesión válida y solo actúan sobre el usuario dueño de
    // esa sesión (nunca sobre otra cuenta) — mismo criterio que ya
    // usa el resto del archivo para acciones sobre datos propios.
    if (action === "totp_generar" || action === "totp_activar" || action === "totp_desactivar") {
      let resTotp;
      if (action === "totp_generar") resTotp = totpGenerar_(sesion);
      else if (action === "totp_activar") resTotp = totpActivar_(sesion, payload);
      else resTotp = totpDesactivar_(sesion);
      return enviarRespuesta_(resTotp, payload._requestId);
    }

    if (action === "backup" || action === "install_backup_trigger") {
      if (sesion.rol !== "admin") {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "FORBIDDEN" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (action === "backup") {
        const result = backupManual();
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const result = instalarTriggerBackup();
      return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── ALERTAS: garantías/licencias próximas a vencer + deadlines ─
    if (action === "run_alertas_ahora" || action === "install_alertas_trigger") {
      if (sesion.rol !== "admin") {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "FORBIDDEN" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const result = action === "run_alertas_ahora"
        ? ejecutarAlertasManual()
        : instalarTriggerAlertas();
      return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── DIAGNÓSTICO / INSTALACIÓN DE LA COLA DE NOTIFICACIONES ────
    if (action === "install_notif_trigger" || action === "estado_cola_notif") {
      if (sesion.rol !== "admin") {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "FORBIDDEN" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const resNotif = action === "install_notif_trigger"
        ? { ok: true, msg: instalarTriggerNotificaciones() }
        : estadoColaNotificaciones();
      return enviarRespuesta_(resNotif, payload._requestId);
    }

    // ── PROTECCIÓN ANTI-DUPLICADOS (idempotencia) ─────────────────
    // Si esta MISMA operación ya se procesó (mismo _opId), se devuelve el
    // resultado anterior sin volver a escribir nada. Esto neutraliza tanto
    // el clic repetido del usuario como el reintento automático del cliente.
    if (["insert", "update", "delete_logical"].includes(action) && payload._opId) {
      const previo = resultadoOperacionPrevia_(payload._opId);
      if (previo) {
        previo.duplicadoEvitado = true;
        return enviarRespuesta_(previo, payload._requestId);
      }
    }

    // ── CONTROL DE ACCESO POR ROL (server-side, no solo UI) ────────
    if (["insert", "update", "delete_logical"].includes(action)) {
      if (!tienePermisoEscritura_(sesion.rol, sheetName, action)) {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "FORBIDDEN", message: "Tu rol no tiene permiso para esta acción." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      // Si es cambio de contraseña de usuarios, exigir que el hash venga
      // ya calculado por procesarLogin/setPassword — nunca aceptar
      // passHash arbitrario desde el cliente para otra cuenta que no sea
      // la propia, salvo que quien edita sea admin.
      if (sheetName === "usuarios" && sesion.rol !== "admin" && payload.username !== sesion.username) {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "FORBIDDEN" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    const sheet = getSheet(SHEETS[sheetName]);
    const headers = HEADERS[sheetName];

    ensureHeaders(sheet, headers);
    if (sheetName === "tickets") asegurarColumnaFotos_(sheet);

    // ── LÍMITE DE FOTOS POR TICKET (defensa en profundidad) ────────
    // El límite ya se aplica en el cliente, pero se repite aquí porque
    // el cliente puede ser manipulado — el servidor es la fuente de verdad.
    if (sheetName === "tickets" && ["insert", "update"].includes(action) && payload.fotos !== undefined) {
      let fotosPayload = payload.fotos;
      if (typeof fotosPayload === "string") {
        try { fotosPayload = JSON.parse(fotosPayload); } catch (e) { fotosPayload = []; }
      }
      if (Array.isArray(fotosPayload) && fotosPayload.length > MAX_FOTOS_TICKET) {
        return ContentService.createTextOutput(JSON.stringify({
          ok: false, error: "DEMASIADAS_FOTOS",
          message: "Un ticket no puede tener más de " + MAX_FOTOS_TICKET + " fotos."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (action === "insert") {
      // ── LOCK EXCLUSIVO — evita códigos duplicados en inserciones simultáneas ──
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(8000); // espera hasta 8 segundos para obtener el lock
      } catch(lockErr) {
        return error("Servicio ocupado, reintenta en unos segundos");
      }

      try {
        // Si el payload trae código provisional (cliente), lo reemplazamos
        // con el código real generado en el servidor usando el conteo actual
        // Códigos automáticos por tipo de hoja
        if (sheetName === "mobiliario" && !payload.codigo) {
          const mobCount = sheet.getLastRow() - 1;
          payload.codigo = "MOB-" + String(mobCount + 1).padStart(4, "0");
        }
        if (sheetName === "personas" && !payload.codigo) {
          const perCount = sheet.getLastRow() - 1;
          payload.codigo = "PER-" + String(perCount + 1).padStart(4, "0");
        }
        if (sheetName === "espacios" && !payload.codigo) {
          const espCount = sheet.getLastRow() - 1;
          payload.codigo = "ESP-" + String(espCount + 1).padStart(4, "0");
        }
        if (sheetName === "departamentos" && !payload.codigo) {
          const depCount = sheet.getLastRow() - 1;
          payload.codigo = "DEP-" + String(depCount + 1).padStart(3, "0");
        }
        if (sheetName === "licencias" && !payload.codigo) {
          const licCount = sheet.getLastRow() - 1;
          payload.codigo = "LIC-" + String(licCount + 1).padStart(4, "0");
        }
        if (sheetName === "tickets" && payload.codigo) {
          const realCount = sheet.getLastRow() - 1; // filas menos encabezado
          const realCode = "TKT-" + String(realCount + 1).padStart(4, "0");
          // Verificar que no exista ya ese código (doble seguro)
          const existingRows = sheet.getDataRange().getValues();
          const exists = existingRows.some(row => String(row[0]) === realCode);
          if (exists) {
            // Si ya existe, usar timestamp para garantizar unicidad
            const tsCode = "TKT-" + Date.now().toString(36).toUpperCase().slice(-6);
            payload.codigo = tsCode;
            payload.id     = tsCode;
          } else {
            payload.codigo = realCode;
            payload.id     = realCode;
          }
          // Actualizar referencia en historial si existe
          if (Array.isArray(payload.historial)) {
            payload.historial = payload.historial.map(h => ({...h}));
          }
        }
        if (sheetName === "activos" && payload.codigo) {
          const realCount = sheet.getLastRow() - 1;
          const realCode  = "ACT-" + String(realCount + 1).padStart(4, "0");
          const existingRows = sheet.getDataRange().getValues();
          const exists = existingRows.some(row => String(row[0]) === realCode);
          if (exists) {
            // Fallback con timestamp — garantiza unicidad absoluta
            const tsCode = "ACT-" + Date.now().toString(36).toUpperCase().slice(-6);
            payload.codigo = tsCode;
            payload.id     = tsCode;
          } else {
            payload.codigo = realCode;
            payload.id     = realCode;
          }
          // Actualizar código en historial si existe
          if (Array.isArray(payload.historial)) {
            payload.historial = payload.historial.map(h => ({...h}));
          }
        }

        // ── Contraseñas: el cliente NUNCA calcula ni envía passHash.
        // Envía passwordPlano solo por HTTPS; se hashea aquí y se descarta.
        if (sheetName === "usuarios") {
          if (payload.passwordPlano) {
            payload.passHash = hashPassSeguro_(String(payload.passwordPlano));
          }
          delete payload.passwordPlano;
          delete payload.sessionToken; // columna heredada, ya no se usa
        }

        const row = headers.map(h => {
          const v = payload[h];
          if (v === undefined || v === null) return "";
          if (Array.isArray(v)) return JSON.stringify(v);
          if (typeof v === "boolean") return v.toString();
          return v;
        });
        sheet.appendRow(row);
      } finally {
        lock.releaseLock(); // siempre liberar el lock
      }

      // La hoja de usuarios cambió: invalidar la caché de correos para que
      // el nuevo usuario reciba notificaciones desde el primer momento.
      if (sheetName === "usuarios") invalidarCacheUsuarios_();

      // ── NOTIFICACIONES AL INSERTAR (ahora encoladas) ──────────────
      // Ya NO se envían correos dentro de esta petición: se encolan y un
      // disparador los despacha cada minuto. El usuario deja de esperar.
      if (sheetName === "tickets") {
        encolarNotificacion_({ tipo: 'ticket_nuevo', sheet: 'tickets', codigo: payload.codigo });
        const histT = payload.historial;
        if (Array.isArray(histT) && histT.length > 0) {
          const ultimoT = histT[histT.length - 1];
          if (ultimoT.tipo === "Solicitud de Compra") {
            encolarNotificacion_({
              tipo: 'ticket_piezas', sheet: 'tickets', codigo: payload.codigo,
              extra: { solicitud: compactarEventoHistorial_(ultimoT), usuario: ultimoT.usuario || "" }
            });
          }
        }
      }
      if (sheetName === "activos") {
        const hist = payload.historial;
        if (Array.isArray(hist) && hist.length > 0) {
          const ultimo = hist[hist.length - 1];
          const tiposMant = ["Preventivo","Correctivo","Actualización","Limpieza","Reparación","Inspección"];
          if (tiposMant.includes(ultimo.tipo)) {
            encolarNotificacion_({
              tipo: 'activo_mant', sheet: 'activos', codigo: payload.codigo,
              extra: { solicitud: compactarEventoHistorial_(ultimo) }
            });
          }
          if (ultimo.tipo === "Solicitud de Compra") {
            encolarNotificacion_({
              tipo: 'activo_piezas', sheet: 'activos', codigo: payload.codigo,
              extra: { solicitud: compactarEventoHistorial_(ultimo), usuario: ultimo.usuario || "" }
            });
          }
        }
      }

      // Devolver el código REAL asignado por el servidor, y recordarlo bajo
      // el _opId para que un reintento no cree una segunda fila.
      return enviarRespuesta_(
        recordarOperacion_(payload._opId, { ok: true, codigo: payload.codigo, id: payload.id }),
        payload._requestId
      );
    }

    if (action === "update") {
      // ── PROTECCIÓN ANTI-DOBLE ASIGNACIÓN ────────────────────────
      // Si es un update de tickets que cambia el responsable (tomar ticket),
      // usar LockService para garantizar que solo un técnico lo tome
      const esTakeTicket = sheetName === "tickets"
        && payload.resp
        && payload._isTakeTicket === true;

      if (esTakeTicket) {
        const takeLock = LockService.getScriptLock();
        try {
          takeLock.waitLock(6000);
        } catch(lockErr) {
          return ContentService
            .createTextOutput(JSON.stringify({
              ok: false,
              error: "TICKET_LOCKED",
              message: "El sistema está procesando otra asignación. Reintenta en un momento."
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }

        try {
          // Re-leer el ticket directamente del Sheets (estado actual real)
          const freshRows = sheet.getDataRange().getValues();
          const respColIdx = HEADERS["tickets"].indexOf("resp");
          const ticketRow = freshRows.find(r => String(r[0]) === String(payload[HEADERS["tickets"][0]]));

          if (ticketRow && respColIdx >= 0) {
            const respActual = String(ticketRow[respColIdx] || "").trim();

            // ── Protección de carrera SOLO para tickets libres ─────────────
            // El panel web se actualiza cada 20s (sondeo), así que casi
            // siempre la vista del usuario está un poco desactualizada
            // frente al servidor. Exigir que el responsable actual coincida
            // EXACTO con lo que el cliente vio (para toda reasignación)
            // bloqueaba casi cualquier "Tomar ticket ya asignado", aunque no
            // hubiera ninguna carrera real — eso fue lo que rompió la
            // reasignación de vuelta al panel web después de que el móvil
            // ya lo había tomado.
            //
            // La carrera que sí importa evitar es: dos personas viendo el
            // mismo ticket SIN ASIGNAR e intentando tomarlo casi al mismo
            // tiempo — ahí sí puede haber dos "ganadores" si no se valida.
            // Si el usuario ya sabía que el ticket tenía un responsable
            // (aunque no supiera exactamente cuál, por estar desactualizado),
            // se trata de una reasignación intencional y SIEMPRE se permite.
            const respEsperadoNorm = _respNormalizado_(payload._respEsperado);
            const respActualNorm = _respNormalizado_(respActual);

            if (respEsperadoNorm === null && respActualNorm !== null) {
              return enviarRespuesta_({
                ok: false,
                error: "TICKET_ALREADY_TAKEN",
                takenBy: respActualNorm,
                message: "Este ticket ya fue tomado por " + respActualNorm
              }, payload._requestId);
            }
          }

          // Sin conflicto real — proceder con la asignación/reasignación
          // normalmente (continúa abajo).

        } finally {
          takeLock.releaseLock();
        }
      }

      // ── LOCALIZACIÓN DE LA FILA (optimizada) ─────────────────────
      // Antes se leía la hoja ENTERA (getDataRange) incluyendo historial y
      // fotos de todos los registros solo para encontrar una fila. Ahora se
      // lee únicamente la columna de códigos.
      const ultimaFila = sheet.getLastRow();
      let filaEncontrada = -1;
      if (ultimaFila >= 2) {
        const claves = sheet.getRange(2, 1, ultimaFila - 1, 1).getValues();
        const buscado = String(payload[headers[0]]);
        for (let i = 0; i < claves.length; i++) {
          if (String(claves[i][0]) === buscado) { filaEncontrada = i + 2; break; }
        }
      }

      if (filaEncontrada > 0) {
        const filaActual = sheet.getRange(filaEncontrada, 1, 1, headers.length).getValues()[0];

        // Detectar cambios en tickets ANTES de actualizar
        let estadoAnterior = null;
        let respAnterior = null;
        if (sheetName === "tickets") {
          const estadoColIdx = headers.indexOf("estado");
          const respColIdx = headers.indexOf("resp");
          if (estadoColIdx >= 0) estadoAnterior = filaActual[estadoColIdx];
          if (respColIdx >= 0) respAnterior = filaActual[respColIdx];
        }

        if (sheetName === "usuarios") {
          if (payload.passwordPlano) {
            payload.passHash = hashPassSeguro_(String(payload.passwordPlano));
            // Cambiar la contraseña invalida cualquier sesión activa de
            // este usuario en cualquier plataforma — así, si alguien más
            // estaba usando la cuenta, queda fuera de inmediato en vez de
            // seguir adentro hasta que su sesión expire sola (hasta 30 min).
            try {
              CacheService.getScriptCache().remove('activeToken_web_' + payload.username);
              CacheService.getScriptCache().remove('activeToken_mobile_' + payload.username);
            } catch(e) {}
          } else {
            delete payload.passHash; // no pisar el hash existente si no hay cambio de clave
          }
          delete payload.passwordPlano;
          delete payload.sessionToken;
        }

        // ── ESCRITURA EN UNA SOLA OPERACIÓN ────────────────────────
        // Antes: un setValue() por columna = 16 viajes de ida y vuelta a
        // Sheets por cada guardado de ticket. Ahora: un único setValues().
        // Las columnas que el payload no trae conservan su valor actual.
        const nuevaFila = headers.map((h, col) => {
          if (payload[h] === undefined) return filaActual[col];
          const v = payload[h];
          if (Array.isArray(v)) return JSON.stringify(v);
          if (typeof v === "boolean") return v.toString();
          if (v === null) return "";
          return v;
        });
        sheet.getRange(filaEncontrada, 1, 1, headers.length).setValues([nuevaFila]);

        if (sheetName === "usuarios") invalidarCacheUsuarios_();

        // ── NOTIFICACIONES AL ACTUALIZAR (ahora encoladas) ─────────
        if (sheetName === "tickets") {
          // Cambio de estado
          if (estadoAnterior && payload.estado && estadoAnterior !== payload.estado) {
            encolarNotificacion_({
              tipo: 'ticket_estado', sheet: 'tickets', codigo: payload.codigo,
              extra: { estadoAnterior: String(estadoAnterior) }
            });
          }
          // Cambio de responsable (asignación de ticket)
          if (respAnterior && payload.resp && respAnterior !== payload.resp) {
            encolarNotificacion_({
              tipo: 'ticket_resp', sheet: 'tickets', codigo: payload.codigo,
              extra: { respAnterior: String(respAnterior) }
            });
          }
          // Solicitud de piezas / compras agregada al ticket
          const histTU = payload.historial;
          if (Array.isArray(histTU) && histTU.length > 0) {
            const ultimoTU = histTU[histTU.length - 1];
            if (ultimoTU.tipo === "Solicitud de Compra") {
              encolarNotificacion_({
                tipo: 'ticket_piezas', sheet: 'tickets', codigo: payload.codigo,
                extra: { solicitud: compactarEventoHistorial_(ultimoTU), usuario: ultimoTU.usuario || "" }
              });
            }
          }
        }

        // Entrada/salida de mantenimiento y solicitudes de compra en activos.
        // NOTA: la versión anterior tenía este bloque DUPLICADO (dos "if
        // sheetName === activos" seguidos), lo que provocaba que el correo de
        // mantenimiento y el de solicitud de piezas se enviaran DOS VECES por
        // cada registro. Se unifica en un solo bloque.
        if (sheetName === "activos") {
          const hist = Array.isArray(payload.historial) ? payload.historial : [];
          if (hist.length > 0) {
            const ultimo = hist[hist.length - 1];
            const tiposMant = ["Preventivo","Correctivo","Actualización","Limpieza","Reparación","Inspección"];
            if (ultimo.tipo === "Entrada a Mantenimiento") {
              encolarNotificacion_({
                tipo: 'activo_mant_entrada', sheet: 'activos', codigo: payload.codigo,
                extra: { tecnico: ultimo.tecnico || "", motivo: ultimo.desc || "", emailResp: ultimo.emailResp || "" }
              });
            } else if (ultimo.tipo === "Salida de Mantenimiento") {
              encolarNotificacion_({
                tipo: 'activo_mant_salida', sheet: 'activos', codigo: payload.codigo,
                extra: { tecnico: ultimo.tecnico || "", motivo: ultimo.desc || "",
                         estado: payload.estado || "", emailResp: ultimo.emailResp || "" }
              });
            }
            if (tiposMant.includes(ultimo.tipo)) {
              encolarNotificacion_({
                tipo: 'activo_mant', sheet: 'activos', codigo: payload.codigo,
                extra: { solicitud: compactarEventoHistorial_(ultimo) }
              });
            }
            if (ultimo.tipo === "Solicitud de Compra") {
              encolarNotificacion_({
                tipo: 'activo_piezas', sheet: 'activos', codigo: payload.codigo,
                extra: { solicitud: compactarEventoHistorial_(ultimo), usuario: ultimo.usuario || "" }
              });
            }
          }
        }
      }

      return enviarRespuesta_(
        recordarOperacion_(payload._opId, { ok: true, encontrado: filaEncontrada > 0 }),
        payload._requestId
      );
    }

    if (action === "delete_logical") {
      const ultimaFilaDel = sheet.getLastRow();
      if (ultimaFilaDel >= 2) {
        const clavesDel = sheet.getRange(2, 1, ultimaFilaDel - 1, 1).getValues();
        const buscadoDel = String(payload[headers[0]]);
        for (let i = 0; i < clavesDel.length; i++) {
          if (String(clavesDel[i][0]) === buscadoDel) {
            const colEstado = headers.indexOf("estado") + 1;
            if (colEstado > 0) sheet.getRange(i + 2, colEstado).setValue("eliminado");
            break;
          }
        }
      }
      return enviarRespuesta_(
        recordarOperacion_(payload._opId, { ok: true }),
        payload._requestId
      );
    }

    return ok();
  } catch (err) {
    return error(err.message);
  }
}

function doGet(e) {
  const sheetParam = e.parameter.sheet || "";
  const action     = e.parameter.action || "";

  if (action === "resultado") {
    const requestId = e.parameter.requestId || "";
    if (!requestId) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "MISSING_REQUEST_ID" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const cache = CacheService.getScriptCache();
    const cached = cache.get('result_' + requestId);
    if (!cached) {
      // Aún no está listo (o ya se recuperó antes) — el cliente reintenta
      return ContentService.createTextOutput(JSON.stringify({ ok: false, pending: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    cache.remove('result_' + requestId); // de un solo uso — evita reproducir el mismo resultado dos veces
    return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
  }

  // ── CONFIGURACIÓN DE LA INSTITUCIÓN (marca blanca) ─────────────
  // Público a propósito: es texto de presentación (nombre del colegio),
  // no un dato sensible. Se configura UNA vez por instalación en
  // Propiedades del script — así el mismo código sirve para cualquier
  // institución sin tocar ni un archivo.
  if (action === "config") {
    const props = PropertiesService.getScriptProperties();
    const nombreInstitucion = props.getProperty('NOMBRE_INSTITUCION') || 'tu institución';
    const nombreCorto = props.getProperty('NOMBRE_INSTITUCION_CORTO') || nombreInstitucion;
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, nombreInstitucion: nombreInstitucion, nombreCorto: nombreCorto }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── FOTO EN BASE64 (para incrustar en el expediente imprimible) ──
  // Los enlaces públicos de Drive ("uc?export=view") no siempre se
  // pueden usar como <img src> — Google los restringe según el archivo,
  // la cuenta o el contexto. En vez de depender de eso, el backend (que
  // sí tiene acceso autorizado al archivo, porque el propio script lo
  // creó) lo entrega directamente como datos, sin pasar por ningún
  // enlace público. Requiere sesión válida — las fotos de tickets no
  // son públicas.
  if (action === "fotoBase64") {
    const sesionFoto = validarSesion_(e.parameter.session || "");
    if (!sesionFoto) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "SESSION_INVALID" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const fileId = e.parameter.fileId || "";
    if (!fileId) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "MISSING_FILE_ID" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    try {
      const file = DriveApp.getFileById(fileId);
      const blob = file.getBlob();
      const base64 = Utilities.base64Encode(blob.getBytes());
      const mime = blob.getContentType() || "image/jpeg";
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, mime: mime, data: base64 }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (fotoErr) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "FILE_ERROR", message: fotoErr.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // ── LISTA LIGERA DE RESPONSABLES (para asignar tickets) ─────────
  // La hoja "usuarios" completa solo la puede leer el rol admin
  // (puedeLeerHoja_), porque trae correo, usuario y otros datos de
  // cuenta. Pero CUALQUIER rol autenticado necesita poder elegir un
  // responsable al crear/editar un ticket — por eso este endpoint
  // aparte, que solo expone nombre y rol (nada de correo, usuario,
  // ni contraseña) de los usuarios activos del sistema.
  if (action === "responsables") {
    const sesionResp = validarSesion_(e.parameter.session || "");
    if (!sesionResp) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "SESSION_INVALID" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const sheetU = getSheet(SHEETS.usuarios);
    if (!sheetU || sheetU.getLastRow() < 2) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
    const rowsU = sheetU.getDataRange().getValues();
    const headersU = rowsU[0];
    const idxNombre = headersU.indexOf("nombre");
    const idxRol = headersU.indexOf("rol");
    const idxEstado = headersU.indexOf("estado");
    const lista = rowsU.slice(1)
      .filter(r => r[idxEstado] !== "inactivo" && r[idxEstado] !== "eliminado")
      .map(r => ({ nombre: r[idxNombre], rol: r[idxRol] }));
    return ContentService.createTextOutput(JSON.stringify(lista)).setMimeType(ContentService.MimeType.JSON);
  }

  const esCatalogoPublico = sheetParam === "departamentos" || sheetParam === "espacios";

  if (!esCatalogoPublico) {
    const sesion = validarSesion_(e.parameter.session || "");
    if (!sesion) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "SESSION_INVALID" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (sheetParam && !puedeLeerHoja_(sesion.rol, sheetParam)) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "FORBIDDEN" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // ── GENERAR CÓDIGO ÚNICO SEGURO con LockService ───────────────
  if (action === "nextCode") {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(6000);
      const sheetObj = getSheet(SHEETS[sheetParam]);
      if (!sheetObj) return ContentService
        .createTextOutput(JSON.stringify({ code: null, error: "Sheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
      const count = sheetObj.getLastRow() - 1;
      const prefix = sheetParam === "tickets" ? "TKT" : "ACT";
      let code = prefix + "-" + String(count + 1).padStart(4, "0");
      const existRows = sheetObj.getDataRange().getValues();
      if (existRows.some(r => String(r[0]) === code)) {
        code = prefix + "-" + Date.now().toString(36).toUpperCase().slice(-6);
      }
      return ContentService
        .createTextOutput(JSON.stringify({ code }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch(lockErr) {
      return ContentService
        .createTextOutput(JSON.stringify({ code: null, error: lockErr.message }))
        .setMimeType(ContentService.MimeType.JSON);
    } finally {
      lock.releaseLock();
    }
  }

  // ── LECTURA NORMAL DE HOJAS ───────────────────────────────────
  try {
    const sheet = getSheet(SHEETS[sheetParam]);
    if (!sheet) return error("Hoja no encontrada: " + sheetParam);

    if (sheetParam === "tickets") asegurarColumnaFotos_(sheet);

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => {
        let v = r[i];
        if (typeof v === "string" && v.startsWith("[")) {
          try { v = JSON.parse(v); } catch(_) {}
        }
        if (v === "true") v = true;
        if (v === "false") v = false;
        obj[h] = v;
      });
      if (sheetParam === "tickets") migrarFotosTicket_(obj);
      return despojarCamposSensibles_(obj);
    });

    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return error(err.message);
  }
}

function procesarLogin_(payload) {
  const username = String(payload.username || '').trim();
  const password = String(payload.password || '');
  if (!username || !password) {
    return { ok: false, error: "MISSING_FIELDS" };
  }
  if (estaBloqueado_(username)) {
    return { ok: false, error: "BLOCKED", message: "Demasiados intentos fallidos. Espera 5 minutos." };
  }
  const sheet = getSheet(SHEETS.usuarios);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idx = {};
  headers.forEach((h, i) => { idx[h] = i; });

  let rowNum = -1;
  let userRow = null;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[idx.username] || '').trim().toLowerCase() === username.toLowerCase() && r[idx.estado] !== 'inactivo') {
      userRow = r; rowNum = i + 1; break;
    }
  }

  const storedHash = userRow ? String(userRow[idx.passHash] || '') : '';
  const passOk = userRow && verificarPassword_(password, storedHash);

  if (!passOk) {
    registrarIntentoFallido_(username);
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }
  limpiarIntentos_(username);

  // Migración automática de hash legacy (texto plano) a S2$ en el primer login exitoso
  if (storedHash && storedHash.indexOf('S2$') !== 0) {
    sheet.getRange(rowNum, idx.passHash + 1).setValue(hashPassSeguro_(password));
  }
  // ultimoAcceso: se registra DESPUÉS de responder al usuario, no antes.
  // Cada setValue() tarda ~0.3-1s, y en red celular esa espera extra es
  // lo que hace que el sondeo expire antes de encontrar la respuesta.
  // Se delega a un bloque try/catch al final para que no bloquee el login.

  const rol = userRow[idx.rol];
  const nombre = userRow[idx.nombre];
  const mustChange = userRow[idx.mustChange] || false;

  // ── Verificación en dos pasos (Google Authenticator) ───────────────
  // Si el usuario la tiene activada, la contraseña correcta NO basta:
  // se emite un preAuthToken de corta duración (5 min) en vez de una
  // sesión real. El cliente debe confirmar con el código de 6 dígitos
  // (acción "procesarLoginTOTP") antes de recibir una sesión de verdad.
  const totpEnabled = userRow[idx.totpEnabled] === true || String(userRow[idx.totpEnabled] || '').toLowerCase() === 'true';
  if (totpEnabled) {
    const preAuthToken = randomHex_(32);
    CacheService.getScriptCache().put(
      'preauth_' + preAuthToken,
      JSON.stringify({ username: username, plataforma: payload.plataforma }),
      PREAUTH_TTL_SECONDS
    );
    return { ok: true, requiereTOTP: true, preAuthToken: preAuthToken };
  }

  const token = crearSesion_(username, rol, nombre, payload.plataforma);

  // Escribir ultimoAcceso DESPUÉS de armar la respuesta (best-effort)
  try {
    if (idx.ultimoAcceso !== undefined) {
      sheet.getRange(rowNum, idx.ultimoAcceso + 1).setValue(
        Utilities.formatDate(new Date(), "America/Panama", "yyyy-MM-dd HH:mm:ss")
      );
    }
  } catch (e) { /* no bloquear el login por un campo informativo */ }

  return {
    ok: true, token: token, rol: rol, nombre: nombre, username: username, mustChange: mustChange
  };
}

function crearTicketPublico_(payload) {
  // Rate limiting best-effort por deviceId (localStorage del portal) — GAS
  // no expone la IP del cliente, así que esto complementa pero no
  // reemplaza un WAF/Cloudflare si el volumen de abuso lo justifica.
  const deviceId = String(payload.deviceId || 'anon').trim().slice(0, 64) || 'anon';
  const cache = CacheService.getScriptCache();
  const rlKey = 'portalrl_' + deviceId;
  const n = parseInt(cache.get(rlKey) || '0', 10);
  if (n >= 5) {
    return { ok: false, error: "RATE_LIMIT", message: "Demasiados reportes enviados desde este dispositivo. Intenta más tarde." };
  }
  cache.put(rlKey, String(n + 1), 3600);

  const globalKey = 'portalrl_global_' + Math.floor(Date.now() / 3600000);
  const nGlobal = parseInt(cache.get(globalKey) || '0', 10);
  if (nGlobal >= 200) {
    return { ok: false, error: "RATE_LIMIT_GLOBAL", message: "El portal alcanzó su límite de reportes por hora. Intenta más tarde." };
  }
  cache.put(globalKey, String(nGlobal + 1), 3600);

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(8000);
  } catch (lockErr) {
    return { ok: false, error: "BUSY" };
  }

  try {
    const sheet = getSheet(SHEETS.tickets);
    const headers = HEADERS.tickets;
    ensureHeaders(sheet, headers);
    asegurarColumnaFotos_(sheet);

    // Únicamente estos campos pueden venir del portal anónimo — cualquier
    // otro campo del payload se ignora explícitamente.
    const camposPermitidos = ['titulo', 'activoId', 'activoNombre', 'tipo', 'prior', 'desc'];
    const t = {};
    camposPermitidos.forEach(c => { if (payload[c] !== undefined) t[c] = payload[c]; });

    // Galería de fotos del reporte (hasta MAX_FOTOS_TICKET, con nota opcional)
    let fotosPortal = Array.isArray(payload.fotos) ? payload.fotos : [];
    fotosPortal = fotosPortal.slice(0, MAX_FOTOS_TICKET).map(f => ({
      url: String((f && f.url) || '').slice(0, 500),
      fecha: Utilities.formatDate(new Date(), "America/Panama", "yyyy-MM-dd HH:mm:ss"),
      usuario: 'Portal público',
      estado: 'abierto',
      nota: String((f && f.nota) || '').slice(0, 200)
    })).filter(f => f.url);
    t.fotos = JSON.stringify(fotosPortal);
    t.foto = fotosPortal.length ? fotosPortal[0].url : '—'; // compatibilidad legacy

    t.resp = '—';
    t.estado = 'abierto';
    t.avance = 0;
    t.dead = '';
    t.proy = '';
    t.historial = JSON.stringify([{
      tipo: 'Creación', desc: 'Ticket creado desde el portal público de reportes.',
      fecha: Utilities.formatDate(new Date(), "America/Panama", "yyyy-MM-dd HH:mm:ss"),
      usuario: 'Portal público', color: 'navy'
    }]);
    t.fechaCreacion = Utilities.formatDate(new Date(), "America/Panama", "yyyy-MM-dd HH:mm:ss");

    const count = sheet.getLastRow() - 1;
    let codigo = 'TKT-' + String(count + 1).padStart(4, '0');
    const existentes = sheet.getDataRange().getValues();
    if (existentes.some(r => String(r[0]) === codigo)) {
      codigo = 'TKT-' + Date.now().toString(36).toUpperCase().slice(-6);
    }
    t.codigo = codigo;

    const row = headers.map(h => {
      const v = t[h];
      if (v === undefined || v === null) return '';
      return v;
    });
    sheet.appendRow(row);
    // Notificación encolada: el docente que reporta desde el portal ya no
    // espera a que se envíen los correos para ver su confirmación.
    encolarNotificacion_({ tipo: 'ticket_nuevo', sheet: 'tickets', codigo: codigo });

    // Auditoría — el portal ya NO escribe directo a la hoja de auditoría
    // (eso hubiera requerido darle también permiso de escritura genérico).
    try {
      const auditSheet = getSheet(SHEETS.auditoria);
      const auditHeaders = HEADERS.auditoria;
      ensureHeaders(auditSheet, auditHeaders);
      const reportador = String(payload.reportadoPor || 'Portal público').slice(0, 120);
      auditSheet.appendRow([
        Utilities.formatDate(new Date(), "America/Panama", "yyyy-MM-dd HH:mm:ss"),
        'portal', reportador, 'reportador', 'CREAR', 'Ticket', codigo,
        'Reporte externo desde el Portal Público SAGAE.'
      ]);
    } catch (auditErr) { /* no bloquear la creación del ticket por un fallo de auditoría */ }

    return { ok: true, codigo: codigo };
  } finally {
    lock.releaseLock();
  }
}

// ══════════════════════════════════════════════════════════════════════
// PATRÓN "POST ciego + GET de resultado"
// ══════════════════════════════════════════════════════════════════════
// Hallazgo confirmado en pruebas reales: Apps Script NO agrega el
// encabezado Access-Control-Allow-Origin a las respuestas de doPost,
// aunque sí lo hace de forma confiable en doGet. Esto significa que el
// navegador puede ENVIAR un POST correctamente (el servidor lo procesa),
// pero JavaScript no puede LEER esa respuesta si se usa fetch en modo
// 'cors' — el navegador la bloquea silenciosamente.
//
// Solución: el cliente manda el POST en modo 'no-cors' (ciego, sin poder
// leer la respuesta) incluyendo un _requestId único. El servidor procesa
// todo normal y, además de intentar responder al POST, GUARDA el
// resultado en caché bajo ese _requestId por 60 segundos. El cliente
// entonces hace polling con un GET (que sí puede leer) preguntando por
// ese resultado, hasta obtenerlo o agotar el tiempo de espera.
function enviarRespuesta_(obj, requestId) {
  if (requestId) {
    try {
      // 120s (antes 60s): la subida de fotos desde el móvil puede tardar más
      // que otras acciones (base64 grande + red celular + DriveApp), y el
      // cliente necesita una ventana suficiente para encontrar el resultado
      // cuando hace polling. Ver timeoutMs elevado en apiPostAsync del móvil.
      CacheService.getScriptCache().put('result_' + requestId, JSON.stringify(obj), 120);
    } catch (e) { /* si falla el cache, el cliente igual reintentará hasta el timeout */ }
  }
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ok() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ════════════════════════════════════════════════════════════════
// BACKUP AUTOMÁTICO — Exporta todas las hojas a JSON en Google Drive
// Configurar trigger: Extensiones > Apps Script > Triggers
//   Función: backupAutomatico | Evento: Basado en tiempo | Diario | 2-3am
// ════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════
// SUBIDA DE FOTOS A GOOGLE DRIVE
// ════════════════════════════════════════════════════════════════
function subirFotoADrive(payload) {
  try {
    const { base64, mimeType, nombreArchivo, modulo, codigoRegistro } = payload;

    if (!base64 || !mimeType || !nombreArchivo) {
      return { ok: false, error: "Datos incompletos para subir foto" };
    }

    // ── Obtener o crear carpeta SAGAE_Fotos en Drive ──────────────
    const CARPETA_RAIZ = "SAGAE_Fotos";
    let carpetaRaiz;
    const carpetasRaiz = DriveApp.getFoldersByName(CARPETA_RAIZ);
    if (carpetasRaiz.hasNext()) {
      carpetaRaiz = carpetasRaiz.next();
    } else {
      carpetaRaiz = DriveApp.createFolder(CARPETA_RAIZ);
    }

    // ── Subcarpeta por módulo (Activos, Tickets, Mobiliario) ──────
    const subNombre = modulo || "General";
    let subcarpeta;
    const subcarpetas = carpetaRaiz.getFoldersByName(subNombre);
    if (subcarpetas.hasNext()) {
      subcarpeta = subcarpetas.next();
    } else {
      subcarpeta = carpetaRaiz.createFolder(subNombre);
    }

    // ── Decodificar base64 y crear archivo ────────────────────────
    const decodedBytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(decodedBytes, mimeType, nombreArchivo);
    const archivo = subcarpeta.createFile(blob);

    // ── Hacer el archivo accesible con enlace ─────────────────────
    archivo.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );

    const fileId  = archivo.getId();
    const fileUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";

    return {
      ok:       true,
      url:      fileUrl,
      fileId:   fileId,
      nombre:   nombreArchivo,
      modulo:   subNombre,
      codigo:   codigoRegistro || ""
    };

  } catch (e) {
    return { ok: false, error: "Error al subir foto: " + e.message };
  }
}
// ════════════════════════════════════════════════════════════════

function backupAutomatico() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const ahora = new Date();
    const fecha = Utilities.formatDate(ahora, "America/Panama", "yyyy-MM-dd_HH-mm");
    const nombreArchivo = "SAGAE_Backup_" + fecha + ".json";

    // Exportar todas las hojas
    const backup = {
      metadata: {
        sistema:    "SAGAE",
        institucion: ss.getName(),
        fecha:      ahora.toISOString(),
        version:    "1.0",
        hojas:      Object.keys(SHEETS)
      },
      datos: {}
    };

    for (const [key, sheetName] of Object.entries(SHEETS)) {
      try {
        const sheet = getSheet(sheetName);
        if (!sheet) { backup.datos[key] = []; continue; }
        const rows = sheet.getDataRange().getValues();
        if (rows.length < 2) { backup.datos[key] = []; continue; }
        const headers = rows[0];
        backup.datos[key] = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => { if (h) obj[h] = row[i] ?? ""; });
          return obj;
        });
      } catch(e) {
        backup.datos[key] = [];
      }
    }

    // Guardar en Google Drive — carpeta SAGAE Backups
    let folder;
    const folderName = "SAGAE_Backups_" + ss.getName().replace(/[^a-zA-Z0-9]/g, "_");
    const folders = DriveApp.getFoldersByName(folderName);
    folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // Guardar JSON
    const jsonStr = JSON.stringify(backup, null, 2);
    folder.createFile(nombreArchivo, jsonStr, MimeType.PLAIN_TEXT);

    // Mantener solo los últimos 30 backups (rotar)
    const archivos = folder.getFiles();
    const listaArchivos = [];
    while (archivos.hasNext()) {
      const f = archivos.next();
      if (f.getName().startsWith("SAGAE_Backup_")) {
        listaArchivos.push({ file: f, date: f.getDateCreated() });
      }
    }
    listaArchivos.sort((a, b) => b.date - a.date);
    if (listaArchivos.length > 30) {
      listaArchivos.slice(30).forEach(item => item.file.setTrashed(true));
    }

    // Notificar a administradores
    const admins = getAdminEmails();
    if (admins.length > 0) {
      const totalRegistros = Object.values(backup.datos).reduce((s, arr) => s + arr.length, 0);
      MailApp.sendEmail({
        to: admins.join(","),
        subject: "SAGAE - Backup automatico completado " + fecha,
        body: "Backup diario completado exitosamente.\n\n" +
          "Fecha: " + ahora.toLocaleString("es-PA") + "\n" +
          "Archivo: " + nombreArchivo + "\n" +
          "Total registros: " + totalRegistros + "\n" +
          "Carpeta: " + folderName + " en Google Drive\n\n" +
          "Los backups se retienen por 30 dias.\n" +
          "-- Sistema SAGAE / RYE Design"
      });
    }

    Logger.log("Backup completado: " + nombreArchivo);
    return { ok: true, archivo: nombreArchivo };

  } catch(e) {
    Logger.log("Error en backup: " + e.message);
    // Notificar error a admins
    try {
      const admins = getAdminEmails();
      if (admins.length > 0) {
        MailApp.sendEmail({
          to: admins.join(","),
          subject: "❌ SAGAE — Error en backup automático",
          body: "El backup automático falló.\n\nError: " + e.message + "\n\nRevisar Apps Script."
        });
      }
    } catch(e2) {}
    return { ok: false, error: e.message };
  }
}

// Backup manual desde el sistema web — llamado vía doPost
function backupManual() {
  return backupAutomatico();
}

// Instalador automático del trigger de backup
function instalarTriggerBackup() {
  // Eliminar triggers existentes de backup para evitar duplicados
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "backupAutomatico") {
      ScriptApp.deleteTrigger(t);
    }
  });
  // Crear trigger diario entre 2am y 3am (hora Panamá UTC-5)
  ScriptApp.newTrigger("backupAutomatico")
    .timeBased()
    .everyDays(1)
    .atHour(7) // 7am UTC = 2am Panamá
    .create();
  Logger.log("Trigger de backup instalado: diario a las 2am Panamá");
  return "Trigger instalado";
}
