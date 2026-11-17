// TaskForm.jsx
// Formulario de alta y edición. Solo maneja estado de UI: las reglas viven en
// logic/taskLogic.js y quién guarda (API) lo decide el padre vía onSubmit.
//
// Filtros de entrada: título y materia no dejan escribir caracteres no permitidos,
// y la fecha solo acepta desde ahora hasta 5 años. Los errores aparecen junto a cada campo.

import { useState } from "react";
import {
  LIMITES, aInputFecha, canonizarMateria, erroresTarea, fechaAISO, limitesFecha,
  limpiarDescripcion, limpiarMateria, limpiarTitulo, normalizarTexto,
} from "../logic/taskLogic";
import { Icono } from "./Icono";

const VACIO = { titulo: "", descripcion: "", materia: "", fechaLimite: "", prioridad: "media" };
const LIMPIAR = { titulo: limpiarTitulo, materia: limpiarMateria, descripcion: limpiarDescripcion };

// Atajos: hoy / mañana / en una semana, a las 23:59.
const atajo = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(23, 59, 0, 0);
  return aInputFecha(d.toISOString());
};

function Campo({ nombre, etiqueta, error, contador, ayuda, aviso, children }) {
  return (
    <div className={`campo ${error ? "invalido" : ""}`}>
      <label htmlFor={`f-${nombre}`}>
        {etiqueta}
        {contador && <span className="contador">{contador}</span>}
      </label>
      {children}
      {error ? (
        <p className="msg-error" id={`e-${nombre}`} role="alert"><Icono n="alerta" size={14} />{error}</p>
      ) : (
        <>
          {aviso && <p className="aviso-campo">{aviso}</p>}
          {ayuda && <p className="ayuda">{ayuda}</p>}
        </>
      )}
    </div>
  );
}

