// src/services/taskService.js
// Service: reglas de negocio. No sabe nada de HTTP (eso es del Controller)
// ni de cómo se persisten los datos (eso es del Repository).

const { validarDatosTarea, crearTarea } = require("../logic/taskLogic");
const repo = require("../repositories/taskRepository");

function crearNuevaTarea(datosCrudos) {
  // 1) Validación de formato/obligatoriedad (delegada a la lógica pura)
  const { valido, error } = validarDatosTarea(datosCrudos);
  if (!valido) {
    return { ok: false, status: 400, error };
  }

  // 2) Regla de negocio que la IA NO propuso originalmente:
  //    no permitir dos tareas activas con el mismo título+materia.
  //    (Ver justificación de esta decisión en la entrega.)
  const yaExiste = repo.existeMateriaYTitulo(
    datosCrudos.titulo,
    datosCrudos.materia
  );
  if (yaExiste) {
    return {
      ok: false,
      status: 409,
      error: "Ya existe una tarea activa con ese título en esa materia",
    };
  }

  // 3) Construcción y persistencia
  const tarea = crearTarea(datosCrudos);
  repo.agregar(tarea);
  return { ok: true, status: 201, tarea };
}

function listarTareas() {
  return repo.obtenerTodas();
}

module.exports = { crearNuevaTarea, listarTareas };
