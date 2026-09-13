# SAGAE — Plan de Refactorización Completo

**Versión:** 1.0  
**Fecha:** 2026-09-10  
**Duración estimada:** 18 semanas  
**Equipo recomendado:** 4 desarrolladores + 1 líder técnico

---

## 1. Análisis de Requisitos

SAGAE actualmente soporta **12 módulos funcionales** que deben ser separados en servicios independientes. Cada módulo tiene responsabilidades claras y usuarios específicos:

| Módulo | Responsabilidad | Usuarios |
|--------|-----------------|----------|
| **Autenticación** | Login, 2FA, JWT, roles RBAC | Todos |
| **Usuarios** | CRUD usuarios, permisos, roles | Admin |
| **Activos** | Registro, seguimiento, historial, estado | Admin, Inventario, Técnico |
| **Tickets** | Reportes, asignación, resolución | Técnico, Admin, Consultor |
| **Mantenimientos** | Preventivo/correctivo, calendarios | Técnico, Admin |
| **Mobiliario** | Inventario de muebles por espacio | Inventario, Admin |
| **Licencias** | Seguimiento de licencias de software | Admin |
| **Personas** | Base de datos de contactos (empleados, estudiantes) | Admin, Consultor |
| **Espacios** | Ubicaciones, departamentos, inventario por ubicación | Admin, Inventario |
| **Departamentos** | Organización jerárquica | Admin |
| **Auditoría** | Logs, cambios, accesos | Admin |
| **Reportes** | Consultas, exportación, visualización | Admin, Consultor, Público (restringido) |

---

## 2. Esquema de Base de Datos Completo

### Diagrama ER

```
┌─────────────────────────────────────────────────────────────────┐
│                      SAGAE Database Schema                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│    USUARIOS      │         │   DEPARTAMENTOS  │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ username         │         │ nombre           │
│ email            │         │ codigo           │
│ hash_password    │         │ descripcion      │
│ rol              │         │ activo           │
│ estado           │         │ fecha_creacion   │
│ fecha_creacion   │         └──────────────────┘
│ ultimo_login     │
│ secret_2fa       │         ┌──────────────────┐
│ permisos (JSON)  │         │    ESPACIOS      │
└──────────────────┘         ├──────────────────┤
         │                   │ id (PK)          │
         │                   │ nombre           │
         │                   │ codigo           │
    ┌────┴─────┐             │ departamento_id (FK)
    │           │             │ piso             │
    │           │             │ m2               │
    v           v             │ activo           │
┌─────────────┐ ┌──────────────────┐            └──────────────────┘
│   ACTIVOS   │ │     PERSONAS     │
├─────────────┤ ├──────────────────┤    ┌──────────────────┐
│ id (PK)     │ │ id (PK)          │    │  MOBILIARIO      │
│ codigo (UQ) │ │ nombre           │    ├──────────────────┤
│ nombre      │ │ tipo (emp/est)   │    │ id (PK)          │
│ categoria   │ │ cedula           │    │ codigo           │
│ serial      │ │ email            │    │ nombre           │
│ estado      │ │ telefono         │    │ categoria        │
│ ubicacion_id(FK)│ departamento_id(FK)  │ estado           │
│ departamento_id(FK)  │ fecha_creacion   │ espacio_id (FK)  │
│ responsable_id(FK)   │ activo           │ responsable_id(FK)
│ metadata(JSON)       └──────────────────┘ │ metadata(JSON)   │
│ fecha_creacion       │ fecha_creacion   │
│ fecha_actualizacion  └──────────────────┘
└─────────────┘
    │
    └──────────┬──────────────────────┐
               │                      │
    ┌──────────v──────────┐ ┌────────v──────────┐
    │  HISTORIAL_ACTIVOS  │ │     TICKETS      │
    ├─────────────────────┤ ├──────────────────┤
    │ id (PK)             │ │ id (PK)          │
    │ activo_id (FK)      │ │ codigo           │
    │ cambio (JSON)       │ │ titulo           │
    │ usuario_id (FK)     │ │ tipo             │
    │ fecha               │ │ prioridad        │
    │ razon               │ │ estado           │
    └─────────────────────┘ │ activo_id (FK)   │
                            │ reportado_por(FK)│
                            │ asignado_a (FK)  │
                            │ fotos (JSON)     │
                            │ fecha_creacion   │
                            │ fecha_resolucion │
                            └──────────────────┘
                                   │
                         ┌─────────┴──────────┐
                         │                    │
            ┌────────────v────────┐ ┌────────v──────────────┐
            │   MANTENIMIENTOS    │ │  SOLICITUD_PIEZAS    │
            ├─────────────────────┤ ├──────────────────────┤
            │ id (PK)             │ │ id (PK)              │
            │ ticket_id (FK)      │ │ ticket_id (FK)       │
            │ tipo (prev/corr)    │ │ pieza                │
            │ descripcion         │ │ cantidad             │
            │ tecnico_id (FK)     │ │ estado               │
            │ duracion            │ │ fecha_solicitud      │
            │ fecha_programada    │ │ fecha_entrega        │
            │ fecha_realizado     │ │ recibido_por (FK)    │
            │ costo               │ └──────────────────────┘
            └─────────────────────┘

┌──────────────────┐     ┌──────────────────┐
│   LICENCIAS      │     │   AUDITORIA      │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │
│ nombre           │     │ usuario_id (FK)  │
│ tipo             │     │ accion           │
│ version          │     │ tabla            │
│ licencia         │     │ registro_id      │
│ fecha_compra     │     │ cambios (JSON)   │
│ fecha_vencimiento│     │ ip               │
│ costo            │     │ user_agent       │
│ estado           │     │ timestamp        │
│ responsable_id(FK)      │ motivo           │
└──────────────────┘     └──────────────────┘
```

