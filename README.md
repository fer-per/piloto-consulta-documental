# SIARC-ARA — Sistema de Información del Archivo Regional de Arequipa

Sistema web para la consulta y gestión del patrimonio documental custodiado por el
Archivo Regional de Arequipa. Implementa el diseño descrito en `tesis.tex`: catálogo
descriptivo (ISAD-G), búsqueda de texto completo, visor de documentos digitalizados y
auditoría de las operaciones, con tres perfiles de acceso y control de intentos fallidos.

## Arquitectura

Monorepositorio con dos aplicaciones y una base de datos PostgreSQL:

```
tesisrevisinon/
├─ backend/          API REST (Node.js + Express, ESM)
├─ frontend/         Interfaz web (React 19 + Vite + Bootstrap 5)
├─ database/         schema.sql y seed.sql (esquema e índices)
├─ storage/          Repositorio digital (PDF/A, TIFF y miniaturas)
├─ postgres-portable/ Servidor PostgreSQL portátil (solo desarrollo local)
└─ tesis.tex         Documento de tesis (fuente de requisitos)
```

### Backend (`backend/`)

- **Stack**: Node.js ≥ 20, Express 4, PostgreSQL (`pg`), JWT (`jsonwebtoken`),
  hash de contraseñas con `bcryptjs`, validación con `zod` y cabeceras con `helmet`.
- **Módulos**: `auth` (login/logout, bloqueo por intentos), `documentos` (búsqueda
  simple y avanzada, detalle, edición), `catalogos` (fondos, series, tipologías) y
  `auditoria`.
- **Búsqueda de texto completo**: usa `tsvector`, `unaccent` y `pg_trgm` para admitir
  búsquedas insensibles a mayúsculas y acentos (p. ej. "escritura" encuentra "ESCRITURA").
- **Seguridad**: JWT con expiración, tres perfiles (`ADMINISTRADOR`, `ARCHIVISTA`,
  `USUARIO_EXTERNO`) y bloqueo temporal de la cuenta tras 5 intentos fallidos (HU-17).
- **Auditoría**: registra en `registro_auditoria` los inicios de sesión, búsquedas,
  consultas de detalle, visualizaciones y ediciones, con IP y user-agent.

### Frontend (`frontend/`)

- **Stack**: React 19, React Router 7, Vite 8 y Bootstrap 5.3.
- **Vistas**: login, panel, consulta (búsqueda simple/avanzada con panel de filtros),
  detalle del documento y estadísticas.
- **Visor de documentos**: PDF en `iframe` y TIFF decodificado en cliente con `utif2`
  y dibujado en `canvas` (soporte multipágina); las miniaturas se solicitan
  autenticadas como blob.

## Requisitos

- Node.js ≥ 20
- PostgreSQL ≥ 14 (se incluye un servidor portátil para desarrollo local)
- PowerShell (Windows) o cualquier shell POSIX

## Puesta en marcha

### 1. Base de datos

Se puede usar el PostgreSQL portátil incluido (`postgres-portable/`) o una instalación
propia. Cree la base de datos y ajuste `backend/.env` a partir de `backend/.env.example`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=siarc_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña_local
```

### 2. Backend

```powershell
cd backend
npm install
npm run db:reset    # crea el esquema (schema.sql + seed.sql) y siembra los datos
npm start           # API en http://localhost:4000
```

Scripts disponibles:

- `npm run db:reset` — recrea el esquema y carga los datos de ejemplo.
- `npm run db:schema` — solo crea el esquema.
- `npm run db:seed` — solo carga los datos de ejemplo.
- `npm run dev` — arranque con recarga automática (`node --watch`).

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev         # http://localhost:5173
npm run build       # compila a frontend/dist
npm run preview     # sirve la compilación de producción
```

> En Windows, si la política de ejecución bloquea `npm.ps1`, use `npm.cmd`.

## Credenciales de demostración

Cargadas por `database/seed.sql`:

| Usuario    | Contraseña     | Perfil          |
|------------|----------------|-----------------|
| `anaquispe`| `Admin123!`    | ADMINISTRADOR   |
| `lmamani`  | `Archivo123!`  | ARCHIVISTA      |
| `cflores`  | `Consulta123!` | USUARIO_EXTERNO |

## Endpoints principales

| Método | Ruta                              | Descripción                            |
|--------|-----------------------------------|----------------------------------------|
| GET    | `/api/salud`                      | Estado del servicio                    |
| POST   | `/api/auth/login`                 | Inicio de sesión (devuelve JWT)        |
| POST   | `/api/auth/logout`                | Cierre de sesión (auditado)            |
| GET    | `/api/documentos/busqueda/simple` | Búsqueda de texto completo             |
| GET    | `/api/documentos/busqueda/avanzada` | Búsqueda con filtros combinados      |
| GET    | `/api/documentos/:id`             | Detalle descriptivo (ISAD-G)           |
| PUT    | `/api/documentos/:id`             | Edición de la descripción (auditada)   |
| GET    | `/api/documentos/:id/miniatura`   | Miniatura (autenticada)                |
| GET    | `/api/documentos/:id/archivo`     | Documento digitalizado (PDF/A o TIFF)  |
| GET    | `/api/catalogos/fondos`           | Catálogo de fondos                     |
| GET    | `/api/catalogos/series`           | Catálogo de series                     |
| GET    | `/api/catalogos/tipologias`       | Catálogo de tipologías documentales    |
| GET    | `/api/auditoria`                  | Registro de auditoría (solo ADMIN)     |

## Seguridad y privacidad

- Las contraseñas se almacenan con hash `bcrypt`; nunca en texto plano.
- El token JWT se envía en la cabecera `Authorization: Bearer <token>`.
- El acceso a documentos queda sujeto al perfil: la edición está reservada a
  `ADMINISTRADOR` y `ARCHIVISTA`.
- Toda operación sensible queda registrada en `registro_auditoria` para trazabilidad.

## Licencia

Proyecto académico desarrollado como parte de la tesis del Archivo Regional de Arequipa.
