// ══════════════════════════════════════════════════════════════════════
// SAGAE — RESPALDO AUTOMÁTICO DEL PROGRAMA A GOOGLE DRIVE
// Desarrollado por RYE Design
//
// NO CONFUNDIR CON backupAutomatico():
//   backupAutomatico()   guarda los DATOS   (la hoja de cálculo → JSON)
//   backupProgramaWeb()  guarda el PROGRAMA (los archivos publicados)
//
// Este respaldo lo hace el propio Apps Script: descarga los archivos desde
// GitHub Pages y los guarda en Drive. Como corre en los servidores de
// Google, no depende de ninguna computadora encendida, no tiene el límite
// de tamaño que sí tienen otras vías, y no necesita ninguna credencial
// nueva (UrlFetchApp ya se usa en este proyecto para reCAPTCHA).
//
// INSTALACIÓN — una sola vez:
//   1. Pegue este archivo al final del código del proyecto.
//   2. Ejecute instalarTriggerBackupPrograma() una vez desde el editor.
//   3. Ejecute backupProgramaWeb() una vez para comprobar que funciona.
// ══════════════════════════════════════════════════════════════════════

// Raíz publicada del programa. Si algún día cambia el sitio, se cambia aquí.
const URL_PROGRAMA = "https://ryedesingsagaedemo-maker.github.io/sagae-ryedesing/";

// Los archivos que componen el programa. Las rutas con "/" se recrean como
// subcarpetas dentro del respaldo, para que restaurar sea copiar y pegar.
const ARCHIVOS_PROGRAMA = [
  "index.html",
  "SAGAE_index_mobile.html",
  "SAGAE_portal_reportes.html",
  "manifest.json",
  "sw.js",
  "icons/icon-72.png",
  "icons/icon-96.png",
  "icons/icon-128.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "logo/sagae-logo.png",
  "logo/sagae-simbolo.png",
  "logo/sagae-simbolo-blanco.png"
];

// Cuántos respaldos semanales se conservan (8 ≈ dos meses).
const RETENER_PROGRAMA = 8;

// ── Carpeta raíz de los respaldos del programa ────────────────────────
function _folderPrograma_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const nombre = "SAGAE_Programa_" + ss.getName().replace(/[^a-zA-Z0-9]/g, "_");
  const encontradas = DriveApp.getFoldersByName(nombre);
  return encontradas.hasNext() ? encontradas.next() : DriveApp.createFolder(nombre);
}

// Devuelve la subcarpeta con ese nombre, creándola si no existe.
function _subcarpeta_(padre, nombre) {
  const hijas = padre.getFoldersByName(nombre);
  return hijas.hasNext() ? hijas.next() : padre.createFolder(nombre);
}

// ── RESPALDO ──────────────────────────────────────────────────────────
function backupProgramaWeb() {
  const resultado = { ok: false, carpeta: "", guardados: [], fallidos: [], bytes: 0 };
  try {
    const raiz  = _folderPrograma_();
    const fecha = Utilities.formatDate(new Date(), "America/Panama", "yyyy-MM-dd");
    const destino = _subcarpeta_(raiz, fecha);
    resultado.carpeta = fecha;

    ARCHIVOS_PROGRAMA.forEach(function (ruta) {
      try {
        // El parámetro de tiempo evita que una caché intermedia devuelva
        // una versión vieja del archivo.
        const resp = UrlFetchApp.fetch(URL_PROGRAMA + ruta + "?t=" + Date.now(), {
          muteHttpExceptions: true,
          followRedirects: true
        });
        const codigo = resp.getResponseCode();
        if (codigo !== 200) {
          resultado.fallidos.push(ruta + " — HTTP " + codigo);
          return;
        }

        const partes = ruta.split("/");
        const nombreArchivo = partes.pop();
        let carpetaDestino = destino;
        partes.forEach(function (sub) { carpetaDestino = _subcarpeta_(carpetaDestino, sub); });

        // Si el respaldo de hoy ya tenía este archivo (reejecución), se
        // reemplaza en vez de dejar dos copias.
        const previos = carpetaDestino.getFilesByName(nombreArchivo);
        while (previos.hasNext()) previos.next().setTrashed(true);

        const blob = resp.getBlob().setName(nombreArchivo);
        const archivo = carpetaDestino.createFile(blob);
        resultado.guardados.push(ruta + " (" + archivo.getSize() + " bytes)");
        resultado.bytes += archivo.getSize();
      } catch (eArchivo) {
        resultado.fallidos.push(ruta + " — " + eArchivo.message);
      }
    });

    // ── Rotación: conservar solo los últimos respaldos ────────────────
    const carpetas = raiz.getFolders();
    const lista = [];
    while (carpetas.hasNext()) {
      const c = carpetas.next();
      if (/^\d{4}-\d{2}-\d{2}$/.test(c.getName())) lista.push({ f: c, d: c.getDateCreated() });
    }
    lista.sort(function (a, b) { return b.d - a.d; });
    if (lista.length > RETENER_PROGRAMA) {
      lista.slice(RETENER_PROGRAMA).forEach(function (item) { item.f.setTrashed(true); });
    }

    resultado.ok = resultado.fallidos.length === 0;
    _avisarBackupPrograma_(resultado);
    Logger.log("backupProgramaWeb: " + JSON.stringify(resultado));
    return resultado;

  } catch (e) {
    resultado.fallidos.push("Error general: " + e.message);
    _avisarBackupPrograma_(resultado);
    Logger.log("backupProgramaWeb ERROR: " + e.message);
    return resultado;
  }
}

