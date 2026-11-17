// taskLogic.js
// Lógica de datos pura, sin dependencias de React ni del DOM.
// Espeja las reglas del backend para poder funcionar también en modo local.

export const PRIORIDADES_VALIDAS = ["baja", "media", "alta"];
export const ESTADOS_VALIDOS = ["pendiente", "en curso", "completada"];
const HORA = 60 * 60 * 1000;

// ---------- Límites (mismos valores que el backend) ----------
export const LIMITES = {
  tituloMin: 3, tituloMax: 100,
  materiaMin: 2, materiaMax: 40,
  descripcionMax: 500,
  busquedaMax: 50,
  anios: 5,
};

/** Recorta y colapsa espacios internos: "  TP   de  Física " -> "TP de Física". */
export const normalizarTexto = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

const CARACTERES_TITULO = /^[\p{L}\p{M}\p{N} .,;:!?¿¡()\-_/&'"+#%°ºª@=*…]+$/u;
const CARACTERES_MATERIA = /^[\p{L}\p{M}\p{N} .\-'&()]+$/u;
const FUERA_TITULO = /[^\p{L}\p{M}\p{N} .,;:!?¿¡()\-_/&'"+#%°ºª@=*…]/gu;
const FUERA_MATERIA = /[^\p{L}\p{M}\p{N} .\-'&()]/gu;
const CONTROL = /[\u0000-\u001F\u007F]/g;
const CONTROL_SIN_SALTO = /[\u0000-\u0009\u000B-\u001F\u007F]/;
const TIENE_LETRA = /\p{L}/u;
const REPITE = /(.)\1{3,}/u;
const msgRepite = (n) => `${n} no puede repetir un mismo carácter más de 3 veces seguidas`;

// ---------- Filtros mientras se escribe: lo que no está permitido ni entra ----------
const sinEspaciosDobles = (v) => v.replace(/^\s+/, "").replace(/\s{2,}/g, " ");
export const limpiarTitulo = (v) => sinEspaciosDobles(String(v ?? "").replace(FUERA_TITULO, "")).slice(0, LIMITES.tituloMax);
export const limpiarMateria = (v) => sinEspaciosDobles(String(v ?? "").replace(FUERA_MATERIA, "")).slice(0, LIMITES.materiaMax);
export const limpiarBusqueda = (v) => String(v ?? "").replace(CONTROL, "").replace(/^\s+/, "").slice(0, LIMITES.busquedaMax);
export const limpiarDescripcion = (v) => String(v ?? "").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").slice(0, LIMITES.descripcionMax);

// ---------- Reglas por campo ----------
export function errorTitulo(valor) {
  if (typeof valor !== "string" || valor.trim() === "") return "El título es obligatorio";
  const t = normalizarTexto(valor);
  if (t.length < LIMITES.tituloMin) return `El título debe tener al menos ${LIMITES.tituloMin} caracteres`;
  if (t.length > LIMITES.tituloMax) return `El título no puede superar los ${LIMITES.tituloMax} caracteres`;
  if (!CARACTERES_TITULO.test(t)) return "El título tiene caracteres no permitidos";
  if (!TIENE_LETRA.test(t)) return "El título debe incluir al menos una letra";
  if (REPITE.test(t)) return msgRepite("El título");
  return null;
}

export function errorMateria(valor) {
  if (typeof valor !== "string" || valor.trim() === "") return "La materia es obligatoria";
  const m = normalizarTexto(valor);
  if (m.length < LIMITES.materiaMin) return `La materia debe tener al menos ${LIMITES.materiaMin} caracteres`;
  if (m.length > LIMITES.materiaMax) return `La materia no puede superar los ${LIMITES.materiaMax} caracteres`;
  if (!CARACTERES_MATERIA.test(m)) return "La materia solo admite letras, números, espacios y . - ' & ( )";
  if (!TIENE_LETRA.test(m)) return "La materia debe incluir al menos una letra";
  if (REPITE.test(m)) return msgRepite("La materia");
  return null;
}

export function errorDescripcion(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== "string") return "La descripción debe ser texto";
  if (valor.trim().length > LIMITES.descripcionMax) return `La descripción no puede superar los ${LIMITES.descripcionMax} caracteres`;
  if (CONTROL_SIN_SALTO.test(valor)) return "La descripción tiene caracteres no permitidos";
  return null;
}

const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|([+-])(\d{2}):(\d{2}))?)?$/;
const diasDelMes = (anio, mes) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();

/** Fecha y hora: formato, día real (sin 31 de febrero), hora 00-23 y minutos 00-59. */
export function errorFormatoFecha(valor) {
  if (valor === undefined || valor === null || valor === "") return "La fecha límite es obligatoria";
  if (typeof valor !== "string") return "La fecha límite no es válida";
  const m = FORMATO_FECHA.exec(valor.trim());
  if (!m) return "La fecha límite no es válida";
  if (m[4] === undefined) return "La fecha límite debe incluir fecha y hora";
  const [anio, mes, dia, hora, min] = [m[1], m[2], m[3], m[4], m[5]].map(Number);
  const seg = m[6] === undefined ? 0 : Number(m[6]);
  const offH = m[9] === undefined ? 0 : Number(m[9]);
  const offM = m[10] === undefined ? 0 : Number(m[10]);
  const real =
    anio >= 1970 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasDelMes(anio, mes) &&
    hora <= 23 && min <= 59 && seg <= 59 && offH <= 23 && offM <= 59;
  return real && !isNaN(new Date(valor).getTime()) ? null : "La fecha límite no es válida";
}

const topeFecha = (ahora) => { const t = new Date(ahora); t.setFullYear(t.getFullYear() + LIMITES.anios); return t; };

/** Valida un campo suelto. `opciones.fechaOriginal` permite conservar una fecha ya vencida al editar. */
export function errorDeCampo(campo, valor, { ahora = new Date(), fechaOriginal = null } = {}) {
  switch (campo) {
    case "titulo": return errorTitulo(valor);
    case "materia": return errorMateria(valor);
    case "descripcion": return errorDescripcion(valor);
    case "prioridad": return PRIORIDADES_VALIDAS.includes(valor) ? null : "La prioridad no es válida";
    case "fechaLimite": {
      const e = errorFormatoFecha(valor);
      if (e) return e;
      const f = new Date(valor);
      if (f > topeFecha(ahora)) return `La fecha límite no puede superar los ${LIMITES.anios} años desde hoy`;
      const alMinuto = (d) => Math.floor(new Date(d).getTime() / 60000);
      const igualALaOriginal = fechaOriginal && alMinuto(f) === alMinuto(fechaOriginal);
      if (!igualALaOriginal && f <= ahora) return "La fecha límite debe ser posterior al momento actual";
      return null;
    }
    default: return null;
  }
}

const CAMPOS_FORM = ["titulo", "materia", "fechaLimite", "prioridad", "descripcion"];

/** Todos los errores del formulario, por campo (para mostrarlos junto a cada input). */
export function erroresTarea(datos, opciones = {}) {
  const errores = {};
  for (const campo of CAMPOS_FORM) {
    const e = errorDeCampo(campo, datos[campo], opciones);
    if (e) errores[campo] = e;
  }
  return errores;
}

/**
 * Valida los datos ingresados para crear o editar una tarea.
 * @returns {{valido: boolean, error: string|null}} primer error encontrado
 */
export function validarDatosTarea(datos, opciones = {}) {
  const primero = Object.values(erroresTarea(datos, opciones))[0];
  return primero ? { valido: false, error: primero } : { valido: true, error: null };
}

/** Límites para <input type="datetime-local">: desde ahora hasta 5 años. */
export function limitesFecha(ahora = new Date()) {
  return { min: aInputFecha(ahora.toISOString()), max: aInputFecha(topeFecha(ahora).toISOString()) };
}

/** Valor de <input datetime-local> (hora local) -> ISO en UTC, sin ambigüedad de zona. */
export const fechaAISO = (valor) => new Date(valor).toISOString();

/** Si la materia ya existe (sin distinguir mayúsculas ni tildes), reutiliza su escritura. */
export function canonizarMateria(materia, existentes = []) {
  const clave = (v) => normalizarTexto(v).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const m = normalizarTexto(materia);
  return existentes.find((e) => clave(e) === clave(m)) ?? m;
}

// ---------- Credenciales ----------
const COMUNES = ["12345678", "123456789", "1234567890", "password", "password1", "contrasena1", "contraseña1", "qwerty123", "abc12345", "iloveyou1", "admin123", "tareasya1"];

export function errorUsuario(usuario) {
  return typeof usuario === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,28}[a-zA-Z0-9]$/.test(usuario)
    ? null
    : "Usuario: 3 a 30 caracteres (letras, números, . _ -), sin empezar ni terminar con símbolo";
}

