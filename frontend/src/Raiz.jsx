// Raiz.jsx: decide entre la pantalla de acceso y la app según haya sesión.
import { useEffect, useState } from "react";
import App from "./App.jsx";
import Auth from "./components/Auth.jsx";
import { sesionActual, salir } from "./logic/taskClient";

export default function Raiz() {
  const [sesion, setSesion] = useState(sesionActual);
  useEffect(() => {
    const alSalir = () => setSesion(null);
    window.addEventListener("tareasya:salir", alSalir);
    return () => window.removeEventListener("tareasya:salir", alSalir);
  }, []);
  return sesion ? (
    <App key={sesion.usuario} usuario={sesion.usuario} onSalir={salir} />
  ) : (
    <Auth onListo={() => setSesion(sesionActual())} />
  );
}
