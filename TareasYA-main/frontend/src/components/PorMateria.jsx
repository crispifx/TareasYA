// PorMateria.jsx: avance por materia. Al hacer clic en una fila se filtra por esa materia.
import { resumenPorMateria } from "../logic/taskLogic";
import { Icono } from "./Icono";

export default function PorMateria({ tareas, materiaActiva, onElegir }) {
  const filas = resumenPorMateria(tareas);
  if (filas.length === 0) return null;
  return (
    <section className="panel por-materia" aria-label="Avance por materia">
      <h2><Icono n="libro" size={16} />Por materia</h2>
      <ul>
        {filas.map((f) => (
          <li key={f.materia}>
            <button type="button" className={f.materia === materiaActiva ? "on" : ""} aria-pressed={f.materia === materiaActiva}
              onClick={() => onElegir(f.materia === materiaActiva ? "" : f.materia)}
              title={f.materia === materiaActiva ? "Quitar filtro" : `Ver solo ${f.materia}`}>
              <span className="materia-linea"><span className="materia-nombre">{f.materia}</span><span className="materia-cuenta">{f.completadas}/{f.total}</span></span>
              <span className="barra chica" aria-hidden="true"><i style={{ width: `${f.pct}%` }} /></span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
