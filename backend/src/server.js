// src/server.js
const express = require("express");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
app.use(express.json());
app.use("/api", taskRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TareasYA backend escuchando en http://localhost:${PORT}`);
});

module.exports = app;
