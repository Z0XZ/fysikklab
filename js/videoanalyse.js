// Videoanalyse: felles verktøy for oppleggene med Tracker.
// 1) Scenarier: modeller for fall, muffinsformer, rulling, glidende kloss og støt. Brukes til eksempeldata
//    (med fast «tilfeldig» støy, så tallene er like hver gang) og til den virtuelle videoen.
// 2) Analyse: Lim inn t og posisjon fra Tracker, velg intervall og tilpass rett linje eller andregradsfunksjon.
// 3) Virtuell video: Klikk på objektet bilde for bilde, slik som i Tracker.

const G = 9.81;

function frø(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function støy(seed) { const r = frø(seed); return () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }; }

// Muffinsformer: L = k v², m = n · 0,40 g. Samme modell som i simuleringen «Fall med luftmotstand».
const MUFFIN_M1 = 0.0004, MUFFIN_K = MUFFIN_M1 * G / 1.1 ** 2;
function muffinFall(n, h0) {
  const m = n * MUFFIN_M1, dt = 1e-4, tab = [];
  let y = h0, v = 0;
  for (let t = 0; t <= 3; t += dt) { if (Math.round(t / dt) % 10 === 0) tab.push(y); v += (G - MUFFIN_K * v * v / m) * dt; y -= v * dt; }
  return (t) => tab[Math.min(tab.length - 1, Math.max(0, Math.round(t / 1e-3)))];
}

// Hvert scenario: fps, varighet, bildet (bredde × høyde i m), objekter med posisjon i bildet (x, y i m),
// og målestørrelsen som eksporteres (for eksempel y oppover eller s langs planet).
function scenario(navn, valg = {}) {
  if (navn === "fall") {
    const h0 = 1.6, T = Math.sqrt(2 * (h0 - 0.03) / G);
    return { navn: "Ball som slippes", fps: 30, T, bredde: 0.8, hoyde: 1.8, kolonner: ["t (s)", "y (m)"], linjal: "loddrett",
      objekter: [{ id: "A", form: "ball", r: 0.03, pos: (t) => ({ x: 0.4, y: h0 - 0.5 * G * Math.min(t, T) ** 2 }) }],
      mål: (p) => [p.A.y] };
  }
  if (navn === "muffins") {
    const n = valg.n || 1, f = muffinFall(n, 1.75);
    let T = 0; while (f(T) > 0.05 && T < 3) T += 0.001;
    return { navn: `Muffinsform (${n} stk.)`, fps: 60, T, bredde: 0.8, hoyde: 1.9, kolonner: ["t (s)", "y (m)"], linjal: "loddrett",
      objekter: [{ id: "A", form: "muffins", r: 0.035, n, pos: (t) => ({ x: 0.4, y: f(t) }) }], mål: (p) => [p.A.y] };
  }
  if (navn === "skraaplan") {
    const th = 5 * Math.PI / 180, a = G * Math.sin(th) - 0.06, L = 1.6, T = Math.sqrt(2 * L / a);
    return { navn: "Vogn på skråplan (5°)", fps: 30, T, bredde: 2.0, hoyde: 0.6, kolonner: ["t (s)", "s (m)"], linjal: "langs", vinkel: th, a,
      objekter: [{ id: "A", form: "vogn", r: 0.06, pos: (t) => { const s = 0.15 + 0.5 * a * Math.min(t, T) ** 2; return { x: 0.15 + s * Math.cos(th), y: 0.05 + (L + 0.3 - s) * Math.sin(th), s }; } }],
      mål: (p) => [p.A.s] };
  }
  if (navn === "gulv") {
    const v0 = 1.2, a = 0.15, T = 2.5;
    return { navn: "Ball som ruller langs gulvet", fps: 30, T, bredde: 3.2, hoyde: 0.5, kolonner: ["t (s)", "x (m)"], linjal: "vannrett", a,
      objekter: [{ id: "A", form: "ball", r: 0.04, pos: (t) => ({ x: 0.2 + v0 * t - 0.5 * a * t * t, y: 0.04 }) }], mål: (p) => [p.A.x - 0.2] };
  }
  if (navn === "glid") {
    const v0 = 1.6, mu = 0.3, a = mu * G, tStopp = v0 / a, T = 0.8;
    const s = (t) => (t < tStopp ? v0 * t - 0.5 * a * t * t : v0 * tStopp - 0.5 * a * tStopp ** 2);
    return { navn: "Kloss som glir til den stopper", fps: 60, T, bredde: 1.2, hoyde: 0.4, kolonner: ["t (s)", "x (m)"], linjal: "vannrett", mu,
      objekter: [{ id: "A", form: "kloss", r: 0.05, pos: (t) => ({ x: 0.15 + s(t), y: 0.03 }) }], mål: (p) => [p.A.x - 0.15] };
  }
  if (navn === "kast") {
    // Ball kastet skrått oppover: v0 = 3,6 m/s, 52° over vannrett, fra (0,25 m, 0,85 m). Uten luftmotstand.
    const v0 = 3.6, th = 52 * Math.PI / 180, x0 = 0.25, y0 = 0.85, vx = v0 * Math.cos(th), vy = v0 * Math.sin(th), r = 0.035;
    const T = (vy + Math.sqrt(vy * vy + 2 * G * (y0 - r))) / G;
    return { navn: "Ball som kastes skrått", fps: 30, T, bredde: 2.3, hoyde: 1.5, kolonner: ["t (s)", "x (m)", "y (m)"], linjal: "begge", x0,
      fakta: { v0, th, vx, vy, T },
      objekter: [{ id: "A", form: "ball", r, pos: (t) => ({ x: x0 + vx * Math.min(t, T), y: y0 + vy * Math.min(t, T) - 0.5 * G * Math.min(t, T) ** 2 }) }],
      mål: (p) => [p.A.x - x0, p.A.y] };
  }
  if (navn === "stot") {
    // Vogn A (0,50 kg) treffer vogn B (0,25 kg) som står i ro. Støttall 0,80 og litt rullefriksjon.
    const mA = 0.5, mB = 0.25, e = 0.8, af = 0.02, L = 0.17, vA0 = 0.42, xA0 = 0.25, xB0 = 1.0;
    // Tid til støtet: A bremser litt
    const gap = xB0 - xA0 - L; let tS = 0; while (vA0 * tS - 0.5 * af * tS * tS < gap) tS += 1e-4;
    const vAS = vA0 - af * tS, uA = (mA * vAS - mB * e * vAS) / (mA + mB), uB = (mA * vAS + mA * e * vAS) / (mA + mB);
    const xS = xA0 + vA0 * tS - 0.5 * af * tS * tS;
    const etter = (u, t) => { const d = t - tS, tStopp = u / af; const dd = Math.min(d, tStopp); return u * dd - 0.5 * af * dd * dd; };
    const xA = (t) => (t < tS ? xA0 + vA0 * t - 0.5 * af * t * t : xS + etter(uA, t));
    const xB = (t) => (t < tS ? xB0 : xB0 + etter(uB, t));
    return { navn: "Støt mellom to vogner", fps: 30, T: 3.0, bredde: 2.2, hoyde: 0.45, kolonner: ["t (s)", "xA (m)", "xB (m)"], linjal: "vannrett",
      fakta: { mA, mB, vAS, uA, uB, tS },
      objekter: [{ id: "A", form: "vogn", r: 0.085, farge: "f1", pos: (t) => ({ x: xA(t) + L / 2, y: 0.05 }) }, { id: "B", form: "vogn", r: 0.085, farge: "f2", pos: (t) => ({ x: xB(t) + L / 2, y: 0.05 }) }],
      mål: (p) => [p.A.x, p.B.x] };
  }
  return null;
}

