// pdf.js: abre una hoja prolija con las tareas y el diálogo de impresión ("Guardar como PDF").
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const GRUPOS = [["pendiente", "Pendientes"], ["en curso", "En curso"], ["completada", "Completadas"]];

export function imprimirPDF(tareas, usuario) {
  const fecha = (t) => new Date(t.fechaLimite).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
  const hechas = tareas.filter((t) => t.estado === "completada").length;
  const pct = tareas.length ? Math.round((hechas / tareas.length) * 100) : 0;
  const secciones = GRUPOS.map(([estado, titulo]) => {
    const items = tareas.filter((t) => t.estado === estado).sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite));
    if (!items.length) return "";
    const filas = items.map((t) => `<tr><td>${t.favorito ? "★ " : ""}<b>${esc(t.titulo)}</b>${t.descripcion ? `<small>${esc(t.descripcion)}</small>` : ""}</td><td>${esc(t.materia)}</td><td class="p-${esc(t.prioridad)}">${esc(t.prioridad)}</td><td>${esc(fecha(t))}</td></tr>`).join("");
    return `<h2>${titulo} <span>${items.length}</span></h2><table><thead><tr><th>Tarea</th><th>Materia</th><th>Prioridad</th><th>Fecha límite</th></tr></thead><tbody>${filas}</tbody></table>`;
  }).join("");
  const w = window.open("", "_blank");
  if (!w) { alert("Permití las ventanas emergentes para generar el PDF"); return; }
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>TareasYA - ${esc(usuario)}</title><style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px;font-size:13px}
  header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #111;padding-bottom:10px;margin-bottom:6px}
  h1{margin:0;font-size:28px}h1 span{background:#ffd23f;padding:0 6px}header p{margin:0;text-align:right;color:#444}
  .res{margin:12px 0 22px;font-size:14px}h2{font-size:16px;margin:22px 0 8px;border-left:8px solid #111;padding-left:8px}h2 span{color:#666;font-weight:400}
  table{width:100%;border-collapse:collapse}th{text-align:left;background:#111;color:#fff;padding:7px 8px;font-size:12px}
  td{padding:8px;border-bottom:1px solid #ccc;vertical-align:top}td small{display:block;color:#555;margin-top:2px}tr{break-inside:avoid}
  .p-alta{color:#c1121f;font-weight:700}.p-media{color:#b45f06;font-weight:700}.p-baja{color:#2b8a3e;font-weight:700}
  @media print{body{margin:14mm}}</style></head><body>
  <header><h1>Tareas<span>YA</span></h1><p><b>${esc(usuario)}</b><br>${new Date().toLocaleDateString("es-AR", { dateStyle: "long" })}</p></header>
  <p class="res"><b>${tareas.length}</b> tareas · <b>${hechas}</b> completadas (${pct}%)</p>
  ${secciones || "<p>No hay tareas para mostrar.</p>"}<script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
  w.document.close();
}
