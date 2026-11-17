// CICLO 3: validación estricta (título, materia, descripción, fecha y hora, filtros y credenciales).
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { crearEntorno, enHoras, tareaValida, tareaGuardada } = require("./helpers");
const {
  validarDatosTarea,
  validarCambios,
  validarConsulta,
  errorUsuario,
  errorPassword,
  normalizarTexto,
} = require("../src/logic/taskLogic");

const env = crearEntorno();
before(() => env.iniciar());
after(() => env.cerrar());
beforeEach(() => env.limpiar());

const AHORA = new Date("2026-11-16T12:00:00.000Z");
const base = (extra = {}) => ({
  titulo: "TP de Física",
  materia: "Física",
  fechaLimite: "2026-12-01T20:00",
  prioridad: "alta",
  ...extra,
});
const error = (extra) => validarDatosTarea(base(extra), AHORA).error;

// ---------- título ----------
test("título: mínimo 3 caracteres, contando sin espacios de más", () => {
  assert.equal(error({ titulo: "ab" }), "El título debe tener al menos 3 caracteres");
  assert.equal(error({ titulo: "   ab   " }), "El título debe tener al menos 3 caracteres");
  assert.equal(error({ titulo: "TP1" }), null);
});
test("título: exige al menos una letra", () => {
  assert.equal(error({ titulo: "12345" }), "El título debe incluir al menos una letra");
  assert.equal(error({ titulo: "?!?!?" }), "El título debe incluir al menos una letra");
});
test("título: rechaza símbolos fuera de la lista permitida", () => {
  assert.equal(error({ titulo: "TP <script>" }), "El título tiene caracteres no permitidos");
  assert.equal(error({ titulo: "TP 😀" }), "El título tiene caracteres no permitidos");
  assert.equal(error({ titulo: "TP\u0000x" }), "El título tiene caracteres no permitidos");
});
test("título: acepta tildes, ñ y puntuación habitual", () => {
  assert.equal(error({ titulo: "Informe N° 2: ¿Qué es la energía? (parcial)" }), null);
  assert.equal(error({ titulo: "Año nuevo, vida nueva" }), null);
});
test("título: no admite el mismo carácter más de 3 veces seguidas", () => {
  assert.equal(error({ titulo: "Holaaaaa" }), "El título no puede repetir un mismo carácter más de 3 veces seguidas");
  assert.equal(error({ titulo: "Holaaa" }), null);
});

// ---------- materia ----------
test("materia: mínimo 2 y máximo 40 caracteres", () => {
  assert.equal(error({ materia: "F" }), "La materia debe tener al menos 2 caracteres");
  assert.equal(error({ materia: "x".repeat(41) }), "La materia no puede superar los 40 caracteres");
  assert.equal(error({ materia: "Ed" }), null);
});
test("materia: solo letras, números, espacios y . - ' & ( )", () => {
  assert.equal(error({ materia: "Física #1" }), "La materia solo admite letras, números, espacios y . - ' & ( )");
  assert.equal(error({ materia: "Mate <b>" }), "La materia solo admite letras, números, espacios y . - ' & ( )");
  assert.equal(error({ materia: "Matemática II (Cálculo)" }), null);
  assert.equal(error({ materia: "Ed. Física" }), null);
});
test("materia: no puede ser solo números ni repetir un carácter", () => {
  assert.equal(error({ materia: "2024" }), "La materia debe incluir al menos una letra");
  assert.equal(error({ materia: "Hoooola" }), "La materia no puede repetir un mismo carácter más de 3 veces seguidas");
});
test("normalizarTexto colapsa espacios internos", () => {
  assert.equal(normalizarTexto("  TP   de    Física "), "TP de Física");
});

// ---------- descripción ----------
test("descripción: máximo 500 y sin caracteres de control (el salto de línea sí)", () => {
  assert.equal(error({ descripcion: "x".repeat(501) }), "La descripción no puede superar los 500 caracteres");
  assert.equal(error({ descripcion: "a\u0007b" }), "La descripción tiene caracteres no permitidos");
  assert.equal(error({ descripcion: "Línea 1\nLínea 2" }), null);
});