// Eksempeldata med «digitaliseringsstøy» (som når man klikker litt ved siden av i Tracker)
function eksempelData(navn, valg = {}, seed = 7, sigma = 0.002) {
  const sc = scenario(navn, valg), n = støy(seed), rader = [];
  for (let i = 0; i * (1 / sc.fps) <= sc.T + 1e-9; i++) {
    const t = i / sc.fps, p = {};
    for (const o of sc.objekter) p[o.id] = o.pos(t);
    rader.push([t, ...sc.mål(p).map((v) => v + sigma * n())]);
  }
  return { kolonner: sc.kolonner, rader };
}
function somTekst(d, des = 4) {
  return [d.kolonner.join("\t"), ...d.rader.map((r) => r.map((v, i) => v.toFixed(i ? des : 4).replace(".", ",")).join("\t"))].join("\n");
}

// Leser tekst fra Tracker eller et regneark: kolonner skilt med tabulator, semikolon eller mellomrom.
function lesTabell(tekst) {
  const rader = []; let kolonner = null;
  for (const linje of tekst.split(/\r?\n/)) {
    const l = linje.trim(); if (!l) continue;
    let deler;
    if (/[\t;]/.test(l)) deler = l.split(/\s*[\t;]\s*/);
    else if (/\s/.test(l)) deler = l.split(/\s+/);
    else deler = l.includes(".") ? l.split(",") : [l];
    const tall = deler.map((d) => parseFloat(d.replace(",", ".").replace("−", "-")));
    if (tall.length >= 2 && tall.every((x) => isFinite(x))) rader.push(tall);
    else if (!rader.length && deler.length >= 2) kolonner = deler;
  }
  const n = rader.length ? Math.min(...rader.map((r) => r.length)) : 0;
  return { kolonner: kolonner && kolonner.length >= n ? kolonner.slice(0, n) : Array.from({ length: n }, (_, i) => (i ? "kolonne " + (i + 1) : "t")), rader: rader.map((r) => r.slice(0, n)).sort((a, b) => a[0] - b[0]) };
}

