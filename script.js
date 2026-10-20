function esGitHubPages() {
  return true; // Modo simulación activado permanentemente
}

function generarNumerosAleatorios(cantidad, maximo) {
  const numeros = new Set();
  while (generos.size < cantidad) {
    numeros.add(String(Math.floor(Math.random() * maximo) + 1));
  }
  return Array.from(numeros).sort((a, b) => a - b);
}

async function consultarSorteoServidor(juego) {
  if (esGitHubPages() || ["localhost", "127.0.0.1", ""].includes(window.location.hostname)) {
    return obtenerDatosSimuladosLocales(juego);
  }
  const respuesta = await fetch(`/api/resultados?juego=${encodeURIComponent(juego)}`);
  if (!respuesta.ok) throw new Error(`HTTP error! status: ${respuesta.status}`);
  return await respuesta.json();
}

function obtenerDatosSimuladosLocales(juego) {
  const simulaciones = {
    "loteria-nacional": { result: { primero: String(Math.floor(Math.random() * 90000) + 10000), segundo: String(Math.floor(Math.random() * 90000) + 10000) } },
    "once": { result: { combination: String(Math.floor(Math.random() * 90000) + 10000), serie: String(Math.floor(Math.random() * 120) + 1).padStart(3, '0') } },
    "la-primitiva": { result: { combination: generarNumerosAleatorios(6, 49) } },
    "bonoloto": { result: { combination: generarNumerosAleatorios(6, 49) } },
    "euromillones": { result: { combination: generarNumerosAleatorios(5, 50), estrellas: generarNumerosAleatorios(2, 12) } },
    "el-gordo-de-la-primitiva": { result: { combination: generarNumerosAleatorios(5, 54), reintegro: String(Math.floor(Math.random() * 10)) } },
    "eurojackpot": { result: { combination: generarNumerosAleatorios(5, 50), soles: generarNumerosAleatorios(2, 12) } },
    "la-quiniela": { result: { partidos: Array.from({ length: 15 }, (_, i) => ({ local: `Equipo L${i+1}`, visitante: `Equipo V${i+1}`, pronostico: ["1", "X", "2"][Math.floor(Math.random() * 3)] })) } },
    "el-quinigol": { result: { partidos: Array.from({ length: 6 }, (_, i) => ({ local: `Equipo L${i+1}`, visitante: `Equipo V${i+1}`, signo: `${["0", "1", "2", "M"][Math.floor(Math.random() * 4)]}-${["0", "1", "2", "M"][Math.floor(Math.random() * 4)]}` })) } }
  };
  return simulaciones[juego] ? { data: simulaciones[juego] } : null;
}

async function renderizarSorteo(juego, nombreJuegoAPI) {
  const elementos = {
    nacional: "num-nacional",
    once: "num-once",
    primitiva: "num-primitiva",
    bonoloto: "num-bonoloto",
    euromillones: "num-euromillones",
    gordo: "num-gordo",
    eurojackpot: "num-euro",
    quiniela: "contenedor-quiniela",
    quinigol: "contenedor-quinigol"
  };

  const elemento = document.getElementById(elementos[juego]);
  if (!elemento) return;

  try {
    const res = await consultarSorteoServidor(nombreJuegoAPI);
    if (!res || !res.data || !res.data.result) {
      elemento.textContent = "No disponible";
      return;
    }

    const data = res.data.result;

    if (juego === "nacional") {
      elemento.textContent = `1º: ${data.primero} || 2º: ${data.segundo}`;
    } else if (juego === "once") {
      elemento.textContent = data.combination || '';
      const elSerie = document.getElementById("serie-once");
      if (elSerie) elSerie.textContent = `Serie: ${data.serie || ''}`;
    } else if (juego === "quiniela") {
      renderizarQuiniela(data.partidos);
    } else if (juego === "quinigol") {
      renderizarQuinigol(data.partidos);
    } else {
      const bolas = data.combination || [];
      if (juego === "eurojackpot") {
        const bolaContenedor = elemento.closest('.box-eurojackpot')?.querySelector('.bola-contenedor');
        if (bolaContenedor) {
          bolaContenedor.innerHTML = bolas.map(num => `<span class="num">${num}</span>`).join("");
        }
        elemento.textContent = ""; 
      } else {
        elemento.innerHTML = bolas.map(num => `<span class="num">${num}</span>`).join("");
      }
    }

    if (juego === "euromillones" && data.estrellas) {
      const elEstrellas = document.getElementById("estrellas-euromillones");
      if (elEstrellas) elEstrellas.innerHTML = data.estrellas.map(num => `<span class="star">${num}</span>`).join(" ");
    } else if (juego === "gordo") {
      const elClave = document.getElementById("clave-gordo");
      if (elClave) elClave.innerHTML = `<span class="reintegro">${data.reintegro || '0'}</span>`;
    } else if (juego === "eurojackpot" && data.soles) {
      const elSoles = document.getElementById("euro-soles");
      if (elSoles) elSoles.innerHTML = data.soles.map(num => `<span class="star">${num}</span>`).join(" ");
    }

  } catch (error) {
    console.error(`Error al renderizar el juego ${juego}:`, error);
    elemento.textContent = "No disponible";
  }
}

function renderizarQuiniela(partidos) {
  const contenedor = document.getElementById("contenedor-quiniela");
  if (!contenedor || !partidos) return;
  contenedor.innerHTML = "";
  partidos.forEach((partido, index) => {
    const div = document.createElement("div");
    div.className = "casilla-partido";
    div.innerHTML = `<span>Partido ${index + 1}: </span> ${partido.local} - ${partido.visitante} | <strong>${partido.pronostico}</strong>`;
    contenedor.appendChild(div);
  });
}

function renderizarQuinigol(partidos) {
  const contenedor = document.getElementById("contenedor-quinigol");
  if (!contenedor || !partidos) return;
  contenedor.innerHTML = "";
  partidos.forEach((gol, index) => {
    const div = document.createElement("div");
    div.className = "casilla-partido";
    div.innerHTML = `<span>Partido ${index + 1}: </span> ${gol.local} - ${gol.visitante} | <strong>${gol.signo}</strong>`;
    contenedor.appendChild(div);
  });
}

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function ejecutarConsultas() {
  const juegosAPI = {
    nacional: "loteria-nacional",
    once: "once",
    primitiva: "la-primitiva",
    bonoloto: "bonoloto",
    euromillones: "euromillones",
    gordo: "el-gordo-de-la-primitiva",
    eurojackpot: "eurojackpot",
    quiniela: "la-quiniela",
    quinigol: "el-quinigol"
  };

  const juegos = ["nacional", "once", "primitiva", "bonoloto", "euromillones", "gordo", "eurojackpot", "quiniela", "quinigol"];
  for (const juego of juegos) {
    try {
      await renderizarSorteo(juego, juegosAPI[juego]);
    } catch (err) {
      console.error(`Error en sorteo ${juego}:`, err);
    }
    await esperar(2500);
  }
}

function inicializarPanel() {
  const hoy = new Date();
  const fechaEl = document.getElementById("fecha-actual");
  if (fechaEl) fechaEl.innerText = hoy.toLocaleDateString("es-ES");
  ejecutarConsultas();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", inicializarPanel);
} else {
  inicializarPanel();
}

function actualizarTodoAutomatico() {
  console.log("Actualizando resultados automáticamente...");
  ejecutarConsultas();
  const ahora = new Date();
  const horaFormateada = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;
  const elementoHora = document.getElementById("hora-actualizacion");
  if (elementoHora) elementoHora.textContent = horaFormateada;
}

setInterval(actualizarTodoAutomatico, 300000);
