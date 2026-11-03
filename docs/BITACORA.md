# Bitácora de TareasYA (julio → noviembre 2026)

> **Bitácora simulada.** Las fechas de hitos marcados con ✅ salen de los archivos reales de las entregas (TP 1, 2, 4, 5, 6 y 7). Los números de versión y los pasos intermedios son una reconstrucción verosímil, no un historial real de commits.

Convención de etiquetas: **[Nuevo]** funcionalidad · **[Mejora]** cambio sobre algo existente · **[Fix]** corrección · **[Suceso]** hito o decisión del proyecto · **[Deuda]** problema conocido

---

## v0.1.0 — 5 de julio de 2026 ✅ *Diseño*
- **[Suceso]** Arranca el proyecto con el TP 1: "Diseñá tu propia aplicación".
- **[Nuevo]** Definición del problema: estudiantes que pierden entregas por manejar tareas en cuaderno o chat del curso.
- **[Nuevo]** SPEC: objetivo, usuario, funcionalidades, restricciones y tecnología (React + localStorage).
- **[Nuevo]** Modelo de datos: título, descripción, materia, fecha límite, prioridad, estado, favorito, fecha de creación.
- **[Nuevo]** Prompt profesional y *challenge de validación* de 7 puntos para revisar el código generado.

## v0.2.0 — mediados de julio *(simulada)* — Prototipo
- **[Nuevo]** Primer prototipo React: alta de tareas con persistencia en localStorage.
- **[Nuevo]** Lista básica de tareas.
- **[Deuda]** Validación y creación de la tarea viven dentro del componente del formulario.

## v0.2.1 — fines de julio *(simulada)*
- **[Fix]** El formulario no se vaciaba tras crear una tarea.
- **[Mejora]** Mensajes de error visibles cuando faltan datos obligatorios.

## v0.3.0 — principios de agosto *(simulada)* — Primera ronda del challenge
- **[Nuevo]** Estados (pendiente, en curso, completada) y marca de favorito.
- **[Mejora]** Primera pasada contra el *challenge de validación* del TP 1.
- **[Deuda]** `TaskForm.jsx` mezcla UI, validación, armado del objeto y guardado.

## v0.4.0 — 19 de agosto de 2026 ✅ *Refactoring + tests unitarios*
- **[Suceso]** TP 2: se refactoriza `TaskForm.jsx` (versión previa conservada en `docs/TaskForm.before-refactor.jsx`).
- **[Mejora]** Se extrae `taskLogic.js`: lógica pura, sin React ni DOM.
  - `validarDatosTarea` (título, materia, fecha obligatoria y válida, prioridad permitida).
  - `generarIdTarea` y `crearTarea`.
- **[Mejora]** `TaskForm` queda solo con estado de UI y delega en la lógica.
- **[Nuevo]** `taskLogic.test.js` con Vitest: 8 tests (5 de validación, 3 de creación) que cubren casos correctos, inválidos y límite (título con espacios, fecha imposible, descripción omitida, ids distintos).

## v0.5.0 — septiembre de 2026 *(simulada)* — Migración a backend
- **[Suceso]** Se decide que "qué es una tarea válida" no puede vivir solo en el navegador.
- **[Nuevo]** Servidor Express en el puerto 3001.
- **[Nuevo]** Arquitectura en capas: `routes → controllers → services → repositories`.
- **[Mejora]** La lógica del TP 2 se migra a `backend/src/logic/taskLogic.js` (versión CommonJS).

## v0.5.1 — mediados de septiembre *(simulada)*
- **[Nuevo]** Repositorio con persistencia en archivo JSON (`data/tareas.json`), equivalente backend de localStorage; se crea solo si no existe.
- **[Nuevo]** Primera tarea de prueba cargada: "TP de Física", prioridad alta.
- **[Mejora]** El repositorio es la única capa que sabe dónde se guardan los datos.