// Minste kvadraters metode for et polynom av grad 1 eller 2. Returnerer koeffisienter [c0, c1, c2] og R².
function tilpass(pkt, grad) {
  const n = grad + 1, A = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
  const t0 = pkt[0][0];   // forskyver tiden for bedre numerikk
  for (const [t, y] of pkt) { const x = t - t0; for (let i = 0; i < n; i++) { b[i] += y * x ** i; for (let j = 0; j < n; j++) A[i][j] += x ** (i + j); } }
  for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]]; for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; } }
  const k = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let c = i + 1; c < n; c++) s -= A[i][c] * k[c]; k[i] = s / A[i][i]; }
  // Tilbake til uforskjøvet tid: y = k0 + k1 (t − t0) + k2 (t − t0)²
  const c2 = grad === 2 ? k[2] : 0, c1 = k[1] - 2 * c2 * t0, c0 = k[0] - k[1] * t0 + c2 * t0 * t0;
  const f = (t) => c0 + c1 * t + c2 * t * t, my = pkt.reduce((s, p) => s + p[1], 0) / pkt.length;
  const ssr = pkt.reduce((s, p) => s + (p[1] - f(p[0])) ** 2, 0), sst = pkt.reduce((s, p) => s + (p[1] - my) ** 2, 0);
  return { c0, c1, c2, f, r2: sst > 0 ? 1 - ssr / sst : 1, a: 2 * c2, v: (t) => c1 + 2 * c2 * t };
}

// Analyseverktøyet
(function () {
  const $ = Sim.$, komma = Sim.komma;
  const rot = document.getElementById("va");
  if (!rot) return;
  const l = Sim.lerret($("va-graf"), tegn);
  let tab = { kolonner: [], rader: [] }, fit = null;
  const mål = JSON.parse(rot.dataset.mal || "[]");
  const tall = (s) => { const v = parseFloat(String(s).replace(",", ".")); return isFinite(v) ? v : null; };

  function lesInn() {
    tab = lesTabell($("va-data").value);
    const sel = $("va-kolonne"), før = sel.value;
    sel.innerHTML = tab.kolonner.slice(1).map((k, i) => `<option value="${i + 1}">${k}</option>`).join("");
    if (før && Number(før) < tab.kolonner.length) sel.value = før;
    $("rad-kolonne").hidden = tab.kolonner.length <= 2;
    if (tab.rader.length) {
      const t0 = tab.rader[0][0], t1 = tab.rader[tab.rader.length - 1][0];
      // Rund utover, så første og siste punkt alltid er med
      if (tall($("va-fra").value) === null || tall($("va-fra").value) < t0 - 0.01 || tall($("va-fra").value) > t1) $("va-fra").value = komma(Math.floor(t0 * 100 + 1e-9) / 100, 2);
      if (tall($("va-til").value) === null || tall($("va-til").value) > t1 + 0.01 || tall($("va-til").value) < t0) $("va-til").value = komma(Math.ceil(t1 * 100 - 1e-9) / 100, 2);
    }
    analyser();
  }

  function analyser() {
    const k = Number($("va-kolonne").value || 1), grad = Number(Sim.verdi("va-modell"));
    const fra = tall($("va-fra").value) ?? -Infinity, til = tall($("va-til").value) ?? Infinity;
    const pkt = tab.rader.filter((r) => r[0] >= fra - 1e-9 && r[0] <= til + 1e-9).map((r) => [r[0], r[k]]);
    fit = pkt.length > grad + 1 ? tilpass(pkt, grad) : null;
    if (!fit) { for (const id of ["va-funksjon", "va-v", "va-a", "va-r2", "va-n"]) $(id).textContent = "–"; }
    else {
      const sgn = (x) => (x < 0 ? " − " : " + ") + Sim.tall(Math.abs(x), 4);
      $("va-funksjon").textContent = grad === 1 ? `${Sim.tall(fit.c1, 4)} · t${sgn(fit.c0)}` : `${Sim.tall(fit.c2, 4)} · t²${sgn(fit.c1)} · t${sgn(fit.c0)}`;
      $("va-v").textContent = grad === 1 ? Sim.tall(fit.c1, 3) + " m/s" : `${Sim.tall(fit.v(pkt[0][0]), 3)} → ${Sim.tall(fit.v(pkt[pkt.length - 1][0]), 3)} m/s`;
      $("va-a").textContent = grad === 1 ? "0 (rett linje)" : Sim.tall(fit.a, 3) + " m/s²";
      $("va-r2").textContent = komma(fit.r2, 5);
      $("va-n").textContent = String(pkt.length);
    }
    $("va-knapper").innerHTML = fit ? mål.map(([id, navn, hva]) => `<button class="knapp lys liten" type="button" data-til="${id}" data-hva="${hva}" data-navn="${navn}">${navn}</button>`).join(" ") : "";
    tegn();
  }

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f;
    l.tom();
    if (!tab.rader.length) { c.fillStyle = f.dempet; c.font = "13px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("Lim inn data eller trykk på «Last inn eksempeldata».", l.b / 2, l.h / 2); return; }
    const k = Number($("va-kolonne").value || 1), visV = $("va-fart").checked;
    let pkt = tab.rader.map((r) => [r[0], r[k]]);
    if (visV) pkt = pkt.slice(1, -1).map((p, i) => [p[0], (tab.rader[i + 2][k] - tab.rader[i][k]) / (tab.rader[i + 2][0] - tab.rader[i][0])]);
    const ts = pkt.map((p) => p[0]), ys = pkt.map((p) => p[1]);
    let y0 = Math.min(...ys), y1 = Math.max(...ys); const pad = (y1 - y0 || 1) * 0.1; y0 -= pad; y1 += pad;
    const { px, py } = Sim.akser(l, { x: [Math.min(...ts), Math.max(...ts)], y: [y0, y1], xTekst: "t / s", yTekst: visV ? "v / (m/s), regnet ut fra nabopunktene" : tab.kolonner[k] });
    const fra = tall($("va-fra").value) ?? -Infinity, til = tall($("va-til").value) ?? Infinity;
    c.fillStyle = f.flate; c.globalAlpha = 0.7; c.fillRect(px(Math.max(fra, ts[0])), 14, px(Math.min(til, ts[ts.length - 1])) - px(Math.max(fra, ts[0])), l.h - 44); c.globalAlpha = 1;
    for (const [t, y] of pkt) { const inne = t >= fra - 1e-9 && t <= til + 1e-9; c.fillStyle = inne ? f.f1 : f.dempet; c.beginPath(); c.arc(px(t), py(y), inne ? 3.5 : 2.5, 0, 2 * Math.PI); c.fill(); }
    if (fit) {
      c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath();
      const a = Math.max(fra, ts[0]), b = Math.min(til, ts[ts.length - 1]);
      for (let i = 0; i <= 100; i++) { const t = a + (b - a) * i / 100, y = visV ? fit.v(t) : fit.f(t); i ? c.lineTo(px(t), py(y)) : c.moveTo(px(t), py(y)); }
      c.stroke();
    }
  }

  rot.addEventListener("click", (e) => {
    const b = e.target.closest("[data-til]");
    if (!b || !fit) return;
    const felt = document.getElementById(b.dataset.til);
    if (!felt) return;
    const verdi = b.dataset.hva === "a" ? fit.a : fit.c1;
    felt.value = komma(verdi, 3);
    felt.dispatchEvent(new Event("input", { bubbles: true }));
    b.textContent = "Satt inn!"; setTimeout(() => { b.innerHTML = b.dataset.navn; }, 900);
  });
  $("va-data").addEventListener("input", lesInn);
  for (const id of ["va-kolonne", "va-modell", "va-fra", "va-til"]) $(id).addEventListener("input", analyser);
  $("va-fart").addEventListener("input", tegn);
  const eks = $("va-eksempel");
  if (eks) eks.addEventListener("click", () => {
    const valg = Sim.verdi("va-eksempel-valg");
    const [navn, n] = valg.split(":");
    $("va-data").value = somTekst(eksempelData(navn, { n: Number(n) || 1 }, 7 + (Number(n) || 0)));
    $("va-fra").value = ""; $("va-til").value = "";
    lesInn();
  });
  // Den virtuelle videoen kan sende data hit
  window.addEventListener("videodata", (e) => { $("va-data").value = e.detail; $("va-fra").value = ""; $("va-til").value = ""; lesInn(); rot.scrollIntoView({ behavior: "smooth", block: "start" }); });
  lesInn();
})();

