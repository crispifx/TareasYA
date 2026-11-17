// TaskForm.jsx (VERSIÓN ANTES DEL REFACTOR)
// Problema: handleSubmit hace demasiadas cosas a la vez:
// valida, arma el objeto tarea, genera id y fecha, guarda en localStorage
// y limpia el formulario. Todo mezclado, difícil de testear y de leer.

import { useState } from "react";
import { loadTasks, saveTasks } from "../logic/taskStorage";

export default function TaskForm({ onTaskCreated }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [materia, setMateria] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    // validación de título
    if (!titulo || titulo.trim() === "") {
      setError("El título es obligatorio");
      return;
    }
    // validación de materia
    if (!materia || materia.trim() === "") {
      setError("La materia es obligatoria");
      return;
    }
    // validación de fecha
    if (!fechaLimite) {
      setError("La fecha límite es obligatoria");
      return;
    }
    const fechaLimiteDate = new Date(fechaLimite);
    if (isNaN(fechaLimiteDate.getTime())) {
      setError("La fecha límite no es válida");
      return;
    }
    // validación de prioridad
    if (!["baja", "media", "alta"].includes(prioridad)) {
      setError("La prioridad no es válida");
      return;
    }

    // generación de id (mezclado acá adentro)
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const nuevaTarea = {
      id,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      materia: materia.trim(),
      fechaLimite: fechaLimiteDate.toISOString(),
      prioridad,
      estado: "pendiente",
      favorito: false,
      fechaCreacion: new Date().toISOString(),
    };

    // guardado directo en localStorage desde el componente
    const tareasActuales = loadTasks();
    tareasActuales.push(nuevaTarea);
    saveTasks(tareasActuales);

    // limpieza del formulario
    setTitulo("");
    setDescripcion("");
    setMateria("");
    setFechaLimite("");
    setPrioridad("media");
    setError("");

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
