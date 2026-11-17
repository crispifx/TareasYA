// TaskList.jsx: lista de tareas y acciones rápidas por tarea.
import { ESTADOS_VALIDOS, estaVencida, textoVencimiento } from "../logic/taskLogic";
import { Icono } from "./Icono";

const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const HORAS_AVISO = 48;

function BloqueFecha({ tarea, vencida }) {
  const f = new Date(tarea.fechaLimite);
  const horas = (f - new Date()) / 36e5;
  const estado = tarea.estado === "completada" ? "hecha" : vencida ? "vencida" : horas <= HORAS_AVISO ? "pronto" : "";
  return (
    <div className={`fecha-bloque ${estado}`} aria-hidden="true">
      <span className="dia">{f.getDate()}</span>
      <span className="mes">{f.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}</span>
      <span className="hora">{f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
    </div>
  );
}

export function TaskItem({ tarea, onCambiar, onEditar, onEliminar }) {
  const vencida = estaVencida(tarea);
  const hecha = tarea.estado === "completada";
  return (
    <li className={`panel tarea ${hecha ? "hecha" : ""}`}>
      <BloqueFecha tarea={tarea} vencida={vencida} />
      <div className="tarea-cuerpo">
        <div className="tarea-cabecera">
          <button
            type="button"
            className={`check-circulo ${hecha ? "ok" : ""}`}
            onClick={() => onCambiar(tarea.id, { estado: hecha ? "pendiente" : "completada" })}
            aria-label={hecha ? "Marcar como pendiente" : "Marcar como completada"}
            title={hecha ? "Marcar como pendiente" : "Marcar como completada"}
          ><Icono n="check" size={14} strokeWidth={3} /></button>
          <h3>{tarea.titulo}</h3>
          <button
            type="button"
            className={`estrella ${tarea.favorito ? "activa" : ""}`}
            onClick={() => onCambiar(tarea.id, { favorito: !tarea.favorito })}
            aria-pressed={tarea.favorito}
            aria-label={tarea.favorito ? "Quitar de favoritas" : "Marcar como favorita"}
            title={tarea.favorito ? "Quitar de favoritas" : "Marcar como favorita"}
          ><Icono n="estrella" size={17} relleno={tarea.favorito} /></button>
        </div>
        <div className="meta">
          <span className="chip materia"><Icono n="libro" size={13} />{tarea.materia}</span>
          <span className={`chip prio prio-${tarea.prioridad}`}>{mayus(tarea.prioridad)}</span>
          <span className={`chip vence ${vencida ? "rojo" : ""}`}>
            <Icono n="reloj" size={13} />
            {new Date(tarea.fechaLimite).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
            {!hecha && ` · ${textoVencimiento(tarea)}`}
          </span>
        </div>
        {tarea.descripcion && <p className="descripcion">{tarea.descripcion}</p>}
        <div className="tarea-acciones">
          <select value={tarea.estado} onChange={(e) => onCambiar(tarea.id, { estado: e.target.value })} aria-label="Estado de la tarea">
            {ESTADOS_VALIDOS.map((e) => <option key={e} value={e}>{mayus(e)}</option>)}
          </select>
          <span className="sep" />
          <button type="button" className="fantasma chico" onClick={() => onEditar(tarea)}><Icono n="lapiz" size={15} />Editar</button>
          <button type="button" className="fantasma peligro chico" onClick={() => onEliminar(tarea)}><Icono n="papelera" size={15} />Eliminar</button>
        </div>
      </div>
    </li>
  );
}

const COLUMNAS = [["pendiente", "Pendientes"], ["en curso", "En curso"], ["completada", "Completadas"]];

export function TaskList({ tareas, hayTareas, vista = "lista", ...acciones }) {
  if (tareas.length === 0) {
    return (
      <div className="vacio">
        <strong>{hayTareas ? "Ninguna tarea coincide con los filtros" : "Todavía no cargaste tareas"}</strong>
        <span>{hayTareas ? "Probá con otra búsqueda o limpiá los filtros." : "Creá la primera desde el formulario."}</span>
      </div>
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

export default TaskList;
