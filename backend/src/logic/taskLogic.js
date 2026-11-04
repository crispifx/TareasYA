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
const MAX_TITULO = 100;
const MAX_DESCRIPCION = 500;

const esTexto = (v) => typeof v === "string";
const vacio = (v) => !esTexto(v) || v.trim() === "";

// Valida un campo suelto. Devuelve un mensaje de error o null.
function errorDeCampo(campo, valor) {
  switch (campo) {
    case "titulo":
      if (vacio(valor)) return "El título es obligatorio";
      if (valor.trim().length > MAX_TITULO)
        return `El título no puede superar los ${MAX_TITULO} caracteres`;
      return null;
    case "materia":
      return vacio(valor) ? "La materia es obligatoria" : null;
    case "descripcion":
      if (valor !== undefined && !esTexto(valor))
        return "La descripción debe ser texto";
      if (esTexto(valor) && valor.trim().length > MAX_DESCRIPCION)
        return `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres`;
      return null;
    case "fechaLimite":
      if (valor === undefined || valor === null || valor === "")
        return "La fecha límite es obligatoria";
      return isNaN(new Date(valor).getTime())
        ? "La fecha límite no es válida"
        : null;
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

function validarDatosTarea(datos) {
  const d = datos && typeof datos === "object" ? datos : {};
  for (const campo of ["titulo", "materia", "fechaLimite", "prioridad", "descripcion"]) {
    const error = errorDeCampo(campo, d[campo]);
    if (error) return { valido: false, error };
  }
  return { valido: true, error: null };
}

// Validación parcial para ediciones: solo se revisan los campos enviados.
function validarCambios(cambios) {
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
  return { valido: true, error: null };
}

function generarIdTarea() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function crearTarea(datos) {
  const { titulo, descripcion = "", materia, fechaLimite, prioridad } = datos;
  const ahora = new Date().toISOString();
  return {
    id: generarIdTarea(),
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    materia: materia.trim(),
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
    else if (esTexto(valor)) nueva[campo] = valor.trim();
    else nueva[campo] = valor;
  }
  nueva.fechaActualizacion = new Date().toISOString();
  return nueva;
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

module.exports = {
  PRIORIDADES_VALIDAS,
  ESTADOS_VALIDOS,
  validarDatosTarea,
  validarCambios,
  crearTarea,
  aplicarCambios,
  generarIdTarea,
  filtrarYOrdenar,
};
