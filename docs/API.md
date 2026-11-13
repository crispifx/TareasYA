# Referencia de la API

Base: `http://localhost:3001/api` · Formato: JSON · Sin autenticación (uso personal).
Los errores siempre tienen la forma `{ "error": "mensaje" }`.

## Resumen de endpoints

| Método | Ruta | Descripción | Éxito | Errores |
|--------|------|-------------|-------|---------|
| GET | `/salud` | Comprueba que el servidor responde | 200 | |
| GET | `/tareas` | Lista tareas con filtros y orden | 200 | |
| POST | `/tareas` | Crea una tarea | 201 | 400, 409 |
| GET | `/tareas/resumen` | Contadores por estado, vencidas y por vencer | 200 | |
| GET | `/tareas/proximas` | Tareas activas que vencen pronto | 200 | 400 |
| GET | `/tareas/:id` | Obtiene una tarea | 200 | 404 |
| PATCH | `/tareas/:id` | Edita campos de una tarea | 200 | 400, 404, 409 |
| DELETE | `/tareas/:id` | Elimina una tarea | 204 | 404 |

> Las rutas fijas (`/tareas/resumen`, `/tareas/proximas`) se registran antes que `/tareas/:id`.

## Modelo `Tarea`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | texto | Lo genera el servidor |
| `titulo` | texto | Obligatorio, hasta 100 caracteres |
| `descripcion` | texto | Opcional, hasta 500 caracteres |
| `materia` | texto | Obligatoria |
| `fechaLimite` | fecha ISO 8601 | Obligatoria; se guarda en UTC |
| `prioridad` | `baja` \| `media` \| `alta` | Obligatoria |
| `estado` | `pendiente` \| `en curso` \| `completada` | Inicia en `pendiente` |
| `favorito` | booleano | Inicia en `false` |
| `fechaCreacion` | fecha ISO | No editable |
| `fechaActualizacion` | fecha ISO | Cambia en cada edición |

## `GET /tareas`

Parámetros de consulta (todos opcionales):

| Parámetro | Valores | Efecto |
|-----------|---------|--------|
| `q` | texto | Busca en título y materia, sin distinguir mayúsculas |
| `materia` | texto | Filtra por materia exacta (sin distinguir mayúsculas) |
| `estado` | `pendiente`, `en curso`, `completada` | Filtra por estado |
| `prioridad` | `baja`, `media`, `alta` | Filtra por prioridad |
| `favorito` | `true` | Solo favoritas |
| `orden` | `fecha` (por defecto), `prioridad`, `creacion` | Orden del resultado |

```bash
curl "http://localhost:3001/api/tareas?materia=Física&orden=prioridad"
```

## `POST /tareas`

Cuerpo: `titulo`, `materia`, `fechaLimite`, `prioridad` (obligatorios) y `descripcion` (opcional).

```bash
curl -X POST http://localhost:3001/api/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"TP de Física","materia":"Física","fechaLimite":"2026-12-01T20:00","prioridad":"alta"}'
```

| Código | Cuándo |
|--------|--------|
| 201 | Creada; devuelve la tarea |
| 400 | Dato inválido (el mensaje indica cuál) o JSON mal formado |
| 409 | Ya existe una tarea **activa** con ese título y materia |

## `GET /tareas/resumen`

Devuelve contadores. Una tarea completada nunca cuenta como vencida.

```json
{ "total": 12, "pendientes": 7, "enCurso": 2, "completadas": 3, "vencidas": 1, "porVencer": 4 }
```

- `vencidas`: activas con fecha límite anterior a ahora.
- `porVencer`: activas que vencen en las próximas 48 horas.

## `GET /tareas/proximas`

Lista las tareas **activas** que vencen entre ahora y ahora + `horas`, la más próxima primero (el límite es inclusivo).

| Parámetro | Valores | Por defecto |
|-----------|---------|-------------|
| `horas` | entero de 1 a 720 | 48 |

```bash
curl "http://localhost:3001/api/tareas/proximas?horas=24"
```

| Código | Cuándo |
|--------|--------|
| 200 | Lista (puede estar vacía) |
| 400 | `horas` no es un entero entre 1 y 720: `El parámetro horas debe ser un entero entre 1 y 720` |

## `PATCH /tareas/:id`

Edición parcial. Campos editables: `titulo`, `descripcion`, `materia`, `fechaLimite`, `prioridad`, `estado`, `favorito`. Cualquier otro campo (por ejemplo `id`) se rechaza con 400.

```bash
curl -X PATCH http://localhost:3001/api/tareas/ID \
  -H "Content-Type: application/json" -d '{"estado":"completada","favorito":true}'
```

| Código | Cuándo |
|--------|--------|
| 200 | Editada; devuelve la tarea |
| 400 | Sin cambios, campo no editable o valor inválido |
| 404 | No existe esa tarea |
| 409 | La edición dejaría dos tareas activas con el mismo título y materia |

## `DELETE /tareas/:id`

Responde 204 sin cuerpo, o 404 si no existe.

## Errores generales

| Código | Cuándo |
|--------|--------|
| 400 | JSON inválido |
| 404 | Ruta inexistente |
| 413 | Cuerpo mayor a 100 kb |
| 500 | Error interno o base de datos dañada (mensaje genérico) |

## Para probar

- `backend/requests.http`: peticiones listas para la extensión REST Client de VS Code.
- `backend/openapi.yaml`: especificación OpenAPI 3.0, se puede abrir en [editor.swagger.io](https://editor.swagger.io).