// Virtuell video: Klikk på objektet i hvert bilde
(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("vv");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let sc, bilde = 0, merker = {}, aktiv = "A";

  function nytt() {
    const [navn, n] = Sim.verdi("vv-scenario").split(":");
    sc = scenario(navn, { n: Number(n) || 1 });
    bilde = 0; merker = {}; aktiv = "A";
    $("rad-vv-objekt").hidden = sc.objekter.length < 2;
    $("vv-objekt").value = "A";
    oppdater();
  }
  const antall = () => Math.floor(sc.T * sc.fps + 1e-9) + 1;
  const skala = () => Math.min((l.b - 40) / sc.bredde, (l.h - 40) / sc.hoyde);
  const tilSkjerm = (x, y) => { const s = skala(), ox = (l.b - sc.bredde * s) / 2, oy = l.h - 20; return [ox + x * s, oy - y * s]; };
  const fraSkjerm = (X, Y) => { const s = skala(), ox = (l.b - sc.bredde * s) / 2, oy = l.h - 20; return [(X - ox) / s, (oy - Y) / s]; };

  function tegn() {
    if (!l.b || !sc) return;
    const c = l.ctx, f = l.f, s = skala(), t = bilde / sc.fps;
    l.tom();
    c.fillStyle = f.flate; const [gx, gy] = tilSkjerm(0, 0); c.fillRect(gx, gy, sc.bredde * s, 20);
    // Underlag og linjal
    c.strokeStyle = f.blekk; c.lineWidth = 2;
    if (sc.vinkel) { const [x0, y0] = tilSkjerm(0.15, 0.05 + 1.9 * Math.sin(sc.vinkel)), [x1, y1] = tilSkjerm(0.15 + 1.9 * Math.cos(sc.vinkel), 0.05); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    else { c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + sc.bredde * s, gy); c.stroke(); }
    c.fillStyle = f.dempet; c.font = "10px " + Sim.MONO; c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1;
    if (sc.linjal === "loddrett" || sc.linjal === "begge") { const [lx] = tilSkjerm(0.08, 0); for (let y = 0; y <= sc.hoyde + 1e-9; y += 0.1) { const [, ly] = tilSkjerm(0, y); const hel = Math.abs(y * 2 - Math.round(y * 2)) < 1e-6; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + (hel ? 12 : 6), ly); c.stroke(); if (hel) { c.textAlign = "right"; c.textBaseline = "middle"; c.fillText(komma(y, 1), lx - 3, ly); } } }
    if (sc.linjal !== "loddrett") { for (let x = 0; x <= sc.bredde + 1e-9; x += 0.1) { const [lx, ly] = tilSkjerm(x, 0); const hel = Math.abs(x * 2 - Math.round(x * 2)) < 1e-6; c.beginPath(); c.moveTo(lx, ly + 2); c.lineTo(lx, ly + (hel ? 10 : 6)); c.stroke(); if (hel) { c.textAlign = "center"; c.textBaseline = "top"; c.fillText(komma(x, 1), lx, ly + 10); } } }
    // Objektene
    for (const o of sc.objekter) {
      const p = o.pos(t), [X, Y] = tilSkjerm(p.x, p.y), r = Math.max(5, o.r * s);
      c.fillStyle = f[o.farge || "f2"];
      if (o.form === "ball") { c.beginPath(); c.arc(X, Y, r, 0, 2 * Math.PI); c.fill(); }
      else if (o.form === "muffins") { c.beginPath(); c.moveTo(X - r, Y - r * 0.6); c.lineTo(X + r, Y - r * 0.6); c.lineTo(X + r * 0.65, Y + r * 0.5); c.lineTo(X - r * 0.65, Y + r * 0.5); c.closePath(); c.fill(); }
      else if (o.form === "vogn" || o.form === "kloss") {
        c.save(); c.translate(X, Y); if (sc.vinkel) c.rotate(sc.vinkel);
        c.fillRect(-r, -r * (o.form === "kloss" ? 1.2 : 0.7), 2 * r, r * (o.form === "kloss" ? 1.2 : 0.7));
        if (o.form === "vogn") { c.fillStyle = f.blekk; for (const k of [-0.6, 0.6]) { c.beginPath(); c.arc(k * r, 2, 3.5, 0, 2 * Math.PI); c.fill(); } }
        c.fillStyle = f.papir; c.beginPath(); c.arc(0, -r * 0.35, 2.5, 0, 2 * Math.PI); c.fill();
        c.restore();
      }
      if (sc.objekter.length > 1) { c.fillStyle = f.blekk; c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "bottom"; c.fillText(o.id, X, Y - r - 6); }
    }
    // Merkene som er satt
    for (const id of Object.keys(merker)) for (const [b, [x, y]] of Object.entries(merker[id])) {
      const [X, Y] = tilSkjerm(x, y); c.strokeStyle = Number(b) === bilde ? f.blekk : f.f1; c.globalAlpha = Number(b) === bilde ? 1 : 0.5; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(X - 5, Y - 5); c.lineTo(X + 5, Y + 5); c.moveTo(X + 5, Y - 5); c.lineTo(X - 5, Y + 5); c.stroke(); c.globalAlpha = 1;
    }
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText(`bilde ${bilde + 1} av ${antall()}   t = ${komma(t, 3)} s`, l.b - 8, 6);
  }

  function data() {
    const rader = [];
    for (let b = 0; b < antall(); b++) {
      const rad = [b / sc.fps];
      let ok = true;
      for (const o of sc.objekter) {
        const m = merker[o.id] && merker[o.id][b];
        if (!m) { ok = false; break; }
        // Målestørrelsen: y oppover, x langs gulvet, eller s langs skråplanet
        if (sc.linjal === "begge") rad.push(m[0] - sc.x0, m[1]);
        else if (sc.linjal === "loddrett") rad.push(m[1]);
        else if (sc.linjal === "langs") rad.push((m[0] - 0.15) * Math.cos(sc.vinkel) - (m[1] - 0.05 - 1.9 * Math.sin(sc.vinkel)) * Math.sin(sc.vinkel));
        else rad.push(sc.objekter.length > 1 ? m[0] : m[0] - (sc.navn.startsWith("Ball") ? 0.2 : 0.15));
      }
      if (ok) rader.push(rad);
    }
    return { kolonner: sc.kolonner, rader };
  }

  function oppdater() {
    $("vv-bilde").max = antall() - 1; $("vv-bilde").value = bilde;
    const d = data();
    $("vv-antall").textContent = `${d.rader.length} punkter`;
    $("vv-send").disabled = d.rader.length < 4;
    tegn();
  }

  el.addEventListener("pointerdown", (e) => {
    const r = el.getBoundingClientRect(), [x, y] = fraSkjerm(e.clientX - r.left, e.clientY - r.top);
    const id = sc.objekter.length > 1 ? $("vv-objekt").value : "A";
    (merker[id] = merker[id] || {})[bilde] = [x, y];
    bilde = Math.min(antall() - 1, bilde + Number($("vv-hopp").value));
    oppdater();
  });
  $("vv-scenario").addEventListener("input", nytt);
  $("vv-bilde").addEventListener("input", () => { bilde = Number($("vv-bilde").value); oppdater(); });
  $("vv-forrige").addEventListener("click", () => { bilde = Math.max(0, bilde - 1); oppdater(); });
  $("vv-neste").addEventListener("click", () => { bilde = Math.min(antall() - 1, bilde + 1); oppdater(); });
  $("vv-start").addEventListener("click", () => { bilde = 0; oppdater(); });
  $("vv-objekt").addEventListener("input", () => { bilde = 0; oppdater(); });
  $("vv-slett").addEventListener("click", () => { merker = {}; bilde = 0; oppdater(); });
  $("vv-send").addEventListener("click", () => window.dispatchEvent(new CustomEvent("videodata", { detail: somTekst(data()) })));
  nytt();
})();

