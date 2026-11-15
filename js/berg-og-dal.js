// Berg-og-dal-bane. Vogna er festet til skinnene, så den kan ikke lette fra banen.
// Banen går gjennom fem punkter og er glatt (cosinus-overganger med vannrett bane i hvert punkt).

const G = 9.81;
const VOGN_M = 500;
const DT = 0.002;
const AVSTAND = 5;                        // Vannrett avstand mellom punktene i meter
const SLUTT_X = 5 * AVSTAND;
const DAL = [0.5, 0.5];
const MAL_Y = 2.0;

function banePunkter(h1, h2, h3) { return [h1, DAL[0], h2, DAL[1], h3, MAL_Y]; }

function baneGeometri(ys, x) {
  if (x <= 0) return { y: ys[0], y1: 0, y2: 0 };
  if (x >= SLUTT_X) return { y: ys[5], y1: 0, y2: 0 };
  const i = Math.min(4, Math.floor(x / AVSTAND));
  const s = (x - i * AVSTAND) / AVSTAND, D = ys[i + 1] - ys[i], k = Math.PI / AVSTAND;
  return {
    y: ys[i] + D * (1 - Math.cos(Math.PI * s)) / 2,
    y1: D * k / 2 * Math.sin(Math.PI * s),
    y2: D * k * k / 2 * Math.cos(Math.PI * s),
  };
}

// Tilstanden er [x, v, w] der v er farten langs banen og w er friksjonsarbeidet per masse
function deriverte(ys, mu, [x, v]) {
  const g = baneGeometri(ys, x), q = Math.sqrt(1 + g.y1 * g.y1);
  const sin = g.y1 / q, cos = 1 / q, kappa = g.y2 / (q * q * q);
  const N = Math.abs(G * cos + v * v * kappa);
  return [v / q, -G * sin - mu * N * Math.sign(v), mu * N * Math.abs(v)];
}

function stegVogn(vogn, ys, mu, dt) {
  const s = [vogn.x, vogn.v, vogn.w];
  const leggTil = (a, b, k) => a.map((ai, i) => ai + b[i] * k);
  const k1 = deriverte(ys, mu, s);
  const k2 = deriverte(ys, mu, leggTil(s, k1, dt / 2));
  const k3 = deriverte(ys, mu, leggTil(s, k2, dt / 2));
  const k4 = deriverte(ys, mu, leggTil(s, k3, dt));
  const ny = s.map((si, i) => si + (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) * dt / 6);
  const forrigeV = vogn.v;
  [vogn.x, vogn.v, vogn.w] = ny;
  vogn.t += dt;

  if (vogn.x >= SLUTT_X) { vogn.x = SLUTT_X; vogn.status = "i mål"; return; }
  if (vogn.x <= 0 && vogn.v < 0) { vogn.x = 0; vogn.status = "tilbake ved start"; return; }
  if (forrigeV * vogn.v <= 0 && forrigeV !== 0) {
    // Farten skifter retning. Friksjonen kan holde vogna i ro hvis banen er slak nok.
    const g = baneGeometri(ys, vogn.x), q = Math.sqrt(1 + g.y1 * g.y1);
    if (Math.abs(g.y1 / q) <= mu * (1 / q)) { vogn.v = 0; vogn.status = "stoppet"; return; }
    vogn.v = 0;
  }
}

