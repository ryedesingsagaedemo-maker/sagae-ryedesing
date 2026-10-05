// ══════════════════════════════════════════════════════════════════════
// SAGAE — PARCHE DEL SERVIDOR: CAMBIO DEL TOKEN DE API (2026-10-05)
// Desarrollado por RYE Design
//
// QUÉ ES EL TOKEN DE API: un filtro de "tráfico ajeno" que cada pantalla
// envía en cada petición. Como las pantallas son públicas, el token SIEMPRE
// es visible en el código de la página: NO es un secreto ni protege datos.
// Lo que protege los datos es la sesión que valida el servidor.
// Aun así se renueva por higiene: el valor anterior quedó en el historial de
// GitHub, en copias del script y en conversaciones.
//
// CÓMO SE CAMBIA SIN CORTAR A NADIE (orden obligatorio):
//   PASO 1 (Apps Script)  Reemplazar la función validarApiToken por la de
//                         abajo y añadir la propiedad SAGAE_API_TOKEN_NUEVO
//                         (Configuración del proyecto → Propiedades del
//                         script). NO borrar SAGAE_API_TOKEN todavía.
//                         Implementar → Administrar implementaciones →
//                         lápiz → Nueva versión.
//   PASO 2 (GitHub)       Publicar las pantallas con el token nuevo (sw v3.4).
//   PASO 3 (una semana
//           después)      Borrar la propiedad SAGAE_API_TOKEN (la vieja).
//                         Desde ese momento el token anterior ya no sirve.
//
// Si algo sale mal en el paso 1 o 2, no se pierde nada: las pantallas
// antiguas siguen entrando con el token anterior mientras exista.
// ══════════════════════════════════════════════════════════════════════

function validarApiToken(payload) {
  try {
    // PARCHE 2026-10-05 — cambio de token sin cortar a nadie: se aceptan DOS valores.
    //   SAGAE_API_TOKEN        = el token anterior (se borra cuando todos ya actualizaron)
    //   SAGAE_API_TOKEN_NUEVO  = el token nuevo que ya llevan las pantallas
    const props = PropertiesService.getScriptProperties();
    const validos = [props.getProperty('SAGAE_API_TOKEN'), props.getProperty('SAGAE_API_TOKEN_NUEVO')]
      .filter(function (t) { return t && String(t).length >= 16; });
    // Fail-closed: si no hay ningún token configurado, o falla la lectura, se RECHAZA.
    if (!validos.length) return false;
    const recibido = payload && payload._apiToken;
    return !!recibido && validos.indexOf(String(recibido)) !== -1;
  } catch (e) {
    return false;
  }
}