// Resultattabeller for de enkelte oppleggene. Hver blokk kjører bare når elementene finnes.
(function () {
  const $ = Sim.$, komma = Sim.komma;
  const tall = (id) => { const el = $(id); if (!el) return null; const v = parseFloat(String(el.value).replace(",", ".").replace("−", "-")); return isFinite(v) ? v : null; };
  const vis = (id, tekst) => { const el = $(id); if (el) el.textContent = tekst; };

  // Fritt fall: g fra akselerasjonen
  if ($("fall-a")) {
    const f = () => { const a = tall("fall-a"); vis("fall-g", a === null ? "–" : komma(Math.abs(a), 2) + " m/s²"); vis("fall-avvik", a === null ? "–" : komma((Math.abs(a) / G - 1) * 100, 1) + " %"); };
    $("fall-a").addEventListener("input", f); f();
  }
  // Skrått kast: fart og vinkel ut fra vx (rett linje i x) og vy0 og ay (andregradsfunksjon i y)
  if ($("kast-vx")) {
    const f = () => {
      const vx = tall("kast-vx"), vy = tall("kast-vy"), ay = tall("kast-ay");
      const ok = vx !== null && vy !== null;
      vis("kast-v0", ok ? komma(Math.hypot(vx, vy), 2) + " m/s" : "–");
      vis("kast-vinkel", ok ? komma(Math.atan2(vy, vx) * 180 / Math.PI, 1) + "°" : "–");
      vis("kast-g", ay === null ? "–" : komma(Math.abs(ay), 2) + " m/s² (avvik " + komma((Math.abs(ay) / G - 1) * 100, 1) + " %)");
    };
    for (const id of ["kast-vx", "kast-vy", "kast-ay"]) $(id).addEventListener("input", f); f();
  }
  // Rulling: sammenlign med g sin θ, og rullefriksjon langs gulvet
  if ($("rull-a")) {
    const f = () => {
      const a = tall("rull-a"), th = tall("rull-vinkel"), ag = tall("gulv-a");
      const gs = th === null ? null : G * Math.sin(th * Math.PI / 180);
      vis("rull-gs", gs === null ? "–" : komma(gs, 3) + " m/s²");
      vis("rull-frik", gs === null || a === null ? "–" : komma(gs - Math.abs(a), 3) + " m/s²");
      vis("gulv-mu", ag === null ? "–" : komma(Math.abs(ag) / G, 3));
    };
    for (const id of ["rull-a", "rull-vinkel", "gulv-a"]) $(id).addEventListener("input", f); f();
  }
  // Muffinsformer: k = mg / vt² for hver rad, og tilpasning av vt² mot m
  if ($("muf-rader")) {
    const l = Sim.lerret($("muf-graf"), tegn);
    function rader() { return [1, 2, 3, 4].map((n) => ({ n, m: tall("muf-m" + n), vt: tall("muf-v" + n) })); }
    function regn() {
      let sxy = 0, sxx = 0;
      for (const r of rader()) {
        const ok = r.m !== null && r.vt !== null && r.vt !== 0;
        vis("muf-k" + r.n, ok ? Sim.tall(r.m / 1000 * G / (r.vt * r.vt), 3) : "");
        if (ok) { sxy += (r.m / 1000) * r.vt * r.vt; sxx += (r.m / 1000) ** 2; }
      }
      const stig = sxx > 0 ? sxy / sxx : null;   // vt² = (g/k) m
      vis("muf-kfit", stig ? Sim.tall(G / stig, 3) + " kg/m" : "–");
      tegn();
    }
    function tegn() {
      if (!l.b) return;
      const c = l.ctx, f = l.f; l.tom();
      const p = rader().filter((r) => r.m !== null && r.vt !== null).map((r) => [r.m, Math.abs(r.vt) ** 2]);
      const { px, py } = Sim.akser(l, { x: [0, Math.max(2, ...p.map((q) => q[0])) * 1.1], y: [0, Math.max(1, ...p.map((q) => q[1])) * 1.15], xTekst: "m / g", yTekst: "vₜ² / (m²/s²)" });
      let sxy = 0, sxx = 0; for (const [m, v2] of p) { sxy += m * v2; sxx += m * m; }
      if (sxx > 0) { const s = sxy / sxx, xm = Math.max(2, ...p.map((q) => q[0])) * 1.1; c.strokeStyle = f.blekk; c.setLineDash([6, 4]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(xm), py(s * xm)); c.stroke(); c.setLineDash([]); }
      c.fillStyle = f.f1; for (const [m, v2] of p) { c.beginPath(); c.arc(px(m), py(v2), 5, 0, 2 * Math.PI); c.fill(); }
    }
    $("muf-rader").addEventListener("input", regn);
    const eks = $("muf-eksempel");
    if (eks) eks.addEventListener("click", () => { [[0.4, 1.10], [0.8, 1.55], [1.2, 1.90], [1.6, 2.20]].forEach(([m, v], i) => { $("muf-m" + (i + 1)).value = komma(m, 1); $("muf-v" + (i + 1)).value = komma(v, 2); }); regn(); });
    regn();
  }
  // Friksjon med kraftsensor: μs og μk for hver rad, og tilpasning av F mot N
  if ($("fr-rader")) {
    const l = Sim.lerret($("fr-graf"), tegn);
    const rader = () => [1, 2, 3, 4, 5].map((i) => ({ i, m: tall("fr-m" + i), Fs: tall("fr-s" + i), Fk: tall("fr-k" + i) }));
    const stig = (p) => { let sxy = 0, sxx = 0; for (const [x, y] of p) { sxy += x * y; sxx += x * x; } return sxx > 0 ? sxy / sxx : null; };
    function regn() {
      for (const r of rader()) {
        const N = r.m === null ? null : r.m * G;
        vis("fr-n" + r.i, N === null ? "" : komma(N, 2));
        vis("fr-mus" + r.i, N && r.Fs !== null ? komma(r.Fs / N, 2) : "");
        vis("fr-muk" + r.i, N && r.Fk !== null ? komma(r.Fk / N, 2) : "");
      }
      const ms = stig(rader().filter((r) => r.m !== null && r.Fs !== null).map((r) => [r.m * G, r.Fs]));
      const mk = stig(rader().filter((r) => r.m !== null && r.Fk !== null).map((r) => [r.m * G, r.Fk]));
      vis("fr-mus", ms === null ? "–" : komma(ms, 3)); vis("fr-muk", mk === null ? "–" : komma(mk, 3));
      tegn();
    }
    function tegn() {
      if (!l.b) return;
      const c = l.ctx, f = l.f; l.tom();
      const r = rader().filter((x) => x.m !== null);
      const xm = Math.max(5, ...r.map((x) => x.m * G)) * 1.1, ym = Math.max(2, ...r.map((x) => Math.max(x.Fs || 0, x.Fk || 0))) * 1.15;
      const { px, py } = Sim.akser(l, { x: [0, xm], y: [0, ym], xTekst: "N / N", yTekst: "friksjon / N" });
      for (const [nøkkel, farge] of [["Fs", f.f1], ["Fk", f.f2]]) {
        const p = r.filter((x) => x[nøkkel] !== null).map((x) => [x.m * G, x[nøkkel]]), s = stig(p);
        if (s !== null) { c.strokeStyle = farge; c.setLineDash([6, 4]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(xm), py(s * xm)); c.stroke(); c.setLineDash([]); }
        c.fillStyle = farge; for (const [x, y] of p) { c.beginPath(); c.arc(px(x), py(y), 5, 0, 2 * Math.PI); c.fill(); }
      }
    }
    $("fr-rader").addEventListener("input", regn);
    const eks = $("fr-eksempel");
    if (eks) eks.addEventListener("click", () => { [[0.25, 1.30, 0.80], [0.45, 2.35, 1.40], [0.65, 3.30, 2.05], [0.85, 4.40, 2.60], [1.05, 5.30, 3.20]].forEach(([m, s, k], i) => { $("fr-m" + (i + 1)).value = komma(m, 2); $("fr-s" + (i + 1)).value = komma(s, 2); $("fr-k" + (i + 1)).value = komma(k, 2); }); regn(); });
    // Fra videoanalyse: μk = |a|/g
    if ($("fr-a")) { const f = () => { const a = tall("fr-a"); vis("fr-mu-video", a === null ? "–" : komma(Math.abs(a) / G, 3)); }; $("fr-a").addEventListener("input", f); f(); }
    regn();
  }
  // Støt i én dimensjon: bevegelsesmengde og kinetisk energi før og etter
  if ($("st-mA")) {
    const f = () => {
      const [mA, mB, vA, vB, uA, uB] = ["st-mA", "st-mB", "st-vA", "st-vB", "st-uA", "st-uB"].map(tall);
      if ([mA, mB, vA, vB, uA, uB].some((x) => x === null)) { for (const id of ["st-pf", "st-pe", "st-pr", "st-ef", "st-ee", "st-er"]) vis(id, "–"); return; }
      const pf = mA * vA + mB * vB, pe = mA * uA + mB * uB, ef = 0.5 * mA * vA ** 2 + 0.5 * mB * vB ** 2, ee = 0.5 * mA * uA ** 2 + 0.5 * mB * uB ** 2;
      vis("st-pf", komma(pf, 3) + " kg m/s"); vis("st-pe", komma(pe, 3) + " kg m/s"); vis("st-pr", Math.abs(pf) > 1e-9 ? komma(pe / pf * 100, 1) + " %" : "–");
      vis("st-ef", komma(ef * 1000, 1) + " mJ"); vis("st-ee", komma(ee * 1000, 1) + " mJ"); vis("st-er", ef > 1e-12 ? komma(ee / ef * 100, 1) + " %" : "–");
    };
    for (const id of ["st-mA", "st-mB", "st-vA", "st-vB", "st-uA", "st-uB"]) $(id).addEventListener("input", f);
    f();
  }
  // Kraftsensor: kalibrering med lodd, g fra stigningstallet
  if ($("ks-rader")) {
    const l = Sim.lerret($("ks-graf"), tegn);
    const rader = () => [1, 2, 3, 4, 5].map((i) => ({ m: tall("ks-m" + i), F: tall("ks-f" + i) })).filter((r) => r.m !== null && r.F !== null);
    function regn() { let sxy = 0, sxx = 0; for (const r of rader()) { sxy += r.m * r.F; sxx += r.m * r.m; } vis("ks-g", sxx > 0 ? komma(sxy / sxx, 2) + " N/kg" : "–"); tegn(); }
    function tegn() {
      if (!l.b) return;
      const c = l.ctx, f = l.f; l.tom();
      const p = rader(), xm = Math.max(0.5, ...p.map((r) => r.m)) * 1.1, ym = Math.max(5, ...p.map((r) => r.F)) * 1.15;
      const { px, py } = Sim.akser(l, { x: [0, xm], y: [0, ym], xTekst: "m / kg", yTekst: "F / N" });
      let sxy = 0, sxx = 0; for (const r of p) { sxy += r.m * r.F; sxx += r.m * r.m; }
      if (sxx > 0) { c.strokeStyle = f.blekk; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(xm), py(sxy / sxx * xm)); c.stroke(); c.setLineDash([]); }
      c.fillStyle = f.f1; for (const r of p) { c.beginPath(); c.arc(px(r.m), py(r.F), 5, 0, 2 * Math.PI); c.fill(); }
    }
    $("ks-rader").addEventListener("input", regn);
    regn();
  }
  // Newtons 2. lov: kraft mot akselerasjon for en vogn, massen fra stigningstallet
  if ($("n2-rader")) {
    const l = Sim.lerret($("n2-graf"), tegn);
    const rader = () => [1, 2, 3, 4, 5].map((i) => ({ a: tall("n2-a" + i), F: tall("n2-f" + i) })).filter((r) => r.a !== null && r.F !== null);
    function regn() { let sxy = 0, sxx = 0; for (const r of rader()) { sxy += r.a * r.F; sxx += r.a * r.a; } vis("n2-m", sxx > 0 ? komma(sxy / sxx, 3) + " kg" : "–"); tegn(); }
    function tegn() {
      if (!l.b) return;
      const c = l.ctx, f = l.f; l.tom();
      const p = rader(), xm = Math.max(1, ...p.map((r) => r.a)) * 1.1, ym = Math.max(1, ...p.map((r) => r.F)) * 1.15;
      const { px, py } = Sim.akser(l, { x: [0, xm], y: [0, ym], xTekst: "a / (m/s²)", yTekst: "F / N" });
      let sxy = 0, sxx = 0; for (const r of p) { sxy += r.a * r.F; sxx += r.a * r.a; }
      if (sxx > 0) { c.strokeStyle = f.blekk; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(xm), py(sxy / sxx * xm)); c.stroke(); c.setLineDash([]); }
      c.fillStyle = f.f2; for (const r of p) { c.beginPath(); c.arc(px(r.a), py(r.F), 5, 0, 2 * Math.PI); c.fill(); }
    }
    $("n2-rader").addEventListener("input", regn);
    regn();
  }
})();
