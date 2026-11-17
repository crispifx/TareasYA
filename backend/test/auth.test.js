const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), os = require("os"), path = require("path");
process.env.TAREASYA_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "tya-auth-")), "db.json");
delete process.env.TAREASYA_SIN_AUTH;
const app = require("../src/app");
let server, base;
before(async () => { await new Promise((r) => (server = app.listen(0, r))); base = `http://localhost:${server.address().port}/api`; });
after(() => server.close());
const pedir = (r, m = "GET", b, t) => fetch(base + r, { method: m, headers: { "Content-Type": "application/json", ...(t && { Authorization: `Bearer ${t}` }) }, body: b && JSON.stringify(b) });
const tarea = { titulo: "TP Uno", materia: "Física", fechaLimite: new Date(Date.now() + 30 * 864e5).toISOString(), prioridad: "alta" };

test("sin sesión no se accede a las tareas", async () => assert.strictEqual((await pedir("/tareas")).status, 401));
test("registro, duplicado y login", async () => {
  assert.strictEqual((await pedir("/auth/registro", "POST", { usuario: "ana", password: "secreto1" })).status, 201);
  assert.strictEqual((await pedir("/auth/registro", "POST", { usuario: "ANA", password: "secreto1" })).status, 409);
  assert.strictEqual((await pedir("/auth/registro", "POST", { usuario: "x", password: "1" })).status, 400);
  assert.strictEqual((await pedir("/auth/login", "POST", { usuario: "ana", password: "mala" })).status, 401);
  assert.strictEqual((await pedir("/auth/login", "POST", { usuario: "ana", password: "secreto1" })).status, 200);
});
test("cada usuario ve solo sus tareas", async () => {
  const a = (await (await pedir("/auth/login", "POST", { usuario: "ana", password: "secreto1" })).json()).token;
  const b = (await (await pedir("/auth/registro", "POST", { usuario: "beto", password: "secreto2" })).json()).token;
  assert.strictEqual((await pedir("/tareas", "POST", tarea, a)).status, 201);
  assert.strictEqual((await (await pedir("/tareas", "GET", undefined, a)).json()).length, 1);
  assert.strictEqual((await (await pedir("/tareas", "GET", undefined, b)).json()).length, 0);
  assert.strictEqual((await pedir("/tareas", "GET", undefined, a + "x")).status, 401);
});
