// TaskFilters.jsx: búsqueda, filtros y orden. Componente controlado.
import { ESTADOS_VALIDOS, PRIORIDADES_VALIDAS } from "../logic/taskLogic";

export default function TaskFilters({ filtros, setFiltros, orden, setOrden, materias }) {
  const set = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value });
  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <section className="card filtros" aria-label="Búsqueda y filtros">
      <input type="search" value={filtros.q} onChange={set("q")} placeholder="Buscar por título o materia" aria-label="Buscar" />
      <div className="fila">
        <select value={filtros.materia} onChange={set("materia")} aria-label="Materia">
          <option value="">Todas las materias</option>
          {materias.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtros.estado} onChange={set("estado")} aria-label="Estado">
          <option value="">Todos los estados</option>
          {ESTADOS_VALIDOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filtros.prioridad} onChange={set("prioridad")} aria-label="Prioridad">
          <option value="">Toda prioridad</option>
          {PRIORIDADES_VALIDAS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="fila centrado">
        <label className="check">
          <input type="checkbox" checked={filtros.soloFavoritas} onChange={(e) => setFiltros({ ...filtros, soloFavoritas: e.target.checked })} />
          Solo favoritas
        </label>
        <label className="inline">Ordenar:
          <select value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="fecha">Fecha límite</option>
            <option value="prioridad">Prioridad</option>
            <option value="creacion">Más recientes</option>
          </select>
        </label>
        {hayFiltros && (
          <button type="button" className="enlace" onClick={() => setFiltros({ q: "", materia: "", estado: "", prioridad: "", soloFavoritas: false })}>
            Limpiar
          </button>
        )}
      </div>
    </section>
  );
}
