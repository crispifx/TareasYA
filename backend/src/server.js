// src/server.js: único archivo que abre el puerto.
const app = require("./app");

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TareasYA backend escuchando en http://localhost:${PORT}`);
});
