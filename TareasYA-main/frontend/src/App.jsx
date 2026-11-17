// App.jsx: orquesta datos (taskClient) y componentes de presentación.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskFilters, { FILTROS_INICIALES } from "./components/TaskFilters";
import TaskList from "./components/TaskList";
import Calendario from "./components/Calendario";
import { Icono } from "./components/Icono";
import PorMateria from "./components/PorMateria";
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

export default function App({ usuario, onSalir }) {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [orden, setOrden] = useState("fecha");
  const [editando, setEditando] = useState(null);
  const [ocultas, setOcultas] = useState(() => new Set()); // eliminadas con "Deshacer" pendiente
  const [avisos, setAvisos] = useState([]);
  const pendientes = useRef(new Map()); // id -> { timer, tarea }
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
  const porVencer = useMemo(() => tareasPorVencer(tareas.filter((t) => !ocultas.has(t.id))), [tareas, ocultas]);
  useEffect(() => {
    if (permisoNotif !== "granted" || porVencer.length === 0) return;
    const ya = new Set(JSON.parse(sessionStorage.getItem("avisadas") || "[]"));
    porVencer.filter((t) => !ya.has(t.id)).forEach((t) => {
      new Notification(`TareasYA: ${t.titulo}`, { body: `${t.materia} · ${textoVencimiento(t)}` });
      ya.add(t.id);
    });
    sessionStorage.setItem("avisadas", JSON.stringify([...ya]));
  }, [porVencer, permisoNotif]);

  const quitarAviso = useCallback((id) => setAvisos((a) => a.filter((x) => x.id !== id)), []);
  const avisar = useCallback((texto, { deshacer, ms = 3500 } = {}) => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a.slice(-2), { id, texto, deshacer }]);
    setTimeout(() => quitarAviso(id), ms);
  }, [quitarAviso]);

  // Atajos: "/" busca, "n" abre una tarea nueva (solo fuera de los campos de texto).
  useEffect(() => {
    const alTeclear = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const foco = { "/": "busqueda", n: "f-titulo" }[e.key];
      if (!foco) return;
      e.preventDefault();
      document.getElementById(foco)?.focus();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  // Al salir de la pantalla, las eliminaciones que esperaban "Deshacer" se confirman.
  useEffect(() => () => pendientes.current.forEach(({ timer, tarea }) => { clearTimeout(timer); cliente.eliminarTarea(tarea.id).catch(() => {}); }), []);

  async function accion(fn) {
    setErrorGlobal("");
    try {
      await fn();
      await recargar();
    } catch (e) {
      setErrorGlobal(e.message);
    }
  }

  const crear = (datos) => cliente.crearNuevaTarea(datos).then(recargar).then(() => avisar("Tarea creada"));
  const guardarEdicion = (datos) =>
    cliente.actualizarTarea(editando.id, datos).then(recargar).then(() => { setEditando(null); avisar("Cambios guardados"); });
  const cambiar = (id, cambios) => accion(async () => {
    await cliente.actualizarTarea(id, cambios);
    if (cambios.estado === "completada") avisar("Marcada como completada");
  });

  // Eliminar: la tarea se oculta al instante y se borra de verdad a los 6 s, salvo que se toque "Deshacer".
  const eliminar = (t) => {
    if (editando?.id === t.id) setEditando(null);
    setOcultas((o) => new Set(o).add(t.id));
    const timer = setTimeout(() => {
      pendientes.current.delete(t.id);
      cliente.eliminarTarea(t.id)
        .catch((e) => setErrorGlobal(e.message))
        .finally(() => recargar().finally(() => setOcultas((o) => { const n = new Set(o); n.delete(t.id); return n; })));
    }, 6000);
    pendientes.current.set(t.id, { timer, tarea: t });
    avisar(`Eliminaste "${t.titulo}"`, {
      ms: 6000,
      deshacer: () => {
        clearTimeout(timer);
        pendientes.current.delete(t.id);
        setOcultas((o) => { const n = new Set(o); n.delete(t.id); return n; });
      },
    });
  };

  const vivas = useMemo(() => tareas.filter((t) => !ocultas.has(t.id)), [tareas, ocultas]);
  const materias = useMemo(() => [...new Set(vivas.map((t) => t.materia))].sort(), [vivas]);
  const visibles = useMemo(() => ordenarTareas(filtrarTareas(vivas, filtros), orden), [vivas, filtros, orden]);
  const resumen = resumenTareas(vivas);
  const pct = vivas.length ? Math.round((resumen.completadas / vivas.length) * 100) : 0;
  const hora = new Date().getHours();
  const saludo = hora < 6 ? "Buenas noches" : hora < 13 ? "Buen día" : hora < 20 ? "Buenas tardes" : "Buenas noches";
  const activas = resumen.pendientes + resumen.enCurso;
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const frase = vivas.length === 0
    ? "Cargá tu primera entrega para empezar."
    : activas === 0
      ? "Estás al día: no tenés entregas pendientes."
      : [
          `Tenés ${plural(activas, "entrega activa", "entregas activas")}`,
          resumen.vencidas ? `${plural(resumen.vencidas, "ya venció", "ya vencieron")}` : null,
          porVencer.length ? `${plural(porVencer.length, "vence", "vencen")} en 48 h` : null,
        ].filter(Boolean).join(", ") + ".";
  const temaIcono = tema === "dark" ? "luna" : tema === "light" ? "sol" : "auto";
  const temaTexto = tema === "dark" ? "oscuro" : tema === "light" ? "claro" : "automático";

  const acc = {
    onCambiar: cambiar,
    onEditar: (t) => { setEditando(t); if (window.innerWidth < 1000) window.scrollTo({ top: 0, behavior: "smooth" }); },
    onEliminar: eliminar,
  };

  return (
    <main className="app">
      <header className="barra-superior">
        <span className="marca"><span className="marca-logo"><Icono n="tilde" size={19} /></span>TareasYA</span>
        <div className="herramientas">
          <span className="usuario"><span className="avatar" aria-hidden="true">{usuario.slice(0, 1)}</span>{usuario}</span>
          <button type="button" className="icono" onClick={ciclarTema} title={`Tema ${temaTexto} (clic para cambiar)`} aria-label={`Tema: ${temaTexto}`}><Icono n={temaIcono} /></button>
          <button type="button" className="icono texto" onClick={() => imprimirPDF(visibles, usuario)} title="Descargar PDF de tus tareas" aria-label="Descargar PDF"><Icono n="pdf" size={17} />PDF</button>
          <button type="button" className="icono texto" onClick={onSalir} title="Cerrar sesión" aria-label="Cerrar sesión"><Icono n="salir" size={17} />Salir</button>
        </div>
      </header>

      <div className="encabezado">
        <h1>{saludo}, {usuario}</h1>
        <p>{frase}</p>
      </div>

      {errorGlobal && <p className="error-general" role="alert"><Icono n="alerta" size={16} />{errorGlobal}</p>}

      <section className="panel metricas" aria-label="Resumen">
        <div className="metricas-grilla">
          <div className="metrica pendientes"><span>Pendientes</span><strong>{resumen.pendientes}</strong></div>
          <div className="metrica en-curso"><span>En curso</span><strong>{resumen.enCurso}</strong></div>
          <div className="metrica completadas"><span>Completadas</span><strong>{resumen.completadas}</strong></div>
          <div className={`metrica vencidas ${resumen.vencidas ? "activa" : ""}`}><span>Vencidas</span><strong>{resumen.vencidas}</strong></div>
        </div>
        <div className="progreso" aria-label="Progreso">
          <div className="progreso-txt"><strong>{pct}% completado</strong><span>{resumen.completadas} de {vivas.length} tareas</span></div>
          <div className="barra" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pct}%` }} /></div>
        </div>
      </section>

      <div className="disposicion">
        <aside className="lateral">
          <TaskForm
            key={editando ? editando.id : "nueva"}
            tareaEditar={editando}
            materias={materias}
            onSubmit={editando ? guardarEdicion : crear}
            onCancel={() => setEditando(null)}
          />
          <TaskFilters filtros={filtros} setFiltros={setFiltros} orden={orden} setOrden={setOrden} materias={materias} />
          <PorMateria tareas={vivas} materiaActiva={filtros.materia} onElegir={(m) => setFiltros({ ...filtros, materia: m })} />
        </aside>

        <div className="principal">
          {porVencer.length > 0 && (
            <section className="por-vencer" aria-label="Por vencer">
              <Icono n="campana" />
              <p>
                <strong>Por vencer en 48 h:</strong>{" "}
                {porVencer.map((t) => `${t.titulo} (${textoVencimiento(t)})`).join(" · ")}
              </p>
              {permisoNotif === "default" && (
                <button type="button" className="enlace" onClick={async () => setPermisoNotif(await Notification.requestPermission())}>
                  Activar avisos
                </button>
              )}
            </section>
          )}

          <div className="barra-vistas">
            <div className="segmentado" role="group" aria-label="Vista">
              <button type="button" className={vista === "lista" ? "on" : ""} aria-pressed={vista === "lista"} onClick={() => setVista("lista")}><Icono n="lista" size={16} /><span>Lista</span></button>
              <button type="button" className={vista === "tablero" ? "on" : ""} aria-pressed={vista === "tablero"} onClick={() => setVista("tablero")}><Icono n="tablero" size={16} /><span>Tablero</span></button>
              <button type="button" className={vista === "calendario" ? "on" : ""} aria-pressed={vista === "calendario"} onClick={() => setVista("calendario")}><Icono n="calendario" size={16} /><span>Calendario</span></button>
            </div>
            <span className="cantidad">{visibles.length} {visibles.length === 1 ? "tarea" : "tareas"}</span>
          </div>

          {cargando ? (
            <div className="lista" aria-busy="true" aria-label="Cargando tus tareas">
              {[0, 1, 2].map((i) => <div key={i} className="panel esqueleto" />)}
            </div>
          ) : vista === "calendario" ? (
            <Calendario tareas={visibles} {...acc} />
          ) : (
            <TaskList tareas={visibles} hayTareas={vivas.length > 0} vista={vista} agrupar={vista === "lista" && orden === "fecha"} {...acc} />
          )}
        </div>
      </div>

      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className="aviso-flotante">
            <span>{a.texto}</span>
            {a.deshacer && <button type="button" className="enlace" onClick={() => { a.deshacer(); quitarAviso(a.id); }}>Deshacer</button>}
            <button type="button" className="icono" onClick={() => quitarAviso(a.id)} aria-label="Cerrar aviso"><Icono n="mas" size={15} style={{ transform: "rotate(45deg)" }} /></button>
          </div>
        ))}
      </div>
    </main>
  );
}
