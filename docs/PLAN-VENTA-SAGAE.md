# SAGAE — Plan por fases: de "proyecto seguro" a "producto vendible"

Última actualización: 2026-08-28

Este documento responde a una pregunta puntual del dueño del proyecto: qué
le faltaría a SAGAE, más allá de la seguridad de login ya reforzada, para
poder venderse como producto a varias escuelas (no solo operar bien para
una). No es un plan de ejecución con fechas — es un mapa de fases para
retomar cuando se decida avanzar en ese camino.

## Decisión tomada — meta concreta: 5 escuelas, modelo replicado

El dueño del proyecto definió la primera meta real: **instalar SAGAE en
~5 escuelas** usando el modelo actual (una cuenta de Google = una escuela
= una Hoja = un Apps Script, replicado por instalación), no una
reescritura a SaaS multi-cliente. Esto resuelve a favor de la opción
"pocos clientes" el punto de bifurcación que se planteaba más abajo en la
Fase 3 — **queda descartado por ahora migrar a un backend multi-tenant**
(Fase 3-SaaS y Fase 4 quedan en pausa indefinida, no son necesarias para
esta etapa).

Con esa meta ya fijada, lo que sigue es afilar específicamente lo que
hace falta para llegar a 5 instalaciones reales con confianza — eso es
la sección "Primera etapa: 5 escuelas" justo abajo. El resto de fases
(legal, pre-venta) se mantienen como referencia para más adelante, pero
recortadas a lo mínimo indispensable para no bloquear esta primera etapa.

## Primera etapa — afilar para llegar a 5 escuelas

Esto es lo que de verdad hace falta pulir antes de repetir la instalación
4 veces más (ya hay una corriendo — la actual):

1. **Actualizar el manual de instalación al backend REAL.** El manual
   detallado que se generó antes era una reconstrucción a partir del
   frontend, no una copia del backend real — desde entonces se descubrió
   que el formato de contraseñas, el orden de columnas y varias funciones
   (cola de notificaciones, backup automático) son distintos a lo
   reconstruido. Antes de instalar en la escuela #2, el manual debe
   reflejar el `Code.gs` real tal como quedó hoy (con 2FA, `mi_perfil`,
   etc.), no la versión reconstruida.
2. **Checklist de onboarding por escuela**, como lista de verificación
   corta (no el manual completo) para no saltarse pasos de seguridad al
   repetir la instalación rápido: activar 2FA en la cuenta de Google de
   cada escuela, confirmar que quedó como única con acceso de Editor a
   su Hoja, instalar el trigger de backup automático, crear el primer
   usuario admin con contraseña fuerte.
3. **Registro interno de las 5 instalaciones** — qué escuela tiene qué
   Hoja/Script, en qué versión del código quedó cada una, y datos de
   contacto. Sin esto, aplicar un arreglo como el de hoy (el bug de
   `computeHmacSha1Signature`) a las 5 por separado se vuelve caótico.
4. **Proceso simple para propagar un arreglo a las 5 instalaciones.** Hoy
   cada escuela es independiente — si aparece un bug como el de hoy, hay
   que ir una por una pegando el `Code.gs` corregido. No hace falta
   automatizarlo todavía, pero sí un procedimiento por escrito (y el
   registro del punto 3) para no perder ninguna en el camino.
5. ✅ **Mínimo legal por escuela** — resuelto el 31 de agosto de 2026 como
   plantillas listas para reutilizar en cada escuela:
   [`docs/legal/AVISO-DE-PRIVACIDAD-PLANTILLA.md`](legal/AVISO-DE-PRIVACIDAD-PLANTILLA.md)
   (lo publica la escuela hacia su propia comunidad) y
   [`docs/legal/ACUERDO-DE-RESPONSABILIDAD-DE-DATOS-PLANTILLA.md`](legal/ACUERDO-DE-RESPONSABILIDAD-DE-DATOS-PLANTILLA.md)
   (entre RYE Design y la escuela). **Pendiente antes de usarlos con dinero
   real de por medio:** que un abogado panameño los revise — son un punto
   de partida serio, no asesoría legal validada.
6. **Probar una restauración real desde el backup** al menos una vez,
   en la instalación actual, antes de repetir el proceso 4 veces más.

## Contexto — qué ya está resuelto (28 de agosto de 2026)

