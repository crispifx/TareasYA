// Tests del backend con el runner nativo de Node (node --test).
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "tareasya-")), "db.json");
process.env.TAREASYA_DB = DB;

const app = require("../src/app");
const { validarDatosTarea, validarCambios, filtrarYOrdenar } = require("../src/logic/taskLogic");

let server, base;
before(async () => {
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://localhost:${server.address().port}/api`;
});
after(() => server.close());
beforeEach(() => fs.writeFileSync(DB, "[]"));

const valida = (extra = {}) => ({
  titulo: "TP de Física",
  materia: "Física",
  fechaLimite: "2026-12-01T20:00",
  prioridad: "alta",
  ...extra,
});
const pedir = (ruta, metodo = "GET", cuerpo) =>
  fetch(base + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

// ---------- lógica pura ----------
test("lógica: distingue fecha vacía de fecha inválida", () => {
  assert.equal(validarDatosTarea(valida({ fechaLimite: "" })).error, "La fecha límite es obligatoria");
  assert.equal(validarDatosTarea(valida({ fechaLimite: "31-31-2026" })).error, "La fecha límite no es válida");
});
test("lógica: título que no es texto se rechaza sin romper", () => {
  assert.equal(validarDatosTarea(valida({ titulo: 123 })).error, "El título es obligatorio");
});
test("lógica: validarCambios rechaza campos no editables", () => {
  assert.equal(validarCambios({ id: "x" }).error, "Campo no editable: id");
  assert.equal(validarCambios({}).error, "No hay cambios para aplicar");
  assert.equal(validarCambios({ estado: "hecho" }).error, "El estado no es válido");
});
test("lógica: filtrarYOrdenar ordena por fecha y filtra por texto", () => {
  const ts = [
    { titulo: "B", materia: "Arte", prioridad: "baja", estado: "pendiente", favorito: false, fechaLimite: "2026-12-05T00:00:00Z", fechaCreacion: "2026-11-01T00:00:00Z" },
    { titulo: "A", materia: "Física", prioridad: "alta", estado: "pendiente", favorito: true, fechaLimite: "2026-12-01T00:00:00Z", fechaCreacion: "2026-11-02T00:00:00Z" },
  ];
  assert.deepEqual(filtrarYOrdenar(ts).map((t) => t.titulo), ["A", "B"]);
  assert.deepEqual(filtrarYOrdenar(ts, { q: "arte" }).map((t) => t.titulo), ["B"]);
  assert.deepEqual(filtrarYOrdenar(ts, { favorito: "true" }).map((t) => t.titulo), ["A"]);
});

// ---------- API ----------
test("POST crea una tarea (201) y GET la lista", async () => {
  const r = await pedir("/tareas", "POST", valida());
  assert.equal(r.status, 201);
  const t = await r.json();
  assert.equal(t.estado, "pendiente");
  const lista = await (await pedir("/tareas")).json();
  assert.equal(lista.length, 1);
});
test("POST inválido responde 400 con mensaje", async () => {
  const r = await pedir("/tareas", "POST", valida({ prioridad: "urgente" }));
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "La prioridad no es válida");
});
test("POST duplicada activa responde 409; si la otra está completada, se permite", async () => {
  const t = await (await pedir("/tareas", "POST", valida())).json();
  assert.equal((await pedir("/tareas", "POST", valida({ titulo: " tp de física " }))).status, 409);
  await pedir(`/tareas/${t.id}`, "PATCH", { estado: "completada" });
  assert.equal((await pedir("/tareas", "POST", valida())).status, 201);
});
test("GET con filtros y orden", async () => {
  await pedir("/tareas", "POST", valida({ titulo: "Uno", fechaLimite: "2026-12-10T10:00" }));
  await pedir("/tareas", "POST", valida({ titulo: "Dos", materia: "Arte", prioridad: "baja", fechaLimite: "2026-12-02T10:00" }));
  const porFecha = await (await pedir("/tareas")).json();
  assert.deepEqual(porFecha.map((t) => t.titulo), ["Dos", "Uno"]);
  const arte = await (await pedir("/tareas?materia=arte")).json();
  assert.deepEqual(arte.map((t) => t.titulo), ["Dos"]);
  const prio = await (await pedir("/tareas?orden=prioridad")).json();
  assert.equal(prio[0].titulo, "Uno");
});
test("PATCH edita campos y actualiza fechaActualizacion", async () => {
  const t = await (await pedir("/tareas", "POST", valida())).json();
  const r = await pedir(`/tareas/${t.id}`, "PATCH", { favorito: true, estado: "en curso" });
  assert.equal(r.status, 200);
  const n = await r.json();
  assert.equal(n.favorito, true);
  assert.equal(n.estado, "en curso");
  assert.equal(n.id, t.id);
});
test("PATCH no deja crear un duplicado al editar", async () => {
  await pedir("/tareas", "POST", valida({ titulo: "A" }));
  const b = await (await pedir("/tareas", "POST", valida({ titulo: "B" }))).json();
  assert.equal((await pedir(`/tareas/${b.id}`, "PATCH", { titulo: "a" })).status, 409);
});
test("PATCH / GET / DELETE de id inexistente responden 404", async () => {
  assert.equal((await pedir("/tareas/nope", "PATCH", { favorito: true })).status, 404);
  assert.equal((await pedir("/tareas/nope")).status, 404);
  assert.equal((await pedir("/tareas/nope", "DELETE")).status, 404);
});
test("DELETE elimina (204)", async () => {
  const t = await (await pedir("/tareas", "POST", valida())).json();
  assert.equal((await pedir(`/tareas/${t.id}`, "DELETE")).status, 204);
  assert.equal((await (await pedir("/tareas")).json()).length, 0);
});
test("JSON inválido responde 400 y ruta desconocida 404", async () => {
  const r = await fetch(base + "/tareas", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{roto" });
  assert.equal(r.status, 400);
  assert.equal((await pedir("/no-existe")).status, 404);
});
test("base de datos dañada responde 500 sin filtrar detalles", async () => {
  fs.writeFileSync(DB, "{{{");
  const orig = console.error; console.error = () => {};
  const r = await pedir("/tareas");
  console.error = orig;
  assert.equal(r.status, 500);
  assert.equal((await r.json()).error, "Error interno del servidor");
});
