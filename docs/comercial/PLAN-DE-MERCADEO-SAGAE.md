# Plan de mercadeo — SAGAE

Última actualización: 2026-09-01

Este documento traduce la meta ya definida en
[`../PLAN-VENTA-SAGAE.md`](../PLAN-VENTA-SAGAE.md) (instalar SAGAE en ~5
escuelas) en un plan de mercadeo concreto: a quién venderle, cómo
posicionarlo frente a lo que ya existe en el mercado, por dónde
conseguir los primeros clientes, y cómo se ve el proceso de venta de
principio a fin usando los documentos que ya están listos.

## 1. A quién le vendes (perfil de cliente)

**Cliente ideal para esta primera etapa:** colegios privados o
semi-privados en Panamá, de tamaño pequeño a mediano (aprox. 100 a
1,500 equipos entre computadoras, proyectores y demás inventario
tecnológico), que hoy administran su inventario y soporte técnico con
hojas de cálculo sueltas, WhatsApp, o memoria de una sola persona de TI
— exactamente el problema que SAGAE resuelve (sección 1 de
`marketing/SAGAE-Presentacion-Cliente.pdf`).

**Señales de que una escuela es buen prospecto:**
- Tiene una persona de TI o soporte técnico identificable (aunque sea
  de medio tiempo) — es quien más rápido entiende el valor.
- Ya usa Google Workspace para su correo institucional — reduce fricción
  técnica de instalación a casi cero, porque SAGAE vive sobre esa misma
  cuenta.
- Ha tenido al menos un incidente reciente de "se perdió un equipo" o
  "no sabíamos que esa licencia había vencido" — es el dolor concreto
  que abre la conversación.

**No es el cliente ideal (todavía) para esta etapa:** colegios muy
grandes con varios campus y un departamento de TI robusto que ya tiene
su propio sistema — son un cliente de fases posteriores (Fase 5,
pre-venta institucional), no de las primeras 5 instalaciones.

## 2. Cómo se posiciona SAGAE frente al mercado

| Alternativa que la escuela usa hoy | Por qué SAGAE gana |
|---|---|
| Hojas de cálculo sueltas + WhatsApp/correo | SAGAE conecta todo en un solo lugar, en tiempo real, sin depender de que alguien "pase" la información a mano. |
| Software genérico de gestión de activos (internacional, en inglés, pensado para empresas) | SAGAE está en español, pensado específicamente para el vocabulario y los flujos de una institución educativa (personas, espacios, departamentos como en un colegio, no como en una oficina corporativa). |
| Un sistema hecho a medida por otro desarrollador local | SAGAE ya existe, probado en producción real, con seguridad seria (2FA, respaldo con restauración probada, permisos por rol) — no hay que esperar meses de desarrollo desde cero. |
| No usar ningún sistema | El costo de no tener control de inventario (equipos perdidos, licencias vencidas sin aviso, soporte desorganizado) casi siempre termina siendo mayor que el de adoptar SAGAE. |

**El mensaje central de venta, en una frase:** *"Todo el control de tu
institución, en un solo lugar"* — ya es el título de portada de
`SAGAE-Presentacion-Cliente.pdf`, y debe ser el mensaje que se repite
en cualquier conversación, publicación o reunión.

## 3. Canales para conseguir los primeros 5 clientes

Con una meta de solo 5 instalaciones, **no hace falta publicidad
pagada ni una campaña masiva** — el canal más eficiente a esta escala
es la relación directa:

1. **Red de contactos directa.** El colegio piloto (PCA) es la
   referencia más fuerte que existe — un caso real, funcionando, es más
   convincente que cualquier folleto. Pedir una referencia o
   presentación directa desde ahí es el primer paso, no el último.
2. **Asociaciones de colegios particulares en Panamá.** Existen
   agrupaciones gremiales de colegios privados que organizan reuniones
   o boletines — una mención o presentación breve ahí llega
   directamente al perfil de cliente correcto, sin gastar en anuncios
   genéricos.
3. **LinkedIn, dirigido, no masivo.** Buscar directores administrativos,
   coordinadores de TI o directores generales de colegios privados en
   Panamá y escribirles directamente, mencionando el caso piloto — un
   mensaje personalizado a 20 contactos bien elegidos rinde más que un
   anuncio a miles.