## v0.6.0 — 30 de septiembre de 2026 ✅ *Backend (TP 4)*
- **[Suceso]** Entrega del TP 4.
- **[Nuevo]** `POST /api/tareas`: responde 201 con la tarea creada.
- **[Nuevo]** `GET /api/tareas`: lista todas las tareas.
- **[Nuevo]** Regla de negocio propia que la IA no había propuesto: no se permiten dos tareas activas con el mismo título y materia (compara sin distinguir mayúsculas y responde 409; las completadas no cuentan).
- **[Mejora]** El controller solo traduce HTTP ↔ service; las reglas quedan en el service.
- **[Deuda]** El backend unifica "fecha vacía" y "fecha inválida" en un solo mensaje; el frontend los distingue.

## v0.6.1 — 30 de septiembre de 2026 ✅ *Analizar antes de pedir (TP 5)*
- **[Suceso]** Ejercicio sobre `queryTicketRows()` (`GET /tickets`), un código ajeno a TareasYA que sirvió para entrenar la mirada crítica.
- **[Mejora]** Criterio incorporado al proyecto: antes de pedirle algo a la IA, leer qué decisiones quedaron implícitas (límites ocultos, errores silenciosos, volumen).
- **[Suceso]** Tres problemas identificados y ordenados por gravedad, probabilidad y detectabilidad: SQL como texto, JSON cortado a 8000 caracteres y lectura completa de la tabla en cada request.
- **[Deuda]** Aplicable a TareasYA a futuro: `obtenerTodas()` lee y parsea todo el JSON en cada request y no hay paginación.

## v0.7.0 — 19 de octubre de 2026 ✅ *Mejora del agente revisor (TP 6)*
- **[Suceso]** Se afina el subagente `revisor` (solo lectura) armado en clase.
- **[Mejora]** 5 cambios sobre la versión original:
  1. `description` con más disparadores (autenticación, base de datos, uploads, secretos, producción).
  2. Alcance definido: revisa el `git diff` y su entorno, no el repo entero.
  3. Una quinta pregunta sobre secretos y datos sensibles.
  4. Formato fijo de hallazgo: gravedad, archivo:línea, escenario y qué resolver.
  5. Salida para el caso limpio, para no inventar problemas.
- **[Mejora]** Se mantiene `readonly: true` y 36 líneas.

## v0.7.1 — 19 de octubre de 2026 ✅ *Medí tu revisor (TP 7)*
- **[Suceso]** Se diseña una evaluación con 5 archivos: 3 con problema (`login.py`, `subir.py`, `config.py`) y 2 sanos (`precios.py`, `clientes.py`).
- **[Nuevo]** Expectativas escritas antes de correr el revisor, para que el puntaje mida algo real.
- **[Nuevo]** Criterio de acierto: en archivos con problema, reportar el principal; en sanos, no inventar.

## v0.8.0 — 3 de noviembre de 2026 ✅ *Versión actual: repositorio*
- **[Suceso]** Se reúnen los TP en un solo repositorio.
- **[Nuevo]** Estructura `backend/`, `frontend/`, `docs/`.
- **[Nuevo]** `frontend/src/logic/taskStorage.js` (`loadTasks` y `saveTasks` sobre localStorage), que `TaskForm` importaba pero no estaba entregado.
- **[Nuevo]** `README.md`, `.gitignore` (excluye `node_modules` y `backend/data/tareas.json`) y scripts `start` y `dev` en el backend.
- **[Nuevo]** Entregas en PDF archivadas en `docs/entregas/`.
- **[Deuda]** Sin verificar en esta versión: arranque del backend y ejecución de los tests.

---

## Problemas conocidos a la versión actual
| # | Tema | Detalle |
|---|------|---------|
| 1 | Frontend incompleto | Faltan `App`, lista de tareas, `index.html` y `main.jsx`. |
| 2 | Mensajes de fecha | El backend no distingue fecha vacía de inválida. |
| 3 | `server.js` | Hace `listen` al importarse, lo que dificulta testear con supertest. |
| 4 | Persistencia | El JSON completo se lee en cada request; sin paginación. |
| 5 | Duplicados | La comparación del 409 asume que título y materia siempre son texto. |
| 6 | Funcionalidades del TP 1 sin construir | Editar, eliminar, buscar, filtrar, ordenar, recordatorios. |

## Próximos pasos sugeridos
1. v0.9.0: `PUT/PATCH/DELETE` y tests del backend.
2. v0.10.0: búsqueda, filtros y orden por fecha límite.
3. v1.0.0: frontend conectado a la API y recordatorios previos al vencimiento.
