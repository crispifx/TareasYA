// TaskList.jsx: lista de tareas y acciones rápidas por tarea.
import { ESTADOS_VALIDOS, estaVencida, textoVencimiento } from "../logic/taskLogic";

function TaskItem({ tarea, onCambiar, onEditar, onEliminar }) {
  const vencida = estaVencida(tarea);
  return (
    <li className={`card tarea prio-${tarea.prioridad} ${tarea.estado === "completada" ? "hecha" : ""}`}>
      <div className="tarea-cabecera">
        <button
          type="button"
          className={`check-circulo ${tarea.estado === "completada" ? "ok" : ""}`}
          onClick={() => onCambiar(tarea.id, { estado: tarea.estado === "completada" ? "pendiente" : "completada" })}
          aria-label={tarea.estado === "completada" ? "Marcar como pendiente" : "Marcar como completada"}
        >{tarea.estado === "completada" ? "✓" : ""}</button>
        <h3>{tarea.titulo}</h3>
        <button
          type="button"
          className={`estrella ${tarea.favorito ? "activa" : ""}`}
          onClick={() => onCambiar(tarea.id, { favorito: !tarea.favorito })}
          aria-pressed={tarea.favorito}
          aria-label={tarea.favorito ? "Quitar de favoritas" : "Marcar como favorita"}
        >
          {tarea.favorito ? "★" : "☆"}
        </button>
      </div>
      <p className="meta">
        <span className="etiqueta">{tarea.materia}</span>
        <span className={`etiqueta prio`}>{tarea.prioridad}</span>
        <span className={vencida ? "vence rojo" : "vence"}>
          {new Date(tarea.fechaLimite).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
          {tarea.estado !== "completada" && ` · ${textoVencimiento(tarea)}`}
        </span>
      </p>
      {tarea.descripcion && <p className="descripcion">{tarea.descripcion}</p>}
      <div className="acciones">
        <select value={tarea.estado} onChange={(e) => onCambiar(tarea.id, { estado: e.target.value })} aria-label="Estado de la tarea">
          {ESTADOS_VALIDOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <button type="button" className="secundario" onClick={() => onEditar(tarea)}>Editar</button>
        <button type="button" className="peligro" onClick={() => onEliminar(tarea)}>Eliminar</button>
      </div>
    </li>
  );
}

const COLUMNAS = [["pendiente", "Pendientes"], ["en curso", "En curso"], ["completada", "Completadas"]];

export default function TaskList({ tareas, hayTareas, vista = "lista", ...acciones }) {
  if (tareas.length === 0) {
    return (
      <p className="vacio">
        {hayTareas ? "Ninguna tarea coincide con los filtros." : "Todavía no cargaste tareas. ¡Creá la primera!"}
      </p>
    );
  }
  if (vista === "tablero") {
    return (
      <div className="tablero">
        {COLUMNAS.map(([estado, titulo]) => {
          const items = tareas.filter((t) => t.estado === estado);
          return (
            <section key={estado} className="columna" aria-label={titulo}>
              <h2>{titulo} <span>{items.length}</span></h2>
              <ul className="lista">
                {items.map((t) => <TaskItem key={t.id} tarea={t} {...acciones} />)}
              </ul>
            </section>
          );
        })}
      </div>
    );
  }
  return (
    <ul className="lista">
      {tareas.map((t) => <TaskItem key={t.id} tarea={t} {...acciones} />)}
    </ul>
  );
}