export default function TaskForm({ tareaEditar, materias = [], onSubmit, onCancel }) {
  const [datos, setDatos] = useState(
    tareaEditar
      ? {
          titulo: tareaEditar.titulo,
          descripcion: tareaEditar.descripcion,
          materia: tareaEditar.materia,
          fechaLimite: aInputFecha(tareaEditar.fechaLimite),
          prioridad: tareaEditar.prioridad,
        }
      : VACIO
  );
  const [tocados, setTocados] = useState({});
  const [intentado, setIntentado] = useState(false);
  const [avisos, setAvisos] = useState({});
  const [errorServidor, setErrorServidor] = useState("");
  const [enviando, setEnviando] = useState(false);

  const ahora = new Date();
  const original = tareaEditar?.fechaLimite ?? null;
  const errores = erroresTarea(datos, { ahora, fechaOriginal: original });
  const ver = (campo) => (intentado || tocados[campo] ? errores[campo] : null);
  const limites = limitesFecha(ahora);
  // Al editar una tarea ya vencida, el selector debe poder mostrar su fecha original.
  const minFecha = original && aInputFecha(original) < limites.min ? aInputFecha(original) : limites.min;

  const cambiar = (campo) => (e) => {
    const bruto = e.target.value;
    const limpio = LIMPIAR[campo] ? LIMPIAR[campo](bruto) : bruto;
    const quitoAlgo = limpio.replace(/\s/g, "").length < bruto.replace(/\s/g, "").length;
    setAvisos((a) => ({ ...a, [campo]: quitoAlgo }));
    setDatos({ ...datos, [campo]: limpio });
  };
  const tocar = (campo) => () => setTocados((t) => ({ ...t, [campo]: true }));
  const aviso = (campo) => (avisos[campo] ? "Se quitaron caracteres no permitidos o que superan el límite." : null);

  async function handleSubmit(e) {
    e.preventDefault();
    setIntentado(true);
    setErrorServidor("");
    const primero = Object.keys(errores)[0];
    if (primero) {
      e.currentTarget.elements[primero]?.focus();
      return;
    }
    // Si la fecha no se tocó al editar, se reenvía la original tal cual.
    const fechaIgual = tareaEditar && datos.fechaLimite === aInputFecha(tareaEditar.fechaLimite);
    const payload = {
      titulo: normalizarTexto(datos.titulo),
      descripcion: datos.descripcion.trim(),
      materia: canonizarMateria(datos.materia, materias),
      prioridad: datos.prioridad,
      fechaLimite: fechaIgual ? tareaEditar.fechaLimite : fechaAISO(datos.fechaLimite),
    };
    setEnviando(true);
    try {
      await onSubmit(payload);
      if (!tareaEditar) {
        setDatos(VACIO);
        setTocados({});
        setIntentado(false);
        setAvisos({});
      }
    } catch (err) {
      setErrorServidor(err.message); // ej: duplicada (409) o error del servidor
    } finally {
      setEnviando(false);
    }
  }

  const descripcionContador = `${datos.descripcion.length}/${LIMITES.descripcionMax}`;

  return (
    <form onSubmit={handleSubmit} className="panel formulario" noValidate aria-label={tareaEditar ? "Editar tarea" : "Nueva tarea"}>
      <div className="formulario-cabecera">
        <h2>{tareaEditar ? "Editar tarea" : "Nueva tarea"}</h2>
        {tareaEditar && (
          <button type="button" className="icono" onClick={onCancel} aria-label="Cancelar edición" title="Cancelar edición">
            <Icono n="mas" style={{ transform: "rotate(45deg)" }} />
          </button>
        )}
      </div>

      {errorServidor && (
        <p className="error-general" role="alert"><Icono n="alerta" size={16} />{errorServidor}</p>
      )}

      <Campo nombre="titulo" etiqueta="Título" error={ver("titulo")} aviso={aviso("titulo")} contador={`${datos.titulo.length}/${LIMITES.tituloMax}`}>
        <input id="f-titulo" name="titulo" value={datos.titulo} onChange={cambiar("titulo")} onBlur={tocar("titulo")}
          placeholder="Ej: TP 2 de Física" maxLength={LIMITES.tituloMax} autoComplete="off"
          aria-invalid={!!ver("titulo")} aria-describedby={ver("titulo") ? "e-titulo" : undefined} />
      </Campo>

      <Campo nombre="materia" etiqueta="Materia" error={ver("materia")} aviso={aviso("materia")}
        ayuda="Letras, números, espacios y . - ' & ( )">
        <input id="f-materia" name="materia" value={datos.materia} onChange={cambiar("materia")} onBlur={tocar("materia")}
          placeholder="Ej: Física II" maxLength={LIMITES.materiaMax} list="lista-materias" autoComplete="off"
          aria-invalid={!!ver("materia")} aria-describedby={ver("materia") ? "e-materia" : undefined} />
        <datalist id="lista-materias">{materias.map((m) => <option key={m} value={m} />)}</datalist>
      </Campo>

      <div className="fila">
        <Campo nombre="prioridad" etiqueta="Prioridad" error={ver("prioridad")}>
          <select id="f-prioridad" name="prioridad" value={datos.prioridad} onChange={cambiar("prioridad")}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </Campo>
        <Campo nombre="fechaLimite" etiqueta="Fecha y hora límite" error={ver("fechaLimite")}>
          <input id="f-fechaLimite" name="fechaLimite" type="datetime-local" value={datos.fechaLimite}
            min={minFecha} max={limites.max} onChange={cambiar("fechaLimite")} onBlur={tocar("fechaLimite")}
            aria-invalid={!!ver("fechaLimite")} aria-describedby={ver("fechaLimite") ? "e-fechaLimite" : undefined} />
        </Campo>
      </div>
      <div className="atajos" aria-label="Atajos de fecha">
        <button type="button" className="chico" onClick={() => setDatos({ ...datos, fechaLimite: atajo(0) })}>Hoy 23:59</button>
        <button type="button" className="chico" onClick={() => setDatos({ ...datos, fechaLimite: atajo(1) })}>Mañana 23:59</button>
        <button type="button" className="chico" onClick={() => setDatos({ ...datos, fechaLimite: atajo(7) })}>En 1 semana</button>
      </div>
      <p className="ayuda" style={{ marginTop: -6 }}>Hora local. Desde ahora hasta {LIMITES.anios} años.</p>

      <Campo nombre="descripcion" etiqueta="Descripción (opcional)" error={ver("descripcion")} aviso={aviso("descripcion")} contador={descripcionContador}>
        <textarea id="f-descripcion" name="descripcion" value={datos.descripcion} onChange={cambiar("descripcion")} onBlur={tocar("descripcion")}
          placeholder="Detalle, consignas, material…" maxLength={LIMITES.descripcionMax} rows={3} />
      </Campo>

      <div className="acciones">
        <button type="submit" className="primario" disabled={enviando}>
          <Icono n={tareaEditar ? "check" : "mas"} size={16} />
          {enviando ? "Guardando…" : tareaEditar ? "Guardar cambios" : "Crear tarea"}
        </button>
        {tareaEditar && <button type="button" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}