- Verificación en dos pasos (TOTP / Google Authenticator) implementada y
  verificada funcionando en producción.
- Cierre automático de sesiones activas al cambiar la contraseña.
- Bloqueo por intentos fallidos, permisos por rol y hash de contraseña con
  sal por usuario — ya existían en el backend real, verificados.
- Respaldo diario automático de la Hoja (JSON, 30 días de retención, aviso
  por correo).
- Acceso de Editor a la Hoja restringido solo al dueño de la cuenta.
- Corrección de "Mi perfil" y cambio de contraseña, que fallaban en
  silencio para roles distintos de admin.

## Fase 0 — Cerrar lo que quedó abierto (corto plazo, esta semana)

- Confirmar quién tiene acceso de **colaborador** al proyecto de Apps
  Script (nunca se llegó a revisar esa lista — solo se confirmó que la
  Hoja de cálculo en sí no tiene otros editores).
- Archivar las implementaciones viejas en "Gestionar implementaciones"
  del editor de Apps Script (había varias "Sin título" activas).
- Activar verificación en dos pasos en la cuenta de Google real
  (`ryedesingsagaedemo@gmail.com`) — distinto del 2FA de la app, protege
  la cuenta dueña de todo (Drive, Hoja, Script).
- Exigir contraseñas más fuertes (hoy el mínimo es 6 caracteres, sin
  exigir complejidad).

## Fase 1 — Endurecer lo que ya existe, para un solo cliente en producción real

- Definir y respetar un flujo de staging obligatorio (copia de prueba
  antes de cualquier cambio de backend) — hoy se saltó una vez por falta
  de tiempo; no debería repetirse con un cliente pagando.
- Pruebas automatizadas mínimas sobre lo crítico: login, permisos por
  rol, 2FA. No se necesita cobertura total, sí cubrir lo que rompe
  confianza si falla.
- Probar una restauración real desde el backup (no solo confirmar que se
  genera correctamente).
- Pulir el manual de instalación ya existente para que sirva como
  procedimiento repetible de onboarding, no solo como referencia.

## Fase 2 — Base legal completa (más adelante, pasadas las 5 escuelas)

El mínimo indispensable para arrancar ya está movido al punto 5 de
"Primera etapa" arriba. Esto es la versión completa, para cuando el
negocio crezca más allá de las 5 primeras instalaciones:

- Política de privacidad y términos de servicio formales.
- Revisión de cumplimiento con la Ley 81 de 2019 (Panamá) sobre
  protección de datos personales — el sistema maneja datos de personas
  (beneficiarios, personal).
- Contrato tipo con cada escuela cliente: propiedad de los datos, dónde
  se almacenan, qué pasa al terminar el contrato.
- Evaluar seguro de responsabilidad civil / ciberseguridad si se va a
  cobrar por manejar datos de terceros.

## Fase 3 — Arquitectura multi-cliente (EN PAUSA — no aplica a la meta de 5 escuelas)

Se decidió no perseguir esto por ahora (ver "Decisión tomada" arriba).
Queda documentado para el día que la ambición pase de ~10 clientes:

- Migrar de Google Sheets/Apps Script a una base de datos real con
  backend multi-tenant y aislamiento por escuela. Sheets/Apps Script no
  está pensado para eso a esa escala (rendimiento con miles de filas,
  límite de 6 minutos por ejecución, cuotas diarias compartidas). Es una
  reescritura seria del backend, no una extensión del actual.

## Fase 4 — Si algún día se retoma el camino SaaS multi-cliente (EN PAUSA)

- Backend multi-tenant con aislamiento real de datos por escuela.
- Mecanismo para desplegar actualizaciones a todos los clientes desde un
  solo lugar (hoy no existe — cada instalación es independiente).
- Panel de administración/monitoreo centralizado.
- Modelo de facturación, si se va a cobrar.

## Fase 5 — Pre-venta (más adelante, pasadas las 5 escuelas)

- Auditoría de seguridad externa formal (pentest con reporte firmado) —
  algo mostrable a un cliente institucional como garantía. Lo hecho hasta
  ahora es una revisión propia, seria pero no sustituye una auditoría
  independiente.
- Prueba de carga, si va a haber varias escuelas usando el sistema a la
  vez sobre la misma infraestructura.
- Proceso de soporte definido: quién responde, en qué tiempo, cómo se
  reportan y priorizan bugs.
