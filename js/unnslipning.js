// Unnslipningsfart. Et prosjektil skytes rett opp fra overflaten med farten v₀, uten luftmotstand.
// Bevegelsen regnes ut med a = −GM/r². Energien per kilogram: Ek = ½v², Ep = −GM/r. Sammenlignes med tilnærmingen Ep ≈ gh.
// Animasjonen varer omtrent 10 s uansett hvor lang tid turen tar i virkeligheten.

const UN_G = 6.674e-11;
const UN_LEGEMER = {
  jorda: { navn: "Jorda", M: 5.972e24, R: 6.371e6 },
  manen: { navn: "Månen", M: 7.342e22, R: 1.737e6 },
  mars: { navn: "Mars", M: 6.417e23, R: 3.390e6 },
};
const UN_RMAKS = 12;   // vi stopper når r = 12R

// Simulerer turen og returnerer punkter { t, r, v }
function unTur(M, R, v0) {
  const GM = UN_G * M, ut = [];
  let r = R, v = v0, t = 0;
  const dt = Math.max(0.5, R / Math.max(v0, 100) / 400);
  ut.push({ t, r, v });
  const a = (rr) => -GM / (rr * rr);
  for (let i = 0; i < 400000; i++) {
    // Runge–Kutta 4
    const k1r = v, k1v = a(r), k2r = v + 0.5 * dt * k1v, k2v = a(r + 0.5 * dt * k1r);
    const k3r = v + 0.5 * dt * k2v, k3v = a(r + 0.5 * dt * k2r), k4r = v + dt * k3v, k4v = a(r + dt * k3r);
    r += dt / 6 * (k1r + 2 * k2r + 2 * k3r + k4r); v += dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v); t += dt;
    if (r <= R) { ut.push({ t, r: R, v }); break; }
    if (r >= UN_RMAKS * R) { ut.push({ t, r, v }); break; }
    if (i % 20 === 0) ut.push({ t, r, v });
  }
  return ut;
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("un-scene");
  if (!el) return;
  let leg, v0, tur = [], idx = 0, tAnim = 0;
  const ls = Sim.lerret(el, tegnScene);
  const lg = Sim.lerret($("un-graf"), tegnGraf);

  const vesc = () => Math.sqrt(2 * UN_G * leg.M / leg.R);
  function les() {
    leg = UN_LEGEMER[$("un-legeme").value];
    const ve = vesc();
    const sl = $("un-v");
    sl.max = (Math.ceil(ve * 1.3 / 100) / 10).toFixed(1);
    sl.step = ve > 5000 ? 0.1 : 0.05;
    v0 = Sim.verdi("un-v", (x) => komma(x, 2) + " km/s") * 1000;
  }
  function beregn() { tur = unTur(leg.M, leg.R, v0); idx = 0; tAnim = 0; }
  const naa = () => tur[Math.min(idx, tur.length - 1)];

  function steg(dt) {
    const total = tur[tur.length - 1].t;
    tAnim += dt * total / 10;
    while (idx < tur.length - 1 && tur[idx + 1].t <= tAnim) idx++;
    tegn();
    return idx < tur.length - 1;
  }
  const avspiller = Sim.avspiller({ knapp: $("un-start"), steg, nullstill: () => { idx = 0; tAnim = 0; }, lerret: el });

  function tegn() { tegnScene(); tegnGraf(); tall(); }

  function tegnScene() {
    if (!ls.b) return;
    const c = ls.ctx, f = ls.f, B = ls.b, H = ls.h;
    ls.tom();
    const rmaks = Math.max(2, Math.min(UN_RMAKS, Math.max(...tur.map((p) => p.r)) / leg.R * 1.08));
    // Planeten til venstre, banen vannrett mot høyre
    const s = Math.min((B - 60) / (rmaks + 1), H * 0.3), cx = 20 + s, cy = H / 2;
    c.fillStyle = leg.navn === "Jorda" ? f.f2 : leg.navn === "Mars" ? f.f1 : f["rute-sterk"];
    c.beginPath(); c.arc(cx, cy, s, 0, 2 * Math.PI); c.fill();
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
    for (let k = 2; k <= rmaks; k += rmaks > 6 ? 2 : 1) { c.fillRect(cx + k * s, cy + 2, 1, 6); c.fillText(k + "R", cx + k * s, cy + 10); }
    c.strokeStyle = f["rute-sterk"]; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(cx + s, cy); c.lineTo(B - 10, cy); c.stroke(); c.setLineDash([]);
    const p = naa();
    c.fillStyle = f.blekk; c.beginPath(); c.arc(cx + p.r / leg.R * s, cy, 6, 0, 2 * Math.PI); c.fill();
    c.textAlign = "left"; c.fillText(leg.navn + " · t = " + tidTekst(p.t), 8, 8);
  }

  function tegnGraf() {
    if (!lg.b) return;
    const c = lg.ctx, f = lg.f, GM = UN_G * leg.M, R = leg.R;
    lg.tom();
    const E = 0.5 * v0 * v0 - GM / R;   // J/kg
    const MJ = 1e-6, ymin = -GM / R * MJ * 1.1, ymaks = Math.max(0.3 * GM / R * MJ, E * MJ * 1.2);
    const { px, py } = Sim.akser(lg, { x: [1, UN_RMAKS], y: [ymin, ymaks], xTekst: "r / R", yTekst: "energi / (MJ/kg)" });
    c.save(); c.beginPath(); c.rect(px(1), py(ymaks), px(UN_RMAKS) - px(1), py(ymin) - py(ymaks)); c.clip();
    c.strokeStyle = f.f2; c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i <= 200; i++) { const x = 1 + (UN_RMAKS - 1) * i / 200; i ? c.lineTo(px(x), py(-GM / (x * R) * MJ)) : c.moveTo(px(x), py(-GM / (x * R) * MJ)); }
    c.stroke();
    const g = GM / (R * R);
    c.strokeStyle = f.dempet; c.lineWidth = 1.5; c.setLineDash([5, 4]); c.beginPath();
    c.moveTo(px(1), py(-GM / R * MJ)); c.lineTo(px(UN_RMAKS), py((-GM / R + g * (UN_RMAKS - 1) * R) * MJ)); c.stroke();
    c.strokeStyle = f.f1; c.setLineDash([]); c.lineWidth = 2; c.beginPath(); c.moveTo(px(1), py(E * MJ)); c.lineTo(px(UN_RMAKS), py(E * MJ)); c.stroke();
    const p = naa();
    c.fillStyle = f.blekk; c.beginPath(); c.arc(px(p.r / R), py(-GM / p.r * MJ), 5, 0, 2 * Math.PI); c.fill();
    // Ek som avstand mellom Ep og E
    c.strokeStyle = f.blekk; c.lineWidth = 1; c.beginPath(); c.moveTo(px(p.r / R), py(-GM / p.r * MJ)); c.lineTo(px(p.r / R), py(E * MJ)); c.stroke();
    c.restore();
  }

  function tidTekst(t) { return t < 120 ? komma(t, 0) + " s" : t < 7200 ? komma(t / 60, 1) + " min" : komma(t / 3600, 1) + " h"; }

  function tall() {
    const GM = UN_G * leg.M, R = leg.R, E = 0.5 * v0 * v0 - GM / R, p = naa(), g = GM / (R * R);
    $("un-ve").textContent = komma(vesc() / 1000, 2) + " km/s";
    $("un-hmaks").textContent = E < 0 ? Sim.tall((1 / (-E / GM) - R) / 1000, 3) + " km" : "slipper unna";
    $("un-hgh").textContent = Sim.tall(v0 * v0 / (2 * g) / 1000, 3) + " km";
    $("un-h").textContent = Sim.tall((p.r - R) / 1000, 3) + " km";
    $("un-fart").textContent = komma(Math.abs(p.v) / 1000, 2) + " km/s";
    $("un-E").textContent = komma(E / 1e6, 2) + " MJ/kg";
  }

  function nullstill() { avspiller.stopp(); les(); beregn(); tegn(); }
  for (const id of ["un-legeme", "un-v"]) $(id).addEventListener("input", nullstill);
  $("un-nullstill").addEventListener("click", nullstill);
  nullstill();
})();
