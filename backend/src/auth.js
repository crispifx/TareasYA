// src/auth.js: usuarios, contraseñas (scrypt) y sesiones con token firmado (HMAC).
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { als } = require("./contexto");

const base = () => process.env.TAREASYA_DB || path.join(__dirname, "..", "data", "tareas.json");
const dir = () => path.dirname(base());
const archivoUsuarios = () => path.join(dir(), "usuarios.json");
const DIAS = 30;

function asegurarDir() { if (!fs.existsSync(dir())) fs.mkdirSync(dir(), { recursive: true }); }
function leerUsuarios() {
  try { return JSON.parse(fs.readFileSync(archivoUsuarios(), "utf-8")); } catch { return []; }
}
function guardarUsuarios(u) {
  asegurarDir();
  const tmp = `${archivoUsuarios()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(u, null, 2));
  fs.renameSync(tmp, archivoUsuarios());
}
function secreto() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const f = path.join(dir(), "secret.key");
  asegurarDir();
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(32).toString("hex"));
  return fs.readFileSync(f, "utf-8");
}
const firmar = (s) => crypto.createHmac("sha256", secreto()).update(s).digest("base64url");

function crearToken(u) {
  const p = Buffer.from(JSON.stringify({ uid: u.id, n: u.usuario, exp: Date.now() + DIAS * 864e5 })).toString("base64url");
  return `${p}.${firmar(p)}`;
}
function leerToken(t = "") {
  const [p, f] = t.split(".");
  if (!p || !f) return null;
  const esperado = Buffer.from(firmar(p)), recibido = Buffer.from(f);
  if (esperado.length !== recibido.length || !crypto.timingSafeEqual(esperado, recibido)) return null;
  try {
    const d = JSON.parse(Buffer.from(p, "base64url").toString());
    return d.exp > Date.now() ? d : null;
  } catch { return null; }
}
const hash = (pw, salt = crypto.randomBytes(16).toString("hex")) =>
  `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
function coincide(pw, guardado) {
  const [salt, h] = guardado.split(":");
  const a = Buffer.from(h, "hex"), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function registro(req, res) {
  const { usuario = "", password = "" } = req.body || {};
  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(usuario))
    return res.status(400).json({ error: "Usuario: 3 a 30 caracteres (letras, números, . _ -)" });
  if (typeof password !== "string" || password.length < 6 || password.length > 100)
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  const us = leerUsuarios();
  if (us.some((u) => u.usuario.toLowerCase() === usuario.toLowerCase()))
    return res.status(409).json({ error: "Ese usuario ya existe" });
  const u = { id: crypto.randomUUID(), usuario, clave: hash(password), creado: new Date().toISOString() };
  guardarUsuarios([...us, u]);
  res.status(201).json({ token: crearToken(u), usuario: u.usuario });
}

const intentos = new Map(); // límite simple contra fuerza bruta
function login(req, res) {
  const ip = req.ip, ahora = Date.now();
  const rec = (intentos.get(ip) || []).filter((t) => ahora - t < 15 * 60e3);
  if (rec.length >= 10) return res.status(429).json({ error: "Demasiados intentos. Probá en 15 minutos" });
  const { usuario = "", password = "" } = req.body || {};
  const u = leerUsuarios().find((x) => x.usuario.toLowerCase() === String(usuario).toLowerCase());
  if (!u || typeof password !== "string" || !coincide(password, u.clave)) {
    intentos.set(ip, [...rec, ahora]);
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }
  res.json({ token: crearToken(u), usuario: u.usuario });
}

function requerirAuth(req, res, next) {
  if (process.env.TAREASYA_SIN_AUTH === "1") return next(); // solo para los tests
  const d = leerToken((req.headers.authorization || "").replace("Bearer ", ""));
  if (!d) return res.status(401).json({ error: "Iniciá sesión para continuar" });
  req.usuario = d.n;
  als.run({ uid: d.uid }, next);
}

module.exports = { registro, login, requerirAuth };
