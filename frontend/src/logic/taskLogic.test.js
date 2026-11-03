// taskLogic.test.js
// Tests unitarios para la funcionalidad de "alta de tarea" (validación + creación),
// tal como quedó luego del refactoring.

import { describe, it, expect } from "vitest";
import { validarDatosTarea, crearTarea, generarIdTarea } from "./taskLogic";

describe("validarDatosTarea", () => {
  it("caso correcto: datos completos y válidos", () => {
    const datos = {
      titulo: "TP de Física",
      materia: "Física",
      fechaLimite: "2026-09-01T18:00",
      prioridad: "alta",
    };
    const resultado = validarDatosTarea(datos);
    expect(resultado.valido).toBe(true);
    expect(resultado.error).toBeNull();
  });

  it("caso inválido: título vacío devuelve error específico", () => {
    const datos = {
      titulo: "   ", // solo espacios, se considera vacío
      materia: "Matemática",
      fechaLimite: "2026-09-01T18:00",
      prioridad: "media",
    };
    const resultado = validarDatosTarea(datos);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBe("El título es obligatorio");
  });

  it("caso inválido: prioridad fuera de las permitidas", () => {
    const datos = {
      titulo: "TP de Química",
      materia: "Química",
      fechaLimite: "2026-09-01T18:00",
      prioridad: "urgente", // no es baja/media/alta
    };
    const resultado = validarDatosTarea(datos);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBe("La prioridad no es válida");
  });

  it("caso límite: fecha límite con formato inválido (no parseable como fecha)", () => {
    const datos = {
      titulo: "TP de Historia",
      materia: "Historia",
      fechaLimite: "31-31-2026", // fecha imposible / no parseable
      prioridad: "baja",
    };
    const resultado = validarDatosTarea(datos);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBe("La fecha límite no es válida");
  });

  it("caso límite: título con espacios al borde se recorta y es válido", () => {
    const datos = {
      titulo: "  TP de Programación  ",
      materia: "Programación",
      fechaLimite: "2026-09-01T18:00",
      prioridad: "media",
    };
    const resultado = validarDatosTarea(datos);
    expect(resultado.valido).toBe(true);
  });
});

describe("crearTarea", () => {
  it("caso correcto: genera una tarea con estado pendiente y favorito en falso por defecto", () => {
    const datos = {
      titulo: "TP de Física",
      descripcion: "Resolver guía de cinemática",
      materia: "Física",
      fechaLimite: "2026-09-01T18:00",
      prioridad: "alta",
    };
    const tarea = crearTarea(datos);

    expect(tarea.titulo).toBe("TP de Física");
    expect(tarea.materia).toBe("Física");
    expect(tarea.estado).toBe("pendiente");
    expect(tarea.favorito).toBe(false);
    expect(typeof tarea.id).toBe("string");
    expect(tarea.id.length).toBeGreaterThan(0);
    expect(new Date(tarea.fechaLimite).toISOString()).toBe(tarea.fechaLimite);
  });

  it("caso límite: descripción vacía u omitida no rompe la creación", () => {
    const datos = {
      titulo: "TP corto",
      materia: "Arte",
      fechaLimite: "2026-09-01T18:00",
      prioridad: "baja",
      // sin 'descripcion'
    };
    const tarea = crearTarea(datos);
    expect(tarea.descripcion).toBe("");
  });

  it("caso límite: dos tareas creadas seguidas tienen ids distintos", () => {
    const id1 = generarIdTarea();
    const id2 = generarIdTarea();
    expect(id1).not.toBe(id2);
  });
});
