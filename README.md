# TareasYA

Organizador de tareas y estudio para estudiantes secundarios y terciarios.
Centraliza tareas, trabajos prácticos y fechas de entrega por materia, prioridad y fecha límite.

**Autor:** Santino Crespo · 6.° 2.ª · E.T. N.° 35 "Ing. Eduardo Latzina"

## Estructura

```
TareasYA/
├── backend/    API REST (Node + Express), arquitectura en capas
├── frontend/   Formulario React + lógica pura con tests (Vitest)
└── docs/       Entregas de los TP y versión previa al refactor
```

## Backend

```bash
cd backend
npm install
npm start          # http://localhost:3001
```

| Método | Ruta          | Descripción |
|--------|---------------|-------------|
| GET    | `/api/tareas` | Lista todas las tareas |
| POST   | `/api/tareas` | Crea una tarea (400 si es inválida, 409 si ya existe una activa con el mismo título y materia) |

```bash
curl -X POST http://localhost:3001/api/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"TP de Física","materia":"Física","fechaLimite":"2026-12-01T20:00","prioridad":"alta"}'
```

Capas: `routes → controllers → services → repositories` (+ `logic/` con reglas puras).
Los datos se guardan en `backend/data/tareas.json` (se crea automáticamente).

## Frontend

```bash
cd frontend
npm install
npm test           # tests unitarios de la lógica de tareas
```

> Incluye `TaskForm`, la lógica de validación/creación y la persistencia local.
> Faltan `index.html`, `main.jsx`, `App` y la lista de tareas para tener la app completa.

## Documentación

Las entregas de cada TP están en `docs/entregas/`. El historial del proyecto está en [`docs/BITACORA.md`](docs/BITACORA.md).

## Pendiente

- Editar, eliminar y marcar tareas (PUT/PATCH/DELETE).
- Búsqueda, filtros y orden por fecha límite.
- Conectar el frontend con la API.
- Tests del backend.
