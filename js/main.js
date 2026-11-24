/* =========================================================
   Invitación de boda — interacción
   Los textos y datos se editan en js/config.js
   ========================================================= */
(() => {
  "use strict";

  const B = window.BODA;
  if (!B) {
    console.error("No se encontró la configuración (js/config.js).");
    document.documentElement.classList.remove("is-locked");
    return;
  }

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Utilidades ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const icono = (nombre, clase = "icon") => `<svg class="${clase}" aria-hidden="true"><use href="#i-${nombre}"></use></svg>`;

  function formatoHora(hhmm) {
    const [h, m = 0] = String(hhmm).split(":").map(Number);
    return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "a. m." : "p. m."}`;
  }

  let toastTimer = 0;
  function aviso(mensaje) {
    const t = $("#toast");
    t.textContent = mensaje;
    t.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2200);
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    aviso("¡Copiado!");
  }

  /* ---------- Datos derivados ---------- */
  const fecha = new Date(B.fecha);
  const fmt = (opciones, d = fecha) => new Intl.DateTimeFormat("es", opciones).format(d);
  const pareja = `${B.novia} & ${B.novio}`;

  // Personalización por enlace: index.html?invitado=Familia%20Pérez&pases=4
  const params = new URLSearchParams(location.search);
  const invitado = (params.get("invitado") || "").trim().slice(0, 80);
  const pases = Math.min(Math.max(parseInt(params.get("pases"), 10) || 0, 0), 20);

  /* ---------- Textos con data-bind ---------- */
  function vincularTextos() {
    const C = B.confirmacion || {};
    const limite = C.fechaLimite ? new Date(`${C.fechaLimite}T12:00`) : null;
    const textos = {
      novia: B.novia,
      novio: B.novio,
      pareja,
      iniciales: `${B.novia.charAt(0)}&${B.novio.charAt(0)}`,
      diaSemana: fmt({ weekday: "long" }),
      dia: fmt({ day: "numeric" }),
      mes: fmt({ month: "long" }),
      anio: fmt({ year: "numeric" }),
      fechaLarga: capitalizar(fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" })),
      fechaCorta: `${pad(fecha.getDate())} · ${pad(fecha.getMonth() + 1)} · ${fecha.getFullYear()}`,
      hora: formatoHora(`${fecha.getHours()}:${fecha.getMinutes()}`),
      hashtag: B.hashtag,
      frase: B.frase,
      fechaLimite: limite ? fmt({ day: "numeric", month: "long" }, limite) : "",
    };

    $$("[data-bind]").forEach((el) => {
      const valor = textos[el.dataset.bind];
      if (valor) el.textContent = valor;
      else if (el.hasAttribute("data-opcional")) el.hidden = true;
    });

    if (!textos.fechaLimite) $("#rsvp-limite").hidden = true;
    if (!B.hashtag) $("#pie-hashtag").hidden = true;
    else $("#hashtag-btn").dataset.copiar = B.hashtag;

    document.title = `${pareja} · Nuestra boda`;
  }

  /* ---------- Secciones generadas desde config.js ---------- */
  function renderPadres() {
    const p = B.padres;
    if (!p || (!p.novia?.length && !p.novio?.length)) {
      $("#padres").hidden = true;
      return;
    }
    const lista = (nombres = []) => nombres.map((n) => `<span>${esc(n)}</span>`).join("");
    $("#padres-novia").innerHTML = lista(p.novia);
    $("#padres-novio").innerHTML = lista(p.novio);
  }

  function renderHistoria() {
    if (!B.historia?.length) {
      $("#historia").hidden = true;
      return;
    }
    $("#historia-lista").innerHTML = B.historia
      .map(
        (h) => `
        <li class="linea__item reveal">
          <span class="linea__punto" aria-hidden="true"></span>
          <p class="linea__anio">${esc(h.anio)}</p>
          <h3 class="linea__titulo">${esc(h.titulo)}</h3>
          <p class="linea__texto">${esc(h.texto)}</p>
        </li>`
      )
      .join("");
  }

  function renderGaleria() {
    const fotos = B.galeria || [];
    if (!fotos.length) {
      $("#galeria").hidden = true;
      return;
    }
    const cont = $("#galeria-lista");
    cont.innerHTML = fotos
      .map(
        (src, i) => `
        <button class="galeria__item reveal" type="button" data-foto="${esc(src)}" style="--d:${(i % 3) * 120}ms" aria-label="Ampliar foto ${i + 1}">
          <img src="${esc(src)}" alt="Foto ${i + 1} de ${esc(pareja)}" loading="lazy">
        </button>`
      )
      .join("");

    const dialogo = $("#lightbox");
    const img = $("#lightbox-img");
    cont.addEventListener("click", (e) => {
      const boton = e.target.closest("[data-foto]");
      if (!boton) return;
      img.src = boton.dataset.foto;
      img.alt = boton.querySelector("img").alt;
      dialogo.showModal();
    });
    dialogo.addEventListener("click", (e) => {
      if (e.target === dialogo || e.target.closest(".lightbox__cerrar")) dialogo.close();
    });
  }

  function renderEventos() {
    const eventos = [
      [B.ceremonia, "iglesia"],
      [B.recepcion, "copa"],
    ].filter(([e]) => e);

    $("#eventos-lista").innerHTML = eventos
      .map(([e, ic], i) => {
        const mapa = e.mapa || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.lugar}, ${e.direccion}`)}`;
        return `
        <article class="evento reveal" style="--d:${i * 150}ms">
          <div class="evento__icono">${icono(ic)}</div>
          <h3 class="evento__titulo">${esc(e.titulo)}</h3>
          <p class="evento__hora">${formatoHora(e.hora)}</p>
          <p class="evento__lugar">${esc(e.lugar)}</p>
          <p class="evento__dir">${esc(e.direccion)}</p>
          <a class="btn btn--claro" href="${esc(mapa)}" target="_blank" rel="noopener">${icono("pin")} Cómo llegar</a>
        </article>`;
      })
      .join("");
  }

  function renderItinerario() {
    const items = B.itinerario || [];
    if (!items.length) {
      $("#itinerario").hidden = true;
      return;
    }
    const lista = $("#itinerario-lista");
    lista.style.setProperty("--n", items.length);
    lista.innerHTML = items
      .map(
        (it, i) => `
        <li class="itinerario__item reveal" style="--d:${i * 120}ms">
          <span class="itinerario__icono">${icono(it.icono || "corazon")}</span>
          <span class="itinerario__info">
            <span class="itinerario__hora">${formatoHora(it.hora)}</span>
            <span class="itinerario__titulo">${esc(it.titulo)}</span>
          </span>
        </li>`
      )
      .join("");
  }

  function renderVestimenta() {
    const v = B.vestimenta;
    if (!v) {
      $("#vestimenta").hidden = true;
      return;
    }
    $("#vestimenta-tipo").textContent = v.tipo || "Formal";
    $("#vestimenta-nota").textContent = v.nota || "";
    $("#vestimenta-colores").innerHTML = (v.colores || [])
      .map((c, i) => `<li class="muestra" style="--c:${esc(c)};--i:${i}" title="${esc(c)}"></li>`)
      .join("");
  }

  function renderRegalos() {
    const R = B.regalos;
    if (!R) {
      $("#regalos").hidden = true;
      return;
    }
    $("#regalos-mensaje").textContent = R.mensaje || "";

    const tarjetas = [];
    if (R.lluviaDeSobres) {
      tarjetas.push(`
        <article class="regalo reveal">
          ${icono("sobre", "icon regalo__icono")}
          <h3 class="regalo__titulo">Lluvia de sobres</h3>
          <p class="regalo__texto">Es la tradición de regalar efectivo en un sobre el día del evento. Habrá un buzón especial en la recepción.</p>
        </article>`);
    }
    (R.cuentas || []).forEach((c) => {
      tarjetas.push(`
        <article class="regalo reveal">
          ${icono("banco", "icon regalo__icono")}
          <h3 class="regalo__titulo">Transferencia</h3>
          <dl class="regalo__datos">
            <div><dt>Banco</dt><dd>${esc(c.banco)}</dd></div>
            <div><dt>Titular</dt><dd>${esc(c.titular)}</dd></div>
            <div><dt>Cuenta</dt><dd>${esc(c.numero)}</dd></div>
          </dl>
          <button class="btn btn--linea btn--chico" type="button" data-copiar="${esc(String(c.numero).replace(/\s/g, ""))}">
            ${icono("copiar")} Copiar cuenta
          </button>
        </article>`);
    });
    (R.tiendas || [])
      .filter((t) => t.url)
      .forEach((t) => {
        tarjetas.push(`
        <article class="regalo reveal">
          ${icono("tienda", "icon regalo__icono")}
          <h3 class="regalo__titulo">${esc(t.nombre || "Mesa de regalos")}</h3>
          <p class="regalo__texto">Elegimos algunas cosas para nuestro nuevo hogar.</p>
          <a class="btn btn--linea btn--chico" href="${esc(t.url)}" target="_blank" rel="noopener">${icono("regalo")} Ver lista</a>
        </article>`);
      });

    $("#regalos-lista").innerHTML = tarjetas.join("");
    $$("#regalos-lista .regalo").forEach((el, i) => el.style.setProperty("--d", `${i * 130}ms`));
  }

  /* ---------- Personalización del invitado ---------- */
  function personalizar() {
    if (invitado) {
      const para = $("#intro-para");
      para.innerHTML = '<span class="intro__label">Para</span><span class="intro__invitado"></span>';
      para.querySelector(".intro__invitado").textContent = invitado;
    }
    if (!invitado && !pases) return;

    $("#pase").hidden = false;
    $("#pase-nombre").textContent = invitado || "Querido invitado";
    if (pases) {
      $("#pase-texto").textContent = "Hemos reservado en tu honor";
      $("#pase-num").textContent = pases;
      $("#pase-label").textContent = pases === 1 ? "lugar" : "lugares";
      $("#pase-talon").hidden = false;
      $("#pase").classList.add("pase--talon");
    }
  }

  /* ---------- Sobre de bienvenida ---------- */
  function initIntro() {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const intro = $("#intro");
    const sobre = $("#sobre");
    let abierto = false;

    sobre.addEventListener("click", () => {
      if (abierto) return;
      abierto = true;
      sobre.classList.add("is-open");
      intro.classList.add("is-opening");
      reproducirMusica(); // debe llamarse dentro del clic para que el navegador lo permita

      setTimeout(
        () => {
          intro.classList.add("is-gone");
          document.documentElement.classList.remove("is-locked");
          iniciarPortada();
          setTimeout(() => intro.remove(), 1300);
        },
        reducirMovimiento ? 60 : 2400
      );
    });
  }

  function iniciarPortada() {
    $("#inicio").classList.add("is-ready");
    if (!reducirMovimiento) particulas($("#hero-canvas"));
  }

  /* ---------- Pétalos y destellos dorados ---------- */
  function particulas(canvas) {
    const ctx = canvas.getContext("2d");
    const colores = ["#e8c4ba", "#f3d9d2", "#d9a79b", "#f6ead8"];
    let w = 0;
    let h = 0;
    let petalos = [];
    let chispas = [];
    let activo = true;
    let raf = 0;

    const nuevoPetalo = (inicio) => ({
      x: Math.random() * w,
      y: inicio ? Math.random() * h : -20 - Math.random() * 60,
      s: 5 + Math.random() * 7,
      vy: 0.35 + Math.random() * 0.75,
      vx: (Math.random() - 0.5) * 0.4,
      fase: Math.random() * Math.PI * 2,
      giro: Math.random() * Math.PI * 2,
      vg: (Math.random() - 0.5) * 0.03,
      color: colores[(Math.random() * colores.length) | 0],
      a: 0.55 + Math.random() * 0.4,
    });

    const nuevaChispa = (inicio) => ({
      x: Math.random() * w,
      y: inicio ? Math.random() * h : h + 10,
      r: 0.5 + Math.random() * 1.6,
      vy: 0.12 + Math.random() * 0.35,
      fase: Math.random() * Math.PI * 2,
    });

    function ajustar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const anchoAnterior = w;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (w !== anchoAnterior) {
        petalos = Array.from({ length: Math.min(36, Math.round(w / 38)) }, () => nuevoPetalo(true));
        chispas = Array.from({ length: Math.min(90, Math.round(w / 14)) }, () => nuevaChispa(true));
      }
    }

    function dibujarPetalo(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.scale(1, 0.55 + 0.45 * Math.sin(p.fase));
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.bezierCurveTo(p.s, -p.s * 0.6, p.s * 0.7, p.s, 0, p.s);
      ctx.bezierCurveTo(-p.s * 0.7, p.s, -p.s, -p.s * 0.6, 0, -p.s);
      ctx.fill();
      ctx.restore();
    }

    function cuadro(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ecdcb0";
      for (const c of chispas) {
        c.y -= c.vy;
        c.x += Math.sin(t / 1800 + c.fase) * 0.15;
        if (c.y < -10) Object.assign(c, nuevaChispa(false));
        const brillo = 0.25 + 0.75 * Math.abs(Math.sin(t / 900 + c.fase));
        ctx.globalAlpha = brillo * 0.22;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = brillo;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of petalos) {
        p.fase += 0.02;
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.fase) * 0.6;
        p.giro += p.vg;
        if (p.y > h + 20 || p.x < -30 || p.x > w + 30) Object.assign(p, nuevoPetalo(false));
        dibujarPetalo(p);
      }
      ctx.globalAlpha = 1;
      if (activo) raf = requestAnimationFrame(cuadro);
    }

    // Pausar cuando la portada no se ve (ahorra batería)
    new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting && !activo) {
        activo = true;
        raf = requestAnimationFrame(cuadro);
      } else if (!entrada.isIntersecting) {
        activo = false;
        cancelAnimationFrame(raf);
      }
    }).observe(canvas);

    let espera = 0;
    window.addEventListener("resize", () => {
      clearTimeout(espera);
      espera = setTimeout(ajustar, 150);
    });

    ajustar();
    raf = requestAnimationFrame(cuadro);
  }

  /* ---------- Cuenta regresiva ---------- */
  function initCuenta() {
    const nums = {};
    $$("[data-unidad]").forEach((el) => (nums[el.dataset.unidad] = el));
    const objetivo = fecha.getTime();
    let timer = 0;

    const poner = (el, valor) => {
      const texto = pad(valor);
      if (el.textContent === texto) return;
      el.textContent = texto;
      if (!reducirMovimiento) {
        el.classList.remove("tick");
        void el.offsetWidth; // reinicia la animación
        el.classList.add("tick");
      }
    };

    function actualizar() {
      const diff = objetivo - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        $("#cuenta-grid").hidden = true;
        const fin = $("#cuenta-fin");
        fin.hidden = false;
        fin.textContent = -diff < 864e5 ? "¡Hoy es el gran día!" : "¡Gracias por celebrar con nosotros!";
        return;
      }
      poner(nums.dias, Math.floor(diff / 864e5));
      poner(nums.horas, Math.floor(diff / 36e5) % 24);
      poner(nums.minutos, Math.floor(diff / 6e4) % 60);
      poner(nums.segundos, Math.floor(diff / 1e3) % 60);
    }

    actualizar();
    timer = setInterval(actualizar, 1000);
  }

  /* ---------- Agregar al calendario ---------- */
  function initCalendario() {
    const fin = new Date(fecha.getTime() + (B.duracionHoras || 6) * 36e5);
    const formato = (d) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const titulo = `Boda de ${pareja}`;
    const lugar = B.ceremonia ? `${B.ceremonia.lugar}, ${B.ceremonia.direccion}` : "";
    const detalles = [
      B.ceremonia && `${B.ceremonia.titulo}: ${B.ceremonia.lugar} (${formatoHora(B.ceremonia.hora)})`,
      B.recepcion && `${B.recepcion.titulo}: ${B.recepcion.lugar} (${formatoHora(B.recepcion.hora)})`,
      "¡Te esperamos!",
    ]
      .filter(Boolean)
      .join("\n");

    const google = new URL("https://calendar.google.com/calendar/render");
    google.search = new URLSearchParams({
      action: "TEMPLATE",
      text: titulo,
      dates: `${formato(fecha)}/${formato(fin)}`,
      details: detalles,
      location: lugar,
    }).toString();
    $("#cal-google").href = google.href;

    const escICS = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    $("#cal-ics").addEventListener("click", () => {
      const sello = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Invitacion de boda//ES",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${formato(fecha)}-${B.novia}-${B.novio}@invitacion-boda`.replace(/\s/g, ""),
        `DTSTAMP:${sello}`,
        `DTSTART:${formato(fecha)}`,
        `DTEND:${formato(fin)}`,
        `SUMMARY:${escICS(titulo)}`,
        `DESCRIPTION:${escICS(detalles)}`,
        `LOCATION:${escICS(lugar)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escICS(`Mañana es la boda de ${pareja}`)}`,
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      enlace.download = `boda-${B.novia}-${B.novio}.ics`.toLowerCase();
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(enlace.href), 2000);
    });
  }

  /* ---------- Confirmación por WhatsApp ---------- */
  function initConfirmacion() {
    const form = $("#rsvp-form");
    const C = B.confirmacion || {};
    const maximo = pases || C.pasesPorDefecto || 1;

    const select = $("#rsvp-cantidad");
    select.innerHTML = Array.from(
      { length: maximo },
      (_, i) => `<option value="${i + 1}">${i + 1} ${i === 0 ? "persona" : "personas"}</option>`
    ).join("");
    select.value = String(maximo);
    if (pases) $("#rsvp-cantidad-nota").textContent = `Tu invitación incluye ${pases} ${pases === 1 ? "lugar" : "lugares"}.`;
    if (invitado) form.nombre.value = invitado;

    const grupoCantidad = $("#rsvp-cantidad-grupo");
    const errorNombre = $("#rsvp-error-nombre");
    const errorAsistencia = $("#rsvp-error-asistencia");

    form.addEventListener("change", (e) => {
      if (e.target.name === "asistencia") {
        grupoCantidad.hidden = e.target.value !== "si";
        errorAsistencia.hidden = true;
      }
    });
    form.nombre.addEventListener("input", () => (errorNombre.hidden = true));

    const gracias = $("#rsvp-gracias");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const datos = new FormData(form);
      const nombre = String(datos.get("nombre") || "").trim();
      const asistencia = datos.get("asistencia");

      errorNombre.hidden = !!nombre;
      errorAsistencia.hidden = !!asistencia;
      if (!nombre) return form.nombre.focus();
      if (!asistencia) return $("#rsvp-si").focus();

      const asiste = asistencia === "si";
      const lineas = [
        `¡Hola! Soy ${nombre}.`,
        asiste
          ? `✅ Con mucha alegría confirmo mi asistencia a la boda de ${pareja}.`
          : `💐 Lamentablemente no podré asistir a la boda de ${pareja}, pero les deseo lo mejor.`,
      ];
      if (asiste) lineas.push(`👥 Asistentes: ${datos.get("cantidad")}`);
      const mensaje = String(datos.get("mensaje") || "").trim();
      if (mensaje) lineas.push(`💌 ${mensaje}`);

      const numero = String(C.whatsapp || "").replace(/\D/g, "");
      const enlace = `https://wa.me/${numero}?text=${encodeURIComponent(lineas.join("\n"))}`;
      window.open(enlace, "_blank", "noopener");

      $("#rsvp-gracias-titulo").textContent = asiste ? `¡Gracias, ${nombre}!` : "Gracias por avisarnos";
      $("#rsvp-gracias-texto").textContent = asiste
        ? "Solo falta enviar el mensaje que preparamos en WhatsApp. ¡Nos vemos en la fiesta!"
        : "Te vamos a extrañar. Solo falta enviar el mensaje que preparamos en WhatsApp.";
      $("#rsvp-reenviar").href = enlace;
      form.hidden = true;
      gracias.hidden = false;
      if (asiste) confeti();
    });

    $("#rsvp-editar").addEventListener("click", () => {
      gracias.hidden = true;
      form.hidden = false;
    });
  }

  /* ---------- Confeti ---------- */
  function confeti() {
    if (reducirMovimiento) return;
    const canvas = document.createElement("canvas");
    canvas.className = "confeti";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const colores = ["#c9a45c", "#ecdcb0", "#e8c4ba", "#7a8b6f", "#fbf8f2", "#b7766b"];
    const piezas = Array.from({ length: 180 }, (_, i) => {
      const izquierda = i % 2 === 0;
      return {
        x: izquierda ? -10 : w + 10,
        y: h * 0.75,
        vx: (izquierda ? 1 : -1) * (3 + Math.random() * 8),
        vy: -(8 + Math.random() * 10),
        t: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colores[(Math.random() * colores.length) | 0],
        circulo: Math.random() < 0.35,
      };
    });

    const inicio = performance.now();
    (function cuadro(ahora) {
      ctx.clearRect(0, 0, w, h);
      let vivas = 0;
      for (const p of piezas) {
        p.vy += 0.26;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < h + 20) vivas++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.rot * 2));
        ctx.fillStyle = p.color;
        if (p.circulo) {
          ctx.beginPath();
          ctx.arc(0, 0, p.t / 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.t / 2, -p.t / 4, p.t, p.t / 2);
        }
        ctx.restore();
      }
      if (vivas && ahora - inicio < 6000) requestAnimationFrame(cuadro);
      else canvas.remove();
    })(inicio);
  }

  /* ---------- Música ---------- */
  const audio = $("#audio");
  const btnMusica = $("#btn-musica");

  function marcarMusica(sonando) {
    btnMusica.classList.toggle("is-playing", sonando);
    btnMusica.setAttribute("aria-pressed", String(sonando));
    btnMusica.setAttribute("aria-label", sonando ? "Pausar música" : "Reproducir música");
  }

  function reproducirMusica() {
    if (!B.musica) return;
    // El botón solo aparece si el archivo existe y se puede reproducir.
    audio.addEventListener("canplay", () => (btnMusica.hidden = false), { once: true });
    audio.preload = "auto";
    audio.src = B.musica;
    audio.volume = 0.6;
    audio
      .play()
      .then(() => marcarMusica(true))
      .catch(() => marcarMusica(false));
  }

  function initMusica() {
    btnMusica.addEventListener("click", () => {
      if (audio.paused) audio.play().then(() => marcarMusica(true)).catch(() => {});
      else {
        audio.pause();
        marcarMusica(false);
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && !audio.paused) {
        audio.pause();
        audio.dataset.reanudar = "1";
      } else if (!document.hidden && audio.dataset.reanudar) {
        delete audio.dataset.reanudar;
        audio.play().catch(() => {});
      }
    });
  }

  /* ---------- Animaciones al hacer scroll ---------- */
  function observarApariciones() {
    const elementos = $$(".reveal, .dibujar");
    if (!("IntersectionObserver" in window)) {
      elementos.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("is-visible");
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    elementos.forEach((el) => observador.observe(el));
  }

  /* ---------- Arranque ---------- */
  vincularTextos();
  renderPadres();
  renderHistoria();
  renderGaleria();
  renderEventos();
  renderItinerario();
  renderVestimenta();
  renderRegalos();
  personalizar();

  initIntro();
  initCuenta();
  initCalendario();
  initConfirmacion();
  initMusica();
  observarApariciones();

  document.addEventListener("click", (e) => {
    const boton = e.target.closest("[data-copiar]");
    if (boton) copiar(boton.dataset.copiar);
  });
})();
