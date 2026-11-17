// Fritt fall og loddrett kast uten luftmotstand. Ballen starter i høyden h0 med farten v0 (positiv opp).
// Stroboskopbilde med en tabell over posisjonene, og grafer for å teste Galileos hypoteser v ∝ t og v ∝ s.

const KLODER = { jorda: { navn: "Jorda", g: 9.81 }, manen: { navn: "Månen", g: 1.62 }, mars: { navn: "Mars", g: 3.71 } };

function fall(h0, v0, g) {
  const tLand = (v0 + Math.sqrt(v0 * v0 + 2 * g * h0)) / g;
  const tTopp = Math.max(0, v0 / g);
  const hMaks = h0 + (v0 > 0 ? v0 * v0 / (2 * g) : 0);
  const y = (t) => h0 + v0 * t - 0.5 * g * t * t, v = (t) => v0 - g * t;
  // Tilbakelagt strekning ved tiden t
  const s = (t) => (t <= tTopp ? v0 * t - 0.5 * g * t * t : (v0 > 0 ? hMaks - h0 : 0) + (v0 > 0 ? 0.5 * g * (t - tTopp) ** 2 : -(v0 * t - 0.5 * g * t * t)));
  return { tLand, tTopp, hMaks, y, v, s, vLand: v0 - g * tLand };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("strobe");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("fallgraf"), tegn);
  let inn, b, tid = 0;

  function les() {
    inn = {
      k: KLODER[Sim.verdi("klode")],
      h0: Sim.verdi("hoyde", (v) => komma(v, 0) + " m"),
      v0: Sim.verdi("fart", (v) => (v > 0 ? "+" : "") + komma(v, 0) + " m/s"),
      dt: Number(Sim.verdi("intervall")),
    };
    b = fall(inn.h0, inn.v0, inn.k.g);
  }
  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(b.tLand, tid + dt * Number($("tempo").value)); oppdater(); return tid < b.tLand; }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560, topp = 18, bunn = l.h - 22, hMaks = Math.max(b.hMaks, 5) * 1.05;
    const Y = (y) => bunn - y / hMaks * (bunn - topp);
    const xs = smal ? 46 : 70;
    // Målestokk
    c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xs, Y(0)); c.lineTo(xs, Y(hMaks)); c.stroke();
    const steg = Sim.steglengde(hMaks, 6);
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "middle"; c.lineWidth = 1;
    for (let y = 0; y <= hMaks + 1e-9; y += steg / 5) {
      const hel = Math.abs(y / steg - Math.round(y / steg)) < 1e-6;
      c.beginPath(); c.moveTo(xs, Y(y)); c.lineTo(xs + (hel ? 10 : 5), Y(y)); c.stroke();
      if (hel) c.fillText(komma(y, 0) + " m", xs - 4, Y(y));
    }
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(10, Y(0)); c.lineTo(l.b - 10, Y(0)); c.stroke();
    // Stroboskopbilder: litt forskjøvet sidelengs med tiden, så opp og ned ikke overlapper
    const bredde = l.b - xs - 60, dx = (t) => xs + 40 + t / b.tLand * bredde * 0.85;
    c.fillStyle = f.f2;
    for (let t = 0, k = 0; t <= tid + 1e-9; t = ++k * inn.dt) {
      c.globalAlpha = 0.65; c.beginPath(); c.arc(dx(t), Y(b.y(t)), 5, 0, 2 * Math.PI); c.fill();
      c.strokeStyle = f.rute; c.globalAlpha = 0.6; c.lineWidth = 1; c.beginPath(); c.moveTo(xs + 10, Y(b.y(t))); c.lineTo(dx(t) - 6, Y(b.y(t))); c.stroke();
    }
    c.globalAlpha = 1;
    c.fillStyle = f.f1; c.beginPath(); c.arc(dx(tid), Y(b.y(tid)), 7, 0, 2 * Math.PI); c.fill();
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText(inn.k.navn + ", g = " + komma(inn.k.g, 2) + " m/s²   t = " + komma(tid, 2) + " s", l.b - 8, 4);
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const valg = Sim.verdi("graf");
    const vMaks = Math.max(Math.abs(inn.v0), Math.abs(b.vLand)) * 1.1;
    let o;
    if (valg === "yt") o = { x: [0, b.tLand], y: [0, b.hMaks * 1.1], xT: "t / s", yT: "høyde y / m", fx: (t) => t, fy: (t) => b.y(t) };
    else if (valg === "vt") o = { x: [0, b.tLand], y: [Math.min(0, -vMaks), Math.max(0.5, inn.v0 * 1.1)], xT: "t / s", yT: "v / (m/s) (positiv opp)", fx: (t) => t, fy: (t) => b.v(t) };
    else if (valg === "fartt") o = { x: [0, b.tLand], y: [0, vMaks], xT: "t / s", yT: "fart |v| / (m/s)", fx: (t) => t, fy: (t) => Math.abs(b.v(t)) };
    else o = { x: [0, b.s(b.tLand) * 1.02], y: [0, vMaks], xT: "strekning s / m", yT: "fart |v| / (m/s)", fx: (t) => b.s(t), fy: (t) => Math.abs(b.v(t)) };
    const { px, py } = Sim.akser(l, { x: o.x, y: o.y, xTekst: o.xT, yTekst: o.yT });
    c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i <= 300; i++) { const t = tid * i / 300; i ? c.lineTo(px(o.fx(t)), py(o.fy(t))) : c.moveTo(px(o.fx(t)), py(o.fy(t))); }
    c.stroke();
    // Prikker for stroboskopbildene
    c.fillStyle = f.f2;
    for (let t = 0, k = 0; t <= tid + 1e-9; t = ++k * inn.dt) { c.beginPath(); c.arc(px(o.fx(t)), py(o.fy(t)), 3.5, 0, 2 * Math.PI); c.fill(); }
  }

  function tegn() { if (!b) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    $("r-y").textContent = komma(b.y(tid), 2) + " m";
    $("r-v").textContent = komma(b.v(tid), 2) + " m/s";
    $("r-tland").textContent = tid >= b.tLand ? komma(b.tLand, 2) + " s" : "?";
    $("r-vland").textContent = tid >= b.tLand ? komma(Math.abs(b.vLand), 1) + " m/s" : "?";
    $("r-hmaks").textContent = komma(b.hMaks, 2) + " m";
    const rader = [];
    for (let t = 0, k = 0; t <= tid + 1e-9 && k < 40; t = ++k * inn.dt) rader.push(`<tr><td>${komma(t, 2)}</td><td>${komma(b.y(t), 3)}</td></tr>`);
    $("strobe-rader").innerHTML = rader.join("");
    tegn();
  }

  for (const id of ["klode", "hoyde", "fart", "intervall"]) $(id).addEventListener("input", nullstill);
  $("graf").addEventListener("input", tegn);
  nullstill();
})();
