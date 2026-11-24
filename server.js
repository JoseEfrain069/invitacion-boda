/* =========================================================
   Servidor local para ver la invitación en el navegador.
   Uso:  npm start      (o bien: node server.js)
   Opcional:  PORT=8080 npm start
   Sin dependencias: solo usa módulos que ya trae Node.
   ========================================================= */
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const RAIZ = __dirname;
const PUERTO_INICIAL = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // 0.0.0.0 = también accesible desde tu celular en la misma red Wi-Fi

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

// Archivos del propio servidor que no se deben mostrar
const PRIVADOS = new Set(["server.js", "package.json", "package-lock.json"]);

/** Convierte la ruta pedida en un archivo dentro del proyecto, o null si no está permitido. */
function resolverArchivo(pathname) {
  let ruta;
  try {
    ruta = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (ruta.includes("\0")) return null;

  const absoluta = path.resolve(RAIZ, "." + ruta);
  if (absoluta !== RAIZ && !absoluta.startsWith(RAIZ + path.sep)) return null; // evita salir de la carpeta (../)

  const partes = path.relative(RAIZ, absoluta).split(path.sep);
  if (partes.some((p) => p.startsWith(".")) || partes[0] === "node_modules") return null;
  if (PRIVADOS.has(partes.join("/"))) return null;
  return absoluta;
}

function enviarError(res, estado, mensaje) {
  const html = `<!DOCTYPE html><html lang="es"><meta charset="utf-8"><title>${estado}</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:Georgia,serif;background:#10241f;color:#ecdcb0;text-align:center">
<div><p style="font-size:4rem;margin:0">${estado}</p><p>${mensaje}</p><p><a href="/" style="color:#c9a45c">Volver a la invitación</a></p></div>`;
  res.writeHead(estado, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(html);
}

async function atender(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }

  const { pathname } = new URL(req.url, "http://localhost");
  let archivo = resolverArchivo(pathname);
  if (!archivo) return enviarError(res, 404, "Esta página no existe.");

  let info;
  try {
    info = await fs.promises.stat(archivo);
    if (info.isDirectory()) {
      archivo = path.join(archivo, "index.html");
      info = await fs.promises.stat(archivo);
    }
  } catch {
    console.log(`  404  ${pathname}`);
    return enviarError(res, 404, "Esta página no existe.");
  }

  const cabeceras = {
    "Content-Type": TIPOS[path.extname(archivo).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-cache", // así ves tus cambios al recargar (F5)
    "Last-Modified": info.mtime.toUTCString(),
    "Accept-Ranges": "bytes",
  };

  // Soporte de "Range" para que la música se pueda reproducir y repetir sin problemas
  let inicio = 0;
  let fin = info.size - 1;
  let estado = 200;
  const rango = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (rango && info.size > 0) {
    if (rango[1] === "") {
      inicio = Math.max(info.size - Number(rango[2]), 0);
    } else {
      inicio = Number(rango[1]);
      if (rango[2] !== "") fin = Math.min(Number(rango[2]), info.size - 1);
    }
    if (inicio > fin) {
      res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
      return res.end();
    }
    estado = 206;
    cabeceras["Content-Range"] = `bytes ${inicio}-${fin}/${info.size}`;
  }

  cabeceras["Content-Length"] = info.size > 0 ? fin - inicio + 1 : 0;
  res.writeHead(estado, cabeceras);
  if (req.method === "HEAD" || info.size === 0) return res.end();

  fs.createReadStream(archivo, { start: inicio, end: fin })
    .on("error", () => res.destroy())
    .pipe(res);
}

function mostrarDirecciones(puerto) {
  // Direcciones de red reales (sin adaptadores virtuales ni direcciones 169.254.x sin conexión)
  const virtual = /vEthernet|WSL|Hyper-V|VirtualBox|VMware|docker|Loopback|Bluetooth/i;
  const redes = Object.entries(os.networkInterfaces())
    .filter(([nombre]) => !virtual.test(nombre))
    .flatMap(([nombre, datos]) =>
      (datos || [])
        .filter((i) => (i.family === "IPv4" || i.family === 4) && !i.internal && !i.address.startsWith("169.254."))
        .map((i) => ({ nombre, ip: i.address }))
    );

  const lineas = [
    "",
    "  💍  La invitación está lista",
    "",
    `  En esta computadora:        http://localhost:${puerto}`,
    ...redes.map(({ nombre, ip }) => `  En tu celular (mismo Wi-Fi): http://${ip}:${puerto}   (${nombre})`),
    "",
    `  Con invitado de ejemplo:    http://localhost:${puerto}/?invitado=Familia%20P%C3%A9rez&pases=4`,
    `  Generador de enlaces:       http://localhost:${puerto}/generador.html`,
    "",
    "  Presiona Ctrl + C para detener el servidor.",
    "",
  ];
  console.log(lineas.join("\n"));
}

function iniciar(puerto, intentosRestantes = 10) {
  const servidor = http.createServer((req, res) => {
    atender(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) enviarError(res, 500, "Ocurrió un error en el servidor.");
      else res.destroy();
    });
  });

  servidor.once("error", (err) => {
    if (err.code === "EADDRINUSE" && intentosRestantes > 0) {
      console.log(`  El puerto ${puerto} está ocupado, probando con el ${puerto + 1}…`);
      iniciar(puerto + 1, intentosRestantes - 1);
    } else {
      console.error(`  No se pudo iniciar el servidor: ${err.message}`);
      process.exit(1);
    }
  });

  servidor.listen(puerto, HOST, () => mostrarDirecciones(puerto));
}

iniciar(PUERTO_INICIAL);
