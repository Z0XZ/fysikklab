// To baner med samme fallhøyde. Vognene glir langs banen, og friksjonen er R = μN.
// Normalkraften tar med krumningen til banen: N/m = g·cos θ + v²·κ.

const G = 9.81;
const BANE_L = 2.0;      // Horisontal lengde på banene i meter
const DT = 2e-4;         // Tidssteg i sekunder

// Baneformer y = h·f(u) med u = x/L. f(0) = 1 og f(1) = 0 for alle.
const BANER = {
  rett:  { navn: "Rett",        f: (u) => 1 - u,                     df: () => -1,                     d2f: () => 0 },
  bratt: { navn: "Bratt start", f: (u) => (1 - u) ** 3,              df: (u) => -3 * (1 - u) ** 2,      d2f: (u) => 6 * (1 - u) },
  slak:  { navn: "Slak start",  f: (u) => 1 - 0.4 * u - 0.6 * u * u, df: (u) => -0.4 - 1.2 * u,         d2f: () => -1.2 },
};

function baneGeometri(bane, h, x) {
  const u = Math.min(Math.max(x / BANE_L, 0), 1);
  const yd = h * bane.df(u) / BANE_L;
  const ydd = h * bane.d2f(u) / (BANE_L * BANE_L);
  const s = Math.hypot(1, yd);
  return { y: h * bane.f(u), sin: yd / s, cos: 1 / s, kappa: ydd / (s * s * s) };
}

// Deriverte av (x, v, w), der w er friksjonsarbeid per masse.
function deriverte(bane, h, mu, x, v) {
  const g = baneGeometri(bane, h, x);
  const n = Math.max(0, G * g.cos + v * v * g.kappa);
  let a = -G * g.sin - mu * n;
  if (v <= 0 && a <= 0) a = 0;   // Statisk friksjon holder vogna i ro
  return [v * g.cos, a, mu * n * Math.max(v, 0)];
}

function nyVogn() {
  return { x: 0, v: 0, w: 0, t: 0, ferdig: false, stoppet: false };
}

function stegVogn(vogn, bane, h, mu, dt) {
  const { x, v, w } = vogn;
  const k1 = deriverte(bane, h, mu, x, v);
  const k2 = deriverte(bane, h, mu, x + k1[0] * dt / 2, v + k1[1] * dt / 2);
  const k3 = deriverte(bane, h, mu, x + k2[0] * dt / 2, v + k2[1] * dt / 2);
  const k4 = deriverte(bane, h, mu, x + k3[0] * dt, v + k3[1] * dt);
  const nx = x + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
  const nv = v + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  const nw = w + dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);

  if (nx >= BANE_L) {
    const andel = (BANE_L - x) / (nx - x);
    vogn.x = BANE_L;
    vogn.v = v + andel * (nv - v);
    vogn.w = w + andel * (nw - w);
    vogn.t += andel * dt;
    vogn.ferdig = true;
    return;
  }
  vogn.x = nx; vogn.v = nv; vogn.w = nw; vogn.t += dt;
  if (nv <= 0 && deriverte(bane, h, mu, nx, 0)[1] <= 0) {
    vogn.v = 0;
    vogn.stoppet = true;
  }
}

// Kjører en vogn helt til mål (eller til den stopper) uten animasjon.
function simulerFerdig(baneId, h, mu) {
  const vogn = nyVogn();
  while (!vogn.ferdig && !vogn.stoppet && vogn.t < 20) stegVogn(vogn, BANER[baneId], h, mu, DT);
  return vogn;
}

