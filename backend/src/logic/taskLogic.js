// src/logic/taskLogic.js
// Lógica pura: sin Express ni acceso a datos. Fácil de testear.

const PRIORIDADES_VALIDAS = ["baja", "media", "alta"];
const ESTADOS_VALIDOS = ["pendiente", "en curso", "completada"];
const CAMPOS_EDITABLES = [
  "titulo",
  "descripcion",
  "materia",
  "fechaLimite",
  "prioridad",
  "estado",
  "favorito",
];
const MIN_TITULO = 3;
const MAX_TITULO = 100;
const MIN_MATERIA = 2;
const MAX_MATERIA = 40;
const MAX_DESCRIPCION = 500;
const MAX_BUSQUEDA = 50;
const ANIOS_MAXIMOS = 5;
const HORA_MS = 60 * 60 * 1000;
const HORAS_POR_DEFECTO = 48;
const HORAS_MAXIMAS = 720; // 30 días

const esTexto = (v) => typeof v === "string";
const vacio = (v) => !esTexto(v) || v.trim() === "";

// Recorta y colapsa los espacios internos: "  TP   de  Física " -> "TP de Física".
const normalizarTexto = (v) => String(v).replace(/\s+/g, " ").trim();

// Listas blancas de caracteres (letras con tilde y ñ incluidas).
const CARACTERES_TITULO = /^[\p{L}\p{M}\p{N} .,;:!?¿¡()\-_/&'"+#%°ºª@=*…]+$/u;
const CARACTERES_MATERIA = /^[\p{L}\p{M}\p{N} .\-'&()]+$/u;
const CONTROL_SIN_SALTO = /[\u0000-\u0009\u000B-\u001F\u007F]/;
const TIENE_LETRA = /\p{L}/u;
const REPITE_CARACTER = /(.)\1{3,}/u;

const msgRepite = (nombre) =>
  `${nombre} no puede repetir un mismo carácter más de 3 veces seguidas`;

function errorTitulo(valor) {
  if (vacio(valor)) return "El título es obligatorio";
  const t = normalizarTexto(valor);
  if (t.length < MIN_TITULO) return `El título debe tener al menos ${MIN_TITULO} caracteres`;
  if (t.length > MAX_TITULO) return `El título no puede superar los ${MAX_TITULO} caracteres`;
  if (!CARACTERES_TITULO.test(t)) return "El título tiene caracteres no permitidos";
  if (!TIENE_LETRA.test(t)) return "El título debe incluir al menos una letra";
  if (REPITE_CARACTER.test(t)) return msgRepite("El título");
  return null;
}

function errorMateria(valor) {
  if (vacio(valor)) return "La materia es obligatoria";
  const m = normalizarTexto(valor);
  if (m.length < MIN_MATERIA) return `La materia debe tener al menos ${MIN_MATERIA} caracteres`;
  if (m.length > MAX_MATERIA) return `La materia no puede superar los ${MAX_MATERIA} caracteres`;
  if (!CARACTERES_MATERIA.test(m))
    return "La materia solo admite letras, números, espacios y . - ' & ( )";
  if (!TIENE_LETRA.test(m)) return "La materia debe incluir al menos una letra";
  if (REPITE_CARACTER.test(m)) return msgRepite("La materia");
  return null;
}

function errorDescripcion(valor) {
  if (valor === undefined) return null;
  if (!esTexto(valor)) return "La descripción debe ser texto";
  if (valor.trim().length > MAX_DESCRIPCION)
    return `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres`;
  if (CONTROL_SIN_SALTO.test(valor)) return "La descripción tiene caracteres no permitidos";
  return null;
}

// Fecha y hora: ISO 8601 con hora obligatoria, y que el día exista de verdad.
const FORMATO_FECHA =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|([+-])(\d{2}):(\d{2}))?)?$/;
const diasDelMes = (anio, mes) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();

