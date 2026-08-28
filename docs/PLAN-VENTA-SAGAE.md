# SAGAE — Plan por fases: de "proyecto seguro" a "producto vendible"

Última actualización: 2026-08-28

Este documento responde a una pregunta puntual del dueño del proyecto: qué
le faltaría a SAGAE, más allá de la seguridad de login ya reforzada, para
poder venderse como producto a varias escuelas (no solo operar bien para
una). No es un plan de ejecución con fechas — es un mapa de fases para
retomar cuando se decida avanzar en ese camino.

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

## Fase 2 — Base legal

- Política de privacidad y términos de servicio.
- Revisión de cumplimiento con la Ley 81 de 2019 (Panamá) sobre
  protección de datos personales — el sistema maneja datos de personas
  (beneficiarios, personal).
- Contrato tipo con cada escuela cliente: propiedad de los datos, dónde
  se almacenan, qué pasa al terminar el contrato.
- Evaluar seguro de responsabilidad civil / ciberseguridad si se va a
  cobrar por manejar datos de terceros.

## Fase 3 — Decisión de arquitectura (el punto de bifurcación real)

Hoy el sistema es: una cuenta de Google = una escuela = una Hoja = un
Apps Script. Antes de invertir más, definir cuántos clientes se planean
tener en 1-2 años:

- **Pocos clientes (menos de ~10)** → formalizar el modelo actual de
  "instalación por escuela", con el manual como proceso de onboarding
  repetible. Rápido, sin reescritura, pero cada actualización hay que
  aplicarla cliente por cliente a mano.
- **Ambición de escalar a muchos clientes** → migrar a una base de datos
  real y un backend multi-cliente con aislamiento por escuela. Google
  Sheets/Apps Script no está pensado para eso (rendimiento con miles de
  filas, límite de 6 minutos por ejecución, cuotas diarias compartidas).
  Esto es una reescritura seria del backend, no una extensión.

## Fase 4 — Si se elige el camino SaaS multi-cliente

- Backend multi-tenant con aislamiento real de datos por escuela.
- Mecanismo para desplegar actualizaciones a todos los clientes desde un
  solo lugar (hoy no existe — cada instalación es independiente).
- Panel de administración/monitoreo centralizado.
- Modelo de facturación, si se va a cobrar.

## Fase 5 — Pre-venta

- Auditoría de seguridad externa formal (pentest con reporte firmado) —
  algo mostrable a un cliente institucional como garantía. Lo hecho hasta
  ahora es una revisión propia, seria pero no sustituye una auditoría
  independiente.
- Prueba de carga, si va a haber varias escuelas usando el sistema a la
  vez sobre la misma infraestructura.
- Proceso de soporte definido: quién responde, en qué tiempo, cómo se
  reportan y priorizan bugs.
