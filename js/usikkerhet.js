// Måleusikkerhet: Elevene måler svingetiden til en pendel med stoppeklokke.
// Hvert trykk på klokka har en tilfeldig feil (reaksjonstid som varierer). Valgfritt: en systematisk feil.
// Svingetiden er T = 2π√(L/g) for en pendel med små utslag.

const L_PENDEL = 0.80, G = 9.81;
const T_SANN = 2 * Math.PI * Math.sqrt(L_PENDEL / G);

function normal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Én måling: tiden for n perioder delt på n
function maal(n, sigma, systematisk) {
  const start = sigma * normal(), stopp = sigma * normal();
  return (n * T_SANN + stopp - start + systematisk) / n;
}

function statistikk(verdier) {
  const n = verdier.length;
  if (!n) return null;
  const snitt = verdier.reduce((a, b) => a + b, 0) / n;
  const maks = Math.max(...verdier), min = Math.min(...verdier);
  const avvik = Math.max(maks - snitt, snitt - min);
  const s = n > 1 ? Math.sqrt(verdier.reduce((a, x) => a + (x - snitt) ** 2, 0) / (n - 1)) : NaN;
  return { n, snitt, maks, min, avvik, s, sm: s / Math.sqrt(n) };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("maalinger");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let verdier = [], vinkel0 = performance.now();

  const innst = () => ({
    n: Number(Sim.verdi("perioder")),
    sigma: Number(Sim.verdi("reaksjon")),
    sys: $("systematisk").checked ? 0.15 : 0,
  });

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    // Pendelen til venstre
    const pb = smal ? 0 : l.b * 0.22;
    if (!smal) {
      const t = (performance.now() - vinkel0) / 1000, th = 0.25 * Math.cos(2 * Math.PI * t / T_SANN);
      const ox = pb / 2, oy = 20, L = l.h - 70;
      c.strokeStyle = f.blekk; c.lineWidth = 3; c.beginPath(); c.moveTo(ox - 30, oy); c.lineTo(ox + 30, oy); c.stroke();
      c.lineWidth = 1.5; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + L * Math.sin(th), oy + L * Math.cos(th)); c.stroke();
      c.fillStyle = f.f1; c.beginPath(); c.arc(ox + L * Math.sin(th), oy + L * Math.cos(th), 10, 0, 2 * Math.PI); c.fill();
      c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "bottom";
      c.fillText("L = 0,80 m", ox, l.h - 6);
    }
    // Prikkdiagram over målingene
    const st = statistikk(verdier);
    const midt = st ? st.snitt : T_SANN;
    const spenn = Math.max(0.06, st && st.n > 1 ? Math.max(st.maks - st.min, 4 * st.s) * 0.7 : 0.1, Math.abs(midt - T_SANN) + 0.03);
    const x0 = midt - spenn, x1 = midt + spenn;
    const venstre = pb + (smal ? 10 : 30), høyre = 14, bunn = l.h - 34;
    const X = (x) => venstre + (x - x0) / (x1 - x0) * (l.b - venstre - høyre);
    c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.beginPath(); c.moveTo(venstre, bunn); c.lineTo(l.b - høyre, bunn); c.stroke();
    const steg = Sim.steglengde(x1 - x0, smal ? 3 : 5), des = Math.max(0, -Math.floor(Math.log10(steg) + 1e-9));
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
    for (let v = Math.ceil(x0 / steg) * steg; v <= x1 + 1e-9; v += steg) {
      c.beginPath(); c.moveTo(X(v), bunn); c.lineTo(X(v), bunn + 5); c.stroke();
      c.fillText(komma(v, des), X(v), bunn + 7);
    }
    c.textAlign = "right"; c.textBaseline = "bottom"; c.fillText("T / s", l.b - høyre, bunn - 4);
    if (st && st.n > 1) {
      c.fillStyle = f.flate; c.globalAlpha = 0.9; c.fillRect(X(st.snitt - st.s), 10, X(st.snitt + st.s) - X(st.snitt - st.s), bunn - 10); c.globalAlpha = 1;
    }
    // Stable prikkene i små bøtter
    const bøtte = (x1 - x0) / 60, teller = new Map(), r = smal ? 3.5 : 4.5;
    c.fillStyle = f.f2;
    for (const v of verdier) {
      const k = Math.round(v / bøtte), h = teller.get(k) || 0;
      teller.set(k, h + 1);
      const y = bunn - r - 2 - h * (2 * r + 1);
      if (y > 8) { c.beginPath(); c.arc(X(k * bøtte), y, r, 0, 2 * Math.PI); c.fill(); }
    }
    if (st) {
      c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(X(st.snitt), 8); c.lineTo(X(st.snitt), bunn); c.stroke();
      c.fillStyle = f.blekk; c.textAlign = "left"; c.textBaseline = "top"; c.fillText("middelverdi", X(st.snitt) + 4, 8);
    }
    if ($("vis-sann").checked) {
      c.strokeStyle = f.f1; c.setLineDash([5, 4]); c.lineWidth = 2; c.beginPath(); c.moveTo(X(T_SANN), 8); c.lineTo(X(T_SANN), bunn); c.stroke(); c.setLineDash([]);
      c.fillStyle = f.f1; c.textAlign = "right"; c.textBaseline = "top"; c.fillText("sann verdi", X(T_SANN) - 4, 22);
    }
  }

  function oppdater() {
    const st = statistikk(verdier);
    const d = (x, n = 3) => (st && isFinite(x) ? komma(x, n) + " s" : "–");
    $("r-n").textContent = st ? String(st.n) : "0";
    $("r-snitt").textContent = d(st?.snitt);
    $("r-avvik").textContent = d(st?.avvik);
    $("r-s").textContent = d(st?.s);
    $("r-sm").textContent = d(st?.sm, 4);
    $("r-rel").textContent = st && st.n > 1 ? komma(st.sm / st.snitt * 100, 2) + " %" : "–";
    $("r-sann").textContent = $("vis-sann").checked ? komma(T_SANN, 4) + " s" : "skjult";
    $("siste").textContent = verdier.length ? verdier.slice(-8).map((v) => komma(v, 3)).join("  ") : "Ingen målinger ennå.";
    tegn();
  }

  $("maal-en").addEventListener("click", () => { const o = innst(); verdier.push(maal(o.n, o.sigma, o.sys)); oppdater(); });
  $("maal-ti").addEventListener("click", () => { const o = innst(); for (let k = 0; k < 10; k++) verdier.push(maal(o.n, o.sigma, o.sys)); oppdater(); });
  $("nullstill").addEventListener("click", () => { verdier = []; oppdater(); });
  for (const id of ["perioder", "reaksjon", "systematisk"]) $(id).addEventListener("input", () => { verdier = []; oppdater(); });
  $("vis-sann").addEventListener("input", oppdater);
  // Pendelen svinger hele tiden når lerretet er synlig
  let synlig = true;
  new IntersectionObserver(([e]) => { synlig = e.isIntersecting; }).observe(el);
  (function løkke() { if (synlig) tegn(); requestAnimationFrame(løkke); })();
  oppdater();
})();