### Definición de Tablas

#### USUARIOS
```sql
CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  hash_password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'consultor', -- admin, tecnico, consultor, inventario
  estado VARCHAR(20) NOT NULL DEFAULT 'activo', -- activo, inactivo, bloqueado
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_login TIMESTAMP,
  secret_2fa VARCHAR(32),
  permisos JSONB DEFAULT '{}',
  deleted_at TIMESTAMP NULL, -- soft delete
  
  CONSTRAINT valid_rol CHECK (rol IN ('admin', 'tecnico', 'consultor', 'inventario')),
  CONSTRAINT valid_estado CHECK (estado IN ('activo', 'inactivo', 'bloqueado'))
);
```

#### DEPARTAMENTOS
```sql
CREATE TABLE departamentos (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
```

#### ESPACIOS
```sql
CREATE TABLE espacios (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  departamento_id BIGINT NOT NULL REFERENCES departamentos(id),
  piso INTEGER,
  m2 DECIMAL(8,2),
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
CREATE INDEX idx_espacios_departamento ON espacios(departamento_id);
```

#### PERSONAS
```sql
CREATE TABLE personas (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- empleado, estudiante, visitante
  cedula VARCHAR(20) UNIQUE,
  email VARCHAR(100),
  telefono VARCHAR(20),
  departamento_id BIGINT REFERENCES departamentos(id),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP NULL,
  
  CONSTRAINT valid_tipo CHECK (tipo IN ('empleado', 'estudiante', 'visitante'))
);
CREATE INDEX idx_personas_departamento ON personas(departamento_id);
```

#### ACTIVOS
```sql
CREATE TABLE activos (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL, -- equipos, mobiliario, infraestructura, etc.
  serial VARCHAR(100),
  estado VARCHAR(20) NOT NULL DEFAULT 'disponible', -- disponible, en-uso, mantenimiento, descartado
  ubicacion_id BIGINT REFERENCES espacios(id),
  departamento_id BIGINT REFERENCES departamentos(id),
  responsable_id BIGINT REFERENCES personas(id),
  metadata JSONB DEFAULT '{}', -- especificaciones adicionales
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  CONSTRAINT valid_estado CHECK (estado IN ('disponible', 'en-uso', 'mantenimiento', 'descartado'))
);
CREATE INDEX idx_activos_ubicacion ON activos(ubicacion_id);
CREATE INDEX idx_activos_departamento ON activos(departamento_id);
CREATE INDEX idx_activos_responsable ON activos(responsable_id);
```

#### HISTORIAL_ACTIVOS
```sql
CREATE TABLE historial_activos (
  id BIGSERIAL PRIMARY KEY,
  activo_id BIGINT NOT NULL REFERENCES activos(id),
  cambio JSONB NOT NULL, -- { campo: 'estado', antes: 'disponible', ahora: 'mantenimiento' }
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  razon TEXT
);
CREATE INDEX idx_historial_activos ON historial_activos(activo_id, fecha DESC);
```

