// Auth.jsx: ingreso y registro. En el registro, las reglas se validan mientras se escribe.
import { useState } from "react";
import { ingresar, registrarse } from "../logic/taskClient";
import { errorPassword, errorUsuario } from "../logic/taskLogic";
import { Icono } from "./Icono";

const soloUsuario = (v) => v.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 30);

export default function Auth({ onListo }) {
  const [modo, setModo] = useState("login");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const registro = modo === "registro";
  const reglas = [
    ["8 a 72 caracteres", password.length >= 8 && password.length <= 72],
    ["Combina letras y números", /\p{L}/u.test(password) && /\d/.test(password)],
    ["Distinta del usuario", password !== "" && password.toLowerCase() !== usuario.toLowerCase()],
  ];
  const errorForm = registro ? errorUsuario(usuario) || errorPassword(password, usuario) : null;
  const errorUsr = registro && usuario ? errorUsuario(usuario) : null;
  // Si ya se cumplen los tres requisitos visibles, lo que falta es "demasiado común".
  const errorPass = registro && password && reglas.every(([, ok]) => ok) ? errorPassword(password, usuario) : null;
  const incompleto = !usuario || !password;

  async function enviar(e) {
    e.preventDefault();
    if (registro && errorForm) return setError(errorForm);
    setError(""); setEnviando(true);
    try {
      await (registro ? registrarse : ingresar)(usuario.trim(), password);
      onListo();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const cambiarModo = (m) => { setModo(m); setError(""); };

  return (
    <main className="auth">
      <section className="auth-marca">
        <span className="marca"><span className="marca-logo"><Icono n="tilde" size={22} /></span></span>
        <h1>Tus entregas, bajo control.</h1>
        <p>Cargá tareas por materia, mirá qué vence primero y marcá lo que ya terminaste.</p>
        <ul>
          <li><Icono n="calendario" /><span>Calendario de entregas<small>Todas las fechas límite del mes en una vista.</small></span></li>
          <li><Icono n="tilde" /><span>Progreso por estado<small>Pendientes, en curso y completadas, siempre a mano.</small></span></li>
          <li><Icono n="candado" /><span>Tareas privadas<small>Cada usuario ve únicamente las suyas.</small></span></li>
        </ul>
      </section>

      <section className="auth-panel">
        <form className="panel auth-form" onSubmit={enviar} noValidate>
          <h2>{registro ? "Crear cuenta" : "Ingresar a TareasYA"}</h2>
          <div className="segmentado" role="tablist">
            <button type="button" role="tab" aria-selected={!registro} className={!registro ? "on" : ""} onClick={() => cambiarModo("login")}>Ingresar</button>
            <button type="button" role="tab" aria-selected={registro} className={registro ? "on" : ""} onClick={() => cambiarModo("registro")}>Crear cuenta</button>
          </div>

          <div className={`campo ${errorUsr ? "invalido" : ""}`}>
            <label htmlFor="a-usuario">Usuario</label>
            <input id="a-usuario" value={usuario} onChange={(e) => setUsuario(soloUsuario(e.target.value))}
              autoComplete="username" maxLength={30} autoCapitalize="none" spellCheck={false} />
            {errorUsr
              ? <p className="msg-error" role="alert"><Icono n="alerta" size={14} />{errorUsr}</p>
              : registro && <p className="ayuda">3 a 30 caracteres: letras, números, . _ - (sin empezar ni terminar con símbolo).</p>}
          </div>

          <div className={`campo ${errorPass ? "invalido" : ""}`}>
            <label htmlFor="a-pass">Contraseña</label>
            <div className="entrada-icono con-boton">
              <input id="a-pass" type={ver ? "text" : "password"} value={password} maxLength={72}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={registro ? "new-password" : "current-password"} />
              <button type="button" className="icono" onClick={() => setVer(!ver)}
                aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"} title={ver ? "Ocultar" : "Mostrar"}>
                <Icono n={ver ? "ojoNo" : "ojo"} size={17} />
              </button>
            </div>
            {registro && (
              <ul className="reglas" aria-label="Requisitos de la contraseña">
                {reglas.map(([t, ok]) => <li key={t} className={ok ? "ok" : ""}>{t}</li>)}
              </ul>
            )}
            {errorPass && <p className="msg-error" role="alert"><Icono n="alerta" size={14} />{errorPass}</p>}
          </div>

          {error && <p className="error-general" role="alert"><Icono n="alerta" size={16} />{error}</p>}
          <button type="submit" className="primario" disabled={enviando || incompleto || (registro && !!errorForm)}>
            {enviando ? "Un momento…" : registro ? "Crear cuenta y entrar" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