// ── Aviso por correo — solo si algo falló ─────────────────────────────
// Un respaldo correcto no manda nada: si llega un correo, es porque hay
// algo que revisar. Así el aviso no se vuelve ruido que se ignora.
function _avisarBackupPrograma_(resultado) {
  try {
    if (resultado.ok) return;
    const admins = getAdminEmails();
    if (!admins.length) return;
    MailApp.sendEmail({
      to: admins.join(","),
      subject: "[SAGAE] ⚠ El respaldo del programa no se completó",
      body:
        "El respaldo automático del programa a Google Drive no pudo guardar todos los archivos.\n\n" +
        "Carpeta: " + (resultado.carpeta || "no se llegó a crear") + "\n" +
        "Guardados: " + resultado.guardados.length + " de " + ARCHIVOS_PROGRAMA.length + "\n\n" +
        "No se pudieron guardar:\n  " + resultado.fallidos.join("\n  ") + "\n\n" +
        "Causas más comunes:\n" +
        "  • El sitio está caído o cambió de dirección.\n" +
        "  • Se renombró o se quitó un archivo del programa y hay que\n" +
        "    actualizar la lista ARCHIVOS_PROGRAMA en el Apps Script.\n\n" +
        "Los datos (la hoja de cálculo) se respaldan aparte y no se ven\n" +
        "afectados por esto."
    });
  } catch (e) {
    Logger.log("No se pudo avisar del respaldo del programa: " + e.message);
  }
}

// ── Instalador del disparador semanal ─────────────────────────────────
// Domingos de madrugada, hora de Panamá. Se borra cualquier disparador
// anterior de esta misma función para no dejar duplicados.
function instalarTriggerBackupPrograma() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "backupProgramaWeb") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("backupProgramaWeb")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(8)              // 8:00 UTC = 3:00 a.m. en Panamá
    .create();
  Logger.log("Disparador instalado: respaldo del programa los domingos a las 3 a.m.");
  return "Disparador del respaldo del programa instalado";
}

// ── Consulta rápida del estado ────────────────────────────────────────
// Para responder "¿está funcionando?" sin abrir Drive a mano.
function estadoBackupPrograma() {
  const instalado = ScriptApp.getProjectTriggers()
    .some(function (t) { return t.getHandlerFunction() === "backupProgramaWeb"; });

  const raiz = _folderPrograma_();
  const carpetas = raiz.getFolders();
  const lista = [];
  while (carpetas.hasNext()) {
    const c = carpetas.next();
    if (/^\d{4}-\d{2}-\d{2}$/.test(c.getName())) {
      let n = 0;
      const archivos = c.getFiles();
      while (archivos.hasNext()) { archivos.next(); n++; }
      const subs = c.getFolders();
      while (subs.hasNext()) {
        const s = subs.next(); const fs = s.getFiles();
        while (fs.hasNext()) { fs.next(); n++; }
      }
      lista.push({ fecha: c.getName(), archivos: n });
    }
  }
  lista.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });

  const estado = {
    disparadorInstalado: instalado,
    esperados: ARCHIVOS_PROGRAMA.length,
    respaldos: lista.slice(0, 10),
    carpetaDrive: raiz.getUrl()
  };
  Logger.log(JSON.stringify(estado, null, 2));
  return estado;
}
