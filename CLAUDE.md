# TareasYA: guía para agentes de IA

Organizador de tareas para estudiantes. Backend Express (puerto 3001) + frontend React/Vite (puerto 5173).

## Comandos
- Backend: `cd backend && npm install && npm start` / `npm test` (node:test)
- Frontend: `cd frontend && npm install && npm run dev` / `npm test` (Vitest) / `npm run build`
- En PowerShell de Windows, si `npm` está bloqueado, usar `npm.cmd`.

## Arquitectura (backend)
`routes → controllers → services → logic (reglas puras)` y `services → repositories → data/tareas.json`.
- Reglas de negocio en `logic/` y `services/`. El controller no decide nada.
- Resultado de un service: `{ ok, status, datos | error }`.
- `app.js` arma Express; `server.js` solo abre el puerto (para poder testear).
- Rutas fijas antes de `/tareas/:id`.

## Flujo de trabajo obligatorio
1. **Rojo**: test que falla (por la razón correcta). Commit `test(rojo): ...`.
2. **Verde**: código mínimo, suite completa en verde. Commit `feat(verde): ...`.
3. **Refactor**: limpiar sin tocar tests. Commit `refactor: ...`.
4. **Revisión**: si se tocó un endpoint, pasar por el agente `revisor`.
Detalle en `docs/FLUJO-DE-TRABAJO.md`.

## Agentes del proyecto (`.claude/agents/`)
- `tdd`: guía el ciclo Rojo-Verde-Refactor.
- `revisor`: revisa seguridad y robustez, solo lectura.

## Reglas
- Nunca commitear `backend/data/tareas.json` ni `node_modules`.
- No cambiar el contrato de la API sin actualizar `docs/API.md` y `backend/openapi.yaml`.
- Mensajes de error en español, sin detalles internos.
