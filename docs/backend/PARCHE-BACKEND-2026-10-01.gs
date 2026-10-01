// ════════════════════════════════════════════════════════════════════
// SAGAE — PARCHE DEL BACKEND (Google Apps Script) · 2026-10-01
// Cierra dos huecos que el sitio web NO puede cerrar por sí solo:
//
//   1. PERMISO DE ELIMINAR. Hoy "eliminar" se envía como un "update" que pone
//      estado = "eliminado", y el servidor solo exige el permiso de EDICIÓN.
//      El permiso "eliminar = solo admin" lo cumple únicamente el botón oculto
//      en pantalla: un técnico o un usuario de inventario que llame a la API
//      directamente podría eliminar. Con este parche el servidor lo impide.
//
//   2. CÓDIGOS REPETIDOS EN MOBILIARIO / PERSONAS / ESPACIOS / DEPARTAMENTOS.
//      El código se calcula como (filas + 1) sin comprobar que no exista: si
//      alguien borra una fila a mano en la hoja, el siguiente alta repite un
//      código ya usado y las búsquedas por código abren el registro equivocado.
//      Activos y Tickets ya tenían esa comprobación; ahora todos la tienen.
//
// CÓMO APLICARLO (10 minutos, una sola vez) ─ NO cambia el formato de los datos:
//   1. En Apps Script abra su proyecto SAGAE. ANTES de tocar nada:
//      Archivo → Hacer una copia  (o Implementar → Gestionar implementaciones → anote la versión actual).
//   2. PASO A: busque la función   tienePermisoEscritura_   y REEMPLÁCELA entera por la de abajo.
//   3. PASO B: busque (Ctrl+F) la línea
//          if (!tienePermisoEscritura_(sesion.rol, sheetName, action)) {
//      y cámbiela por
//          if (!tienePermisoEscritura_(sesion.rol, sheetName, action, payload)) {
//   4. PASO C: pegue la función   siguienteCodigoUnico_   (abajo) en cualquier parte del archivo,
//      y en el bloque   if (action === "insert") { ...   cambie las cuatro líneas de código
//      automático, por ejemplo:
//          const mobCount = sheet.getLastRow() - 1;
//          payload.codigo = "MOB-" + String(mobCount + 1).padStart(4, "0");
//      por
//          payload.codigo = siguienteCodigoUnico_(sheet, "MOB-", 4);
//      (PER- ancho 4 · ESP- ancho 4 · DEP- ancho 3 · MOB- ancho 4. Dos líneas por hoja pasan a una.)
//   5. Implementar → Administrar implementaciones → ✏ → Versión: "Nueva versión" → Implementar.
//      (La URL del sistema NO cambia.)
//   6. Pruebe: entre como técnico e intente eliminar un mueble (debe responder FORBIDDEN
//      y seguir existiendo); entre como admin y elimínelo (debe funcionar).
//
// REVERSIBLE: si algo no se ve bien, vuelva a la versión anterior en
// "Administrar implementaciones". Este parche no toca los datos de las hojas.
// ════════════════════════════════════════════════════════════════════

// ── PASO A ── reemplaza la función existente con el mismo nombre ──────────────
function tienePermisoEscritura_(rol, sheetName, action, payload) {
  if (sheetName === 'auditoria' && action === 'insert') return true;
  const p = PERMS_SERVER[rol];
  if (!p || p[sheetName] !== true) return false;
  // Marcar un registro como eliminado mediante "update" TAMBIÉN es eliminar:
  // exige el permiso de eliminar, no solo el de edición.
  if (action === 'update' && payload && String(payload.estado || '').toLowerCase() === 'eliminado') {
    return p.delete === true;
  }
  if (action === 'insert' || action === 'update') return p.edit === true;
  if (action === 'delete_logical') return p.delete === true;
  return false;
}

// ── PASO C ── función nueva ───────────────────────────────────────────────────
// Siguiente código libre: nunca repite uno existente aunque se hayan borrado filas a mano.
function siguienteCodigoUnico_(sheet, prefijo, ancho) {
  const filas = sheet.getDataRange().getValues();
  const usados = {};
  let max = 0;
  for (let i = 1; i < filas.length; i++) {
    const cod = String(filas[i][0] || '');
    usados[cod] = true;
    if (cod.indexOf(prefijo) === 0) {
      const n = parseInt(cod.slice(prefijo.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  let n = Math.max(max, filas.length - 1) + 1;
  let cod = prefijo + String(n).padStart(ancho, '0');
  while (usados[cod]) { n++; cod = prefijo + String(n).padStart(ancho, '0'); }
  return cod;
}
