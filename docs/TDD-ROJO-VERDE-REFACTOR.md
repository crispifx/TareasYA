# Ciclo Rojo-Verde-Refactor en TareasYA

Registro de dos ciclos de desarrollo guiado por tests (TDD) hechos sobre el backend. Las salidas de test son reales (se copiaron de la terminal) y cada fase tiene su commit en el historial de git.

## El ciclo

| Fase | Qué se hace | Cómo se sabe que terminó |
|------|-------------|--------------------------|
| 🔴 **Rojo** | Se escribe un test para un comportamiento que todavía no existe | El test **falla por la razón correcta** (función inexistente o ruta con 404) |
| 🟢 **Verde** | Se escribe el código **mínimo** que lo hace pasar | **Toda** la suite pasa |
| 🔵 **Refactor** | Se limpia el código sin cambiar el comportamiento | La suite sigue en verde, sin tocar los tests |

## Ciclo 1: resumen de tareas (`GET /api/tareas/resumen`)

**Requisito:** devolver cuántas tareas hay por estado y cuántas están vencidas. Una tarea completada nunca cuenta como vencida.

### 🔴 Rojo
Se escribieron 4 tests (2 de lógica pura, 2 de API) en `backend/test/resumen.test.js`. Resultado:

```
=== FASE ROJA (ciclo 1) ===
not ok 1 - resumenTareas: una lista vacía devuelve todo en cero
  name: 'TypeError'
not ok 2 - resumenTareas: cuenta por estado y solo marca vencidas las activas con fecha pasada
  name: 'TypeError'
not ok 3 - GET /tareas/resumen sin tareas responde 200 con ceros (y no se confunde con un id)
    404 !== 200
  expected: 200
  actual: 404
not ok 4 - GET /tareas/resumen refleja las tareas cargadas
    + actual - expected
  expected:
  actual:
# tests 4
# pass 0
# fail 4
```
Fallan por lo correcto: `TypeError` (la función `resumenTareas` no existe) y `404 !== 200` (la ruta no existe). Commit: `test(rojo): resumen de tareas - 4 tests fallando`.

### 🟢 Verde
Se agregó `resumenTareas` en `logic/`, `obtenerResumen` en el service, `getResumen` en el controller y la ruta. La ruta se registró **antes** de `/tareas/:id`; si no, `resumen` se interpretaría como un id y daría 404.

```
=== FASE VERDE (ciclo 1) ===
# tests 18
# pass 18
# fail 0
```
Commit: `feat(verde): GET /api/tareas/resumen - 18 tests pasando`.

### 🔵 Refactor
El código repetía la condición "no está completada" y la forma de contar. Se extrajeron `esActiva`, `estaVencida`, `contar` y `conEstado`.

```
=== REFACTOR (ciclo 1) ===
# tests 18
# pass 18
# fail 0
```
Commit: `refactor: helpers esActiva/estaVencida/contar en la lógica`.

## Ciclo 2: tareas próximas a vencer (`GET /api/tareas/proximas?horas=N`)

**Requisito:** listar las tareas activas que vencen en las próximas N horas (por defecto 48, entre 1 y 720), la más próxima primero. Además, el resumen debe incluir `porVencer`.

### 🔴 Rojo
Se escribieron 13 tests nuevos (`proximas.test.js`): ventana, límite inclusivo, orden, valor por defecto y seis valores inválidos (`abc`, `0`, `-3`, `1.5`, `721`, vacío). Además se **actualizaron las expectativas del ciclo 1** para que incluyan `porVencer`: un cambio de requisito también se escribe primero como test.

```
=== FASE ROJA (ciclo 2) ===
not ok 15 - tareasPorVencer: incluye las activas dentro de la ventana y excluye el resto
not ok 16 - tareasPorVencer: el límite de la ventana es inclusivo (justo a las 48 h entra)
not ok 17 - tareasPorVencer: devuelve las más próximas primero
not ok 18 - tareasPorVencer: usa 48 horas si no se indica la ventana
not ok 19 - GET /tareas/proximas usa 48 h por defecto y ordena por fecha
not ok 20 - GET /tareas/proximas?horas=10 reduce la ventana
not ok 21 - GET /tareas/proximas?horas=abc responde 400
not ok 22 - GET /tareas/proximas?horas=0 responde 400
not ok 23 - GET /tareas/proximas?horas=-3 responde 400
not ok 24 - GET /tareas/proximas?horas=1.5 responde 400
not ok 25 - GET /tareas/proximas?horas=721 responde 400
not ok 26 - GET /tareas/proximas?horas=(vacío) responde 400
not ok 27 - GET /tareas/resumen cuenta porVencer
not ok 28 - resumenTareas: una lista vacía devuelve todo en cero
not ok 29 - resumenTareas: cuenta por estado y solo marca vencidas las activas con fecha pasada
not ok 30 - GET /tareas/resumen sin tareas responde 200 con ceros (y no se confunde con un id)
not ok 31 - GET /tareas/resumen refleja las tareas cargadas
# tests 31
# pass 14
# fail 17
```
Los 14 tests anteriores de la API siguen pasando (no se rompió nada existente); los 17 en rojo son los nuevos y los modificados. Commit: `test(rojo): tareas próximas y porVencer en el resumen`.

### 🟢 Verde
Se implementó `tareasPorVencer`, el parámetro `horas` y `porVencer` en el resumen, **dejando a propósito la condición de ventana repetida** en dos lugares: la limpieza es la fase siguiente.

```
=== FASE VERDE (ciclo 2) ===
# tests 31
# pass 31
# fail 0
```
Commit: `feat(verde): GET /api/tareas/proximas y porVencer en el resumen`.

### 🔵 Refactor
- La condición de ventana estaba duplicada → `venceEnVentana`.
- Números mágicos `48`, `720` y `3600000` → constantes `HORAS_POR_DEFECTO`, `HORAS_MAXIMAS`, `HORA_MS`.
- La validación de `horas` estaba en el service → `validarHoras` en la capa de lógica.
- El controller llamaba `tarea` a lo que puede ser una lista o un resumen → los resultados del service ahora usan `datos`.

```
=== REFACTOR (ciclo 2) ===
# tests 31
# pass 31
# fail 0
```
Commit: `refactor: venceEnVentana, constantes y validarHoras`.

## Historial de git de los ciclos

```
refactor: venceEnVentana, constantes y validarHoras; resultados del service como 'datos'
feat(verde): GET /api/tareas/proximas y porVencer en el resumen
test(rojo): tareas próximas y porVencer en el resumen - tests fallando
refactor: helpers esActiva/estaVencida/contar en la lógica - tests siguen en verde
feat(verde): GET /api/tareas/resumen - 18 tests pasando
test(rojo): resumen de tareas - 4 tests fallando
```

## Balance

| Etapa | Tests del backend | Resultado |
|-------|-------------------|-----------|
| Antes de los ciclos | 14 | 14 pasan |
| Fin del ciclo 1 | 18 | 18 pasan |
| Fin del ciclo 2 | 31 | 31 pasan |

## Qué se aprendió

- Escribir el test primero obligó a decidir antes los casos límite (la ventana inclusiva, el valor `1.5`, el vacío).
- El error de orden de rutas (`/resumen` contra `/:id`) lo muestra el rojo: una ruta con 404 donde se esperaba 200.
- Dejar la repetición en el verde y limpiarla en el refactor mantiene cada paso chico y verificable.
