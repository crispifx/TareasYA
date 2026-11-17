// taskLogic.test.js
// Tests unitarios de la lógica del frontend (validación, creación, filtros, orden, vencimientos).

import { describe, it, expect } from "vitest";
import {
  validarDatosTarea,
  erroresTarea,
  errorDeCampo,
  errorFormatoFecha,
  errorUsuario,
  errorPassword,
  normalizarTexto,
  limpiarTitulo,
  limpiarMateria,
  limpiarBusqueda,
  limitesFecha,
  fechaAISO,
  canonizarMateria,
  LIMITES,
  crearTarea,
  generarIdTarea,
  aplicarCambios,
  existeDuplicada,
  aInputFecha,
  filtrarTareas,
  ordenarTareas,
  estaVencida,
  tareasPorVencer,
  resumenTareas,
  textoVencimiento,
} from "./taskLogic";

const AHORA = new Date("2026-11-16T12:00:00.000Z");
const enDias = (n) => aInputFecha(new Date(AHORA.getTime() + n * 864e5).toISOString());
const base = { titulo: "TP Uno", materia: "Física", fechaLimite: enDias(10), prioridad: "alta" };
const opc = { ahora: AHORA };

describe("validarDatosTarea", () => {
  it("caso correcto: datos completos y válidos", () => {
    const r = validarDatosTarea({ ...base, titulo: "TP de Física" }, opc);
    expect(r.valido).toBe(true);
    expect(r.error).toBeNull();
  });
  it("caso inválido: título vacío devuelve error específico", () => {
    const r = validarDatosTarea({ ...base, titulo: "   " }, opc);
    expect(r.valido).toBe(false);
    expect(r.error).toBe("El título es obligatorio");
  });
  it("caso inválido: prioridad fuera de las permitidas", () => {
    const r = validarDatosTarea({ ...base, prioridad: "urgente" }, opc);
    expect(r.error).toBe("La prioridad no es válida");
  });
  it("caso límite: fecha con formato inválido", () => {
    const r = validarDatosTarea({ ...base, fechaLimite: "31-31-2026" }, opc);
    expect(r.error).toBe("La fecha límite no es válida");
  });
  it("caso límite: fecha vacía es obligatoria", () => {
    expect(validarDatosTarea({ ...base, fechaLimite: "" }, opc).error).toBe("La fecha límite es obligatoria");
  });
  it("caso límite: título con espacios al borde es válido", () => {
    expect(validarDatosTarea({ ...base, titulo: "  TP de Programación  " }, opc).valido).toBe(true);
  });
  it("caso límite: título de más de 100 caracteres se rechaza", () => {
    expect(validarDatosTarea({ ...base, titulo: "ab ".repeat(40) }, opc).valido).toBe(false);
  });
});

describe("crearTarea", () => {
  it("genera tarea pendiente, sin favorito y con fechas", () => {
    const t = crearTarea({ ...base, titulo: "TP de Física", descripcion: "Guía" });
    expect(t.estado).toBe("pendiente");
    expect(t.favorito).toBe(false);
    expect(t.fechaActualizacion).toBe(t.fechaCreacion);
    expect(new Date(t.fechaLimite).toISOString()).toBe(t.fechaLimite);
  });
  it("caso límite: descripción omitida no rompe", () => {
    expect(crearTarea(base).descripcion).toBe("");
  });
  it("caso límite: ids distintos", () => {
    expect(generarIdTarea()).not.toBe(generarIdTarea());
  });
});

describe("aplicarCambios / existeDuplicada", () => {
  it("no muta la original y recorta textos", () => {
    const t = crearTarea(base);
    const n = aplicarCambios(t, { titulo: "  Nuevo  ", favorito: true });
    expect(n.titulo).toBe("Nuevo");
    expect(n.favorito).toBe(true);
    expect(t.titulo).toBe("TP Uno");
  });
  it("detecta duplicadas activas sin distinguir mayúsculas; ignora completadas y a sí misma", () => {
    const t = { ...crearTarea(base), id: "a" };
    expect(existeDuplicada([t], " tp   uno ", "FÍSICA")).toBe(true);
    expect(existeDuplicada([t], "tp uno", "Física", "a")).toBe(false);
    expect(existeDuplicada([{ ...t, estado: "completada" }], "tp uno", "Física")).toBe(false);
  });
});

describe("aInputFecha", () => {
  it("ida y vuelta con datetime-local", () => {
    const iso = new Date("2026-12-01T20:00").toISOString();
    expect(new Date(aInputFecha(iso)).toISOString()).toBe(iso);
  });
});

const T = (id, o = {}) => ({
  id, titulo: id, materia: "Física", prioridad: "media", estado: "pendiente", favorito: false,
  fechaLimite: "2026-11-10T12:00:00.000Z", fechaCreacion: "2026-11-01T00:00:00.000Z", ...o,
});

