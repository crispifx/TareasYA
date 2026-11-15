// taskClient.js: única puerta de entrada a los datos. Habla con la API usando la sesión del usuario.
const K = "tareasya_sesion";
const st = {
  get: () => { try { return JSON.parse(localStorage.getItem(K)); } catch { return null; } },
  set: (v) => { try { localStorage.setItem(K, JSON.stringify(v)); } catch { /* sin storage */ } },
  del: () => { try { localStorage.removeItem(K); } catch { /* sin storage */ } },
};
export const sesionActual = () => st.get();
export function salir() { st.del(); window.dispatchEvent(new Event("tareasya:salir")); }

async function http(ruta, opciones = {}) {
  const s = st.get();
  const res = await fetch(`/api${ruta}`, {
    ...opciones,
    headers: { "Content-Type": "application/json", ...(s && { Authorization: `Bearer ${s.token}` }) },
  });
  if (res.status === 204) return null;
  const datos = await res.json().catch(() => null);
  if (res.status === 401 && s) { salir(); throw new Error("Tu sesión venció. Ingresá de nuevo"); }
  if (!res.ok) throw new Error(datos?.error || "Error del servidor");
  return datos;
}

async function autenticar(ruta, usuario, password) {
  const d = await http(ruta, { method: "POST", body: JSON.stringify({ usuario, password }) });
  st.set(d);
  return d;
}
export const ingresar = (u, p) => autenticar("/auth/login", u, p);
export const registrarse = (u, p) => autenticar("/auth/registro", u, p);

export const listarTareas = () => http("/tareas");
export const crearNuevaTarea = (d) => http("/tareas", { method: "POST", body: JSON.stringify(d) });
export const actualizarTarea = (id, c) => http(`/tareas/${id}`, { method: "PATCH", body: JSON.stringify(c) });
export const eliminarTarea = (id) => http(`/tareas/${id}`, { method: "DELETE" });