#### TICKETS
```sql
CREATE TABLE tickets (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(30) NOT NULL, -- fallo, solicitud, mantenimiento, perdida
  prioridad VARCHAR(20) NOT NULL DEFAULT 'media', -- baja, media, alta, urgente
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto', -- abierto, en-progreso, resuelto, cerrado
  activo_id BIGINT REFERENCES activos(id),
  reportado_por BIGINT NOT NULL REFERENCES usuarios(id),
  asignado_a BIGINT REFERENCES usuarios(id),
  fotos JSONB DEFAULT '{}', -- array de URLs de Google Drive
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  CONSTRAINT valid_tipo CHECK (tipo IN ('fallo', 'solicitud', 'mantenimiento', 'perdida')),
  CONSTRAINT valid_prioridad CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  CONSTRAINT valid_estado CHECK (estado IN ('abierto', 'en-progreso', 'resuelto', 'cerrado'))
);
CREATE INDEX idx_tickets_activo ON tickets(activo_id);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_asignado ON tickets(asignado_a);
```

#### SOLICITUD_PIEZAS
```sql
CREATE TABLE solicitud_piezas (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id),
  pieza VARCHAR(100) NOT NULL,
  cantidad INTEGER NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- pendiente, aprobado, entregado, cancelado
  fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_entrega TIMESTAMP,
  recibido_por BIGINT REFERENCES usuarios(id),
  
  CONSTRAINT valid_estado CHECK (estado IN ('pendiente', 'aprobado', 'entregado', 'cancelado'))
);
CREATE INDEX idx_solicitud_piezas_ticket ON solicitud_piezas(ticket_id);
```

#### MANTENIMIENTOS
```sql
CREATE TABLE mantenimientos (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES tickets(id),
  tipo VARCHAR(20) NOT NULL, -- preventivo, correctivo
  descripcion TEXT NOT NULL,
  tecnico_id BIGINT NOT NULL REFERENCES usuarios(id),
  duracion_minutos INTEGER,
  fecha_programada TIMESTAMP,
  fecha_realizado TIMESTAMP,
  costo DECIMAL(10,2),
  notas TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_tipo CHECK (tipo IN ('preventivo', 'correctivo'))
);
CREATE INDEX idx_mantenimientos_ticket ON mantenimientos(ticket_id);
CREATE INDEX idx_mantenimientos_tecnico ON mantenimientos(tecnico_id);
```

#### MOBILIARIO
```sql
CREATE TABLE mobiliario (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
  espacio_id BIGINT REFERENCES espacios(id),
  responsable_id BIGINT REFERENCES personas(id),
  metadata JSONB DEFAULT '{}',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
```

#### LICENCIAS
```sql
CREATE TABLE licencias (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  version VARCHAR(20),
  numero_licencia VARCHAR(100) UNIQUE,
  fecha_compra DATE,
  fecha_vencimiento DATE,
  costo DECIMAL(10,2),
  estado VARCHAR(20) NOT NULL DEFAULT 'activa',
  responsable_id BIGINT REFERENCES personas(id),
  metadata JSONB DEFAULT '{}',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
```

#### AUDITORIA
```sql
CREATE TABLE auditoria (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
  accion VARCHAR(50) NOT NULL, -- create, read, update, delete
  tabla VARCHAR(50) NOT NULL,
  registro_id BIGINT NOT NULL,
  cambios JSONB DEFAULT '{}',
  ip VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  motivo TEXT,
  
  INDEX idx_auditoria_usuario (usuario_id),
  INDEX idx_auditoria_tabla (tabla),
  INDEX idx_auditoria_timestamp (timestamp DESC)
);
```

---

