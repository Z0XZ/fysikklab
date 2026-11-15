// GPS-klokkene. Sammenligner en klokke i en satellitt i sirkelbane med en klokke på bakken.
// Klokka på bakken regnes som i ro (vi ser bort fra at jorda roterer).

const C = 2.99792458e8;
const GM = 3.986004418e14;
const R_JORD = 6.371e6;
const DOGN = 86400;
const GPS_HOYDE = 20200e3;

// Hvor mye satellittklokka går for fort per døgn, i mikrosekunder
function effekter(hoyde) {
  const r = R_JORD + hoyde, v = Math.sqrt(GM / r);
  const sr = -v * v / (2 * C * C) * DOGN * 1e6;              // Spesiell relativitet: klokka går saktere
  const gr = GM / (C * C) * (1 / R_JORD - 1 / r) * DOGN * 1e6; // Generell relativitet: klokka går raskere høyere oppe
  return { r, v, periode: 2 * Math.PI * r / v, sr, gr };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("bane");
  if (!el) return;

  let hoyde, medSR, medGR, tempo, t = 0, vinkel = 0;
  const DAGER = 7;
  const scene = Sim.lerret(el, tegnAlt);
  const graf = Sim.lerret($("avviksgraf"), tegnAlt);

  const hoydeFra = (s) => Math.round(10 ** s) * 1000;
  function lesInnstillinger() {
    hoyde = hoydeFra(Sim.verdi("hoyde", (s) => komma(hoydeFra(s) / 1000, 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " km"));
    medSR = Sim.verdi("sr");
    medGR = Sim.verdi("gr");
    tempo = Number(Sim.verdi("tempo"));
  }
  const sum = (e) => (medSR ? e.sr : 0) + (medGR ? e.gr : 0);

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    t = 0; vinkel = 0;
    tegnAlt();
  }
  function steg(dt) {
    const e = effekter(hoyde), simDt = dt * tempo * 3600;
    t = Math.min(DAGER * DOGN, t + simDt);
    // Satellitten vises med høyst én runde per 1,5 s, ellers blir bevegelsen bare flimmer
    vinkel += Math.min(2 * Math.PI * simDt / e.periode, 2 * Math.PI * dt / 1.5);
    tegnAlt();
    return t < DAGER * DOGN;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function tegnScene() {
    const c = scene.ctx, f = scene.f, e = effekter(hoyde);
    scene.tom();
    const cx = scene.b / 2, cy = scene.h / 2;
    const sk = (Math.min(scene.b, scene.h) / 2 - 22) / Math.max(e.r, R_JORD * 1.6);
    // Jorda
    c.fillStyle = f.f2; c.globalAlpha = 0.18;
    c.beginPath(); c.arc(cx, cy, R_JORD * sk, 0, 2 * Math.PI); c.fill();
    c.globalAlpha = 1; c.strokeStyle = f.f2; c.lineWidth = 2;
    c.beginPath(); c.arc(cx, cy, R_JORD * sk, 0, 2 * Math.PI); c.stroke();
    // Klokka på bakken
    c.fillStyle = f.blekk;
    c.beginPath(); c.arc(cx, cy - R_JORD * sk, 4, 0, 2 * Math.PI); c.fill();
    c.font = "12px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("jorda", cx, cy);
    // Banen og satellitten
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.setLineDash([4, 4]);
    c.beginPath(); c.arc(cx, cy, e.r * sk, 0, 2 * Math.PI); c.stroke(); c.setLineDash([]);
    const sx = cx + e.r * sk * Math.sin(vinkel), sy = cy - e.r * sk * Math.cos(vinkel);
    c.save(); c.translate(sx, sy); c.rotate(vinkel);
    c.fillStyle = f.f1; c.fillRect(-4, -4, 8, 8);
    c.strokeStyle = f.f1; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.stroke();
    c.restore();
    c.fillStyle = f.dempet; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("v = " + komma(e.v / 1000, 2) + " km/s", 8, 8);
    c.fillText("T = " + komma(e.periode / 3600, 2) + " h", 8, 24);
  }

  function tegnGraf() {
    const c = graf.ctx, f = graf.f, e = effekter(hoyde);
    graf.tom();
    const verdier = [medSR ? e.sr * DAGER : 0, medGR ? e.gr * DAGER : 0, sum(e) * DAGER, 0];
    const yMin = Math.min(...verdier) * 1.1 - 1, yMaks = Math.max(...verdier) * 1.1 + 1;
    const { px, py } = Sim.akser(graf, { x: [0, DAGER], y: [yMin, yMaks], xSteg: 1, xTekst: "døgn", yTekst: "Δt / µs", marg: { v: 50 } });
    const dager = t / DOGN;
    const linje = (rate, farge, stiplet, b = 2.5) => {
      c.strokeStyle = farge; c.lineWidth = b; c.setLineDash(stiplet ? [5, 4] : []);
      c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(dager), py(rate * dager)); c.stroke(); c.setLineDash([]);
    };
    if (medSR) linje(e.sr, f.f2, true);
    if (medGR) linje(e.gr, f.f1, true);
    if (medSR && medGR) linje(sum(e), f.blekk, false, 3);
  }

  function oppdaterTall() {
    const e = effekter(hoyde), s = sum(e), dager = t / DOGN;
    $("dag").textContent = komma(dager, 2) + " døgn";
    $("sr-dogn").textContent = medSR ? komma(e.sr, 1) + " µs" : "av";
    $("gr-dogn").textContent = medGR ? "+" + komma(e.gr, 1) + " µs" : "av";
    $("sum-dogn").textContent = (s > 0 ? "+" : "") + komma(s, 1) + " µs";
    $("feil-dogn").textContent = komma(Math.abs(s) * 1e-6 * C / 1000, 1) + " km";
    $("avvik-naa").textContent = (s > 0 ? "+" : "") + komma(s * dager, 1) + " µs";
    $("feil-naa").textContent = komma(Math.abs(s * dager) * 1e-6 * C / 1000, 1) + " km";
    $("hvem").textContent = Math.abs(s) < 0.05 ? "går like fort" : s > 0 ? "går for fort" : "går for sakte";
  }

  function tegnAlt() {
    if (hoyde === undefined) return;
    if (scene.b) tegnScene();
    if (graf.b) tegnGraf();
    oppdaterTall();
  }

  // Snarveier til kjente baner
  for (const k of document.querySelectorAll("[data-hoyde]")) {
    k.addEventListener("click", () => { $("hoyde").value = Math.log10(Number(k.dataset.hoyde)); nullstill(); });
  }
  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["hoyde", "sr", "gr"]) $(id).addEventListener("input", nullstill);
  $("tempo").addEventListener("input", () => { tempo = Number(Sim.verdi("tempo")); });

  nullstill();
  scene.tilpass();
  graf.tilpass();
})();
