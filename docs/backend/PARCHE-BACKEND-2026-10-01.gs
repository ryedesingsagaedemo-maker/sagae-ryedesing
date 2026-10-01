// ════════════════════════════════════════════════════════════════════
// SAGAE — PARCHE DEL BACKEND (Google Apps Script) · 2026-10-01 · v2 (corregida)
//
// ⚠ Esta versión REEMPLAZA a la primera, que cambiaba tienePermisoEscritura_
//   y habría permitido al administrador editar la hoja de Auditoría (en
//   producción esa hoja es de SOLO inserción). Ya NO se toca esa función.
//
// ARCHIVO COMPLETO LISTO PARA PEGAR: el script de producción con este parche ya
// aplicado se entrega aparte (Codigo_parcheado.gs, fuera de GitHub, porque
// contiene el backend completo). Este archivo documenta SOLO lo que cambia.
//
// DOS CAMBIOS, ambos marcados en el código con "PARCHE 2026-10-01":
//
// 1) ELIMINAR EXIGE EL PERMISO DE ELIMINAR EN EL SERVIDOR.
//    La pantalla "elimina" enviando un update con estado = "eliminado" y el
//    servidor solo exigía el permiso de edición: "eliminar = solo admin" lo
//    cumplía únicamente el botón oculto. En doPost, rama  if (action === "update"),
//    justo DESPUÉS de la línea
//        const filaActual = sheet.getRange(filaEncontrada, 1, 1, headers.length).getValues()[0];
//    agregue:
//
//        const idxEstadoDel = headers.indexOf("estado");
//        if (idxEstadoDel >= 0
//            && String(payload.estado || "").toLowerCase() === "eliminado"
//            && String(filaActual[idxEstadoDel] || "").toLowerCase() !== "eliminado") {
//          const permDel = PERMS_SERVER[sesion.rol];
//          if (!permDel || permDel.delete !== true) {
//            return enviarRespuesta_({ ok: false, error: "FORBIDDEN",
//              message: "Tu rol no tiene permiso para eliminar registros." }, payload._requestId);
//          }
//        }
//
//    Solo bloquea el PASO a "eliminado"; editar un registro ya eliminado no se bloquea.
//
// 2) CÓDIGOS ÚNICOS en Mobiliario, Personas, Espacios, Departamentos y Licencias.
//    La fórmula era (filas + 1): si alguien borraba una fila a mano, el siguiente
//    alta repetía un código. Pegue la función de abajo (antes de doPost) y, en
//    doPost → insert, reemplace cada par de líneas "const xxxCount… / payload.codigo = …" por:
//        payload.codigo = siguienteCodigoUnico_(sheet, "MOB-", 4);   // PER- 4 · ESP- 4 · DEP- 3 · LIC- 4
// ════════════════════════════════════════════════════════════════════

function siguienteCodigoUnico_(sheet, prefijo, ancho) {
  const ultima = sheet.getLastRow();
  const usados = {};
  let max = 0;
  if (ultima >= 2) {
    const claves = sheet.getRange(2, 1, ultima - 1, 1).getValues();
    for (let i = 0; i < claves.length; i++) {
      const cod = String(claves[i][0] || '');
      usados[cod] = true;
      if (cod.indexOf(prefijo) === 0) {
        const n = parseInt(cod.slice(prefijo.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
  }
  let n = Math.max(max, ultima - 1) + 1;
  let cod = prefijo + String(n).padStart(ancho, '0');
  while (usados[cod]) { n++; cod = prefijo + String(n).padStart(ancho, '0'); }
  return cod;
}
