// TaskForm.jsx
// Formulario de alta y edición. Solo maneja estado de UI: la validación vive en
// logic/taskLogic.js y quién guarda (API o local) lo decide el padre vía onSubmit.

import { useState } from "react";
import { validarDatosTarea, aInputFecha } from "../logic/taskLogic";

const VACIO = { titulo: "", descripcion: "", materia: "", fechaLimite: "", prioridad: "media" };

export default function TaskForm({ tareaEditar, onSubmit, onCancel }) {
  const [datos, setDatos] = useState(
    tareaEditar
      ? {
          titulo: tareaEditar.titulo,
          descripcion: tareaEditar.descripcion,
          materia: tareaEditar.materia,
          fechaLimite: aInputFecha(tareaEditar.fechaLimite),
          prioridad: tareaEditar.prioridad,
        }
      : VACIO
  );
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    const { valido, error: errorValidacion } = validarDatosTarea(datos);
    if (!valido) return setError(errorValidacion);

    setEnviando(true);
    try {
      await onSubmit(datos);
      if (!tareaEditar) setDatos(VACIO);
      setError("");
    } catch (err) {
      setError(err.message); // ej: duplicada (409) o error del servidor
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card task-form" noValidate>
      <h2>{tareaEditar ? "Editar tarea" : "Nueva tarea"}</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <label>Título
        <input value={datos.titulo} onChange={cambiar("titulo")} placeholder="Ej: TP de Física" maxLength={100} />
      </label>
      <label>Descripción
        <textarea value={datos.descripcion} onChange={cambiar("descripcion")} placeholder="Detalle (opcional)" maxLength={500} rows={2} />
      </label>
      <div className="fila">
        <label>Materia
          <input value={datos.materia} onChange={cambiar("materia")} placeholder="Ej: Física" />
        </label>
        <label>Prioridad
          <select value={datos.prioridad} onChange={cambiar("prioridad")}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </label>
      </div>
      <label>Fecha límite
        <input type="datetime-local" value={datos.fechaLimite} onChange={cambiar("fechaLimite")} />
      </label>
      <div className="acciones">
        <button type="submit" disabled={enviando}>
          {tareaEditar ? "Guardar cambios" : "Crear tarea"}
        </button>
        {tareaEditar && (
          <button type="button" className="secundario" onClick={onCancel}>Cancelar</button>
        )}
      </div>
    </form>
  );
}
