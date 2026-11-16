// Elektrostatisk ping-pong: En lett, ledende kule spretter mellom to ladde plater.
// Når kula berører en plate, får den ladning med samme fortegn som plata og blir skjøvet over til den andre.
// Ladningen en ledende kule får når den berører en plan elektrode i et homogent felt, er
// q = (2π³/3) ε₀ r² E (kjent resultat fra elektrostatikken). Vi ser bort fra tyngden og snora
// (kula henger i en lang, tynn tråd), luftmotstand og at kula bremses i støtet: Den starter i ro ved hver plate.

const EPS0 = 8.854e-12;

function pingpong(U, d, r, m) {
  const E = U / d, q = (2 * Math.PI ** 3 / 3) * EPS0 * r * r * E;
  const F = q * E, a = F / m, s = d - 2 * r;
  const T = a > 0 ? Math.sqrt(2 * s / a) : Infinity;   // tid for én tur over
  return { E, q, F, a, s, T, v: a * T, I: q / T };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("pingpong");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("pinggraf"), tegn);
  let inn, p, tid = 0;
  const TMAKS = 10;

  const tall = (x, enhet) => Sim.tall(x, 3) + " " + enhet;

  function les() {
    inn = {
      U: Sim.verdi("spenning", (v) => komma(v, 1) + " kV") * 1000,
      d: Sim.verdi("avstand", (v) => komma(v, 0) + " cm") / 100,
      r: Sim.verdi("radius", (v) => komma(v, 1) + " cm") / 100,
      m: Sim.verdi("masse", (v) => komma(v, 2) + " g") / 1000,
    };
    p = pingpong(inn.U, inn.d, inn.r, inn.m);
  }
  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(TMAKS, tid + dt * Number($("tempo").value)); oppdater(); return tid < TMAKS; }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  // Hvor mange turer er fullført, og hvor er kula nå (−s/2 ved venstre plate)
  function tilstand(t) {
    if (!isFinite(p.T)) return { n: 0, x: -p.s / 2, fortegn: 1, v: 0 };
    const n = Math.floor(t / p.T), tau = t - n * p.T, retning = n % 2 === 0 ? 1 : -1;
    const strekning = 0.5 * p.a * tau * tau;
    return { n, x: retning > 0 ? -p.s / 2 + strekning : p.s / 2 - strekning, fortegn: retning, v: p.a * tau };
  }

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const sk = Math.min((l.b - 80) / 0.14, (l.h - 40) / 0.12), mx = l.b / 2, topp = 14;
    const X = (x) => mx + x * sk, Y = (y) => topp + y * sk;
    const hP = 0.10;
    // Platene: venstre positiv, høyre negativ
    for (const side of [-1, 1]) {
      const x = X(side * inn.d / 2), pluss = side < 0;
      c.fillStyle = pluss ? f.f1 : f.f2; c.fillRect(x + (side < 0 ? -7 : 0), Y(0.01), 7, hP * sk);
      c.font = "700 14px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
      for (let k = 0; k < 5; k++) c.fillText(pluss ? "+" : "−", x + side * 16, Y(0.02 + k * 0.02));
    }
    const s = tilstand(tid), y = 0.06;
    // Tråden fra et punkt høyt oppe
    c.strokeStyle = f.dempet; c.lineWidth = 1;
    c.beginPath(); c.moveTo(X(0), 0); c.lineTo(X(s.x), Y(y)); c.stroke();
    c.fillStyle = inn.U === 0 ? f.dempet : s.fortegn > 0 ? f.f1 : f.f2;
    c.beginPath(); c.arc(X(s.x), Y(y), Math.max(4, inn.r * sk), 0, 2 * Math.PI); c.fill();
    if (inn.U > 0) {
      c.fillStyle = f.papir; c.font = "700 " + Math.round(Math.max(10, inn.r * sk)) + "px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(s.fortegn > 0 ? "+" : "−", X(s.x), Y(y) + 1);
    }
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s", l.b - 8, 6);
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const Qmaks = isFinite(p.T) ? p.q * Math.floor(TMAKS / p.T) : 0;
    const enhet = 1e-9;
    const { px, py } = Sim.akser(l, { x: [0, TMAKS], y: [0, Math.max(1e-9, Qmaks) / enhet * 1.1], xTekst: "t / s", yTekst: "Q / nC (ført over)" });
    if (!isFinite(p.T)) return;
    c.strokeStyle = f.f1; c.lineWidth = 2; c.beginPath(); c.moveTo(px(0), py(0));
    let Q = 0;
    for (let t = p.T; t <= tid + 1e-12; t += p.T) { c.lineTo(px(t), py(Q / enhet)); Q += p.q; c.lineTo(px(t), py(Q / enhet)); }
    c.lineTo(px(tid), py(Q / enhet)); c.stroke();
    // Middelstrømmen som rett linje
    c.strokeStyle = f.blekk; c.setLineDash([6, 4]); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(TMAKS), py(p.I * TMAKS / enhet)); c.stroke(); c.setLineDash([]);
  }

  function tegn() {
    if (!p) return;
    if (scene.b) tegnScene();
    if (graf.b) tegnGraf();
  }

  function oppdater() {
    const s = tilstand(tid);
    $("r-e").textContent = tall(p.E, "V/m");
    $("r-q").textContent = tall(p.q * 1e9, "nC");
    $("r-f").textContent = tall(p.F, "N");
    $("r-t").textContent = isFinite(p.T) ? tall(p.T, "s") : "–";
    $("r-n").textContent = String(s.n);
    $("r-qtot").textContent = tall(s.n * p.q * 1e9, "nC");
    $("r-i").textContent = isFinite(p.T) ? tall(p.I * 1e9, "nA") : "–";
    tegn();
  }

  for (const id of ["spenning", "avstand", "radius", "masse"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