function nyVogn(v0) { return { x: 0, v: v0, w: 0, t: 0, status: "klar" }; }

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("bane");
  if (!el) return;

  let ys, v0, mu, tempo, vogn, spor = [], e0;
  const scene = Sim.lerret(el, tegnAlt);
  const graf = Sim.lerret($("energigraf"), tegnAlt);

  function lesInnstillinger() {
    const h1 = Sim.verdi("h1", (v) => komma(v, 1) + " m");
    const h2 = Sim.verdi("h2", (v) => komma(v, 1) + " m");
    const h3 = Sim.verdi("h3", (v) => komma(v, 1) + " m");
    v0 = Sim.verdi("v0", (v) => komma(v, 1) + " m/s");
    mu = Sim.verdi("friksjon", (v) => komma(v, 3));
    tempo = Number(Sim.verdi("tempo"));
    ys = banePunkter(h1, h2, h3);
    e0 = VOGN_M * (G * ys[0] + 0.5 * v0 * v0);
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    vogn = nyVogn(v0);
    spor = [];
    tegnAlt();
  }

  function steg(dt) {
    if (vogn.status === "klar") vogn.status = "kjører";
    const slutt = vogn.t + dt * tempo;
    while (vogn.status === "kjører" && vogn.t < slutt) stegVogn(vogn, ys, mu, Math.min(DT, slutt - vogn.t + 1e-12));
    loggSpor();
    tegnAlt();
    if (vogn.t > 180) vogn.status = "stoppet";
    return vogn.status === "kjører";
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function energi() {
    const ep = VOGN_M * G * baneGeometri(ys, vogn.x).y, ek = 0.5 * VOGN_M * vogn.v * vogn.v;
    return { ep, ek, q: VOGN_M * vogn.w };
  }
  function loggSpor() {
    const e = energi();
    spor.push([vogn.x, e.ep, e.ek]);
    if (spor.length > 6000) spor.shift();
  }

  // Scene
  let skala, ox, oy;
  function oppsett() {
    const xMin = -1.2, xMax = SLUTT_X + 1.6, yMin = -0.6, yMax = 11.2;
    skala = Math.min(scene.b / (xMax - xMin), scene.h / (yMax - yMin));
    ox = (scene.b - (xMax - xMin) * skala) / 2 - xMin * skala;
    oy = scene.h - ((scene.h - (yMax - yMin) * skala) / 2 - yMin * skala);
  }
  const sx = (x) => ox + x * skala;
  const sy = (y) => oy - y * skala;
  const HANDTAK = [0, 2, 4];

  function tegnScene() {
    oppsett();
    const c = scene.ctx, f = scene.f;
    scene.tom();
    c.font = "12px " + Sim.MONO;

    // Bakke og stolper
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1;
    for (let x = 0.5; x < SLUTT_X; x += 1) {
      c.beginPath(); c.moveTo(sx(x), sy(0)); c.lineTo(sx(x), sy(baneGeometri(ys, x).y)); c.stroke();
    }
    c.strokeStyle = f.blekk; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(sx(-1), sy(0)); c.lineTo(sx(SLUTT_X + 1.4), sy(0)); c.stroke();

    // Energinivå: så høyt kan vogna komme med energien den har nå
    const e = energi(), niva = (e.ep + e.ek) / (VOGN_M * G);
    c.strokeStyle = f.f1; c.lineWidth = 1.5; c.setLineDash([6, 5]);
    c.beginPath(); c.moveTo(sx(-1), sy(niva)); c.lineTo(sx(SLUTT_X + 1.4), sy(niva)); c.stroke();
    c.setLineDash([]);
    c.fillStyle = f.f1; c.textAlign = "right"; c.textBaseline = "bottom";
    c.fillText("energinivå " + komma(niva, 2) + " m", sx(SLUTT_X + 1.4), sy(niva) - 3);

    // Banen
    c.strokeStyle = f.blekk; c.lineWidth = 3.5; c.lineJoin = "round";
    c.beginPath(); c.moveTo(sx(-1), sy(ys[0]));
    for (let x = 0; x <= SLUTT_X; x += 0.1) c.lineTo(sx(x), sy(baneGeometri(ys, x).y));
    c.lineTo(sx(SLUTT_X + 1.4), sy(ys[5]));
    c.stroke();

    // Mål
    c.strokeStyle = f.blekk; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(sx(SLUTT_X), sy(ys[5])); c.lineTo(sx(SLUTT_X), sy(ys[5] + 1.6)); c.stroke();
    c.fillStyle = f.f2;
    c.beginPath(); c.moveTo(sx(SLUTT_X), sy(ys[5] + 1.6)); c.lineTo(sx(SLUTT_X) + 16, sy(ys[5] + 1.35)); c.lineTo(sx(SLUTT_X), sy(ys[5] + 1.1)); c.fill();
    c.fillStyle = f.dempet; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText("mål", sx(SLUTT_X), sy(ys[5]) + 6);

    // Håndtak og navn på toppene
    const navn = ["start", "topp 2", "topp 3"];
    HANDTAK.forEach((k, i) => {
      const x = k * AVSTAND, y = ys[k];
      if (!avspiller.kjorer) {
        c.strokeStyle = f.f1; c.fillStyle = f.flate; c.lineWidth = 2;
        c.beginPath(); c.arc(sx(x), sy(y), 7, 0, 2 * Math.PI); c.fill(); c.stroke();
      }
      c.fillStyle = f.dempet; c.textAlign = i === 0 ? "left" : "center"; c.textBaseline = "top";
      c.fillText((scene.b < 560 ? "" : navn[i] + " ") + komma(y, 1) + " m", i === 0 ? sx(-1) : sx(x), sy(y) + 12);
    });

    // Vogna står oppå skinnene
    const g = baneGeometri(ys, vogn.x), q = Math.sqrt(1 + g.y1 * g.y1);
    const nx = -g.y1 / q, ny = 1 / q, lengde = 1.6, hoyde = 0.7;
    c.save();
    c.translate(sx(vogn.x + nx * hoyde / 2), sy(g.y + ny * hoyde / 2));
    c.rotate(-Math.atan(g.y1));
    c.fillStyle = f.f2;
    const b = lengde * skala, hy = hoyde * skala;
    c.beginPath(); c.roundRect(-b / 2, -hy / 2, b, hy, Math.min(6, hy / 3)); c.fill();
    c.restore();
  }

  // Energigraf mot posisjon
  function tegnGraf() {
    const c = graf.ctx, f = graf.f;
    graf.tom();
    const eMaks = Math.max(e0, VOGN_M * G * Math.max(...ys)) / 1000 * 1.08;
    const { px, py } = Sim.akser(graf, { x: [0, SLUTT_X], y: [0, eMaks], xTekst: "x / m", yTekst: "E / kJ", marg: { v: 44 } });
    // Ep langs hele banen
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 2; c.setLineDash([4, 4]);
    c.beginPath();
    for (let x = 0; x <= SLUTT_X; x += 0.1) { const y = VOGN_M * G * baneGeometri(ys, x).y / 1000; x ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y)); }
    c.stroke(); c.setLineDash([]);
    const linje = (k, farge, b) => {
      c.strokeStyle = farge; c.lineWidth = b;
      c.beginPath();
      spor.forEach((s, i) => { const y = k(s) / 1000; i ? c.lineTo(px(s[0]), py(y)) : c.moveTo(px(s[0]), py(y)); });
      c.stroke();
    };
    if (spor.length > 1) {
      linje((s) => s[2], f.f2, 2.5);
      linje((s) => s[1] + s[2], f.f1, 2.5);
    }
  }

  function oppdaterTall() {
    const e = energi(), y = baneGeometri(ys, vogn.x).y;
    $("tid").textContent = komma(vogn.t, 1) + " s";
    $("fart").textContent = komma(Math.abs(vogn.v), 1) + " m/s";
    $("fart-kmt").textContent = komma(Math.abs(vogn.v) * 3.6, 0) + " km/h";
    $("hoyde").textContent = komma(y, 2) + " m";
    $("status").textContent = vogn.status;
    $("ep").textContent = komma(e.ep / 1000, 1) + " kJ";
    $("ek").textContent = komma(e.ek / 1000, 1) + " kJ";
    $("q").textContent = komma(e.q / 1000, 1) + " kJ";
    $("stolpe-ep").style.width = (100 * e.ep / e0) + "%";
    $("stolpe-ek").style.width = (100 * e.ek / e0) + "%";
    $("stolpe-q").style.width = (100 * e.q / e0) + "%";
  }

  function tegnAlt() {
    if (!vogn) return;
    if (scene.b) tegnScene();
    if (graf.b) tegnGraf();
    oppdaterTall();
  }

  // Dra i toppene for å endre høyden
  let dras = null;
  function pekerPunkt(e) {
    const r = el.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  el.addEventListener("pointerdown", (e) => {
    if (avspiller.kjorer) return;
    const [mx, my] = pekerPunkt(e);
    const i = HANDTAK.findIndex((k) => Math.hypot(sx(k * AVSTAND) - mx, sy(ys[k]) - my) < 22);
    if (i < 0) return;
    dras = ["h1", "h2", "h3"][i];
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  el.addEventListener("pointermove", (e) => {
    if (!dras) {
      if (avspiller.kjorer) { el.style.cursor = "default"; return; }
      const [mx, my] = pekerPunkt(e);
      el.style.cursor = HANDTAK.some((k) => Math.hypot(sx(k * AVSTAND) - mx, sy(ys[k]) - my) < 22) ? "grab" : "default";
      return;
    }
    const y = (oy - pekerPunkt(e)[1]) / skala;
    const inp = $(dras);
    inp.value = Math.min(Number(inp.max), Math.max(Number(inp.min), Math.round(y * 10) / 10));
    nullstill();
  });
  el.addEventListener("pointerup", () => { dras = null; });

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["h1", "h2", "h3", "v0", "friksjon"]) $(id).addEventListener("input", nullstill);
  $("tempo").addEventListener("input", () => { tempo = Number(Sim.verdi("tempo")); });

  nullstill();
  scene.tilpass();
  graf.tilpass();
})();