function errorFormatoFecha(valor) {
  if (valor === undefined || valor === null || valor === "")
    return "La fecha límite es obligatoria";
  if (!esTexto(valor)) return "La fecha límite no es válida";
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

// Rango permitido: hasta 5 años hacia adelante.
function errorHorizonteFecha(valor, ahora = new Date()) {
  const tope = new Date(ahora);
  tope.setFullYear(tope.getFullYear() + ANIOS_MAXIMOS);
  return new Date(valor) > tope
    ? `La fecha límite no puede superar los ${ANIOS_MAXIMOS} años desde hoy`
    : null;
}

function errorFechaPasada(valor, ahora = new Date()) {
  return new Date(valor) <= ahora
    ? "La fecha límite debe ser posterior al momento actual"
    : null;
}

// Valida un campo suelto. Devuelve un mensaje de error o null.
function errorDeCampo(campo, valor) {
  switch (campo) {
    case "titulo":
      return errorTitulo(valor);
    case "materia":
      return errorMateria(valor);
    case "descripcion":
      return errorDescripcion(valor);
    case "fechaLimite":
      return errorFormatoFecha(valor);
    case "prioridad":
      return PRIORIDADES_VALIDAS.includes(valor)
        ? null
        : "La prioridad no es válida";
    case "estado":
      return ESTADOS_VALIDOS.includes(valor) ? null : "El estado no es válido";
    case "favorito":
      return typeof valor === "boolean" ? null : "Favorito debe ser verdadero o falso";
    default:
      return null;
  }
}

// Alta: todos los campos, y la fecha debe ser futura y dentro del horizonte.
function validarDatosTarea(datos, ahora = new Date()) {
  const d = datos && typeof datos === "object" ? datos : {};
  for (const campo of ["titulo", "materia", "fechaLimite", "prioridad", "descripcion"]) {
    const error = errorDeCampo(campo, d[campo]);
    if (error) return { valido: false, error };
  }
  const errorFecha = errorHorizonteFecha(d.fechaLimite, ahora) || errorFechaPasada(d.fechaLimite, ahora);
  if (errorFecha) return { valido: false, error: errorFecha };
  return { valido: true, error: null };
}

// Validación parcial para ediciones: solo se revisan los campos enviados.
// Que la fecha no sea pasada lo decide el service, porque depende de la fecha actual de la tarea.
function validarCambios(cambios, ahora = new Date()) {
  if (!cambios || typeof cambios !== "object" || Array.isArray(cambios))
    return { valido: false, error: "El cuerpo de la petición no es válido" };
  const claves = Object.keys(cambios);
  if (claves.length === 0)
    return { valido: false, error: "No hay cambios para aplicar" };
  const desconocidas = claves.filter((c) => !CAMPOS_EDITABLES.includes(c));
  if (desconocidas.length > 0)
    return { valido: false, error: `Campo no editable: ${desconocidas[0]}` };
  for (const campo of claves) {
    const error = errorDeCampo(campo, cambios[campo]);
    if (error) return { valido: false, error };
  }
  if (cambios.fechaLimite !== undefined) {
    const error = errorHorizonteFecha(cambios.fechaLimite, ahora);
    if (error) return { valido: false, error };
  }
  return { valido: true, error: null };
}

// Filtros de GET /tareas: solo valores conocidos y textos acotados.
function validarConsulta(consulta = {}) {
  const { q, materia, estado, prioridad, favorito, orden } = consulta;
  const falla = (error) => ({ valido: false, error });
  if (q !== undefined) {
    if (!esTexto(q)) return falla("La búsqueda debe ser texto");
    if (q.trim().length > MAX_BUSQUEDA)
      return falla(`La búsqueda no puede superar los ${MAX_BUSQUEDA} caracteres`);
  }
  if (materia !== undefined) {
    if (!esTexto(materia)) return falla("La materia debe ser texto");
    if (materia.trim().length > MAX_MATERIA)
      return falla(`La materia no puede superar los ${MAX_MATERIA} caracteres`);
  }
  if (estado !== undefined && estado !== "" && !ESTADOS_VALIDOS.includes(estado))
    return falla("El estado no es válido");
  if (prioridad !== undefined && prioridad !== "" && !PRIORIDADES_VALIDAS.includes(prioridad))
    return falla("La prioridad no es válida");
  if (favorito !== undefined && !["true", "false", ""].includes(favorito))
    return falla("El filtro favorito debe ser true o false");
  if (orden !== undefined && !["fecha", "prioridad", "creacion"].includes(orden))
    return falla("El orden no es válido");
  return { valido: true, error: null };
}

// ---------- Credenciales ----------
const CONTRASENAS_COMUNES = [
  "12345678", "123456789", "1234567890", "password", "password1", "contrasena1",
  "contraseña1", "qwerty123", "abc12345", "iloveyou1", "admin123", "tareasya1",
];

function errorUsuario(usuario) {
  return typeof usuario === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,28}[a-zA-Z0-9]$/.test(usuario)
    ? null
    : "Usuario: 3 a 30 caracteres (letras, números, . _ -), sin empezar ni terminar con símbolo";
}

