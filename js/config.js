/* =========================================================
   ✏️  DATOS DE LA BODA
   Edita lo que necesites aquí: la página se actualiza sola.
   ========================================================= */
window.BODA = {
  novia: "Valeria",
  novio: "Santiago",

  // Fecha y hora de la ceremonia (AAAA-MM-DDTHH:MM, hora local)
  fecha: "2027-03-13T16:00",
  duracionHoras: 9, // para el evento que se agrega al calendario

  hashtag: "#ValeYSanti2027",

  frase:
    "Hay momentos en la vida que son especiales por sí solos, pero compartirlos con las personas que queremos los vuelve inolvidables.",

  padres: {
    novia: ["Carmen Ruiz de Morales", "Alberto Morales Díaz"],
    novio: ["Lucía Herrera de Castillo", "Fernando Castillo Vega"],
  },

  historia: [
    { anio: "2018", titulo: "Nos conocimos", texto: "Una clase en la universidad, un café pendiente y una conversación que duró horas." },
    { anio: "2020", titulo: "Nuestro primer viaje", texto: "Descubrimos que, juntos, cualquier camino se vuelve aventura." },
    { anio: "2023", titulo: "Un hogar para dos", texto: "Llenamos de plantas, música y risas nuestro primer departamento." },
    { anio: "2026", titulo: "¡Dijo que sí!", texto: "Bajo un cielo lleno de estrellas empezó la cuenta regresiva hacia este día." },
  ],

  ceremonia: {
    titulo: "Ceremonia religiosa",
    lugar: "Parroquia San José",
    direccion: "Calle Principal #123, Centro",
    hora: "16:00",
    mapa: "", // pega aquí el enlace de Google Maps (si queda vacío, se busca la dirección)
  },

  recepcion: {
    titulo: "Recepción",
    lugar: "Hacienda Los Almendros",
    direccion: "Km 12, Carretera Sur",
    hora: "18:00",
    mapa: "",
  },

  // Íconos disponibles: iglesia, anillos, copa, cena, pastel, musica, camara, luna, corazon
  itinerario: [
    { hora: "16:00", titulo: "Ceremonia", icono: "iglesia" },
    { hora: "17:30", titulo: "Cóctel y fotos", icono: "copa" },
    { hora: "19:00", titulo: "Cena", icono: "cena" },
    { hora: "20:30", titulo: "Vals de los novios", icono: "corazon" },
    { hora: "21:00", titulo: "¡A bailar!", icono: "musica" },
    { hora: "01:00", titulo: "Despedida", icono: "luna" },
  ],

  vestimenta: {
    tipo: "Formal",
    nota: "Te sugerimos estos tonos para acompañarnos. El blanco y sus variantes los reservamos para la novia.",
    colores: ["#1d3b33", "#7a8b6f", "#c9a45c", "#b7766b", "#4b3b33"],
  },

  regalos: {
    mensaje:
      "Tu presencia es nuestro mejor regalo. Si además deseas tener un detalle con nosotros, aquí te dejamos algunas opciones.",
    lluviaDeSobres: true,
    cuentas: [{ banco: "Banco Ejemplo", titular: "Valeria Morales", numero: "0000 1234 5678 9012" }],
    tiendas: [
      // { nombre: "Mesa de regalos", url: "https://..." },
    ],
  },

  confirmacion: {
    fechaLimite: "2027-02-13",
    // Número de WhatsApp con código de país, sin "+" ni espacios (ej. 50588887777).
    // Si lo dejas vacío, WhatsApp le pedirá al invitado elegir el contacto.
    whatsapp: "",
    pasesPorDefecto: 2, // máximo de asistentes cuando el enlace no indica pases
  },

  // Fotos: guárdalas en assets/fotos/ y escribe sus rutas aquí.
  // Si la lista está vacía, la sección de galería no se muestra.
  galeria: [
    // "assets/fotos/foto1.jpg",
  ],

  // Música de fondo (opcional). Si el archivo no existe, el botón se oculta solo.
  musica: "assets/musica.mp3",
};
