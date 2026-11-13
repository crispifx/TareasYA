// App.jsx: orquesta datos (taskClient) y componentes de presentación.
import { useEffect, useMemo, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskFilters from "./components/TaskFilters";
import TaskList from "./components/TaskList";
import {
  filtrarTareas,
  ordenarTareas,
  resumenTareas,
  tareasPorVencer,
  textoVencimiento,
} from "./logic/taskLogic";
import * as cliente from "./logic/taskClient";

const FILTROS_INICIALES = { q: "", materia: "", estado: "", prioridad: "", soloFavoritas: false };

export default function App() {
  const [tareas, setTareas] = useState([]);
  const [modo, setModo] = useState("api");
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [orden, setOrden] = useState("fecha");
  const [editando, setEditando] = useState(null);
  const [permisoNotif, setPermisoNotif] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  async function recargar() {
    setTareas(await cliente.listarTareas());
  }

  useEffect(() => {
    (async () => {
      try {
        setModo(await cliente.detectarModo());
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

  return (
    <main className="app">
      <header>
        <h1>TareasYA</h1>
        <p className="sub">Tus tareas, por materia y fecha de entrega</p>
        {modo === "local" && (
          <p className="aviso">Modo local: no se encontró el servidor, los datos se guardan en este navegador.</p>
        )}
      </header>

      {errorGlobal && <p className="error" role="alert">{errorGlobal}</p>}

      <section className="resumen" aria-label="Resumen">
        <div><strong>{resumen.pendientes}</strong><span>pendientes</span></div>
        <div><strong>{resumen.enCurso}</strong><span>en curso</span></div>
        <div><strong>{resumen.completadas}</strong><span>completadas</span></div>
        <div className={resumen.vencidas ? "alerta" : ""}><strong>{resumen.vencidas}</strong><span>vencidas</span></div>
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

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : (
        <TaskList
          tareas={visibles}
          hayTareas={tareas.length > 0}
          onCambiar={cambiar}
          onEditar={(t) => { setEditando(t); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onEliminar={eliminar}
        />
      )}
    </main>
  );
}
