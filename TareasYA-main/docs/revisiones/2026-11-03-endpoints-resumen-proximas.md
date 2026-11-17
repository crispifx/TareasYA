# Revisión: endpoints `resumen` y `proximas`

**Alcance:** diff de los ciclos 1 y 2 (`GET /tareas/resumen`, `GET /tareas/proximas`) y el código que lo rodea.
**Método:** se aplicaron **a mano** las cinco preguntas y el formato del agente `revisor` (`.claude/agents/revisor.md`). No se ejecutó el subagente: esta es la lista que usaría, aplicada por la persona que desarrolla. Para una revisión independiente, correr el agente sobre el mismo diff en Claude Code.

## Hallazgos

**[Gravedad: media] backend/src/repositories/taskRepository.js:18.** `obtenerTodas()` lee y parsea el archivo completo en cada petición, y ahora lo hacen también `resumen` y `proximas`.
Escenario: con varios miles de tareas y la interfaz consultando el resumen seguido, cada petición bloquea el proceso (lectura sincrónica) y las demás esperan.
Qué habría que resolver: pasar a una base con índices (SQLite) o cachear en memoria con invalidación al escribir.

**[Gravedad: media] backend/src/repositories/taskRepository.js:33-38.** Cada escritura lee todo, modifica y reescribe el archivo; la escritura es atómica pero no hay bloqueo entre procesos.
Escenario: dos instancias del servidor (o dos peticiones en medio de una lectura-modificación-escritura) pueden pisarse y perder una tarea.
Qué habría que resolver: una sola instancia garantizada o una base con transacciones.

**[Gravedad: media, a verificar] backend/src/app.js:8.** La API no tiene autenticación: cualquiera que alcance el puerto lee y modifica todas las tareas.
Escenario: si se despliega en una red compartida o en internet, un tercero borra o lee todo.
Qué habría que resolver: autenticación antes de exponerla fuera de la máquina local. A verificar dónde se va a desplegar.

## Lo que se revisó y está bien

1. **Datos de entrada:** `horas` se valida en `validarHoras` (entero 1 a 720); un valor repetido (`?horas=1&horas=2`) o un objeto da `NaN` y responde 400. Los demás filtros no rompen con valores raros.
2. **Fallos:** una base dañada responde 500 genérico (probado) y no devuelve una lista vacía.
3. **Secretos:** no hay credenciales en el código; `console.error` (app.js:20) registra el error en el servidor, pero el cliente solo ve un mensaje genérico.
4. **Orden de rutas:** `resumen` y `proximas` están antes de `/:id` (probado con test).

Sin hallazgos críticos ni altos. Ninguno de los tres es un bug nuevo de estos endpoints: son límites de la persistencia en archivo ya documentados en el SPEC.