## 3. Arquitectura en Capas (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  (Vue 3 + Pinia, PWA, API REST routes, WebSocket handlers)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────v──────────────────────────────────────┐
│                  APPLICATION LAYER                               │
│  (Use Cases, Services, DTOs, Request/Response mapping)          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────v──────────────────────────────────────┐
│                     DOMAIN LAYER                                  │
│  (Entities, Business Logic, Value Objects, Domain Rules)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────v──────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                              │
│  (Database, External APIs, File Storage, Authentication)        │
└─────────────────────────────────────────────────────────────────┘
```

**Responsabilidades por capa:**

- **Presentation**: Controllers, routes, state management, UI components
- **Application**: Orquestación de lógica, transformación de datos, validación de entrada
- **Domain**: Reglas de negocio puras, sin dependencias de frameworks
- **Infrastructure**: Implementación de repositorios, integraciones externas, persistencia

---

## 4. Estructura de Módulos (11 módulos independientes)

Cada módulo sigue este patrón de carpetas:

```
modules/
├── {modulo}/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── {Entity}.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── {Entity}Repository.interface.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── {DomainService}.ts
│   │   │   └── index.ts
│   │   ├── value-objects/
│   │   │   ├── {ValueObject}.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── Create{Entity}UseCase.ts
│   │   │   ├── Update{Entity}UseCase.ts
│   │   │   ├── Delete{Entity}UseCase.ts
│   │   │   ├── Get{Entity}UseCase.ts
│   │   │   └── index.ts
│   │   ├── dtos/
│   │   │   ├── Create{Entity}Dto.ts
│   │   │   ├── Update{Entity}Dto.ts
│   │   │   ├── {Entity}ResponseDto.ts
│   │   │   └── index.ts
│   │   ├── mappers/
│   │   │   ├── {Entity}Mapper.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── {Entity}ApplicationService.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── repositories/
│   │   │   │   ├── {Entity}Repository.ts
│   │   │   │   └── index.ts
│   │   │   ├── entities/
│   │   │   │   ├── {Entity}Entity.ts (TypeORM/Prisma entity)
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── external/
│   │   │   └── {ExternalService}.ts
│   │   └── index.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── {Entity}Controller.ts
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── {entity}.routes.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts (public API)
```

### 11 Módulos Detallados

#### 1. **auth-module**
Responsabilidades: Login, 2FA, JWT, RBAC, sesiones

```typescript
// public API
export { AuthService } from './application';
export { CreateSessionUseCase, ValidateTokenUseCase } from './application/use-cases';
export { AuthController } from './presentation';
export { Usuario } from './domain/entities';
```

Dependencias: ninguno (core)
Estados: token_jwt, refresh_token, usuario_autenticado, roles, permisos

#### 2. **usuarios-module**
Responsabilidades: Gestión de usuarios, CRUD, permisos

```typescript
export { UsuarioService } from './application';
export { CreateUsuarioUseCase, UpdateUsuarioUseCase } from './application/use-cases';
export { UsuarioController } from './presentation';
export { Usuario } from './domain/entities';
```

Dependencias: auth-module
Relaciones DB: usuarios (N a N con permisos)

#### 3. **activos-module**
Responsabilidades: Registro, seguimiento, historial, estado de activos

```typescript
export { ActivoService } from './application';
export { CreateActivoUseCase, ChangeActivoStateUseCase } from './application/use-cases';
export { ActivoController } from './presentation';
export { Activo, HistorialActivo } from './domain/entities';
```

Dependencias: auth-module, espacios-module, personas-module
Relaciones DB: activos (1:N con historial), espacios (N:1), personas (N:1)

#### 4. **tickets-module**
Responsabilidades: Reportes de fallos, solicitudes, resolución

```typescript
export { TicketService } from './application';
export { CreateTicketUseCase, ResolveTicketUseCase } from './application/use-cases';
export { TicketController } from './presentation';
export { Ticket } from './domain/entities';
```

Dependencias: auth-module, activos-module, usuarios-module
Relaciones DB: tickets (1:N con solicitud_piezas), activos (N:1)

#### 5. **solicitud-piezas-module**
Responsabilidades: Solicitud y seguimiento de piezas de reemplazo

```typescript
export { SolicitudPiezasService } from './application';
export { CreateSolicitudUseCase, UpdateSolicitudStateUseCase } from './application/use-cases';
export { SolicitudPiezasController } from './presentation';
export { SolicitudPiezas } from './domain/entities';
```

Dependencias: tickets-module, usuarios-module
Relaciones DB: solicitud_piezas (N:1 con tickets)

#### 6. **mantenimientos-module**
Responsabilidades: Mantenimiento preventivo y correctivo

```typescript
export { MantenimientoService } from './application';
export { CreateMantenimientoUseCase, CompleteMantenimientoUseCase } from './application/use-cases';
export { MantenimientoController } from './presentation';
export { Mantenimiento } from './domain/entities';
```

Dependencias: tickets-module, usuarios-module, activos-module
Relaciones DB: mantenimientos (N:1 con tickets)

#### 7. **mobiliario-module**
Responsabilidades: Inventario de muebles, asignación por espacios

```typescript
export { MobiliarioService } from './application';
export { CreateMobiliarioUseCase, UpdateMobiliarioLocationUseCase } from './application/use-cases';
export { MobiliarioController } from './presentation';
export { Mobiliario } from './domain/entities';
```

Dependencias: espacios-module, personas-module
Relaciones DB: mobiliario (N:1 con espacios)

#### 8. **espacios-module**
Responsabilidades: Ubicaciones, aulas, departamentos

```typescript
export { EspacioService } from './application';
export { CreateEspacioUseCase, UpdateEspacioUseCase } from './application/use-cases';
export { EspacioController } from './presentation';
export { Espacio } from './domain/entities';
```

Dependencias: departamentos-module
Relaciones DB: espacios (N:1 con departamentos)

#### 9. **departamentos-module**
Responsabilidades: Organización jerárquica, estructura

```typescript
export { DepartamentoService } from './application';
export { CreateDepartamentoUseCase, UpdateDepartamentoUseCase } from './application/use-cases';
export { DepartamentoController } from './presentation';
export { Departamento } from './domain/entities';
```

Dependencias: ninguno
Relaciones DB: departamentos (root)

#### 10. **personas-module**
Responsabilidades: Base de datos de contactos (empleados, estudiantes)

```typescript
export { PersonaService } from './application';
export { CreatePersonaUseCase, UpdatePersonaUseCase } from './application/use-cases';
export { PersonaController } from './presentation';
export { Persona } from './domain/entities';
```

Dependencias: departamentos-module
Relaciones DB: personas (N:1 con departamentos)

#### 11. **licencias-module**
Responsabilidades: Seguimiento de licencias de software

```typescript
export { LicenciaService } from './application';
export { CreateLicenciaUseCase, UpdateLicenciaStateUseCase } from './application/use-cases';
export { LicenciaController } from './presentation';
export { Licencia } from './domain/entities';
```

Dependencias: personas-module
Relaciones DB: licencias (N:1 con personas)

#### 12. **auditoria-module**
Responsabilidades: Logs, auditoría, trazabilidad

```typescript
export { AuditoriaService } from './application';
export { LogActionUseCase, GetAuditHistoryUseCase } from './application/use-cases';
export { AuditoriaController } from './presentation';
export { AuditoriaLog } from './domain/entities';
```

Dependencias: auth-module
Relaciones DB: auditoria (todos los cambios)

#### 13. **reportes-module** (portal público)
Responsabilidades: Consultas, exportación, visualización pública

```typescript
export { ReportesService } from './application';
export { GetReportUseCase, ExportReportUseCase } from './application/use-cases';
export { ReportesController } from './presentation';
```

Dependencias: activos-module, tickets-module, espacios-module
Relaciones: lectura desde todas las tablas, sin escritura

---

## 5. Matriz de Dependencias (Dirigida Acíclica)

```
Nivel 0 (Sin dependencias):
  ✓ departamentos-module
  ✓ auth-module