4. **Referidos del propio cliente piloto.** Pedirle directamente al
   colegio PCA una recomendación o contacto a otra institución — el
   referido de un cliente real y satisfecho es el canal más barato y
   más efectivo que existe en ventas B2B de este tamaño.
5. **Ferias o eventos educativos locales**, si aparece la oportunidad
   — útil para visibilidad, pero no depender de esto para llegar a la
   meta de 5.

**Lo que NO hace falta todavía:** sitio web de marketing propio con
SEO, campañas de anuncios pagados (Google/Meta Ads), ni un equipo de
ventas — todo eso pertenece a una etapa posterior (Fase 5 del plan de
venta), si la ambición crece más allá de estas 5 escuelas.

## 4. El proceso de venta, de principio a fin

Usando los documentos ya construidos, el recorrido de un prospecto
hasta convertirse en instalación #2, #3, #4 o #5 se ve así:

1. **Primer contacto** — por referido o contacto directo (sección 3).
2. **Presentación del sistema** — se envía o se presenta en persona
   `marketing/SAGAE-Presentacion-Cliente.pdf`. Objetivo: que entiendan
   qué es SAGAE y por qué les sirve, en su propio lenguaje, sin jerga
   técnica.
3. **Propuesta comercial formal** — una vez hay interés real, se envía
   la propuesta (`docs/comercial/PROPUESTA-COMERCIAL-PLANTILLA.md` o su
   versión en PDF), personalizada con el nombre de la escuela y, si ya
   está definida, la inversión.
4. **Aclarar dudas / demo en vivo** — mostrar el sistema piloto
   funcionando (con datos de ejemplo, nunca con datos reales de otra
   escuela).
5. **Firma del contrato** — `docs/legal/CONTRATO-LICENCIA-SERVICIO-PLANTILLA.md`,
   junto con el aviso de privacidad y el acuerdo de responsabilidad de
   datos que ya existían.
6. **Instalación** — siguiendo `docs/MANUAL-INSTALACION-SAGAE.md` y
   `docs/CHECKLIST-ONBOARDING-ESCUELA.md`.
7. **Registro y seguimiento** — la nueva instalación se agrega a
   `docs/REGISTRO-INSTALACIONES.md`.
8. **Pedir el referido** — con el cliente ya satisfecho y funcionando,
   este es el mejor momento para pedir la siguiente presentación (vuelve
   al paso 1, con otro prospecto).

## 5. Sobre el precio (pendiente de definir)

Este plan no fija un precio — esa decisión es del dueño del negocio, no
algo que deba inventarse en un documento. Sí vale la pena dejar
planteadas las **preguntas** que definen el modelo, para cuando se
decida:

- **¿Pago único de instalación, o suscripción recurrente (mensual o
  anual)?** Un pago único es más simple de vender al inicio, pero una
  suscripción da ingresos predecibles y financia el soporte continuo
  (que sí tiene un costo real de tu tiempo).
- **¿El soporte técnico continuo está incluido, o es un servicio
  aparte?** Dado que cada instalación es independiente (no hay
  automatización de despliegue todavía — ver
  `docs/PROCESO-PROPAGAR-ARREGLOS.md`), el soporte tiene un costo real
  de tiempo que conviene reflejar en el precio, no regalarlo.
- **¿El precio varía según el tamaño de la escuela** (número de
  equipos, de usuarios)? — razonable, dado que no cambia el trabajo de
  instalación pero sí el valor que recibe una escuela grande.

Cuando estas respuestas estén definidas, se completan en
`PROPUESTA-COMERCIAL-PLANTILLA.md` y en el contrato — ambos ya están
armados para recibir esa información sin tener que reescribirse desde
cero.

## 6. Meta y cómo medirla

La meta ya está fijada: **~5 escuelas**, modelo replicado (ver
`../PLAN-VENTA-SAGAE.md`). Para este tamaño, no hace falta un tablero
de métricas complejo — basta con llevar, en
`docs/REGISTRO-INSTALACIONES.md`, cuántas filas activas hay en cada
momento, y en una nota aparte (o el propio registro), cuántas
propuestas se enviaron y a cuántas escuelas se les hizo la
presentación — para saber, con esos tres números simples, en qué parte
del embudo de ventas hace falta empujar más.