// ---------- fecha y hora ----------
test("fecha: debe traer fecha y hora", () => {
  assert.equal(error({ fechaLimite: "2026-12-01" }), "La fecha límite debe incluir fecha y hora");
});
test("fecha: rechaza días que no existen (31 de febrero, 30 de abril)", () => {
  assert.equal(error({ fechaLimite: "2027-02-31T10:00" }), "La fecha límite no es válida");
  assert.equal(error({ fechaLimite: "2027-04-31T10:00" }), "La fecha límite no es válida");
  assert.equal(error({ fechaLimite: "2028-02-29T10:00" }), null); // 2028 es bisiesto
  assert.equal(error({ fechaLimite: "2027-02-29T10:00" }), "La fecha límite no es válida");
});
test("hora: rechaza 24:00, minutos 60 y formatos raros", () => {
  assert.equal(error({ fechaLimite: "2026-12-01T24:00" }), "La fecha límite no es válida");
  assert.equal(error({ fechaLimite: "2026-12-01T10:60" }), "La fecha límite no es válida");
  assert.equal(error({ fechaLimite: "mañana a las 10" }), "La fecha límite no es válida");
  assert.equal(error({ fechaLimite: 20261201 }), "La fecha límite no es válida");
});
test("fecha: no puede estar en el pasado ni ser exactamente ahora", () => {
  assert.equal(error({ fechaLimite: "2026-11-16T11:59:00.000Z" }), "La fecha límite debe ser posterior al momento actual");
  assert.equal(error({ fechaLimite: "2026-11-16T12:00:00.000Z" }), "La fecha límite debe ser posterior al momento actual");
  assert.equal(error({ fechaLimite: "2026-11-16T12:01:00.000Z" }), null);
});
test("fecha: no puede superar los 5 años hacia adelante", () => {
  assert.equal(error({ fechaLimite: "2032-01-01T10:00:00.000Z" }), "La fecha límite no puede superar los 5 años desde hoy");
  assert.equal(error({ fechaLimite: "2031-11-01T10:00:00.000Z" }), null);
});
test("validarCambios: la fecha editada también se revisa (formato y horizonte)", () => {
  assert.equal(validarCambios({ fechaLimite: "2026-12-01" }, AHORA).error, "La fecha límite debe incluir fecha y hora");
  assert.equal(validarCambios({ fechaLimite: "2040-01-01T10:00:00.000Z" }, AHORA).error, "La fecha límite no puede superar los 5 años desde hoy");
  assert.equal(validarCambios({ titulo: "ab" }, AHORA).error, "El título debe tener al menos 3 caracteres");
});

// ---------- filtros de la consulta ----------
test("consulta: estado, prioridad, orden y favorito solo aceptan valores conocidos", () => {
  assert.equal(validarConsulta({ estado: "hecho" }).error, "El estado no es válido");
  assert.equal(validarConsulta({ prioridad: "urgente" }).error, "La prioridad no es válida");
  assert.equal(validarConsulta({ orden: "azar" }).error, "El orden no es válido");
  assert.equal(validarConsulta({ favorito: "quizás" }).error, "El filtro favorito debe ser true o false");
  assert.equal(validarConsulta({ estado: "en curso", prioridad: "alta", orden: "prioridad", favorito: "true" }).valido, true);
  assert.equal(validarConsulta({}).valido, true);
});
test("consulta: la búsqueda es texto de hasta 50 caracteres", () => {
  assert.equal(validarConsulta({ q: "x".repeat(51) }).error, "La búsqueda no puede superar los 50 caracteres");
  assert.equal(validarConsulta({ q: ["a", "b"] }).error, "La búsqueda debe ser texto");
  assert.equal(validarConsulta({ materia: "m".repeat(41) }).error, "La materia no puede superar los 40 caracteres");
});

