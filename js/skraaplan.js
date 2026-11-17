// Skråplan med friksjon. Positiv retning er nedover langs planet.
// Glir nedover: a = g(sin θ − μk cos θ). Glir oppover: a = g(sin θ + μk cos θ) (bremser).
// Ligger i ro hvis farten er null og tan θ ≤ μs.

const G = 9.81, LENGDE = 3.0;
const FLATER = {
  tre: { navn: "tre mot tre", s: 0.5, k: 0.3 },
  gummi: { navn: "gummi mot betong", s: 0.9, k: 0.7 },
  staal: { navn: "stål mot stål", s: 0.7, k: 0.55 },
  is: { navn: "is mot is", s: 0.1, k: 0.03 },
  ingen: { navn: "uten friksjon", s: 0, k: 0 },
};

// Simulerer bevegelsen. v0 > 0 betyr startfart oppover planet. s måles langs planet fra bunnen.
function skli(theta, mus, muk, v0) {
  const th = theta * Math.PI / 180, sin = Math.sin(th), cos = Math.cos(th);
  const dt = 0.001, data = [];
  const sStart = v0 > 0 ? 0.4 : LENGDE * 0.8;
  let s = sStart, v = v0, t = 0, status = "";   // v positiv oppover
  for (let i = 0; t <= 8; i++, t = i * dt) {
    let a;
    if (v > 1e-9) a = -G * (sin + muk * cos);
    else if (v < -1e-9) a = -G * (sin - muk * cos);
    else a = Math.tan(th) <= mus + 1e-12 ? 0 : -G * (sin - muk * cos);
    if (i % 10 === 0) data.push({ t, s, v, a });
    const vNy = v + a * dt;
    if (v > 0 && vNy <= 0) { v = 0; status = "snudde"; } else v = vNy;
    if (Math.abs(v) < 1e-9 && a === 0) { status = status || "ro"; if (t > 0.5) { data.push({ t, s, v, a }); break; } }
    s += v * dt;
    if (s <= 0.2 || (v0 > 0 && v < 0 && s <= sStart)) { s = Math.max(0.2, s); data.push({ t, s, v, a }); break; }
    if (s >= LENGDE) { s = LENGDE; data.push({ t, s, v, a }); break; }
  }
  return { data, ned: G * (sin - muk * cos), opp: G * (sin + muk * cos), ligger: Math.tan(th) <= mus, N: cos, Gpar: sin };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("skraaplan");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("planegraf"), tegn);
  let inn, sim, tid = 0;

  function les() {
    const fl = FLATER[Sim.verdi("flate")];
    inn = {
      theta: Sim.verdi("vinkel", (v) => komma(v, 0) + "°"),
      m: Sim.verdi("masse", (v) => komma(v, 1) + " kg"),
      v0: Sim.verdi("startfart", (v) => (v === 0 ? "ingen" : komma(v, 1) + " m/s opp")),
      fl,
    };
    sim = skli(inn.theta, fl.s, fl.k, inn.v0);
  }
  const slutt = () => sim.data[sim.data.length - 1].t;
  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(slutt(), tid + dt * Number($("tempo").value)); oppdater(); return tid < slutt(); }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });
  const nå = () => sim.data[Math.min(sim.data.length - 1, Math.round(tid / 0.01))];

  function pil(c, x0, y0, dx, dy, farge, navn, stiplet) {
    const len = Math.hypot(dx, dy); if (len < 3) return;
    const ux = dx / len, uy = dy / len, x1 = x0 + dx, y1 = y0 + dy;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = stiplet ? 1.5 : 3; c.setLineDash(stiplet ? [5, 4] : []);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * 6, y1 - uy * 6); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * 9 - uy * 4.5, y1 - uy * 9 + ux * 4.5); c.lineTo(x1 - ux * 9 + uy * 4.5, y1 - uy * 9 - ux * 4.5); c.closePath(); c.fill();
    c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(navn, x1 + ux * 13, y1 + uy * 13);
  }

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const th = inn.theta * Math.PI / 180, cos = Math.cos(th), sin = Math.sin(th);
    const bunnX = l.b * 0.12, bunnY = l.h - 24;
    const sk = Math.min((l.b * 0.8) / (LENGDE * cos + 0.3), (l.h - 60) / (LENGDE * sin + 0.4));
    const P = (s, h = 0) => [bunnX + (s * cos - h * sin) * sk, bunnY - (s * sin + h * cos) * sk];
    // Planet
    c.fillStyle = f.flate; c.beginPath(); c.moveTo(...P(0)); c.lineTo(...P(LENGDE)); c.lineTo(P(LENGDE)[0], bunnY); c.closePath(); c.fill();
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(...P(0)); c.lineTo(...P(LENGDE)); c.stroke();
    c.beginPath(); c.moveTo(10, bunnY); c.lineTo(l.b - 10, bunnY); c.stroke();
    c.strokeStyle = f.dempet; c.lineWidth = 1; c.beginPath(); c.arc(bunnX, bunnY, 40, -th, 0); c.stroke();
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "bottom"; c.fillText("θ = " + komma(inn.theta, 0) + "°", bunnX + 46, bunnY - 4);
    // Klossen
    const d = nå(), b = 0.35, hK = 0.22;
    c.save(); c.translate(...P(d.s, 0)); c.rotate(-th);
    c.fillStyle = f.f2; c.fillRect(-b / 2 * sk, -hK * sk, b * sk, hK * sk);
    c.restore();
    // Kreftene fra midten av klossen
    const [mx, my] = P(d.s, hK / 2), kSk = Math.min(90, l.h * 0.28) / (inn.m * G);
    const Gk = inn.m * G, Nk = Gk * cos;
    let R = 0;   // friksjon, positiv oppover planet
    if (d.v > 1e-9) R = -inn.fl.k * Nk; else if (d.v < -1e-9) R = inn.fl.k * Nk; else R = Math.min(Gk * sin, inn.fl.s * Nk);
    if (d.v === 0 && Math.abs(d.a) > 0) R = inn.fl.k * Nk;
    pil(c, mx, my, 0, Gk * kSk, f.blekk, "G");
    if ($("dekomponer").checked) {
      pil(c, mx, my, -Gk * sin * cos * kSk, Gk * sin * sin * kSk, f.dempet, "G∥", true);
      pil(c, mx, my, Gk * cos * sin * kSk, Gk * cos * cos * kSk, f.dempet, "G⊥", true);
    }
    pil(c, mx, my, -sin * Nk * kSk, -cos * Nk * kSk, f.f1, "N");
    if (Math.abs(R) > 1e-6) pil(c, mx, my, cos * R * kSk, -sin * R * kSk, f.f2, "R");
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s", l.b - 8, 6);
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const vs = sim.data.map((d) => d.v), T = Math.max(1, slutt());
    const y0 = Math.min(-0.5, ...vs) * 1.1, y1 = Math.max(0.5, ...vs) * 1.1;
    const { px, py } = Sim.akser(l, { x: [0, T], y: [y0, y1], xTekst: "t / s", yTekst: "v / (m/s), positiv opp langs planet" });
    c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath();
    for (const d of sim.data) { if (d.t > tid) break; d.t ? c.lineTo(px(d.t), py(d.v)) : c.moveTo(px(d.t), py(d.v)); }
    c.stroke();
  }

  function tegn() { if (!sim) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    const d = nå();
    $("r-gpar").textContent = komma(inn.m * G * sim.Gpar, 2) + " N";
    $("r-n").textContent = komma(inn.m * G * sim.N, 2) + " N";
    $("r-tan").textContent = komma(Math.tan(inn.theta * Math.PI / 180), 3) + " (μs = " + komma(inn.fl.s, 2) + ")";
    $("r-a").textContent = komma(-d.a, 2) + " m/s² nedover";
    $("r-v").textContent = komma(d.v, 2) + " m/s";
    $("r-status").textContent = Math.abs(d.v) < 1e-9 && d.a === 0 ? "ligger i ro" : d.v > 0 ? "glir oppover og bremser" : "glir nedover";
    tegn();
  }

  for (const id of ["vinkel", "masse", "flate", "startfart"]) $(id).addEventListener("input", nullstill);
  $("dekomponer").addEventListener("input", tegn);
  nullstill();
})();