function errorPassword(password, usuario = "") {
  if (typeof password !== "string" || password.length < 8 || password.length > 72)
    return "La contraseña debe tener entre 8 y 72 caracteres";
  if (!/\p{L}/u.test(password) || !/\d/.test(password))
    return "La contraseña debe combinar letras y números";
  if (usuario && password.toLowerCase() === String(usuario).toLowerCase())
    return "La contraseña no puede ser igual al usuario";
  if (CONTRASENAS_COMUNES.includes(password.toLowerCase()))
    return "Esa contraseña es demasiado común";
  return null;
}

function generarIdTarea() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function crearTarea(datos) {
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

// Devuelve una tarea nueva con los cambios aplicados (no muta la original).
function aplicarCambios(tarea, cambios) {
  const nueva = { ...tarea };
  for (const campo of Object.keys(cambios)) {
    const valor = cambios[campo];
    if (campo === "fechaLimite") nueva.fechaLimite = new Date(valor).toISOString();
    else if (campo === "titulo" || campo === "materia") nueva[campo] = normalizarTexto(valor);
    else if (esTexto(valor)) nueva[campo] = valor.trim();
    else nueva[campo] = valor;
  }
  nueva.fechaActualizacion = new Date().toISOString();
  return nueva;
}

// Tareas activas que vencen dentro de las próximas `horas`, la más próxima primero.
function tareasPorVencer(tareas, horas = HORAS_POR_DEFECTO, ahora = new Date()) {
  return tareas
    .filter((t) => venceEnVentana(t, horas, ahora))
    .sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite));
}

// Valida el parámetro ?horas. Sin valor se usa el predeterminado.
function validarHoras(valor) {
  const horas = valor === undefined ? HORAS_POR_DEFECTO : Number(valor);
  if (!Number.isInteger(horas) || horas < 1 || horas > HORAS_MAXIMAS)
    return { valido: false, error: `El parámetro horas debe ser un entero entre 1 y ${HORAS_MAXIMAS}` };
  return { valido: true, horas };
}

const PESO_PRIORIDAD = { alta: 0, media: 1, baja: 2 };

// Filtros: q (título/materia), materia, estado, prioridad, favorito.
// Orden: fecha (default, más próxima primero), prioridad, creacion.
function filtrarYOrdenar(tareas, consulta = {}) {
  const { q, materia, estado, prioridad, favorito, orden = "fecha" } = consulta;
  const texto = esTexto(q) ? q.trim().toLowerCase() : "";
  let resultado = tareas.filter((t) => {
    if (texto && !`${t.titulo} ${t.materia}`.toLowerCase().includes(texto)) return false;
    if (materia && t.materia.toLowerCase() !== String(materia).toLowerCase()) return false;
    if (estado && t.estado !== estado) return false;
    if (prioridad && t.prioridad !== prioridad) return false;
    if (favorito === "true" && !t.favorito) return false;
    return true;
  });
  const porFecha = (a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite);
  if (orden === "prioridad")
    resultado.sort((a, b) => PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad] || porFecha(a, b));
  else if (orden === "creacion")
    resultado.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
  else resultado.sort(porFecha);
  return resultado;
}

// ---------- Estado y vencimientos ----------
const esActiva = (tarea) => tarea.estado !== "completada";
const estaVencida = (tarea, ahora) => esActiva(tarea) && new Date(tarea.fechaLimite) < ahora;
// ¿Vence entre ahora y ahora + horas? (límite inclusivo)
const venceEnVentana = (tarea, horas, ahora) => {
  const fecha = new Date(tarea.fechaLimite);
  return esActiva(tarea) && fecha >= ahora && fecha <= new Date(ahora.getTime() + horas * HORA_MS);
};
const contar = (tareas, condicion) => tareas.filter(condicion).length;
const conEstado = (estado) => (tarea) => tarea.estado === estado;

// Contadores por estado y tareas vencidas.
function resumenTareas(tareas, ahora = new Date()) {
  return {
    total: tareas.length,
    pendientes: contar(tareas, conEstado("pendiente")),
    enCurso: contar(tareas, conEstado("en curso")),
    completadas: contar(tareas, conEstado("completada")),
    vencidas: contar(tareas, (t) => estaVencida(t, ahora)),
    porVencer: tareasPorVencer(tareas, HORAS_POR_DEFECTO, ahora).length,
  };
}

module.exports = {
  resumenTareas,
  tareasPorVencer,
  validarHoras,
  PRIORIDADES_VALIDAS,
  ESTADOS_VALIDOS,
  validarDatosTarea,
  validarCambios,
  validarConsulta,
  errorFechaPasada,
  errorUsuario,
  errorPassword,
  normalizarTexto,
  crearTarea,
  aplicarCambios,
  generarIdTarea,
  filtrarYOrdenar,
};