describe("filtrar y ordenar", () => {
  const ts = [
    T("a", { materia: "Arte", prioridad: "baja", fechaLimite: "2026-11-20T00:00:00.000Z" }),
    T("b", { favorito: true, prioridad: "alta", fechaLimite: "2026-11-05T00:00:00.000Z" }),
    T("c", { estado: "completada", fechaLimite: "2026-11-12T00:00:00.000Z" }),
  ];
  it("sin filtros devuelve todo", () => expect(filtrarTareas(ts)).toHaveLength(3));
  it("busca por título o materia sin distinguir mayúsculas", () => {
    expect(filtrarTareas(ts, { q: "ARTE" }).map((t) => t.id)).toEqual(["a"]);
  });
  it("combina filtros", () => {
    expect(filtrarTareas(ts, { estado: "pendiente", soloFavoritas: true }).map((t) => t.id)).toEqual(["b"]);
  });
  it("ordena por fecha próxima y no muta el arreglo", () => {
    expect(ordenarTareas(ts).map((t) => t.id)).toEqual(["b", "c", "a"]);
    expect(ts[0].id).toBe("a");
  });
  it("ordena por prioridad (alta primero)", () => {
    expect(ordenarTareas(ts, "prioridad")[0].id).toBe("b");
  });
});

describe("vencimientos y resumen", () => {
  const ahora = new Date("2026-11-03T12:00:00.000Z");
  it("estaVencida: solo activas con fecha pasada", () => {
    expect(estaVencida(T("x", { fechaLimite: "2026-11-02T00:00:00.000Z" }), ahora)).toBe(true);
    expect(estaVencida(T("x", { fechaLimite: "2026-11-02T00:00:00.000Z", estado: "completada" }), ahora)).toBe(false);
  });
  it("tareasPorVencer: dentro de 48 h, activas y futuras", () => {
    const ts = [
      T("pronto", { fechaLimite: "2026-11-04T12:00:00.000Z" }),
      T("lejos", { fechaLimite: "2026-11-20T12:00:00.000Z" }),
      T("pasada", { fechaLimite: "2026-11-01T12:00:00.000Z" }),
      T("hecha", { fechaLimite: "2026-11-04T12:00:00.000Z", estado: "completada" }),
    ];
    expect(tareasPorVencer(ts, 48, ahora).map((t) => t.id)).toEqual(["pronto"]);
  });
  it("resumenTareas cuenta por estado y vencidas", () => {
    const ts = [T("a", { fechaLimite: "2026-11-01T00:00:00.000Z" }), T("b", { estado: "en curso", fechaLimite: "2026-12-01T00:00:00.000Z" }), T("c", { estado: "completada" })];
    expect(resumenTareas(ts, ahora)).toEqual({ total: 3, pendientes: 1, enCurso: 1, completadas: 1, vencidas: 1 });
  });
  it("textoVencimiento", () => {
    expect(textoVencimiento(T("x", { fechaLimite: "2026-11-03T15:00:00.000Z" }), ahora)).toBe("vence en 3 h");
    expect(textoVencimiento(T("x", { fechaLimite: "2026-11-04T12:00:00.000Z" }), ahora)).toBe("vence mañana");
    expect(textoVencimiento(T("x", { fechaLimite: "2026-11-01T12:00:00.000Z" }), ahora)).toBe("venció hace 2 d");
  });
});

// ---------- Validación estricta (espejo del backend) ----------
describe("título y materia", () => {
  const e = (campo, valor) => errorDeCampo(campo, valor, opc);
  it("título: mínimo 3, al menos una letra, sin símbolos raros ni repeticiones", () => {
    expect(e("titulo", "ab")).toBe("El título debe tener al menos 3 caracteres");
    expect(e("titulo", "12345")).toBe("El título debe incluir al menos una letra");
    expect(e("titulo", "TP <b>")).toBe("El título tiene caracteres no permitidos");
    expect(e("titulo", "Holaaaa")).toBe("El título no puede repetir un mismo carácter más de 3 veces seguidas");
    expect(e("titulo", "Informe N° 2: ¿Qué es la energía?")).toBeNull();
  });
  it("materia: 2 a 40, solo letras/números/espacios y . - ' & ( )", () => {
    expect(e("materia", "F")).toBe("La materia debe tener al menos 2 caracteres");
    expect(e("materia", "x".repeat(41))).toBe("La materia no puede superar los 40 caracteres");
    expect(e("materia", "Física #1")).toBe("La materia solo admite letras, números, espacios y . - ' & ( )");
    expect(e("materia", "2024")).toBe("La materia debe incluir al menos una letra");
    expect(e("materia", "Matemática II (Cálculo)")).toBeNull();
  });
  it("descripción: hasta 500 y sin caracteres de control", () => {
    expect(e("descripcion", "x".repeat(501))).toBe("La descripción no puede superar los 500 caracteres");
    expect(e("descripcion", "a\u0007b")).toBe("La descripción tiene caracteres no permitidos");
    expect(e("descripcion", "Línea 1\nLínea 2")).toBeNull();
  });
});

