// Auth.jsx: ingreso y registro.
import { useState } from "react";
import { ingresar, registrarse } from "../logic/taskClient";

export default function Auth({ onListo }) {
  const [modo, setModo] = useState("login");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError(""); setEnviando(true);
    try {
      await (modo === "login" ? ingresar : registrarse)(usuario.trim(), password);
      onListo();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-marca">
        <h1>Tareas<span>YA</span></h1>
        <p>Tus entregas, tus fechas, tu ritmo.<br />Todo en un solo lugar, solo tuyo.</p>
        <ul><li>📅 Calendario de entregas</li><li>✅ Progreso por materia</li><li>🔐 Tareas privadas por usuario</li></ul>
      </div>
      <form className="card auth-form" onSubmit={enviar}>
        <div className="vistas" role="tablist">
          <button type="button" className={modo === "login" ? "on" : ""} onClick={() => { setModo("login"); setError(""); }}>Ingresar</button>
          <button type="button" className={modo === "registro" ? "on" : ""} onClick={() => { setModo("registro"); setError(""); }}>Crear cuenta</button>
        </div>
        <label>Usuario
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required minLength={3} maxLength={30} />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={modo === "login" ? "current-password" : "new-password"} required minLength={6} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={enviando}>{enviando ? "…" : modo === "login" ? "Entrar" : "Crear cuenta y entrar"}</button>
      </form>
    </main>
  );
}
