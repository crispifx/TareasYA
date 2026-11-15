// Guarda el usuario de la petición en curso (para que el repositorio elija su archivo).
const { AsyncLocalStorage } = require("async_hooks");
module.exports = { als: new AsyncLocalStorage() };
