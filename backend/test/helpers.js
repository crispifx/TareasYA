// Utilidades compartidas por los tests de la API.
// Cada archivo de test corre en su propio proceso, con su propia base temporal.
const fs = require("fs");
const os = require("os");
const path = require("path");

function crearEntorno() {
  const DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "tareasya-")), "db.json");
  process.env.TAREASYA_DB = DB;
  const app = require("../src/app");
  let server;
  let base;

  return {
    async iniciar() {
      await new Promise((r) => (server = app.listen(0, r)));
      base = `http://localhost:${server.address().port}/api`;
      fs.writeFileSync(DB, "[]");
    },
    cerrar: () => server.close(),
    limpiar: () => fs.writeFileSync(DB, "[]"),
    pedir: (ruta, metodo = "GET", cuerpo) =>
      fetch(base + ruta, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      }),
  };
}

const enHoras = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
const tareaValida = (extra = {}) => ({
  titulo: "Tarea " + Math.random().toString(36).slice(2, 7),
  materia: "Física",
  fechaLimite: enHoras(200),
  prioridad: "media",
  ...extra,
});

module.exports = { crearEntorno, enHoras, tareaValida };
