# Acuerdo de responsabilidad de datos — SAGAE (plantilla por escuela)

> **Quién usa este documento:** RYE Design y cada escuela cliente, firmado por
> ambas partes antes de que entren datos reales de personas al sistema (según
> el punto 5 de "Primera etapa" en `docs/PLAN-VENTA-SAGAE.md`).
>
> Esto NO es asesoría legal. Es un punto de partida serio para no llegar con
> las manos vacías a la escuela #2, pero antes de usarlo como contrato real
> con dinero de por medio, que lo revise un abogado panameño — especialmente
> las cláusulas de responsabilidad y las de terminación.
>
> Reemplazar todo lo que está entre `[corchetes]`.

---

## Acuerdo de responsabilidad de datos

Entre **RYE Design** ("el Proveedor") y **[NOMBRE DE LA ESCUELA]** ("el Cliente"),
en relación con el uso del sistema SAGAE (Sistema de Activos y Gestión
Administrativa Educativa).

Fecha: [FECHA] · Contacto del Cliente: [NOMBRE Y CORREO DEL RESPONSABLE EN LA ESCUELA]

### 1. Objeto

El Proveedor entrega e instala el sistema SAGAE en una cuenta de Google
Workspace/Gmail propiedad del Cliente, y brinda soporte técnico y mantenimiento
según lo acordado por separado (alcance, costo y tiempos de soporte no son
parte de este documento — ver acuerdo comercial).

### 2. Propiedad de los datos

**Todos los datos que el Cliente ingrese al sistema (inventario, personal,
tickets, reportes, y cualquier otra información) son propiedad exclusiva del
Cliente.** El Proveedor no reclama ningún derecho de propiedad sobre esos
datos, no los usa para ningún fin propio, y no los comparte con nadie fuera
de lo estrictamente necesario para dar soporte técnico.

### 3. Dónde viven los datos

Los datos se almacenan en una Hoja de cálculo de Google y un proyecto de
Google Apps Script, **dentro de la propia cuenta de Google del Cliente** — el
Proveedor no aloja los datos en infraestructura propia ni de un tercero
distinto a Google. El Cliente mantiene en todo momento el control total de
esa cuenta (contraseña, verificación en dos pasos, y lista de quién tiene
acceso).

### 4. Acceso del Proveedor

El Proveedor solo accede a los datos del Cliente cuando es necesario para:

- Instalar actualizaciones o corregir errores reportados por el Cliente.
- Dar soporte ante un problema técnico específico que el Cliente reporte.

El Proveedor **no** accede de forma rutinaria ni monitorea el uso diario del
sistema. Cualquier acceso fuera de estos casos requiere autorización expresa
del Cliente.

### 5. Confidencialidad

El Proveedor se compromete a mantener confidencial toda la información a la
que tenga acceso por motivo del soporte técnico, y a no divulgarla a terceros
bajo ninguna circunstancia, salvo obligación legal.

### 6. Medidas de seguridad implementadas

El Proveedor mantiene en el sistema, como mínimo: contraseñas cifradas con
sal única por usuario, verificación en dos pasos (2FA), bloqueo temporal tras
intentos fallidos de acceso, permisos de acceso según el rol de cada usuario
(verificados también del lado del servidor, no solo visualmente), respaldo
automático diario con retención de 30 días, y un registro de auditoría no
editable de las acciones realizadas en el sistema.

**Limitación honesta:** estas medidas reducen significativamente el riesgo,
pero ningún sistema es invulnerable. Lo implementado hasta la fecha de este
documento es una revisión de seguridad propia y seria, **no una auditoría de
seguridad externa independiente** — esa es una meta declarada para una etapa
posterior del proyecto (ver `docs/PLAN-VENTA-SAGAE.md`, Fase 5).

### 7. Qué pasa ante un incidente de seguridad

Si el Proveedor detecta o es notificado de un incidente que comprometa los
datos del Cliente, se compromete a notificar al Cliente en un plazo de
**[PLAZO — ej. 48 horas]** desde su detección, con la información disponible
sobre el alcance y las medidas tomadas.

### 8. Respaldo y recuperación

El sistema respalda automáticamente los datos del Cliente todos los días. El
Proveedor se compromete a que el proceso de restauración desde un respaldo se
pruebe y confirme como funcional [al menos una vez antes de la firma de este
acuerdo / con la frecuencia que se acuerde]. Esto no elimina la posibilidad de
pérdida de datos entre el último respaldo y el momento de un incidente.

### 9. Terminación del servicio

Si el Cliente decide dejar de usar SAGAE, el Proveedor:

- No retiene copia de los datos del Cliente más allá de lo estrictamente
  necesario para cerrar la relación de soporte (ej. resolver un ticket
  abierto), y las elimina de cualquier copia propia en un plazo de
  **[PLAZO — ej. 30 días]**.
- Los datos del Cliente permanecen intactos en su propia cuenta de Google,
  ya que nunca salieron de ahí — el Cliente conserva acceso total en todo
  momento, con o sin el Proveedor.

### 10. Limitación de responsabilidad

El Proveedor no garantiza que el sistema esté libre de errores o sea inmune
a todo tipo de ataque. La responsabilidad del Proveedor ante cualquier daño
derivado del uso del sistema se limita a [DEFINIR — ej. el monto pagado por
el servicio en los últimos 12 meses], salvo negligencia grave o dolo
comprobado.

---

**Firmas**

Por el Proveedor (RYE Design): _______________________ Fecha: _______

Por el Cliente ([NOMBRE DE LA ESCUELA]): _______________________ Fecha: _______
