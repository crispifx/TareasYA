// taskLogic.test.js
// Tests unitarios de la lógica del frontend (validación, creación, filtros, orden, vencimientos).

import { describe, it, expect } from "vitest";
import {
  validarDatosTarea,
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

const base = { titulo: "TP", materia: "Física", fechaLimite: "2026-09-01T18:00", prioridad: "alta" };

describe("validarDatosTarea", () => {
  it("caso correcto: datos completos y válidos", () => {
    const r = validarDatosTarea({ ...base, titulo: "TP de Física" });
    expect(r.valido).toBe(true);
    expect(r.error).toBeNull();
  });
  it("caso inválido: título vacío devuelve error específico", () => {
    const r = validarDatosTarea({ ...base, titulo: "   " });
    expect(r.valido).toBe(false);
    expect(r.error).toBe("El título es obligatorio");
  });
  it("caso inválido: prioridad fuera de las permitidas", () => {
    const r = validarDatosTarea({ ...base, prioridad: "urgente" });
    expect(r.error).toBe("La prioridad no es válida");
  });
  it("caso límite: fecha con formato inválido", () => {
    const r = validarDatosTarea({ ...base, fechaLimite: "31-31-2026" });
    expect(r.error).toBe("La fecha límite no es válida");
  });
  it("caso límite: fecha vacía es obligatoria", () => {
    expect(validarDatosTarea({ ...base, fechaLimite: "" }).error).toBe("La fecha límite es obligatoria");
  });
  it("caso límite: título con espacios al borde es válido", () => {
    expect(validarDatosTarea({ ...base, titulo: "  TP de Programación  " }).valido).toBe(true);
  });
  it("caso límite: título de más de 100 caracteres se rechaza", () => {
    expect(validarDatosTarea({ ...base, titulo: "x".repeat(101) }).valido).toBe(false);
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
    expect(t.titulo).toBe("TP");
  });
  it("detecta duplicadas activas sin distinguir mayúsculas; ignora completadas y a sí misma", () => {
    const t = { ...crearTarea(base), id: "a" };
    expect(existeDuplicada([t], " tp ", "FÍSICA")).toBe(true);
    expect(existeDuplicada([t], "tp", "Física", "a")).toBe(false);
    expect(existeDuplicada([{ ...t, estado: "completada" }], "tp", "Física")).toBe(false);
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
