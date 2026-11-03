// TaskForm.jsx (VERSIÓN DESPUÉS DEL REFACTOR)
// El componente ahora solo maneja el estado del formulario y la UI.
// La validación y la creación de la tarea viven en src/logic/taskLogic.js,
// donde se pueden testear sin necesidad de renderizar React.

import { useState } from "react";
import { validarDatosTarea, crearTarea } from "../logic/taskLogic";
import { loadTasks, saveTasks } from "../logic/taskStorage";

export default function TaskForm({ onTaskCreated }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [materia, setMateria] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [error, setError] = useState("");

  function limpiarFormulario() {
    setTitulo("");
    setDescripcion("");
    setMateria("");
    setFechaLimite("");
    setPrioridad("media");
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    const datos = { titulo, descripcion, materia, fechaLimite, prioridad };
    const { valido, error: errorValidacion } = validarDatosTarea(datos);

    if (!valido) {
      setError(errorValidacion);
      return;
    }

    const nuevaTarea = crearTarea(datos);

    const tareasActuales = loadTasks();
    saveTasks([...tareasActuales, nuevaTarea]);

    limpiarFormulario();
    if (onTaskCreated) onTaskCreated(nuevaTarea);
  }

  return (
    <form onSubmit={handleSubmit} className="task-form">
      {error && <p className="error">{error}</p>}
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" />
      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
      <input value={materia} onChange={(e) => setMateria(e.target.value)} placeholder="Materia" />
      <input type="datetime-local" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
      <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
        <option value="baja">Baja</option>
        <option value="media">Media</option>
        <option value="alta">Alta</option>
      </select>
      <button type="submit">Crear tarea</button>
    </form>
  );
}