export function errorPassword(password, usuario = "") {
  if (typeof password !== "string" || password.length < 8 || password.length > 72) return "La contraseña debe tener entre 8 y 72 caracteres";
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return "La contraseña debe combinar letras y números";
  if (usuario && password.toLowerCase() === usuario.toLowerCase()) return "La contraseña no puede ser igual al usuario";
  if (COMUNES.includes(password.toLowerCase())) return "Esa contraseña es demasiado común";
  return null;
}

export function generarIdTarea() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Crea el objeto tarea a partir de datos ya validados. */
export function crearTarea(datos) {
  const { titulo, descripcion = "", materia, fechaLimite, prioridad } = datos;
  const ahora = new Date().toISOString();
  return {
    id: generarIdTarea(),
    titulo: normalizarTexto(titulo),
    descripcion: descripcion.trim(),
    materia: normalizarTexto(materia),
    fechaLimite: new Date(fechaLimite).toISOString(),
    prioridad,
    estado: "pendiente",
    favorito: false,
    fechaCreacion: ahora,
    fechaActualizacion: ahora,
  };
}

/** Devuelve una tarea nueva con los cambios aplicados (no muta la original). */
export function aplicarCambios(tarea, cambios) {
  const nueva = { ...tarea, ...cambios };
  if (cambios.titulo !== undefined) nueva.titulo = normalizarTexto(cambios.titulo);
  if (cambios.materia !== undefined) nueva.materia = normalizarTexto(cambios.materia);
  if (cambios.descripcion !== undefined) nueva.descripcion = cambios.descripcion.trim();
  if (cambios.fechaLimite !== undefined)
    nueva.fechaLimite = new Date(cambios.fechaLimite).toISOString();
  nueva.fechaActualizacion = new Date().toISOString();
  return nueva;
}

