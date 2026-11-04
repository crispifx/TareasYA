# TareasYA

Organizador de tareas y estudio para estudiantes secundarios y terciarios.
Centraliza tareas, trabajos prácticos y fechas de entrega por materia, prioridad y fecha límite.

**Autor:** Santino Crespo · 6.° 2.ª · E.T. N.° 35 "Ing. Eduardo Latzina"

## Funcionalidades

- Crear, editar y eliminar tareas (con confirmación al eliminar).
- Estados (pendiente, en curso, completada), prioridad, materia y favoritas.
- Búsqueda por título o materia, filtros y orden (fecha, prioridad, recientes).
- Resumen de tareas y destaque de vencidas; aviso de las que vencen en 48 h y notificaciones del navegador (con tu permiso).
- **Modo local:** si el servidor no está en marcha, la app funciona igual guardando en el navegador.
- Diseño responsive con modo oscuro automático.

## Estructura

```
TareasYA/
├── backend/    API REST (Node + Express), arquitectura en capas
├── frontend/   App React + Vite, con lógica pura testeada
└── docs/       SPEC, bitácora y entregas de los TP
```

## Cómo ejecutarlo

```bash
# Terminal 1: backend (http://localhost:3001)
cd backend
npm install
npm start

# Terminal 2: frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

## Pruebas

```bash
cd backend  && npm test    # 14 tests (node:test)
cd frontend && npm test    # 22 tests (Vitest)
cd frontend && npm run build
```

## API

Base: `/api`. Errores: `{ "error": "mensaje" }`.

| Método | Ruta | Descripción | Respuestas |
|--------|------|-------------|------------|
| GET | `/salud` | Disponibilidad | 200 |
| GET | `/tareas` | Lista. Query: `q`, `materia`, `estado`, `prioridad`, `favorito=true`, `orden=fecha\|prioridad\|creacion` | 200 |
| POST | `/tareas` | Crea una tarea | 201, 400, 409 |
| GET | `/tareas/:id` | Obtiene una tarea | 200, 404 |
| PATCH | `/tareas/:id` | Edita campos | 200, 400, 404, 409 |
| DELETE | `/tareas/:id` | Elimina una tarea | 204, 404 |

```bash
curl -X POST http://localhost:3001/api/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"TP de Física","materia":"Física","fechaLimite":"2026-12-01T20:00","prioridad":"alta"}'
```

Los datos se guardan en `backend/data/tareas.json` (se crea solo; está ignorado por git). Variable opcional: `TAREASYA_DB` para usar otro archivo.

## Documentación

- [`docs/SPEC-TareasYA.pdf`](docs/SPEC-TareasYA.pdf): SPEC y plan técnico del sistema.
- [`docs/BITACORA-TareasYA.pdf`](docs/BITACORA-TareasYA.pdf) (y [`.md`](docs/BITACORA.md)): historial de versiones.
- `docs/entregas/`: entregas de cada TP.

## Limitaciones conocidas

- La interfaz no se probó manualmente en un navegador; solo hay tests de lógica y de API.
- Sin autenticación: pensado para uso personal.
- Persistencia en JSON: adecuada para pocas tareas; ver el SPEC para el plan de migración.
