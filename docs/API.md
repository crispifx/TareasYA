# Referencia de la API

Base: `http://localhost:3001/api` · Formato: JSON · Las rutas de tareas exigen sesión (`Authorization: Bearer <token>`).
Los errores siempre tienen la forma `{ "error": "mensaje" }`.

## Resumen de endpoints

| Método | Ruta | Descripción | Éxito | Errores |
|--------|------|-------------|-------|---------|
| GET | `/salud` | Comprueba que el servidor responde | 200 | |
| GET | `/tareas` | Lista tareas con filtros y orden | 200 | 400 |
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
| `titulo` | texto | Obligatorio, 3 a 100 caracteres (ver reglas) |
| `descripcion` | texto | Opcional, hasta 500 caracteres |
| `materia` | texto | Obligatoria, 2 a 40 caracteres (ver reglas) |
| `fechaLimite` | fecha ISO 8601 | Obligatoria, con fecha **y hora**; se guarda en UTC |
| `prioridad` | `baja` \| `media` \| `alta` | Obligatoria |
| `estado` | `pendiente` \| `en curso` \| `completada` | Inicia en `pendiente` |
| `favorito` | booleano | Inicia en `false` |
| `fechaCreacion` | fecha ISO | No editable |
| `fechaActualizacion` | fecha ISO | Cambia en cada edición |

## Reglas de validación

Los espacios al borde se recortan y los espacios repetidos dentro del texto se reducen a uno (`"TP   de  Física"` se guarda como `"TP de Física"`). Cada incumplimiento responde 400 con un mensaje en español.

| Campo | Regla |
|-------|-------|
| `titulo` | 3 a 100 caracteres; al menos una letra; solo letras (con tildes y ñ), números, espacios y `. , ; : ! ? ¿ ¡ ( ) - _ / & ' " + # % ° º ª @ = * …`; sin repetir un mismo carácter más de 3 veces seguidas |
| `materia` | 2 a 40 caracteres; al menos una letra; solo letras, números, espacios y `. - ' & ( )`; sin repetir un mismo carácter más de 3 veces seguidas |
| `descripcion` | Hasta 500 caracteres; sin caracteres de control (el salto de línea sí se permite) |
| `fechaLimite` | ISO 8601 **con hora** (`2026-12-01T20:00` o `…Z`); el día debe existir (no hay 31 de febrero), hora 00-23 y minutos 00-59; debe ser **posterior al momento actual** y no pasar de **5 años** hacia adelante |
| `prioridad` / `estado` | Valores de las listas del modelo |
| `favorito` | Booleano |

Al editar con `PATCH`, la fecha solo se compara con "ahora" si **cambia**: una tarea ya vencida puede cambiar de estado, título, etc. sin tocar su fecha; reenviar la misma fecha tampoco cuenta como cambio.

Credenciales (`/auth/registro`): usuario de 3 a 30 caracteres (letras, números, `. _ -`) que empiece y termine con letra o número; contraseña de 8 a 72 caracteres con letras y números, distinta del usuario y fuera de una lista corta de contraseñas comunes. El ingreso (`/auth/login`) no revalida la contraseña, para no dejar afuera cuentas anteriores.

## `GET /tareas`

Parámetros de consulta (todos opcionales):

| Parámetro | Valores | Efecto |
|-----------|---------|--------|
| `q` | texto, hasta 50 caracteres | Busca en título y materia, sin distinguir mayúsculas |
| `materia` | texto, hasta 40 caracteres | Filtra por materia exacta (sin distinguir mayúsculas) |
| `estado` | `pendiente`, `en curso`, `completada` | Filtra por estado |
| `prioridad` | `baja`, `media`, `alta` | Filtra por prioridad |
| `favorito` | `true` o `false` | Con `true`, solo favoritas |
| `orden` | `fecha` (por defecto), `prioridad`, `creacion` | Orden del resultado |

```bash
curl "http://localhost:3001/api/tareas?materia=Física&orden=prioridad"
```

Un valor fuera de la lista (por ejemplo `estado=hecho` u `orden=azar`), un parámetro repetido (`?q=a&q=b`) o un texto demasiado largo responde **400** con un mensaje como `El estado no es válido`. Un valor vacío (`estado=`) equivale a no filtrar.

## `POST /tareas`

Cuerpo: `titulo`, `materia`, `fechaLimite`, `prioridad` (obligatorios) y `descripcion` (opcional).

```bash
curl -X POST http://localhost:3001/api/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"TP de Física","materia":"Física","fechaLimite":"2030-12-01T20:00","prioridad":"alta"}'
```

| Código | Cuándo |
|--------|--------|
| 201 | Creada; devuelve la tarea |
| 400 | Dato inválido (el mensaje indica cuál, ver *Reglas de validación*) o JSON mal formado |
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
| 400 | Sin cambios, campo no editable, valor inválido o fecha nueva en el pasado |
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
