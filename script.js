// Carrito local y reconocimiento de voz
const statusBox = document.getElementById("statusBox");
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-PE';

let carrito = [];
let esperandoConfirmacion = false;

let menu = {
  hamburguesas: [], bebidas: [], papas: [], postres: [], combos: []
};

fetch('./menu.json')
  .then(res => res.json())
  .then(data => {
    menu = data;
    iniciarPedido();
  });

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '') // ✅ esta es la corrección: los corchetes
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}


function iniciarMicroVisual() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const micAudio = new Audio();
    micAudio.srcObject = stream;
    iniciarVisualizacion(micAudio, "mic");
  });
}

function hablarConVozNatural(texto) {
  statusBox.textContent = "🎤 Generando voz...";
  fetch("./eleven.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "texto=" + encodeURIComponent(texto)
  })
    .then(res => res.blob())
    .then(audioBlob => {
      const audioURL = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioURL);
      audio.play();
      iniciarVisualizacion(audio, "voz");
      audio.onended = () => {
        setTimeout(() => {
          statusBox.textContent = "🎧 Esperando tu respuesta...";
          iniciarMicroVisual();
          recognition.start();
        }, 300);
      };
    })
    .catch(() => {
      statusBox.textContent = "❌ Error al generar la voz";
    });
}

function iniciarPedido() {
  hablarConVozNatural(" ¿qué deseas ordenar hoy? Puedes decir hamburguesa, bebida, papas, postres o combo.");
}

function generarResumenDeCarrito() {
  if (carrito.length === 0) return "No hay productos en tu pedido.";
  const detalles = carrito.map(p => `una ${p.nombre} por ${p.precio} pesos`).join(', ');
  const total = carrito.reduce((sum, p) => sum + p.precio, 0);
  return `Tu pedido es: ${detalles}. Total: ${total} pesos. ¿Quieres proceder con la compra? Di: sí me gustaría, o no me gustaría.`;
}

function obtenerRespuesta(textoOriginal) {
  const texto = normalizar(textoOriginal);

  const buscar = categoria => menu[categoria]?.find(item =>
    item.alias.some(alias => texto.includes(normalizar(alias)))
  );

  // Confirmación de compra
  if (esperandoConfirmacion) {
    esperandoConfirmacion = false;
    if (texto.includes("si me gustaria")) {
      return "Perfecto. Puedes pagar con Google Pay, Apple Pay o Tarjeta Contactless. Para todos estos métodos de pago puedes acercarte a nuestro lector de tarjetas que está justo enfrente de ti.";
    }
    if (texto.includes("no me gustaria")) {
      return "Entendido. Puedes seguir agregando productos.";
    }
  }

  // Buscar productos por categoría
  const categorias = ["hamburguesas", "bebidas", "papas", "postres", "combos"];
  for (let cat of categorias) {
    const producto = buscar(cat);
    if (producto) {
        
      carrito.push({ nombre: producto.nombre, precio: producto.precio, categoria: cat });
      return `Agregué una ${producto.nombre} por ${producto.precio} pesos a tu pedido. ¿Deseas algo más?`;
    }
  }

  // Si solo menciona la categoría
  if (texto.includes("hamburguesa")) {
    const lista = menu.hamburguesas.map(h => h.nombre).join(", ");
    return `Tenemos las siguientes hamburguesas: ${lista}. ¿Cuál deseas?`;
  }
  if (texto.includes("bebida") || texto.includes("tomar") || texto.includes("refresco")) {
    const lista = menu.bebidas.map(b => b.nombre).join(", ");
    return `Tenemos estas bebidas: ${lista}. ¿Cuál prefieres?`;
  }
  if (texto.includes("papas")) {
    const lista = menu.papas.map(p => p.nombre).join(", ");
    return `Estas son nuestras papas disponibles: ${lista}. ¿Cuál deseas?`;
  }
  if (texto.includes("postre") || texto.includes("postres")) {
    const lista = menu.postres.map(p => p.nombre).join(", ");
    return `Tenemos estos postres: ${lista}. ¿Cuál prefieres?`;
  }
  if (texto.includes("combo") || texto.includes("combos")) {
    const lista = menu.combos.map(c => c.nombre).join(", ");
    return `Estos son nuestros combos disponibles: ${lista}. ¿Cuál deseas?`;
  }

  // Si finaliza el pedido
  if (["nada mas", "termine", "eso es todo", "no", "muchas gracias"].some(p => texto.includes(p))) {
    esperandoConfirmacion = true;
    return generarResumenDeCarrito();
  }

  return "Lo siento, no entendí eso. ¿Puedes repetirlo?";
}

recognition.onresult = function (event) {
  const texto = event.results[0][0].transcript;
  statusBox.textContent = `👂 Dijiste: "${texto}"`;
  const respuesta = obtenerRespuesta(texto);
  hablarConVozNatural(respuesta);
};

recognition.onerror = function (event) {
  statusBox.textContent = "❌ Error: " + event.error;
  hablarConVozNatural("Hubo un problema al escuchar. Intenta de nuevo.");
};

// Visualizador de ondas
const canvas = document.getElementById("voiceCanvas");
const ctx = canvas.getContext("2d");
let animationFrame, audioContext, analyser, source;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

window.iniciarVisualizacion = function (audioSource, modo = "mic") {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  if (source) source.disconnect();
  source = audioContext.createMediaElementSource(audioSource);
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  const colorFondo = modo === "mic" ? "#FFD600" : "#db1b1b";
  const colorOnda = modo === "mic" ? "#00cc66" : "#FFD600";

  function draw() {
    animationFrame = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = colorFondo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let x = 0;
    const barWidth = (canvas.width / dataArray.length) * 2.5;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = dataArray[i] / 0.5;
      ctx.fillStyle = colorOnda;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  draw();

  audioSource.onended = () => {
    cancelAnimationFrame(animationFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
};

window.iniciarPedido = iniciarPedido;
navigator.mediaDevices.getUserMedia({ audio: true }).then(() => iniciarPedido());