Nivel 1 (Depende de Nivel 0):
  ✓ personas-module → departamentos-module
  ✓ espacios-module → departamentos-module
  ✓ usuarios-module → auth-module

Nivel 2 (Depende de Nivel 0-1):
  ✓ activos-module → personas-module, espacios-module, auth-module
  ✓ mobiliario-module → espacios-module, personas-module
  ✓ licencias-module → personas-module

Nivel 3 (Depende de Nivel 0-2):
  ✓ tickets-module → activos-module, usuarios-module, auth-module
  ✓ mantenimientos-module → tickets-module, usuarios-module

Nivel 4 (Depende de Nivel 0-3):
  ✓ solicitud-piezas-module → tickets-module, usuarios-module

Nivel 5 (Cross-cutting):
  ✓ auditoria-module → auth-module (escucha todos los cambios)
  ✓ reportes-module → todas las demás (solo lectura)
```

**Garantía:** Sin dependencias circulares. Cada módulo conoce sus dependencias explícitamente.

---

## 6. Stack Tecnológico

### Backend

| Componente | Tecnología | Justificación |
|-----------|-----------|--|
| **Runtime** | Node.js 20 LTS | Soporte a largo plazo, V8 engine optimizado |
| **Lenguaje** | TypeScript 5.x | Type safety, refactoring seguro, IDE support excelente |
| **Framework Web** | NestJS 10.x | Arquitectura modular nativa, DI container, decorators |
| **Base de Datos** | PostgreSQL 15+ | ACID, JSONB, índices avanzados, escalable |
| **ORM** | Prisma 5.x | Type-safe query builder, migrations automáticas, performance |
| **Autenticación** | JWT + bcrypt | Stateless, estándar de industria, 2FA via TOTP |
| **Testing** | Jest 29.x | Coverage reporting, snapshot testing, parallelizable |
| **Linting** | ESLint + Prettier | Estilo consistente, rule-based, auto-fix |
| **Logging** | Winston | Structured logging, múltiples transports, rotation |
| **Validación** | class-validator | Decorators, pipeline validation, custom rules |

### Frontend

| Componente | Tecnología | Justificación |
|-----------|-----------|--|
| **Framework** | Vue 3 | Reactivity system, composition API, learning curve |
| **State Mgmt** | Pinia | Vue-native, composable stores, devtools integration |
| **Styling** | Tailwind CSS | Utility-first, bundle size pequeño, consistent design |
| **HTTP Client** | Axios/Fetch API | Promise-based, interceptors, error handling |
| **Testing** | Vitest + Playwright | Fast unit tests, E2E testing, DOM automation |
| **Build Tool** | Vite | Dev server rápido, ESM nativo, code splitting |
| **PWA** | Service Worker | Offline support, background sync, install prompt |

### DevOps

| Componente | Tecnología | Justificación |
|-----------|-----------|--|
| **Containerización** | Docker | Reproducibilidad, CI/CD integration, scaling |
| **CI/CD** | GitHub Actions | Nativo a GitHub, workflow YAML, secrets management |
| **Monitoreo** | Prometheus + Grafana | Open-source, alerting, visualization |
| **Logging Centralizado** | ELK Stack | Elasticsearch, Logstash, Kibana, full-text search |

---

## 7. Timeline de Implementación (18 semanas)

### Phase 0: Infraestructura (Semana 1) — 1 dev + 1 lead

- [ ] Configurar monorepo (packages/backend, packages/frontend)
- [ ] TypeScript config, tsconfig.json, eslint, prettier
- [ ] Docker setup (Dockerfile, docker-compose.yml para dev/prod)
- [ ] PostgreSQL en Docker, inicial database setup
- [ ] NestJS boilerplate, estructura base
- [ ] Prisma schema inicial, primera migración
- [ ] IoC container setup (NestJS modules)
- [ ] Jest configuration, test structure
- [ ] GitHub Actions workflows básicos (lint, test)
- [ ] Documentación de dev setup

**Entregable:** Repositorio limpio, CI/CD pipeline funcionando, dev environment listo

### Phase 1: Autenticación + Core (Semanas 2-3) — 1 dev + 1 lead

- [ ] Auth module completo (JWT + 2FA)
- [ ] USUARIO entity, migrations, repository
- [ ] Login/logout use cases
- [ ] Password hashing, token generation
- [ ] RBAC guards (admin, técnico, consultor, inventario)
- [ ] Audit logging middleware
- [ ] Error handling global
- [ ] Validación de permisos a nivel de ruta
- [ ] Tests: 80% coverage en auth module

**Entregable:** Auth module con tests, M1 milestone (Infrastructure ready)

### Phase 2: Módulos Base (Semanas 4-9) — 4 devs en paralelo

**Semana 4-5: Módulos raíz (lead supervisa)**
- Departamentos module (CRUD completo, tests)
- Espacios module (CRUD, validaciones, índices DB)
- Personas module (CRUD, tipos, departamento FK)

**Semana 6: Módulos dependientes (2 devs)**
- Activos module (CRUD, estado machine, historial automático)
- Mobiliario module (CRUD, ubicación, responsable FK)
- Licencias module (CRUD, fecha vencimiento, alertas)

**Semana 7: Módulos de operación (2 devs)**
- Tickets module (CRUD, asignación, estado machine)
- Mantenimientos module (preventivo/correctivo, calendarios)
- Solicitud piezas module (CRUD, workflow de aprobación)

**Semana 8: Módulos transversales**
- Reportes module (queries complejas, exportación)
- Validadores compartidos, error handlers

**Semana 9: Integración y validación**
- Tests de integración entre módulos
- M3 milestone (Main modules complete)

### Phase 3: Frontend (Semanas 10-13) — 1-2 devs frontend

- [ ] Vue 3 + Pinia setup, estructura de componentes
- [ ] Store modules por cada feature (usuarios, activos, tickets, etc.)
- [ ] Componentes UI reutilizables (forms, modals, tables)
- [ ] Integración con API backend (HTTP clients)
- [ ] Manejo de errores y estados de loading
- [ ] Rutas y navegación (vue-router)
- [ ] Autenticación en frontend (token storage, refresh)
- [ ] Responsive design (desktop + mobile)
- [ ] Accesibilidad (WCAG 2.1 AA)

**Entregable:** Frontend funcional, conectado al backend, M4 milestone

### Phase 4: Testing Integral (Semanas 14-16) — 2 devs QA + 1 dev

- [ ] Unit tests: 80%+ coverage backend
- [ ] Integration tests: entre módulos, happy path + edge cases
- [ ] E2E tests: Playwright, flujos completos
- [ ] Performance testing: queries lentas, N+1 problems
- [ ] Security testing: SQL injection, XSS, CSRF, broken auth
- [ ] Load testing: stress test con 1000+ usuarios
- [ ] M5 milestone (Testing complete)

### Phase 5: Deployment + Optimización (Semanas 17-18) — 1-2 devs

- [ ] Database migrations en producción
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Prometheus + Grafana setup
- [ ] ELK stack para logging centralizado
- [ ] Security hardening (HTTPS, CORS, rate limiting)
- [ ] Backup strategy (PostgreSQL WAL archiving)
- [ ] Disaster recovery plan
- [ ] SRE runbook
- [ ] M6 milestone (Production ready)
- [ ] Deployment a staging y producción

---

## 8. Hitos Clave

| Hito | Semana | Criterio de Aceptación |
|------|--------|------------------------|
| **M1: Infraestructura lista** | 1 | CI/CD verde, DB funcional, dev env documentado |
| **M2: Auth funcional** | 3 | Login, 2FA, JWT, RBAC, tests 80% |
| **M3: Módulos base completos** | 9 | Todos 11 módulos con CRUD, tests, sin dependencias circulares |
| **M4: Frontend integrado** | 13 | Vue 3 conectado, todas las pantallas funcionales |
| **M5: Testing completo** | 16 | Coverage 80%+, E2E tests, performance OK |
| **M6: Listo para producción** | 18 | Desplegado, monitoreo, backup, docs completa |

---

## 9. Evaluación de Riesgos y Mitigación

### Riesgo 1: Complejidad de la migración de datos
**Probabilidad:** Alta | **Impacto:** Alto

**Descripción:** Los datos existentes en Google Sheets están sin estructura clara, con duplicados, inconsistencias.

**Mitigación:**
- Semana 1: Crear herramienta de limpieza de datos (scripts Node.js)
- Semana 2: Validar datos antes de migración
- Semana 3: Migración gradual (staging primero, backups, rollback plan)

### Riesgo 2: Performance de las queries
**Probabilidad:** Media | **Impacto:** Alto

**Descripción:** Con 10K+ activos, queries sin índices será lento.

**Mitigación:**
- Usar Prisma query profiling desde semana 6
- Crear índices estratégicos en FK y búsquedas comunes
- Semana 14: Load testing, identificar N+1 problems
- Implementar caching (Redis si es necesario)

### Riesgo 3: Cambio de scope mid-project
**Probabilidad:** Media | **Impacto:** Alto

**Descripción:** El cliente pide nuevas features durante el desarrollo.

**Mitigación:**
- Definir scope explícitamente en kickoff (documento de requisitos firmado)
- Sprint de 2 semanas, review con cliente cada 2 semanas
- Cambios nuevos → siguiente sprint, no interrumpir actual
- Reservar 1 dev week para cambios imprevistos en Phase 4

### Riesgo 4: Disponibilidad de la escuela para testing
**Probabilidad:** Media | **Impacto:** Medio

**Descripción:** Testing en producción requiere acceso a usuarios reales.

**Mitigación:**
- UAT environment separado (staging exacto a producción)
- Testing en horarios no lectivos (tardes, weekends)
- Manuales de testing preparados, usuarios capacitados en UAT fase

### Riesgo 5: Deuda técnica en código legacy
**Probabilidad:** Alta | **Impacto:** Medio

**Descripción:** El código actual tiene patrones difíciles de replicar.

**Mitigación:**
- Usar el nuevo código como referencia, no copiar legacy
- Code reviews diarios en Phase 2-3
- Refactoring planning para Phase 5 (post-MVP)

### Riesgo 6: Integración con Google Drive/Sheets
**Probabilidad:** Media | **Impacto:** Medio

**Descripción:** APIs de Google pueden cambiar, límites de rate limiting.

**Mitigación:**
- Abstracción via Repository pattern (fácil cambiar proveedor)
- SDK de Google con manejo de reintentos
- Semana 2: Proof-of-concept con Google APIs

### Riesgo 7: Seguridad de datos escolares
**Probabilidad:** Media | **Impacto:** Crítico

**Descripción:** Datos personales de menores, GDPR/LGPD compliance.

**Mitigación:**
- Encryption at rest (PostgreSQL con pgcrypto)
- TLS 1.3+ en tránsito
- RBAC granular, audit logging completo
- Semana 3: Auditoría de seguridad externa (opcional)
- Data retention policy, soft deletes

---

## 10. Métricas de Éxito

### Técnicas
- ✅ **Test Coverage:** 80%+ backend, 70%+ frontend
- ✅ **Build Time:** < 2 minutos en CI
- ✅ **Deploy Time:** < 10 minutos end-to-end
- ✅ **API Response Time:** < 200ms P95
- ✅ **Uptime:** 99.5%+ en staging
- ✅ **Database Query Time:** < 100ms P95
- ✅ **Frontend Bundle Size:** < 500KB gzipped

### Funcionales
- ✅ Todos los 11 módulos funcionales
- ✅ Migración de datos de Google Sheets sin pérdida
- ✅ RBAC completo (5 roles, N permisos)
- ✅ Auditoría de cambios 100% trazable
- ✅ PWA funcional (offline mode, install)
- ✅ Reportes exportables (PDF, Excel, CSV)

### Negociales
- ✅ 0 down-time en transición
- ✅ Menos de 5 bugs críticos post-launch
- ✅ Team adopción en 2 semanas (training)
- ✅ Satisfacción del usuario ≥ 4.5/5

---

## 11. Estructura de Equipo

### Equipo Recomendado (4-5 personas)

| Rol | Dedicación | Responsabilidades |
|-----|-----------|------------------|
| **Tech Lead** | 100% | Arquitectura, decisiones técnicas, code review, mentoring |
| **Backend Dev 1** | 100% | Auth, usuarios, módulos base (departamentos, espacios) |
| **Backend Dev 2** | 100% | Activos, tickets, mantenimientos (Phase 2) |
| **Backend Dev 3** | 100% | Mobiliario, licencias, reportes (Phase 2) |
| **Frontend Dev** | 100% | Vue 3, Pinia, integración API, PWA |
| **QA/DevOps** | 100% | Testing, CI/CD, infraestructura, monitoring |

### Alternativa: Equipo Reducido (3-4 personas)

Si solo 3 devs disponibles:
- Tech Lead: Backend + DevOps
- Backend Dev 1 & 2: Paralelo en Phase 0-1, luego serial en Phase 2
- Frontend Dev: Comienza en Semana 8 (después que APIs ready)
- **Timeline se extiende a 22-24 semanas**

---

## 12. Próximos Pasos Antes de Código

1. ✅ **Revisión de este plan** por stakeholders
2. ✅ **Confirmación de stack tecnológico** (¿PostgreSQL es OK? ¿NestJS?)
3. ✅ **Asignación de equipo** (¿quién implementa?)
4. ✅ **Extracción de datos** de Google Sheets → CSV limpio
5. ✅ **Auditoría de seguridad** (opcional pero recomendado)
6. ✅ **Kickoff con el cliente** (requisitos finales, UAT plan)
7. ✅ **Setup inicial** (repositorio, ambiente local)

**Una vez aprobado, se comienza con Phase 0.**

---

## Resumen Ejecutivo

**SAGAE REFACTORIZADO** será:
- ✅ Modular: 11 módulos independientes, sin dependencias circulares
- ✅ Escalable: Arquitectura en capas, base de datos ACID
- ✅ Mantenible: TypeScript, tests 80%+, código autodocumentado
- ✅ Seguro: RBAC, auditoría completa, encryption at rest
- ✅ Medible: Prometheus, Grafana, SLOs definidos
- ✅ Productivo: 18 semanas, equipo de 4-5 personas

**Viabilidad:** 100% — No hay barreras técnicas. El plan es ejecutable.
