# Proceso para propagar un arreglo a todas las instalaciones

Hoy cada escuela es una instalación completamente independiente — su
propia cuenta de Google, su propia Hoja, su propio proyecto de Apps
Script, su propio hosting del frontend. Eso da aislamiento real entre
clientes (si algo sale mal en una escuela, no afecta a las demás), pero
tiene un costo: **un bug o una mejora no se propaga sola.** Si aparece
un problema como el de hoy (`computeHmacSha1Signature` no existe), hay
que ir escuela por escuela pegando el código corregido.

No hace falta automatizar esto para 5 escuelas — sí hace falta un
procedimiento por escrito para no perder ninguna en el camino ni
aplicar la misma corrección dos veces sin querer.

## Cuándo aplica este proceso

- Se corrigió un bug real en `Code.gs` (backend) y/o en los archivos
  del frontend (`index.html`, `SAGAE_index_mobile.html`,
  `SAGAE_portal_reportes.html`, `manifest.json`, `sw.js`).
- Se agregó una funcionalidad nueva que todas las instalaciones activas
  deberían tener (como pasó hoy con la restauración de backups).

**No aplica** a algo específico de una sola escuela (por ejemplo, su
logo institucional, o un ajuste de datos que solo le corresponde a
ella).

## El proceso, paso a paso

### 1. Validar el cambio en la instalación de referencia primero

Nunca propagar algo que no se probó. La instalación piloto (fila #1 del
[`REGISTRO-INSTALACIONES.md`](REGISTRO-INSTALACIONES.md)) es donde se
prueba primero — es real, está en uso, y ya sirvió como validación real
hoy mismo (por ejemplo, la restauración de backups se confirmó
funcionando ahí antes de darla por lista).

### 2. Documentar el cambio antes de propagarlo

- Agregar una fila nueva a la tabla "Historial de versiones de
  `Code.gs`" en `REGISTRO-INSTALACIONES.md`, con la fecha de hoy y una
  descripción corta de qué trae.
- Si el cambio también afecta al frontend, anotarlo ahí mismo (qué
  archivo(s) cambiaron).

### 3. Revisar el registro para saber a quién le toca

Abrir `REGISTRO-INSTALACIONES.md` y listar todas las filas con datos
reales (no las que dicen "sin instalar"). Esa es la lista completa de
a quién hay que propagar el cambio — no confiar en la memoria.

### 4. Aplicar el cambio, instalación por instalación

Para cada escuela de la lista:

**Si el cambio toca el backend (`Code.gs`):**
1. Abrir el proyecto de Apps Script de esa escuela (el registro tiene
   la cuenta de Google — hay que entrar con esa cuenta o pedirle a
   quien la tenga que lo haga).
2. Reemplazar todo el contenido de `Código.gs` por la versión
   corregida.
3. Guardar.
4. **Implementar → Administrar implementaciones → ✏️ → Nueva versión →
   Implementar** — el paso que más se olvida. Sin esto, el cambio
   queda guardado pero nunca llega a producción.

**Si el cambio toca el frontend:**
1. Subir los archivos actualizados a la ubicación de hosting de esa
   escuela (la columna "Dominio del frontend" del registro dice dónde).
2. Si el cambio tocó `API`/`API_TOKEN`, confirmar que siguen apuntando
   al backend correcto de esa escuela — nunca copiar el token de otra
   instalación por accidente.

### 5. Probar que quedó bien, ahí mismo

No basta con "ya lo pegué" — repetir al menos la prueba de aceptación
correspondiente de la sección 11 del
[`MANUAL-INSTALACION-SAGAE.md`](MANUAL-INSTALACION-SAGAE.md) que tenga
que ver con lo que se corrigió. Si el arreglo fue sobre 2FA, probar
2FA. Si fue sobre restauración de backups, correr
`restaurarUltimoBackupManual()` una vez ahí.

### 6. Actualizar el registro para esa escuela

En `REGISTRO-INSTALACIONES.md`, actualizar la columna "Versión de
`Code.gs`" de esa fila con la fecha nueva. Solo cuando las 5 filas
activas quedan con la misma fecha, la propagación está completa.

## Qué hacer si algo sale mal a mitad de camino

Si a mitad de propagar a las 5 escuelas se descubre un problema con el
propio arreglo (no algo nuevo — un error en la corrección misma):

1. **Detener la propagación** — no seguir aplicando algo que ya se sabe
   que tiene un problema.
2. Corregirlo y volver a probarlo en la instalación de referencia
   (paso 1, de nuevo).
3. Revisar el registro para ver qué escuelas ya recibieron la versión
   con el problema, y volver a pasarlas con la versión corregida antes
   de seguir con las que faltaban.

## Límite real de este proceso

Esto es manual a propósito — para 5 escuelas es manejable sin
automatizarlo. Si el número de instalaciones crece mucho más allá de
eso, este procedimiento se vuelve el cuello de botella, y ahí es donde
entraría en juego lo que hoy está en pausa deliberada: un mecanismo
centralizado de despliegue (ver Fase 4 en
[`PLAN-VENTA-SAGAE.md`](PLAN-VENTA-SAGAE.md)) — no antes de que haga
falta de verdad.