(function () {
  const scene = document.getElementById("baner");
  if (!scene) return;
  const graf = document.getElementById("fartsgraf");
  const sc = scene.getContext("2d"), gc = graf.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const komma = (n, d) => n.toFixed(d).replace(".", ",").replace(/^-(0,0*)$/, "$1");
  const H_MAKS = 1.5;

  let farger = {};
  let h, m, mu, tempo, baneB;
  let vogner, spor, tMaks, vMaks;
  let kjorer = false, forrigeTid = null, animasjon = null;
  const VOGNID = ["a", "b"];

  function lesFarger() {
    const s = getComputedStyle(document.documentElement);
    for (const navn of ["blekk", "dempet", "rute", "rute-sterk", "f1", "f2", "flate"]) {
      farger[navn] = s.getPropertyValue("--" + navn).trim();
    }
  }

  function baneFor(i) { return i === 0 ? BANER.rett : BANER[baneB]; }
  function baneIdFor(i) { return i === 0 ? "rett" : baneB; }
  function fargeFor(i) { return i === 0 ? farger.f1 : farger.f2; }

  function lesInnstillinger() {
    h = Number($("hoyde").value);
    m = Number($("masse").value);
    mu = Number($("friksjon").value);
    tempo = Number($("tempo").value);
    baneB = $("bane-b").value;
    $("hoyde-ut").textContent = komma(h, 2) + " m";
    $("masse-ut").textContent = komma(m, 1) + " kg";
    $("friksjon-ut").textContent = komma(mu, 2);
  }

  function nullstill() {
    if (animasjon) cancelAnimationFrame(animasjon);
    animasjon = null; kjorer = false; forrigeTid = null;
    lesInnstillinger();
    vogner = [nyVogn(), nyVogn()];
    spor = [[[0, 0]], [[0, 0]]];
    const slutt = [0, 1].map((i) => simulerFerdig(baneIdFor(i), h, mu));
    tMaks = Math.max(0.5, ...slutt.map((v) => v.t)) * 1.08;
    vMaks = Math.sqrt(2 * G * h) * 1.12;
    $("start").textContent = "Start";
    tegnAlt();
  }

  // Scene
  let skala, ox, oy;
  function tilpassScene() {
    const r0 = scene.getBoundingClientRect(), z = Sim.tekstskala();
    const r = { width: r0.width / z, height: r0.height / z };
    const dpr = window.devicePixelRatio || 1;
    scene.width = Math.round(r0.width * dpr); scene.height = Math.round(r0.height * dpr);
    sc.setTransform(dpr * z, 0, 0, dpr * z, 0, 0);
    const xMin = -0.3, xMax = BANE_L + 0.45, yMin = -0.15, yMax = H_MAKS + 0.12;
    skala = Math.min(r.width / (xMax - xMin), r.height / (yMax - yMin));
    ox = (r.width - (xMax - xMin) * skala) / 2 - xMin * skala;
    oy = r.height - ((r.height - (yMax - yMin) * skala) / 2 - yMin * skala);
  }
  const sx = (x) => ox + x * skala;
  const sy = (y) => oy - y * skala;

  function tegnScene() {
    const r = scene.getBoundingClientRect();
    sc.clearRect(0, 0, r.width, r.height);
    sc.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

    // Bakke, mål og høydemerke
    sc.strokeStyle = farger["rute-sterk"]; sc.lineWidth = 1;
    sc.setLineDash([5, 5]);
    sc.beginPath(); sc.moveTo(sx(-0.25), sy(h)); sc.lineTo(sx(BANE_L + 0.4), sy(h)); sc.stroke();
    sc.beginPath(); sc.moveTo(sx(BANE_L), sy(-0.12)); sc.lineTo(sx(BANE_L), sy(h + 0.1)); sc.stroke();
    sc.setLineDash([]);
    sc.strokeStyle = farger.blekk; sc.lineWidth = 1.5;
    sc.beginPath(); sc.moveTo(sx(-0.25), sy(0)); sc.lineTo(sx(BANE_L + 0.4), sy(0)); sc.stroke();
    sc.fillStyle = farger.dempet;
    sc.textAlign = "right"; sc.textBaseline = "bottom";
    sc.fillText("h = " + komma(h, 2) + " m", sx(BANE_L + 0.4), sy(h) - 3);
    sc.textBaseline = "top";
    sc.fillText("mål", sx(BANE_L) - 5, sy(0) + 4);

    // Baner
    for (const i of [1, 0]) {
      const bane = baneFor(i);
      sc.strokeStyle = fargeFor(i); sc.lineWidth = 3; sc.lineJoin = "round";
      sc.beginPath();
      for (let k = 0; k <= 120; k++) {
        const x = BANE_L * k / 120, y = h * bane.f(k / 120);
        k ? sc.lineTo(sx(x), sy(y)) : sc.moveTo(sx(x), sy(y));
      }
      sc.stroke();
    }
    sc.font = "600 14px system-ui, sans-serif";
    sc.textAlign = "center"; sc.textBaseline = "middle";
    for (const i of [0, 1]) {
      const bane = baneFor(i), u = i === 0 ? 0.6 : 0.42;
      const g = baneGeometri(bane, h, u * BANE_L);
      const d = i === 0 ? 0.13 : -0.13;   // A over banen, B under
      sc.fillStyle = fargeFor(i);
      sc.fillText(i === 0 ? "A" : "B", sx(u * BANE_L - g.sin * d), sy(g.y + g.cos * d));
    }

    // Vogner: B fylt, A med kant, slik at begge synes når de overlapper
    const side = 0.1;
    for (const i of [1, 0]) {
      const vogn = vogner[i], g = baneGeometri(baneFor(i), h, vogn.x);
      const cx = vogn.x - g.sin * side / 2, cy = g.y + g.cos * side / 2;
      sc.save();
      sc.translate(sx(cx), sy(cy));
      sc.rotate(-Math.atan2(g.sin, g.cos));
      const p = side * skala;
      if (i === 1) { sc.fillStyle = fargeFor(i); sc.fillRect(-p / 2, -p / 2, p, p); }
      else { sc.strokeStyle = fargeFor(i); sc.lineWidth = 3; sc.strokeRect(-p / 2 + 1.5, -p / 2 + 1.5, p - 3, p - 3); }
      sc.restore();
    }
  }

  // Fartsgraf
  let gb, gh;
  const gm = { v: 46, h: 12, o: 12, n: 34 };
  function tilpassGraf() {
    const r0 = graf.getBoundingClientRect(), z = Sim.tekstskala();
    const r = { width: r0.width / z, height: r0.height / z };
    const dpr = window.devicePixelRatio || 1;
    graf.width = Math.round(r0.width * dpr); graf.height = Math.round(r0.height * dpr);
    gc.setTransform(dpr * z, 0, 0, dpr * z, 0, 0);
    gb = r.width; gh = r.height;
  }
  const gx = (t) => gm.v + t / tMaks * (gb - gm.v - gm.h);
  const gy = (v) => gh - gm.n - v / vMaks * (gh - gm.n - gm.o);
  function steglengde(maks) {
    const r = maks / 4, p = 10 ** Math.floor(Math.log10(r));
    return [1, 2, 5, 10].map((k) => k * p).find((s) => s >= r);
  }

  function tegnGraf() {
    gc.clearRect(0, 0, gb, gh);
    gc.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    gc.lineWidth = 1;
    const ts = steglengde(tMaks), vs = steglengde(vMaks);
    gc.fillStyle = farger.dempet;
    gc.textAlign = "center"; gc.textBaseline = "top";
    for (let t = 0; t <= tMaks + 1e-9; t += ts) {
      gc.strokeStyle = farger.rute; gc.beginPath(); gc.moveTo(gx(t), gy(0)); gc.lineTo(gx(t), gy(vMaks)); gc.stroke();
      gc.fillText(komma(t, ts < 1 ? 1 : 0), gx(t), gy(0) + 5);
    }
    gc.textAlign = "right"; gc.textBaseline = "middle";
    for (let v = 0; v <= vMaks + 1e-9; v += vs) {
      gc.strokeStyle = farger.rute; gc.beginPath(); gc.moveTo(gx(0), gy(v)); gc.lineTo(gx(tMaks), gy(v)); gc.stroke();
      gc.fillText(komma(v, vs < 1 ? 1 : 0), gx(0) - 6, gy(v));
    }
    gc.strokeStyle = farger.blekk; gc.lineWidth = 1.5;
    gc.beginPath(); gc.moveTo(gx(0), gy(vMaks)); gc.lineTo(gx(0), gy(0)); gc.lineTo(gx(tMaks), gy(0)); gc.stroke();
    gc.fillStyle = farger.dempet;
    gc.textAlign = "right"; gc.textBaseline = "bottom";
    gc.fillText("t / s", gx(tMaks), gy(0) - 3);
    gc.textAlign = "left"; gc.textBaseline = "top";
    gc.fillText("v / (m/s)", gx(0) + 5, gm.o - 8);

    for (const i of [1, 0]) {
      gc.strokeStyle = fargeFor(i); gc.lineWidth = 2.5; gc.lineJoin = "round";
      gc.beginPath();
      spor[i].forEach(([t, v], k) => (k ? gc.lineTo(gx(t), gy(v)) : gc.moveTo(gx(t), gy(v))));
      gc.stroke();
    }
  }

  // Tabell og energistolper
  function status(vogn) {
    if (vogn.ferdig) return "i mål";
    if (vogn.stoppet) return vogn.t === 0 ? "står i ro" : "stoppet";
    return kjorer || vogn.t > 0 ? "kjører" : "klar";
  }

  function oppdaterTall() {
    const e0 = m * G * h;
    vogner.forEach((vogn, i) => {
      const id = VOGNID[i];
      const ep = m * G * baneGeometri(baneFor(i), h, vogn.x).y;
      const ek = 0.5 * m * vogn.v * vogn.v;
      const q = m * vogn.w;
      $(id + "-tid").textContent = komma(vogn.t, 2) + " s";
      $(id + "-fart").textContent = komma(vogn.v, 2) + " m/s";
      $(id + "-ek").textContent = komma(ek, 2) + " J";
      $(id + "-ep").textContent = komma(ep, 2) + " J";
      $(id + "-q").textContent = komma(q, 2) + " J";
      $(id + "-status").textContent = status(vogn);
      $(id + "-stolpe-ep").style.width = (100 * ep / e0) + "%";
      $(id + "-stolpe-ek").style.width = (100 * ek / e0) + "%";
      $(id + "-stolpe-q").style.width = (100 * q / e0) + "%";
    });
    $("bane-b-navn").textContent = BANER[baneB].navn.toLowerCase();
  }

  function tegnAlt() { tegnScene(); tegnGraf(); oppdaterTall(); }

  function steg(naa) {
    animasjon = null;
    if (!kjorer) return;
    if (forrigeTid !== null) {
      const dtSim = Math.min((naa - forrigeTid) / 1000, 0.1) * tempo;
      vogner.forEach((vogn, i) => {
        const slutt = vogn.t + dtSim;
        while (!vogn.ferdig && !vogn.stoppet && vogn.t < slutt - 1e-12) {
          stegVogn(vogn, baneFor(i), h, mu, Math.min(DT, slutt - vogn.t));
        }
        if (!vogn.ferdig && !vogn.stoppet) vogn.t = slutt;
        spor[i].push([Math.min(vogn.t, tMaks), vogn.v]);
      });
    }
    forrigeTid = naa;
    tegnAlt();
    if (vogner.every((v) => v.ferdig || v.stoppet)) {
      kjorer = false;
      $("start").textContent = "Kjør igjen";
      return;
    }
    animasjon = requestAnimationFrame(steg);
  }

  $("start").addEventListener("click", () => {
    if (kjorer) {
      kjorer = false; forrigeTid = null;
      $("start").textContent = "Fortsett";
      return;
    }
    if (vogner.every((v) => v.ferdig || v.stoppet)) nullstill();
    kjorer = true;
    $("start").textContent = "Pause";
    animasjon = requestAnimationFrame(steg);
  });
  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["hoyde", "masse", "friksjon", "bane-b"]) $(id).addEventListener("input", nullstill);
  $("tempo").addEventListener("input", () => { tempo = Number($("tempo").value); });

  function tilpass() { tilpassScene(); tilpassGraf(); tegnAlt(); }
  new ResizeObserver(tilpass).observe(scene);
  window.addEventListener("tekstendring", tilpass);
  new ResizeObserver(tilpass).observe(graf);
  const fornyFarger = () => { lesFarger(); tegnAlt(); };
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", fornyFarger);
  window.addEventListener("temaendring", fornyFarger);

  lesFarger();
  tilpassScene();
  tilpassGraf();
  nullstill();
})();