// ---------- credenciales ----------
test("usuario: 3 a 30 caracteres, empieza y termina con letra o número", () => {
  assert.equal(errorUsuario("ana"), null);
  assert.equal(errorUsuario("ana.perez_01"), null);
  assert.match(errorUsuario("_ana"), /Usuario/);
  assert.match(errorUsuario("ana."), /Usuario/);
  assert.match(errorUsuario("a b"), /Usuario/);
  assert.match(errorUsuario("x".repeat(31)), /Usuario/);
});
test("contraseña: 8 a 72, con letras y números, distinta del usuario y no trivial", () => {
  assert.equal(errorPassword("secreto12", "ana"), null);
  assert.equal(errorPassword("corta1", "ana"), "La contraseña debe tener entre 8 y 72 caracteres");
  assert.equal(errorPassword("solo letras", "ana"), "La contraseña debe combinar letras y números");
  assert.equal(errorPassword("123456789", "ana"), "La contraseña debe combinar letras y números");
  assert.equal(errorPassword("ana12345", "ANA12345"), "La contraseña no puede ser igual al usuario");
  assert.equal(errorPassword("password1", "ana"), "Esa contraseña es demasiado común");
});

// ---------- API ----------
test("POST: título con símbolos prohibidos responde 400", async () => {
  const r = await env.pedir("/tareas", "POST", tareaValida({ titulo: "TP <x>" }));
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "El título tiene caracteres no permitidos");
});
test("POST: fecha pasada responde 400", async () => {
  const r = await env.pedir("/tareas", "POST", tareaValida({ fechaLimite: enHoras(-1) }));
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "La fecha límite debe ser posterior al momento actual");
});
test("POST guarda título y materia con los espacios normalizados", async () => {
  const r = await env.pedir("/tareas", "POST", tareaValida({ titulo: "  TP   de   Redes ", materia: " Redes   I " }));
  const t = await r.json();
  assert.equal(t.titulo, "TP de Redes");
  assert.equal(t.materia, "Redes I");
});
test("POST: duplicado detectado aunque cambien los espacios internos", async () => {
  await env.pedir("/tareas", "POST", tareaValida({ titulo: "TP de Redes" }));
  const r = await env.pedir("/tareas", "POST", tareaValida({ titulo: "TP  de   redes" }));
  assert.equal(r.status, 409);
});
test("PATCH: mover la fecha al pasado se rechaza", async () => {
  const t = await (await env.pedir("/tareas", "POST", tareaValida())).json();
  const r = await env.pedir(`/tareas/${t.id}`, "PATCH", { fechaLimite: enHoras(-2) });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "La fecha límite debe ser posterior al momento actual");
});
test("PATCH: una tarea vencida puede cambiar de estado sin tocar su fecha", async () => {
  const vieja = tareaGuardada({ fechaLimite: enHoras(-48) });
  env.sembrar([vieja]);
  const r = await env.pedir(`/tareas/${vieja.id}`, "PATCH", { estado: "completada" });
  assert.equal(r.status, 200);
});
test("PATCH: reenviar la misma fecha vencida no se considera un cambio", async () => {
  const vieja = tareaGuardada({ fechaLimite: enHoras(-48) });
  env.sembrar([vieja]);
  const r = await env.pedir(`/tareas/${vieja.id}`, "PATCH", { titulo: "Título nuevo", fechaLimite: vieja.fechaLimite });
  assert.equal(r.status, 200);
});
test("GET con filtros inválidos responde 400 y con filtros válidos 200", async () => {
  const r = await env.pedir("/tareas?estado=hecho");
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "El estado no es válido");
  assert.equal((await env.pedir("/tareas?orden=azar")).status, 400);
  assert.equal((await env.pedir("/tareas?q=a&q=b")).status, 400);
  assert.equal((await env.pedir("/tareas?estado=pendiente&orden=prioridad")).status, 200);
});
