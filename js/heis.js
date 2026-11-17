// Heis og baderomsvekt: N − mg = ma (positiv retning oppover), så vekta viser N/g = m(g + a)/g.
// Heisen akselererer, kjører med konstant fart og bremser med like stor akselerasjon over 12 m.

const G = 9.81, HOYDE = 12;

function heistur(retning, aMag, vMaks) {
  if (retning === "fall") {
    const tFall = Math.sqrt(2 * HOYDE / G);
    return { T: tFall, a: () => -G, v: (t) => -G * t, y: (t) => HOYDE - 0.5 * G * t * t, fall: true };
  }
  const s = retning === "opp" ? 1 : -1;
  // Hvis heisen ikke rekker toppfarten, blir bevegelsen en trekant
  let t1 = vMaks / aMag, d1 = 0.5 * aMag * t1 * t1;
  if (2 * d1 > HOYDE) { t1 = Math.sqrt(HOYDE / aMag); d1 = HOYDE / 2; }
  const vTopp = aMag * t1, t2 = (HOYDE - 2 * d1) / vTopp, T = 2 * t1 + t2;
  const a = (t) => (t < t1 ? s * aMag : t < t1 + t2 ? 0 : t < T ? -s * aMag : 0);
  const v = (t) => s * (t < t1 ? aMag * t : t < t1 + t2 ? vTopp : t < T ? vTopp - aMag * (t - t1 - t2) : 0);
  const avst = (t) => (t < t1 ? 0.5 * aMag * t * t : t < t1 + t2 ? d1 + vTopp * (t - t1) : t < T ? d1 + vTopp * t2 + vTopp * (t - t1 - t2) - 0.5 * aMag * (t - t1 - t2) ** 2 : HOYDE);
  const y = (t) => (s > 0 ? avst(t) : HOYDE - avst(t));
  return { T, t1, t2, vTopp, a, v, y };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("heis");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("heisgraf"), tegn);
  let inn, h, tid = 0;
  const pause = 0.6;   // litt ro før og etter turen

  function les() {
    inn = {
      m: Sim.verdi("masse", (v) => komma(v, 0) + " kg"),
      retning: Sim.verdi("retning"),
      a: Sim.verdi("aks", (v) => komma(v, 1) + " m/s²"),
      v: Sim.verdi("toppfart", (v) => komma(v, 1) + " m/s"),
    };
    h = heistur(inn.retning, inn.a, inn.v);
  }
  const Tslutt = () => h.T + 2 * pause;
  const turTid = (t) => Math.min(h.T, Math.max(0, t - pause));
  const aNå = (t) => (t < pause || t > pause + h.T ? 0 : h.a(t - pause));
  const visning = (t) => inn.m * (G + aNå(t)) / G;   // kg på vekta

  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(Tslutt(), tid + dt * Number($("tempo").value)); oppdater(); return tid < Tslutt(); }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function pil(c, x0, y0, x1, y1, farge, navn) {
    const len = Math.hypot(x1 - x0, y1 - y0); if (len < 3) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, hh = 8;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * hh * 0.7, y1 - uy * hh * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * hh - uy * hh * 0.5, y1 - uy * hh + ux * hh * 0.5); c.lineTo(x1 - ux * hh + uy * hh * 0.5, y1 - uy * hh - ux * hh * 0.5); c.closePath(); c.fill();
    c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(navn, x1 + 8, y1);
  }

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    const sjaktX = smal ? l.b * 0.3 : l.b * 0.18, topp = 20, bunn = l.h - 20, hHeis = 90;
    const Y = (y) => bunn - hHeis - y / HOYDE * (bunn - topp - hHeis);
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1;
    c.strokeRect(sjaktX - 50, topp, 100, bunn - topp);
    for (let e = 0; e <= 4; e++) { const y = Y(e * HOYDE / 4) + hHeis; c.beginPath(); c.moveTo(sjaktX - 60, y); c.lineTo(sjaktX - 50, y); c.stroke(); }
    const yH = Y(h.y(turTid(tid)));
    c.strokeStyle = f.dempet; c.beginPath(); c.moveTo(sjaktX, topp); c.lineTo(sjaktX, yH); c.stroke();
    c.fillStyle = f.flate; c.strokeStyle = f.blekk; c.lineWidth = 2;
    c.fillRect(sjaktX - 44, yH, 88, hHeis); c.strokeRect(sjaktX - 44, yH, 88, hHeis);
    // Person på vekt
    const px = sjaktX, gulv = yH + hHeis - 4;
    c.fillStyle = f.dempet; c.fillRect(px - 16, gulv - 6, 32, 6);
    c.strokeStyle = f.blekk; c.lineWidth = 3;
    c.beginPath(); c.moveTo(px - 6, gulv - 6); c.lineTo(px, gulv - 30); c.lineTo(px + 6, gulv - 6); c.moveTo(px, gulv - 30); c.lineTo(px, gulv - 56); c.moveTo(px - 10, gulv - 46); c.lineTo(px + 10, gulv - 46); c.stroke();
    c.fillStyle = f.blekk; c.beginPath(); c.arc(px, gulv - 64, 7, 0, 2 * Math.PI); c.fill();
    // Kreftene på personen til høyre for heisen
    const kx = sjaktX + (smal ? 70 : 90), ky = yH + hHeis / 2, sk = 40 / (inn.m * G);
    const N = inn.m * (G + aNå(tid));
    pil(c, kx, ky, kx, ky + inn.m * G * sk, f.blekk, "G");
    if (N > 0.5) pil(c, kx + 24, ky, kx + 24, ky - N * sk, f.f1, "N");
    // Vektskjermen
    if (!smal) {
      const vx = l.b * 0.42, vy = l.h * 0.25;
      c.fillStyle = f.flate; c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1;
      c.beginPath(); c.roundRect(vx, vy, 190, 90, 8); c.fill(); c.stroke();
      c.fillStyle = f.dempet; c.font = "12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "top"; c.fillText("Vekta viser", vx + 14, vy + 10);
      c.fillStyle = f.blekk; c.font = "600 34px " + Sim.MONO; c.fillText(komma(Math.max(0, visning(tid)), 1) + " kg", vx + 14, vy + 34);
      const a = aNå(tid);
      c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO;
      c.fillText((h.fall && tid > pause ? "fritt fall!  " : "") + "a = " + komma(a, 2) + " m/s²   v = " + komma(tid < pause ? 0 : h.v(turTid(tid)), 2) + " m/s", vx, vy + 104);
    }
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const { px, py } = Sim.akser(l, { x: [0, Tslutt()], y: [0, Math.max(inn.m * 1.4, 10)], xTekst: "t / s", yTekst: "vekta viser / kg" });
    c.strokeStyle = f.dempet; c.setLineDash([5, 4]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(px(0), py(inn.m)); c.lineTo(px(Tslutt()), py(inn.m)); c.stroke(); c.setLineDash([]);
    c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i <= 400; i++) { const t = tid * i / 400; i ? c.lineTo(px(t), py(Math.max(0, visning(t)))) : c.moveTo(px(t), py(visning(t))); }
    c.stroke();
  }

  function tegn() { if (!h) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    const a = aNå(tid);
    $("r-a").textContent = komma(a, 2) + " m/s²";
    $("r-n").textContent = komma(Math.max(0, inn.m * (G + a)), 0) + " N";
    $("r-vekt").textContent = komma(Math.max(0, visning(tid)), 1) + " kg";
    $("r-v").textContent = komma(tid < pause ? 0 : h.v(turTid(tid)), 2) + " m/s";
    $("rad-aks").hidden = $("rad-toppfart").hidden = inn.retning === "fall";
    tegn();
  }

  for (const id of ["masse", "retning", "aks", "toppfart"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
