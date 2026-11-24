/* Generador de enlaces personalizados: index.html?invitado=...&pases=... */
(() => {
  "use strict";

  const B = window.BODA || { novia: "", novio: "" };
  const $ = (sel) => document.querySelector(sel);

  const form = $("#gen-form");
  const base = $("#gen-base");
  const resultado = $("#gen-resultado");
  const link = $("#gen-link");
  const mensaje = $("#gen-mensaje");
  const whatsapp = $("#gen-whatsapp");

  base.value = new URL("index.html", location.href).href;
  // Aviso cuando la página se abre desde la computadora o desde el servidor local
  const esLocal =
    location.protocol === "file:" ||
    /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(location.hostname);
  if (esLocal) $("#gen-aviso").hidden = false;

  let toastTimer = 0;
  function aviso(texto) {
    const t = $("#toast");
    t.textContent = texto;
    t.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2200);
  }

  function actualizarWhatsApp() {
    whatsapp.href = `https://wa.me/?text=${encodeURIComponent(mensaje.value)}`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    $("#gen-error").hidden = !!nombre;
    if (!nombre) return form.nombre.focus();

    let url;
    try {
      url = new URL(base.value.trim() || "index.html", location.href);
    } catch {
      aviso("El enlace base no es válido");
      return base.focus();
    }
    url.searchParams.set("invitado", nombre);
    const pases = parseInt(form.pases.value, 10);
    if (pases > 0) url.searchParams.set("pases", String(pases));
    else url.searchParams.delete("pases");

    link.value = url.href;
    $("#gen-ver").href = url.href;
    mensaje.value =
      `¡Hola, ${nombre}! 💌\n\n` +
      `${B.novia} y ${B.novio} tenemos la alegría de invitarles a nuestra boda.\n` +
      `Abran su invitación aquí:\n${url.href}`;
    actualizarWhatsApp();
    resultado.hidden = false;
    resultado.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  mensaje.addEventListener("input", actualizarWhatsApp);

  $("#gen-copiar").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link.value);
    } catch {
      link.select();
      document.execCommand("copy");
    }
    aviso("¡Enlace copiado!");
  });
})();
