// CICLO 2: tareas próximas a vencer (GET /api/tareas/proximas?horas=N)
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { crearEntorno, enHoras, tareaValida } = require("./helpers");
const { tareasPorVencer } = require("../src/logic/taskLogic");

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
test("tareasPorVencer: incluye las activas dentro de la ventana y excluye el resto", () => {
  const tareas = [
    T("dentro", { fechaLimite: "2026-11-04T12:00:00.000Z" }),                       // +24 h
    T("lejos", { fechaLimite: "2026-11-20T12:00:00.000Z" }),                        // fuera de ventana
    T("vencida", { fechaLimite: "2026-11-02T12:00:00.000Z" }),                      // ya pasó
    T("hecha", { fechaLimite: "2026-11-04T12:00:00.000Z", estado: "completada" }),  // completada
  ];
  assert.deepEqual(tareasPorVencer(tareas, 48, ahora).map((t) => t.id), ["dentro"]);
});

test("tareasPorVencer: el límite de la ventana es inclusivo (justo a las 48 h entra)", () => {
  const justo = T("justo", { fechaLimite: "2026-11-05T12:00:00.000Z" });
  assert.equal(tareasPorVencer([justo], 48, ahora).length, 1);
});

test("tareasPorVencer: devuelve las más próximas primero", () => {
  const tareas = [
    T("tarde", { fechaLimite: "2026-11-05T00:00:00.000Z" }),
    T("temprano", { fechaLimite: "2026-11-03T18:00:00.000Z" }),
  ];
  assert.deepEqual(tareasPorVencer(tareas, 48, ahora).map((t) => t.id), ["temprano", "tarde"]);
});

test("tareasPorVencer: usa 48 horas si no se indica la ventana", () => {
  const ahoraReal = new Date();
  const t = T("x", { fechaLimite: new Date(ahoraReal.getTime() + 47 * 3600000).toISOString() });
  assert.equal(tareasPorVencer([t]).length, 1);
});

// ---------- API ----------
test("GET /tareas/proximas usa 48 h por defecto y ordena por fecha", async () => {
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "En 30h", fechaLimite: enHoras(30) }));
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "En 5h", fechaLimite: enHoras(5) }));
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "En 100h", fechaLimite: enHoras(100) }));
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "Pasada", fechaLimite: enHoras(-5) }));

  const r = await env.pedir("/tareas/proximas");
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).map((t) => t.titulo), ["En 5h", "En 30h"]);
});

test("GET /tareas/proximas?horas=10 reduce la ventana", async () => {
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "En 5h", fechaLimite: enHoras(5) }));
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "En 30h", fechaLimite: enHoras(30) }));
  const r = await env.pedir("/tareas/proximas?horas=10");
  assert.deepEqual((await r.json()).map((t) => t.titulo), ["En 5h"]);
});

for (const horas of ["abc", "0", "-3", "1.5", "721", ""]) {
  test(`GET /tareas/proximas?horas=${horas || "(vacío)"} responde 400`, async () => {
    const r = await env.pedir(`/tareas/proximas?horas=${horas}`);
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error, "El parámetro horas debe ser un entero entre 1 y 720");
  });
}

test("GET /tareas/resumen cuenta porVencer", async () => {
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "Pronto", fechaLimite: enHoras(10) }));
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "Lejos", fechaLimite: enHoras(300) }));
  const resumen = await (await env.pedir("/tareas/resumen")).json();
  assert.equal(resumen.porVencer, 1);
});
