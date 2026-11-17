// Calendario.jsx: vista mensual; al elegir un día se listan sus tareas.
import { useMemo, useState } from "react";
import { TaskList } from "./TaskList";
import { Icono } from "./Icono";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const clave = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function Calendario({ tareas, ...acciones }) {
  const hoy = new Date();
  const [mes, setMes] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [sel, setSel] = useState(clave(hoy));

  const porDia = useMemo(() => {
    const m = {};
    tareas.forEach((t) => { (m[clave(new Date(t.fechaLimite))] ||= []).push(t); });
    return m;
  }, [tareas]);

  const vacios = (mes.getDay() + 6) % 7;
  const cantidad = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas = [...Array(vacios).fill(null), ...Array.from({ length: cantidad }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1))];
  const mover = (n) => setMes(new Date(mes.getFullYear(), mes.getMonth() + n, 1));
  const delDia = porDia[sel] || [];

  return (
    <section className="calendario panel" aria-label="Calendario">
      <div className="cal-barra">
        <button type="button" className="icono" onClick={() => mover(-1)} aria-label="Mes anterior"><Icono n="izquierda" /></button>
        <h2>{mes.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</h2>
        <button type="button" className="icono" onClick={() => mover(1)} aria-label="Mes siguiente"><Icono n="derecha" /></button>
        <button type="button" onClick={() => { setMes(new Date(hoy.getFullYear(), hoy.getMonth(), 1)); setSel(clave(hoy)); }}>Hoy</button>
      </div>
      <div className="cal-grid">
        {DIAS.map((d) => <b key={d} className="cal-dia-nombre">{d}</b>)}
        {celdas.map((d, i) => {
          if (!d) return <span key={`v${i}`} className="cal-vacio" />;
          const k = clave(d), ts = porDia[k] || [];
          return (
            <button key={k} type="button" onClick={() => setSel(k)}
              className={`cal-dia ${k === clave(hoy) ? "hoy" : ""} ${k === sel ? "sel" : ""}`}
              aria-label={`${d.getDate()}: ${ts.length} ${ts.length === 1 ? "tarea" : "tareas"}`}
              aria-pressed={k === sel}>
              <span>{d.getDate()}</span>
              {ts.slice(0, 3).map((t) => (
                <i key={t.id} className={`cal-chip prio-${t.prioridad} ${t.estado === "completada" ? "hecha" : ""}`}>{t.titulo}</i>
              ))}
              {ts.length > 3 && <em>+{ts.length - 3} más</em>}
            </button>
          );
        })}
      </div>
      <h3 className="cal-titulo-dia">{delDia.length ? `Tareas del día (${delDia.length})` : "Sin tareas este día"}</h3>
      {delDia.length > 0 && <TaskList tareas={delDia} hayTareas {...acciones} />}
    </section>
  );
}
