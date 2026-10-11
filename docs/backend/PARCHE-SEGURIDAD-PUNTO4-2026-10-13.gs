// ══════════════════════════════════════════════════════════════════════
// SAGAE — PARCHE DE SEGURIDAD, PUNTO 4: PORTAL PÚBLICO (2026-10-13)
// Desarrollado por RYE Design
//
// Instalar DESPUÉS del parche del 2026-10-12 (o junto con él).
//
// QUÉ ARREGLA (el portal público de reportes no pide iniciar sesión)
//   a) Un reporte anónimo podía traer títulos o descripciones gigantes y
//      valores inventados en tipo y prioridad. Ahora se recorta el largo
//      (título 200, descripción 3000) y tipo/prioridad solo aceptan los
//      valores reales; si no, quedan en "incidencia" / "normal".
//   b) Los enlaces de foto podían apuntar a CUALQUIER sitio (seguimiento,
//      javascript:, etc.). Ahora solo se aceptan enlaces de archivos de
//      Google Drive, como los que genera la propia subida de fotos.
//   c) La subida de fotos del portal (sin sesión) aceptaba cualquier tipo
//      de archivo, de cualquier tamaño, en cualquier carpeta y sin límite.
//      Ahora: solo imágenes (JPG, PNG, WEBP, GIF, HEIC), máximo 10 MB,
//      carpeta fija "Tickets", nombre de archivo limpio y máximo 15 fotos
//      por dispositivo por hora (400 en total por hora).
//   Lo que sube un usuario CON sesión (técnico, desde la app) NO cambia.
//
// CÓMO SE INSTALA (4 pasos, en el Apps Script, archivo Código.gs)
//   Antes de empezar: Archivo → Hacer una copia (respaldo).
//   Para buscar: Ctrl + F.  Para buscar y reemplazar: Ctrl + H.
//
//   PASO 1  Busque:  function crearTicketPublico_(payload) {
//           Haga clic AL INICIO de esa línea, pegue el BLOQUE NUEVO de abajo
//           y presione Enter para dejar una línea en blanco.
//
//   PASO 2  Busque:  camposPermitidos.forEach(c => { if (payload[c] !== undefined) t[c] = payload[c]; });
//           Justo DEBAJO de esa línea agregue estas dos líneas:
//               limpiarCamposTicketPublico_(t);
//               if (!t.titulo) return { ok: false, error: "INVALID", message: "El título del reporte es obligatorio." };
//
//   PASO 3  Buscar:      })).filter(f => f.url);
//           Reemplazar:  })).filter(f => f.url && urlFotoPermitida_(f.url));
//           Debe ser 1 reemplazo.
//
//   PASO 4  Busque:  const result = subirFotoADrive(payload);
//           (una sola vez; está dentro de  if (action === "uploadFoto") ).
//           Haga clic AL INICIO de esa línea y pegue ENCIMA estas 4 líneas:
//               if (payload.origen === "portal") {
//                 const chkSubida = validarSubidaPortal_(payload);
//                 if (!chkSubida.ok) return enviarRespuesta_(chkSubida, payload._requestId);
//               }
//
//   Luego: Guardar (disquete) → Implementar → Administrar implementaciones →
//   lápiz → Versión: Nueva versión → Implementar.
//
// CÓMO COMPROBAR
//   a) Portal público: mande un reporte normal con una foto. Debe crearse y
//      la foto debe verse dentro del sistema (con sesión).
//   b) Un reporte sin título debe pedir el título.
//   c) Si una foto de celular no se sube (algunos celulares no informan el
//      tipo HEIC), avíseme: es el único caso donde podría ser más estricto
//      que antes.
//
// SI ALGO SALE MAL: Implementar → Administrar implementaciones → lápiz →
// elija la versión anterior → Implementar. No se pierde ningún dato.
// ══════════════════════════════════════════════════════════════════════

// ───────────── BLOQUE NUEVO (para el PASO 1) ─────────────
// ══ PARCHE DE SEGURIDAD 2026-10-13 (punto 4: portal público) ══════════
// Limita largo y valores de lo que envía el portal anónimo.
function limpiarCamposTicketPublico_(t) {
  t.titulo       = String(t.titulo == null ? "" : t.titulo).trim().slice(0, 200);
  t.desc         = String(t.desc == null ? "" : t.desc).slice(0, 3000);
  t.activoNombre = String(t.activoNombre == null ? "—" : t.activoNombre).slice(0, 150);
  t.activoId     = String(t.activoId == null ? "" : t.activoId).slice(0, 40);
  if (["incidencia", "mantenimiento", "solicitud", "tarea"].indexOf(t.tipo) === -1) t.tipo = "incidencia";
  if (["baja", "normal", "importante", "alta", "urgente", "critica"].indexOf(t.prior) === -1) t.prior = "normal";
  return t;
}

// Solo se aceptan enlaces de archivos de Google Drive (los que genera la
// propia subida de fotos), nunca enlaces a sitios ajenos ni javascript:.
function urlFotoPermitida_(u) {
  return /^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{10,}\//.test(String(u || ""));
}

// El portal público sube fotos SIN sesión: se valida tipo, tamaño, nombre y
// carpeta, y se limita cuántas puede subir cada dispositivo por hora.
function validarSubidaPortal_(payload) {
  const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
  if (TIPOS.indexOf(String(payload.mimeType || "").toLowerCase()) === -1) {
    return { ok: false, error: "TIPO_NO_PERMITIDO", message: "Solo se pueden subir fotos (JPG, PNG, WEBP, GIF o HEIC)." };
  }
  const b64 = String(payload.base64 || "");
  if (!b64 || b64.length > 14000000) { // ≈ 10 MB
    return { ok: false, error: "TAMANO_NO_PERMITIDO", message: "La foto no puede superar 10 MB." };
  }
  const cache = CacheService.getScriptCache();
  const deviceId = String(payload.deviceId || "anon").trim().slice(0, 64) || "anon";
  const kDev = "portalup_" + deviceId;
  const nDev = parseInt(cache.get(kDev) || "0", 10);
  const kGlob = "portalup_global_" + Math.floor(Date.now() / 3600000);
  const nGlob = parseInt(cache.get(kGlob) || "0", 10);
  if (nDev >= 15 || nGlob >= 400) {
    return { ok: false, error: "RATE_LIMIT", message: "Demasiadas fotos subidas. Intenta más tarde." };
  }
  cache.put(kDev, String(nDev + 1), 3600);
  cache.put(kGlob, String(nGlob + 1), 3600);
  // Lo que el portal no decide: carpeta, nombre y código de registro.
  payload.modulo = "Tickets";
  payload.codigoRegistro = "";
  payload.nombreArchivo = String(payload.nombreArchivo || "foto").replace(/[^\w.\- ]/g, "_").slice(0, 100) || "foto";
  return { ok: true };
}
