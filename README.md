# 📚 TareasYA

**Organizador de tareas y estudio para estudiantes.** Centraliza tareas, trabajos prácticos y fechas de entrega por materia, prioridad y fecha límite, y avisa antes de que venzan.

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-36%20passing-brightgreen)

---

## 🎯 ¿Qué problema resuelve?

Los estudiantes organizan sus entregas en cuadernos, mensajes sueltos o el chat del curso, y las fechas se pierden. TareasYA junta todo en un solo lugar, ordenado por lo que vence primero.

## ✨ Funcionalidades

- ✅ Crear, editar y eliminar tareas (con confirmación al eliminar)
- 🏷️ Estados (pendiente, en curso, completada), prioridad, materia y favoritas
- 🔎 Búsqueda por título o materia, filtros y orden (fecha, prioridad, recientes)
- ⏰ Resumen de tareas, destaque de vencidas y aviso de las que vencen en 48 h
- 🔔 Notificaciones del navegador (con tu permiso)
- 📴 **Modo local:** si no hay servidor, la app funciona igual guardando en el navegador
- 🌗 Diseño responsive con modo oscuro automático
- 🚫 Regla anti-duplicados: no permite dos tareas activas con el mismo título y materia

## 🧱 Tecnologías

| Parte | Stack |
|-------|-------|
| Frontend | React 18, Vite 5, CSS propio |
| Backend | Node.js, Express 5 (arquitectura en capas) |
| Persistencia | Archivo JSON con escritura atómica (o `localStorage` en modo local) |
| Pruebas | Vitest (frontend) y `node:test` (backend) |

## 📁 Estructura

```
TareasYA/
├── backend/
│   ├── src/        app.js, server.js, routes/, controllers/, services/, repositories/, logic/
│   ├── test/       tests de la API
│   └── data/       tareas.json (se crea solo, ignorado por git)
├── frontend/
│   ├── index.html
│   └── src/        App.jsx, components/, logic/ (+ tests)
└── docs/           SPEC, bitácora y entregas de los TP
```

## 🚀 Instalación y uso

**Requisito:** [Node.js](https://nodejs.org) 18 o superior.

```bash
git clone https://github.com/TU_USUARIO/TareasYA.git
cd TareasYA
```

Hacen falta **dos terminales** abiertas a la vez.

**Terminal 1: backend** (http://localhost:3001)

```bash
cd backend
npm install
npm start
```

**Terminal 2: frontend** (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

Abrí http://localhost:5173. Si no ves el aviso amarillo de "Modo local", la app está conectada al backend.

> 💡 **Windows / PowerShell:** si aparece el error *"la ejecución de scripts está deshabilitada"*, usá `npm.cmd` en lugar de `npm` (por ejemplo `npm.cmd install`), o abrí el Símbolo del sistema (cmd).

## 🧪 Pruebas

```bash
cd backend  && npm test    # 14 tests
cd frontend && npm test    # 22 tests
cd frontend && npm run build
```

## 🔌 API

Base: `/api`. Los errores responden `{ "error": "mensaje" }`.

| Método | Ruta | Descripción | Respuestas |
|--------|------|-------------|------------|
| GET | `/salud` | Disponibilidad | 200 |
| GET | `/tareas` | Lista. Query: `q`, `materia`, `estado`, `prioridad`, `favorito=true`, `orden=fecha\|prioridad\|creacion` | 200 |
| POST | `/tareas` | Crea una tarea | 201, 400, 409 |
| GET | `/tareas/:id` | Obtiene una tarea | 200, 404 |
| PATCH | `/tareas/:id` | Edita campos | 200, 400, 404, 409 |
| DELETE | `/tareas/:id` | Elimina una tarea | 204, 404 |

Ejemplo:

```bash
curl -X POST http://localhost:3001/api/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"TP de Física","materia":"Física","fechaLimite":"2026-12-01T20:00","prioridad":"alta"}'
```

### Modelo de una tarea

```json
{
  "id": "mhk3x9...",
  "titulo": "TP de Física",
  "descripcion": "",
  "materia": "Física",
  "fechaLimite": "2026-12-01T23:00:00.000Z",
  "prioridad": "alta",
  "estado": "pendiente",
  "favorito": false,
  "fechaCreacion": "2026-11-03T18:00:00.000Z",
  "fechaActualizacion": "2026-11-03T18:00:00.000Z"
}
```

## 🏗️ Arquitectura

Backend en capas, cada una con una sola responsabilidad:

```
Ruta → Controller → Service → Lógica (reglas puras)
                         └──→ Repositorio → data/tareas.json
```

El frontend accede a los datos solo a través de `taskClient.js`, que usa la API si el servidor responde y `localStorage` si no. Más detalle en [`docs/SPEC-TareasYA.pdf`](docs/SPEC-TareasYA.pdf).

## 📖 Documentación

- [SPEC y plan técnico](docs/SPEC-TareasYA.pdf)
- [Bitácora de versiones](docs/BITACORA-TareasYA.pdf) ([versión Markdown](docs/BITACORA.md))
- `docs/entregas/`: entregas de cada trabajo práctico

## ⚠️ Limitaciones conocidas

- Sin autenticación: pensado para uso personal.
- Persistencia en JSON: adecuada para pocas tareas.
- La interfaz tiene tests de lógica, pero no tests de componentes ni de punta a punta.

## 🗺️ Próximos pasos

- [ ] Tests de componentes y pruebas en celular
- [ ] Migrar a SQLite con paginación y filtros en el servidor
- [ ] Cuentas de usuario
- [ ] PWA y recordatorios configurables

## 👤 Autor

**Santino Crespo** · 6.° 2.ª · E.T. N.° 35 "Ing. Eduardo Latzina"

Proyecto educativo.
