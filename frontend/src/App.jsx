// App.jsx: orquesta datos (taskClient) y componentes de presentación.
import { useEffect, useMemo, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskFilters from "./components/TaskFilters";
import TaskList from "./components/TaskList";
import Calendario from "./components/Calendario";
import { imprimirPDF } from "./logic/pdf";
import {
  filtrarTareas,
  ordenarTareas,
  resumenTareas,
  tareasPorVencer,
  textoVencimiento,
} from "./logic/taskLogic";
import * as cliente from "./logic/taskClient";

const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin storage */ } };
const leer = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };

const FILTROS_INICIALES = { q: "", materia: "", estado: "", prioridad: "", soloFavoritas: false };

export default function App({ usuario, onSalir }) {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [orden, setOrden] = useState("fecha");
  const [editando, setEditando] = useState(null);
  const [vista, setVista] = useState(() => leer("vista", "lista"));
  const [tema, setTema] = useState(() => leer("tema", "auto"));
  const [permisoNotif, setPermisoNotif] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  useEffect(() => {
    if (tema === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = tema;
    guardar("tema", tema);
  }, [tema]);
  useEffect(() => guardar("vista", vista), [vista]);

  const ciclarTema = () => setTema((t) => (t === "auto" ? "dark" : t === "dark" ? "light" : "auto"));

  async function recargar() {
    setTareas(await cliente.listarTareas());
  }

  useEffect(() => {
    (async () => {
      try {
        await recargar();
      } catch (e) {
        setErrorGlobal(e.message);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Recordatorios: aviso del navegador para tareas que vencen en menos de 48 h.
  const porVencer = useMemo(() => tareasPorVencer(tareas), [tareas]);
  useEffect(() => {
    if (permisoNotif !== "granted" || porVencer.length === 0) return;
    const ya = new Set(JSON.parse(sessionStorage.getItem("avisadas") || "[]"));
    porVencer.filter((t) => !ya.has(t.id)).forEach((t) => {
      new Notification(`TareasYA: ${t.titulo}`, { body: `${t.materia} · ${textoVencimiento(t)}` });
      ya.add(t.id);
    });
    sessionStorage.setItem("avisadas", JSON.stringify([...ya]));
  }, [porVencer, permisoNotif]);

  async function accion(fn) {
    setErrorGlobal("");
    try {
      await fn();
      await recargar();
    } catch (e) {
      setErrorGlobal(e.message);
    }
  }

  const crear = (datos) => cliente.crearNuevaTarea(datos).then(recargar);
  const guardarEdicion = (datos) =>
    cliente.actualizarTarea(editando.id, datos).then(recargar).then(() => setEditando(null));
  const cambiar = (id, cambios) => accion(() => cliente.actualizarTarea(id, cambios));
  const eliminar = (t) => {
    if (window.confirm(`¿Eliminar "${t.titulo}"?`)) accion(() => cliente.eliminarTarea(t.id));
  };

  const materias = useMemo(() => [...new Set(tareas.map((t) => t.materia))].sort(), [tareas]);
  const visibles = useMemo(() => ordenarTareas(filtrarTareas(tareas, filtros), orden), [tareas, filtros, orden]);
  const resumen = resumenTareas(tareas);
  const pct = tareas.length ? Math.round((resumen.completadas / tareas.length) * 100) : 0;
  const hora = new Date().getHours();
  const saludo = hora < 6 ? "Buenas noches" : hora < 13 ? "Buen día" : hora < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="saludo">{saludo}, {usuario} 👋</p>
          <h1>Tareas<span>YA</span></h1>
          <p className="sub">Tus entregas, por materia y fecha límite</p>
        </div>
        <div className="herramientas">
          <button type="button" className="icono" onClick={ciclarTema} title="Cambiar tema" aria-label={`Tema: ${tema}`}>
            {tema === "dark" ? "🌙" : tema === "light" ? "☀️" : "🌓"}
          </button>
          <button type="button" className="icono" onClick={() => imprimirPDF(visibles, usuario)} title="Descargar PDF de tus tareas" aria-label="Descargar PDF">📄 PDF</button>
          <button type="button" className="icono" onClick={onSalir} title="Cerrar sesión" aria-label="Cerrar sesión">Salir ⎋</button>
        </div>
      </header>

      {errorGlobal && <p className="error" role="alert">{errorGlobal}</p>}

      <section className="resumen" aria-label="Resumen">
        <div><strong>{resumen.pendientes}</strong><span>pendientes</span></div>
        <div><strong>{resumen.enCurso}</strong><span>en curso</span></div>
        <div><strong>{resumen.completadas}</strong><span>completadas</span></div>
        <div className={resumen.vencidas ? "alerta" : ""}><strong>{resumen.vencidas}</strong><span>vencidas</span></div>
      </section>

      <section className="card progreso" aria-label="Progreso">
        <div className="progreso-txt"><strong>{pct}% completado</strong><span>{resumen.completadas} de {tareas.length} tareas</span></div>
        <div className="barra" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pct}%` }} /></div>
      </section>

      {porVencer.length > 0 && (
        <section className="card por-vencer" aria-label="Por vencer">
          <strong>Por vencer (48 h):</strong>{" "}
          {porVencer.map((t) => `${t.titulo} (${textoVencimiento(t)})`).join(" · ")}
          {permisoNotif === "default" && (
            <button type="button" className="enlace" onClick={async () => setPermisoNotif(await Notification.requestPermission())}>
              Activar avisos
            </button>
          )}
        </section>
      )}

      <TaskForm
        key={editando ? editando.id : "nueva"}
        tareaEditar={editando}
        onSubmit={editando ? guardarEdicion : crear}
        onCancel={() => setEditando(null)}
      />

      <TaskFilters filtros={filtros} setFiltros={setFiltros} orden={orden} setOrden={setOrden} materias={materias} />

      <div className="vistas" role="group" aria-label="Vista">
        <button type="button" className={vista === "lista" ? "on" : ""} onClick={() => setVista("lista")}>☰ Lista</button>
        <button type="button" className={vista === "tablero" ? "on" : ""} onClick={() => setVista("tablero")}>▦ Tablero</button>
        <button type="button" className={vista === "calendario" ? "on" : ""} onClick={() => setVista("calendario")}>📅 Calendario</button>
        <span>{visibles.length} {visibles.length === 1 ? "tarea" : "tareas"}</span>
      </div>

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : (
        (() => {
          const acc = {
            onCambiar: cambiar,
            onEditar: (t) => { setEditando(t); window.scrollTo({ top: 0, behavior: "smooth" }); },
            onEliminar: eliminar,
          };
          return vista === "calendario"
            ? <Calendario tareas={visibles} {...acc} />
            : <TaskList tareas={visibles} hayTareas={tareas.length > 0} vista={vista} {...acc} />;
        })()
      )}
    </main>
  );
}
