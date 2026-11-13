// src/app.js
// Arma la app Express SIN abrirla en un puerto (así se puede testear).
const express = require("express");
const path = require("path");
const fs = require("fs");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use("/api", taskRoutes);

// Rutas de la API que no existen
app.use("/api", (req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Producción: sirve el frontend compilado (frontend/dist) desde el mismo servidor.
const dist = path.join(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, "index.html")));
}

// Manejo central de errores: nunca se filtran detalles internos al cliente.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "El JSON enviado no es válido" });
  if (err.type === "entity.too.large")
    return res.status(413).json({ error: "El cuerpo es demasiado grande" });
  console.error(err);
  return res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
