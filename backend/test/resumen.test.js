// CICLO 1 (ampliado en el ciclo 2 con porVencer): resumen de tareas (GET /api/tareas/resumen)
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { crearEntorno, enHoras, tareaValida } = require("./helpers");
const { resumenTareas } = require("../src/logic/taskLogic");

const env = crearEntorno();
before(() => env.iniciar());
after(() => env.cerrar());
beforeEach(() => env.limpiar());

const ahora = new Date("2026-11-03T12:00:00.000Z");
const T = (id, o = {}) => ({
  id, titulo: id, materia: "M", prioridad: "media", estado: "pendiente",
  favorito: false, fechaLimite: "2026-12-01T00:00:00.000Z", ...o,
});

// ---------- lógica pura ----------
test("resumenTareas: una lista vacía devuelve todo en cero", () => {
  assert.deepEqual(resumenTareas([], ahora), {
    total: 0, pendientes: 0, enCurso: 0, completadas: 0, vencidas: 0, porVencer: 0,
  });
});

test("resumenTareas: cuenta por estado y solo marca vencidas las activas con fecha pasada", () => {
  const tareas = [
    T("a", { fechaLimite: "2026-11-01T00:00:00.000Z" }),                       // pendiente y vencida
    T("b", { estado: "en curso" }),                                            // activa, a tiempo
    T("c", { estado: "completada", fechaLimite: "2026-11-01T00:00:00.000Z" }), // completada: nunca vencida
    T("d"),                                                                    // pendiente, a tiempo
  ];
  assert.deepEqual(resumenTareas(tareas, ahora), {
    total: 4, pendientes: 2, enCurso: 1, completadas: 1, vencidas: 1, porVencer: 0,
  });
});

// ---------- API ----------
test("GET /tareas/resumen sin tareas responde 200 con ceros (y no se confunde con un id)", async () => {
  const r = await env.pedir("/tareas/resumen");
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { total: 0, pendientes: 0, enCurso: 0, completadas: 0, vencidas: 0, porVencer: 0 });
});

test("GET /tareas/resumen refleja las tareas cargadas", async () => {
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "Futura" }));
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "Atrasada", fechaLimite: enHoras(-30) }));
  const hecha = await (await env.pedir("/tareas", "POST", tareaValida({ titulo: "Hecha" }))).json();
  await env.pedir(`/tareas/${hecha.id}`, "PATCH", { estado: "completada" });

  const r = await env.pedir("/tareas/resumen");
  assert.deepEqual(await r.json(), { total: 3, pendientes: 2, enCurso: 0, completadas: 1, vencidas: 1, porVencer: 0 });
});
