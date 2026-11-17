// Reaksjonslengde og bremselengde. Bilen kjører med konstant fart i reaksjonstiden og bremser så med
// konstant akselerasjon a = μg. Et hinder står i avstanden D foran bilen når sjåføren oppdager det.

const G = 9.81;
const FORE = { torr: { navn: "tørr asfalt", mu: 0.8 }, vat: { navn: "våt asfalt", mu: 0.5 }, sno: { navn: "snø", mu: 0.25 }, is: { navn: "is", mu: 0.1 } };

function bremsing(vKmh, tr, mu, D) {
  const v = vKmh / 3.6, a = mu * G;
  const sr = v * tr, sb = v * v / (2 * a), stopp = sr + sb;
  let vTreff = 0, tTreff = null;
  if (stopp > D) {
    if (D <= sr) { vTreff = v; tTreff = D / v; }
    else { vTreff = Math.sqrt(v * v - 2 * a * (D - sr)); tTreff = tr + (v - vTreff) / a; }
  }
  const tStopp = tr + v / a;
  const pos = (t) => (t <= tr ? v * t : t <= tStopp ? sr + v * (t - tr) - 0.5 * a * (t - tr) ** 2 : stopp);
  const fart = (t) => (t <= tr ? v : Math.max(0, v - a * (t - tr)));
  return { v, a, tr, sr, sb, stopp, vTreff, tTreff, tStopp, pos, fart };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("vei");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("bremsegraf"), tegn);
  let inn, b, tid = 0;

  function les() {
    inn = {
      v: Sim.verdi("fart", (v) => komma(v, 0) + " km/h"),
      tr: Sim.verdi("reaksjon", (v) => komma(v, 1) + " s"),
      fore: FORE[Sim.verdi("fore")],
      D: Sim.verdi("avstand", (v) => komma(v, 0) + " m"),
    };
    b = bremsing(inn.v, inn.tr, inn.fore.mu, inn.D);
  }
  const slutt = () => (b.tTreff !== null ? b.tTreff : b.tStopp);
  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(slutt(), tid + dt * Number($("tempo").value)); oppdater(); return tid < slutt(); }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const lengde = Math.max(inn.D, b.stopp) * 1.1 + 5, marg = 20, y = l.h * 0.55;
    const X = (x) => marg + 30 + x / lengde * (l.b - 2 * marg - 30);
    c.fillStyle = f.flate; c.fillRect(0, y - 26, l.b, 40);
    c.strokeStyle = f.dempet; c.setLineDash([14, 12]); c.lineWidth = 2; c.beginPath(); c.moveTo(0, y - 6); c.lineTo(l.b, y - 6); c.stroke(); c.setLineDash([]);
    // Reaksjons- og bremsestrekning som farget stripe
    c.globalAlpha = 0.85;
    c.fillStyle = f.f1; c.fillRect(X(0), y + 20, X(b.sr) - X(0), 8);
    c.fillStyle = f.f2; c.fillRect(X(b.sr), y + 20, X(b.stopp) - X(b.sr), 8);
    c.globalAlpha = 1;
    c.font = "11px " + Sim.MONO; c.textBaseline = "top"; c.textAlign = "center";
    c.fillStyle = f.f1; if (X(b.sr) - X(0) > 60) c.fillText("reaksjon " + komma(b.sr, 1) + " m", (X(0) + X(b.sr)) / 2, y + 32);
    c.fillStyle = f.f2; if (X(b.stopp) - X(b.sr) > 60) c.fillText("brems " + komma(b.sb, 1) + " m", (X(b.sr) + X(b.stopp)) / 2, y + 32);
    // Hinderet
    c.fillStyle = f.blekk; c.fillRect(X(inn.D) - 2, y - 40, 4, 34);
    c.beginPath(); c.arc(X(inn.D), y - 46, 6, 0, 2 * Math.PI); c.fill();
    c.textAlign = "center"; c.textBaseline = "bottom"; c.fillStyle = f.dempet; c.fillText(komma(inn.D, 0) + " m", X(inn.D), y - 54);
    // Bilen (fronten er posisjonen)
    const xb = X(b.pos(tid));
    c.fillStyle = tid >= b.tr ? f.f2 : f.f1;
    c.beginPath(); c.roundRect(xb - 34, y - 24, 34, 16, 4); c.fill();
    c.fillStyle = f.blekk; for (const k of [-27, -8]) { c.beginPath(); c.arc(xb + k, y - 7, 4, 0, 2 * Math.PI); c.fill(); }
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s   v = " + komma(b.fart(tid) * 3.6, 0) + " km/h", l.b - 8, 6);
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const { px, py } = Sim.akser(l, { x: [0, b.tStopp * 1.05], y: [0, b.v * 3.6 * 1.1], xTekst: "t / s", yTekst: "v / (km/h)" });
    c.fillStyle = f.f1; c.globalAlpha = 0.2; c.beginPath(); c.moveTo(px(0), py(0));
    for (let i = 0; i <= 200; i++) { const t = Math.min(tid, b.tr) * i / 200; c.lineTo(px(t), py(b.fart(t) * 3.6)); }
    c.lineTo(px(Math.min(tid, b.tr)), py(0)); c.fill();
    if (tid > b.tr) {
      c.fillStyle = f.f2; c.globalAlpha = 0.2; c.beginPath(); c.moveTo(px(b.tr), py(0));
      for (let i = 0; i <= 200; i++) { const t = b.tr + (tid - b.tr) * i / 200; c.lineTo(px(t), py(b.fart(t) * 3.6)); }
      c.lineTo(px(tid), py(0)); c.fill();
    }
    c.globalAlpha = 1;
    c.strokeStyle = f.blekk; c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i <= 300; i++) { const t = tid * i / 300; i ? c.lineTo(px(t), py(b.fart(t) * 3.6)) : c.moveTo(px(t), py(b.fart(t) * 3.6)); }
    c.stroke();
  }

  function tegn() { if (!b) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    $("r-v").textContent = komma(b.v, 2) + " m/s";
    $("r-a").textContent = komma(b.a, 2) + " m/s²";
    $("r-sr").textContent = komma(b.sr, 1) + " m";
    $("r-sb").textContent = komma(b.sb, 1) + " m";
    $("r-stopp").textContent = komma(b.stopp, 1) + " m";
    const ferdig = tid >= slutt();
    $("r-utfall").textContent = !ferdig ? "?" : b.tTreff === null ? `stopper ${komma(inn.D - b.stopp, 1)} m før hinderet` : `treffer hinderet med ${komma(b.vTreff * 3.6, 0)} km/h`;
    tegn();
  }

  for (const id of ["fart", "reaksjon", "fore", "avstand"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
