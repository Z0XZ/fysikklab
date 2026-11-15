// Lysklokka. To like lysklokker, A på perrongen og B på toget, sett fra et valgt referansesystem.
// Enheter: meter og nanosekunder.

const C = 0.299792458;   // Lysfarten i m/ns
const SPEIL_L = 1.0;     // Avstand mellom speilene i meter
const T0 = 2 * SPEIL_L / C;
const gamma = (u) => 1 / Math.sqrt(1 - (u / C) ** 2);

(function () {
  const lerret = document.getElementById("klokker");
  if (!lerret) return;
  const ctx = lerret.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const komma = (n, d) => n.toFixed(d).replace(".", ",");

  const BREDDE = 6.0;            // Synlig bredde i meter
  const RAD_H = 1.65;            // Høyde per rad i meter
  const NS_PER_SEKUND = 5;       // Avspilling ved tempo 1×
  const NAVN = ["A", "B"];
  const STED = ["på perrongen", "på toget"];

  let farger = {};
  let v, system, tempo, visTrekant;
  let t = 0, kjorer = false, forrigeTid = null, animasjon = null;
  let u = [0, 0], x0 = [0, 0], spor = [[], []];
  let skala = 1, venstre = 0, topp = 0;

  function lesFarger() {
    const s = getComputedStyle(document.documentElement);
    for (const navn of ["blekk", "dempet", "rute", "rute-sterk", "f1", "f2", "flate"]) {
      farger[navn] = s.getPropertyValue("--" + navn).trim();
    }
  }

  function lesInnstillinger() {
    v = Number($("fart").value) * C;
    system = $("system").value;
    tempo = Number($("tempo").value);
    visTrekant = $("trekant").checked;
    $("fart-ut").textContent = komma(v / C, 2) + "c";
  }

  function nullstill() {
    if (animasjon) cancelAnimationFrame(animasjon);
    animasjon = null; kjorer = false; forrigeTid = null; t = 0;
    lesInnstillinger();
    u = system === "perrong" ? [0, v] : [-v, 0];
    x0 = u.map((ui) => (ui > 0 ? 0.6 : ui < 0 ? BREDDE - 0.6 : BREDDE / 2));
    spor = [[], []];
    leggTilSpor();
    $("start").textContent = "Start";
    tegn();
  }

  // Fotonets posisjon i klokke i ved tiden t
  function foton(i, tid) {
    const periode = gamma(u[i]) * T0;
    const fase = (tid % periode) / periode;
    return [x0[i] + u[i] * tid, SPEIL_L * (fase < 0.5 ? 2 * fase : 2 - 2 * fase)];
  }

  function leggTilSpor() {
    for (const i of [0, 1]) {
      spor[i].push(foton(i, t));
      if (spor[i].length > 1500) spor[i].shift();
    }
  }

  function tilpass() {
    const r = lerret.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    lerret.width = Math.round(r.width * dpr);
    lerret.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    skala = Math.min(r.width / BREDDE, r.height / (2 * RAD_H));
    venstre = (r.width - BREDDE * skala) / 2;
    topp = (r.height - 2 * RAD_H * skala) / 2;
    tegn();
  }

  const omslag = (x) => ((x % BREDDE) + BREDDE) % BREDDE;
  const px = (x) => venstre + omslag(x) * skala;
  // Rad i: bunnspeilet ligger 0,35 m over radens nedre kant
  const py = (i, y) => topp + ((i + 1) * RAD_H - 0.35 - y) * skala;

  function tegnRad(i) {
    const farge = i === 0 ? farger.blekk : farger.f2;
    const gulv = py(i, -0.12);

    // Gulvet beveger seg sammen med klokka
    ctx.strokeStyle = farger["rute-sterk"]; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(venstre, gulv); ctx.lineTo(venstre + BREDDE * skala, gulv); ctx.stroke();
    for (let k = 0; k < BREDDE / 0.5; k++) {
      const x = venstre + omslag(k * 0.5 + u[i] * t) * skala;
      ctx.beginPath(); ctx.moveTo(x, gulv); ctx.lineTo(x, gulv + 6); ctx.stroke();
    }

    // Lysets bane
    ctx.strokeStyle = farger.f1; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.5;
    ctx.beginPath();
    let forrigeOmgang = null;
    for (const [x, y] of spor[i]) {
      const omgang = Math.floor(x / BREDDE);
      if (omgang === forrigeOmgang) ctx.lineTo(px(x), py(i, y));
      else ctx.moveTo(px(x), py(i, y));
      forrigeOmgang = omgang;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Klokka: to speil og en ramme
    const xk = px(x0[i] + u[i] * t), b = 0.2 * skala;
    ctx.strokeStyle = farge; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xk - b, py(i, 0)); ctx.lineTo(xk - b, py(i, SPEIL_L));
    ctx.moveTo(xk + b, py(i, 0)); ctx.lineTo(xk + b, py(i, SPEIL_L));
    ctx.stroke();
    ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(xk - b, py(i, 0)); ctx.lineTo(xk + b, py(i, 0));
    ctx.moveTo(xk - b, py(i, SPEIL_L)); ctx.lineTo(xk + b, py(i, SPEIL_L));
    ctx.stroke();
    ctx.lineCap = "butt";

    // Fotonet
    const [fx, fy] = foton(i, t);
    ctx.fillStyle = farger.f1;
    ctx.beginPath(); ctx.arc(px(fx), py(i, fy), 5, 0, 2 * Math.PI); ctx.fill();

    // Navn og fart
    ctx.fillStyle = farge;
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    const tekst = "Klokke " + NAVN[i] + " " + STED[i];
    ctx.fillText(tekst, venstre + 4, py(i, SPEIL_L + 0.18));
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillStyle = farger.dempet;
    const fart = u[i] === 0 ? "i ro" : (u[i] > 0 ? "→ " : "← ") + komma(Math.abs(u[i]) / C, 2) + "c";
    ctx.fillText(fart, venstre + 4 + ctx.measureText(tekst).width * 1.15 + 10, py(i, SPEIL_L + 0.18));

    if (visTrekant && u[i] !== 0) tegnTrekant(i);
  }

  // Trekanten for den siste fullførte turen mellom speilene
  function tegnTrekant(i) {
    const halv = gamma(u[i]) * T0 / 2;
    const k = Math.floor(t / halv);
    if (k < 1) return;
    const [xa, ya] = [x0[i] + u[i] * (k - 1) * halv, (k - 1) % 2 ? SPEIL_L : 0];
    const [xb, yb] = [xa + u[i] * halv, k % 2 ? SPEIL_L : 0];
    const a = [px(xa), py(i, ya)];
    const b = [a[0] + (xb - xa) * skala, py(i, yb)];
    const hjorne = [b[0], a[1]];

    ctx.strokeStyle = farger.blekk; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...hjorne); ctx.closePath(); ctx.stroke();
    const r = 8 * Math.sign(xa - xb), opp = yb > ya ? -8 : 8;
    ctx.beginPath(); ctx.moveTo(hjorne[0] + r, hjorne[1]); ctx.lineTo(hjorne[0] + r, hjorne[1] + opp); ctx.lineTo(hjorne[0], hjorne[1] + opp); ctx.stroke();

    ctx.fillStyle = farger.blekk;
    ctx.font = "italic 13px " + getComputedStyle(document.body).getPropertyValue("--serif");
    ctx.textAlign = "center";
    ctx.textBaseline = ya === 0 ? "top" : "bottom";
    ctx.fillText("v·Δt/2", (a[0] + hjorne[0]) / 2, a[1] + (ya === 0 ? 4 : -4));
    ctx.textAlign = u[i] > 0 ? "left" : "right"; ctx.textBaseline = "middle";
    ctx.fillText("L", hjorne[0] + (u[i] > 0 ? 6 : -6), (hjorne[1] + b[1]) / 2);
    ctx.textAlign = u[i] > 0 ? "right" : "left";
    ctx.fillText("c·Δt/2", (a[0] + b[0]) / 2 + (u[i] > 0 ? -8 : 8), (a[1] + b[1]) / 2 - 6);
  }

  function oppdaterTall() {
    $("tid").textContent = komma(t, 1) + " ns";
    $("gamma").textContent = komma(gamma(v), 3);
    for (const i of [0, 1]) {
      const id = NAVN[i].toLowerCase(), g = gamma(u[i]);
      $(id + "-fart").textContent = u[i] === 0 ? "0" : komma(Math.abs(u[i]) / C, 2) + "c";
      $(id + "-periode").textContent = komma(g * T0, 2) + " ns";
      $(id + "-tikk").textContent = Math.floor(t / (g * T0));
      $(id + "-viser").textContent = komma(t / g, 1) + " ns";
    }
  }

  function tegn() {
    const r = lerret.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    tegnRad(0);
    tegnRad(1);
    oppdaterTall();
  }

  function steg(naa) {
    animasjon = null;
    if (!kjorer) return;
    if (forrigeTid !== null) {
      const slutt = t + Math.min((naa - forrigeTid) / 1000, 0.1) * NS_PER_SEKUND * tempo;
      // Små steg gir et jevnt spor også når fotonet snur
      while (t < slutt) { t = Math.min(slutt, t + 0.05); leggTilSpor(); }
    }
    forrigeTid = naa;
    tegn();
    animasjon = requestAnimationFrame(steg);
  }

  $("start").addEventListener("click", () => {
    kjorer = !kjorer;
    forrigeTid = null;
    $("start").textContent = kjorer ? "Pause" : "Fortsett";
    if (kjorer) animasjon = requestAnimationFrame(steg);
  });
  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["fart", "system"]) $(id).addEventListener("input", nullstill);
  $("tempo").addEventListener("input", () => { tempo = Number($("tempo").value); });
  $("trekant").addEventListener("input", () => { visTrekant = $("trekant").checked; tegn(); });

  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting && kjorer) $("start").click();
  }).observe(lerret);
  new ResizeObserver(tilpass).observe(lerret);
  const fornyFarger = () => { lesFarger(); tegn(); };
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", fornyFarger);
  window.addEventListener("temaendring", fornyFarger);

  lesFarger();
  nullstill();
  tilpass();
})();
