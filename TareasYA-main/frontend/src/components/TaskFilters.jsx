// TaskFilters.jsx: búsqueda, filtros y orden. Componente controlado.
import { ESTADOS_VALIDOS, LIMITES, PRIORIDADES_VALIDAS, limpiarBusqueda } from "../logic/taskLogic";
import { Icono } from "./Icono";

export const FILTROS_INICIALES = { q: "", materia: "", estado: "", prioridad: "", soloFavoritas: false };
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export default function TaskFilters({ filtros, setFiltros, orden, setOrden, materias }) {
  const set = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value });
  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <section className="panel filtros" aria-label="Búsqueda y filtros">
      <div className="filtros-cabecera">
        <h2><Icono n="filtro" size={16} />Filtrar</h2>
        {hayFiltros && <button type="button" className="enlace" onClick={() => setFiltros(FILTROS_INICIALES)}>Limpiar</button>}
      </div>
      <div className="entrada-icono">
        <Icono n="buscar" size={16} />
        <input type="search" value={filtros.q} maxLength={LIMITES.busquedaMax}
          onChange={(e) => setFiltros({ ...filtros, q: limpiarBusqueda(e.target.value) })}
          placeholder="Buscar por título o materia" aria-label="Buscar" />
      </div>
      <div className="fila">
        <select value={filtros.materia} onChange={set("materia")} aria-label="Materia">
          <option value="">Materia: todas</option>
          {materias.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtros.estado} onChange={set("estado")} aria-label="Estado">
          <option value="">Estado: todos</option>
          {ESTADOS_VALIDOS.map((e) => <option key={e} value={e}>{mayus(e)}</option>)}
        </select>
        <select value={filtros.prioridad} onChange={set("prioridad")} aria-label="Prioridad">
          <option value="">Prioridad: todas</option>
          {PRIORIDADES_VALIDAS.map((p) => <option key={p} value={p}>{mayus(p)}</option>)}
        </select>
      </div>
      <div className="pie-filtros">
        <label className="interruptor">
          <input type="checkbox" checked={filtros.soloFavoritas} onChange={(e) => setFiltros({ ...filtros, soloFavoritas: e.target.checked })} />
          Solo favoritas
        </label>
        <select value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar por" style={{ width: "auto" }}>
          <option value="fecha">Ordenar: fecha límite</option>
          <option value="prioridad">Ordenar: prioridad</option>
          <option value="creacion">Ordenar: más recientes</option>
        </select>
      </div>
    </section>
  );
}