describe("fecha y hora", () => {
  const e = (v, o = opc) => errorDeCampo("fechaLimite", v, o);
  it("exige fecha y hora, y un día que exista", () => {
    expect(e("2026-12-01")).toBe("La fecha límite debe incluir fecha y hora");
    expect(e("2027-02-31T10:00")).toBe("La fecha límite no es válida");
    expect(e("2027-04-31T10:00")).toBe("La fecha límite no es válida");
    expect(e("2028-02-29T10:00")).toBeNull();
    expect(e("2027-02-29T10:00")).toBe("La fecha límite no es válida");
  });
  it("rechaza horas y minutos fuera de rango", () => {
    expect(errorFormatoFecha("2026-12-01T24:00")).toBe("La fecha límite no es válida");
    expect(errorFormatoFecha("2026-12-01T10:60")).toBe("La fecha límite no es válida");
    expect(errorFormatoFecha("mañana a las 10")).toBe("La fecha límite no es válida");
  });
  it("no admite el pasado ni 'ahora mismo'", () => {
    expect(e("2026-11-16T11:00")).toBe("La fecha límite debe ser posterior al momento actual");
    expect(e(aInputFecha(AHORA.toISOString()))).toBe("La fecha límite debe ser posterior al momento actual");
  });
  it("no admite más de 5 años hacia adelante", () => {
    expect(e("2032-01-01T10:00")).toBe("La fecha límite no puede superar los 5 años desde hoy");
    expect(e("2031-10-01T10:00")).toBeNull();
  });
  it("al editar, conservar una fecha ya vencida es válido; cambiarla a otra pasada no", () => {
    const vencida = new Date("2026-11-01T10:00").toISOString();
    expect(e(aInputFecha(vencida), { ahora: AHORA, fechaOriginal: vencida })).toBeNull();
    expect(e("2026-11-02T10:00", { ahora: AHORA, fechaOriginal: vencida })).toBe("La fecha límite debe ser posterior al momento actual");
  });
  it("limitesFecha da min = ahora y max = +5 años; fechaAISO devuelve UTC", () => {
    const { min, max } = limitesFecha(AHORA);
    expect(min).toBe(aInputFecha(AHORA.toISOString()));
    expect(max.slice(0, 4)).toBe("2031");
    expect(fechaAISO("2026-12-01T20:00")).toBe(new Date("2026-12-01T20:00").toISOString());
  });
});

describe("erroresTarea y filtros de escritura", () => {
  it("devuelve un error por campo", () => {
    const r = erroresTarea({ titulo: "", materia: "1", fechaLimite: "", prioridad: "x" }, opc);
    expect(Object.keys(r).sort()).toEqual(["fechaLimite", "materia", "prioridad", "titulo"]);
  });
  it("limpiarTitulo / limpiarMateria quitan lo no permitido y los espacios dobles", () => {
    expect(limpiarTitulo("  TP <b>de</b>   Física 😀")).toBe("TP bde/b Física ");
    expect(limpiarTitulo("TP 😀 uno")).toBe("TP uno");
    expect(limpiarMateria("Física #1 {x}")).toBe("Física 1 x");
    expect(limpiarMateria("a".repeat(60)).length).toBe(LIMITES.materiaMax);
  });
  it("limpiarBusqueda corta a 50 y quita caracteres de control", () => {
    expect(limpiarBusqueda("a\u0000b")).toBe("ab");
    expect(limpiarBusqueda("x".repeat(80)).length).toBe(50);
  });
  it("normalizarTexto y canonizarMateria", () => {
    expect(normalizarTexto("  TP   de  Física ")).toBe("TP de Física");
    expect(canonizarMateria("fisica", ["Física", "Arte"])).toBe("Física");
    expect(canonizarMateria("Química", ["Física"])).toBe("Química");
  });
});

describe("credenciales", () => {
  it("usuario y contraseña con las mismas reglas que el servidor", () => {
    expect(errorUsuario("ana.perez")).toBeNull();
    expect(errorUsuario("_ana")).toMatch(/Usuario/);
    expect(errorPassword("secreto12", "ana")).toBeNull();
    expect(errorPassword("corta1", "ana")).toBe("La contraseña debe tener entre 8 y 72 caracteres");
    expect(errorPassword("solo letras", "ana")).toBe("La contraseña debe combinar letras y números");
    expect(errorPassword("ANA12345", "ana12345")).toBe("La contraseña no puede ser igual al usuario");
    expect(errorPassword("password1", "ana")).toBe("Esa contraseña es demasiado común");
  });
});