/** ¿Hay otra tarea activa con el mismo título y materia? */
export function existeDuplicada(tareas, titulo, materia, excluirId = null) {
  const t = normalizarTexto(titulo).toLowerCase();
  const m = normalizarTexto(materia).toLowerCase();
  return tareas.some(
    (x) =>
      x.id !== excluirId &&
      x.estado !== "completada" &&
      normalizarTexto(x.titulo).toLowerCase() === t &&
      normalizarTexto(x.materia).toLowerCase() === m
  );
}

/** ISO -> valor para <input type="datetime-local"> (hora local). */
export function aInputFecha(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Filtra por texto (título/materia), materia, estado, prioridad y favoritas.
 * Valores vacíos = sin filtro.
 */
export function filtrarTareas(tareas, f = {}) {
  const texto = (f.q || "").trim().toLowerCase();
  return tareas.filter((t) => {
    if (texto && !`${t.titulo} ${t.materia}`.toLowerCase().includes(texto)) return false;
    if (f.materia && t.materia !== f.materia) return false;
    if (f.estado && t.estado !== f.estado) return false;
    if (f.prioridad && t.prioridad !== f.prioridad) return false;
    if (f.soloFavoritas && !t.favorito) return false;
    return true;
  });
}

const PESO = { alta: 0, media: 1, baja: 2 };

/** Ordena sin mutar. orden: "fecha" (próxima primero) | "prioridad" | "creacion". */
export function ordenarTareas(tareas, orden = "fecha") {
  const porFecha = (a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite);
  const copia = [...tareas];
  if (orden === "prioridad")
    return copia.sort((a, b) => PESO[a.prioridad] - PESO[b.prioridad] || porFecha(a, b));
  if (orden === "creacion")
    return copia.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
  return copia.sort(porFecha);
}

/** Una tarea activa cuya fecha ya pasó. */
export function estaVencida(tarea, ahora = new Date()) {
  return tarea.estado !== "completada" && new Date(tarea.fechaLimite) < ahora;
}

/** Tareas activas que vencen dentro de las próximas `horas` (default 48). */
export function tareasPorVencer(tareas, horas = 48, ahora = new Date()) {
  const limite = new Date(ahora.getTime() + horas * HORA);
  return tareas.filter((t) => {
    if (t.estado === "completada") return false;
    const f = new Date(t.fechaLimite);
    return f >= ahora && f <= limite;
  });
}

/** Contadores para el resumen de arriba. */
export function resumenTareas(tareas, ahora = new Date()) {
  return {
    total: tareas.length,
    pendientes: tareas.filter((t) => t.estado === "pendiente").length,
    enCurso: tareas.filter((t) => t.estado === "en curso").length,
    completadas: tareas.filter((t) => t.estado === "completada").length,
    vencidas: tareas.filter((t) => estaVencida(t, ahora)).length,
  };
}

/** Texto amigable: "vence en 3 h", "vence mañana", "venció hace 2 días". */
export function textoVencimiento(tarea, ahora = new Date()) {
  const dif = new Date(tarea.fechaLimite) - ahora;
  const horas = Math.round(Math.abs(dif) / HORA);
  const dias = Math.round(Math.abs(dif) / (24 * HORA));
  if (dif < 0) return horas < 24 ? `venció hace ${horas} h` : `venció hace ${dias} d`;
  if (horas < 1) return "vence en menos de 1 h";
  if (horas < 24) return `vence en ${horas} h`;
  return dias === 1 ? "vence mañana" : `vence en ${dias} d`;
}
