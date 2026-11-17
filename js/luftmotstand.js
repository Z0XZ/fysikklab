// Fall med luftmotstand: n muffinsformer stablet i hverandre faller fra 2,0 m. Luftmotstanden er L = k v².
// Formen er den samme uansett hvor mange former som er stablet, så k er den samme, mens massen er n · m1.
// m1 og k er valgt slik at én form får en terminalfart på omtrent 1,1 m/s, som ligner typiske målinger.

const G = 9.81, M1 = 0.0004, K = M1 * G / 1.1 ** 2, HOYDE = 2.0;

function slipp(n, medLuft) {
  const m = n * M1, dt = 1e-4, data = [{ t: 0, v: 0, s: 0 }];
  let v = 0, s = 0, t = 0;
  while (s < HOYDE && t < 10) {
    const a = G - (medLuft ? K * v * v / m : 0);
    v += a * dt; s += v * dt; t += dt;
    if (Math.round(t / dt) % 20 === 0) data.push({ t, v, s });
  }
  data.push({ t, v, s: HOYDE });
  return { n, m, vt: Math.sqrt(m * G / K), data, tFall: t, vSlutt: v, medLuft };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("muffins");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("luftgraf"), tegn);
  let sim, tid = 0, spor = [];

  function les() {
    const n = Number(Sim.verdi("antall", (v) => v + (v === 1 ? " form" : " former")));
    sim = slipp(n, !$("uten").checked);
  }
  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) {
    tid = Math.min(sim.tFall, tid + dt * Number($("tempo").value));
    if (tid >= sim.tFall) { spor = spor.filter((s) => !(s.n === sim.n && s.medLuft === sim.medLuft)); spor.push(sim); if (spor.length > 6) spor.shift(); }
    oppdater();
    return tid < sim.tFall;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });
  const nå = () => { let d = sim.data[0]; for (const x of sim.data) { if (x.t > tid) break; d = x; } return d; };

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const topp = 30, bunn = l.h - 16, mx = l.b * 0.3, Y = (s) => topp + s / HOYDE * (bunn - topp);
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(10, bunn); c.lineTo(l.b - 10, bunn); c.stroke();
    // Bevegelsessensor
    c.fillStyle = f.dempet; c.fillRect(mx - 18, topp - 22, 36, 12);
    c.font = "11px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText("sensor", mx + 24, topp - 16);
    c.strokeStyle = f.rute; c.lineWidth = 1;
    for (let s = 0; s <= HOYDE + 1e-9; s += 0.5) { c.beginPath(); c.moveTo(20, Y(s)); c.lineTo(34, Y(s)); c.stroke(); c.fillStyle = f.dempet; c.textAlign = "left"; c.fillText(komma(HOYDE - s, 1) + " m", 38, Y(s)); }
    const d = nå(), y = Y(d.s);
    // Muffinsformene som en stabel
    c.fillStyle = f.f1; c.strokeStyle = f.papir; c.lineWidth = 1;
    c.beginPath(); c.moveTo(mx - 20, y - 12); c.lineTo(mx + 20, y - 12); c.lineTo(mx + 13, y + 6); c.lineTo(mx - 13, y + 6); c.closePath(); c.fill();
    for (let k = 1; k < sim.n; k++) { c.beginPath(); c.moveTo(mx - 20 + k * 0.5, y - 12 + k * 3); c.lineTo(mx + 20 - k * 0.5, y - 12 + k * 3); c.stroke(); }
    // Krefter: tyngde og luftmotstand
    const Gk = sim.m * G, L = sim.medLuft ? K * d.v * d.v : 0, sk = 60 / Gk;
    const pil = (y0, lengde, farge, navn) => {
      if (Math.abs(lengde) < 3) return;
      const x = mx + 46, r = Math.sign(lengde);
      c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 + lengde - r * 6); c.stroke();
      c.beginPath(); c.moveTo(x, y0 + lengde); c.lineTo(x - 5, y0 + lengde - r * 8); c.lineTo(x + 5, y0 + lengde - r * 8); c.fill();
      c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(navn, x + 8, y0 + lengde - r * 4);
    };
    pil(y, Gk * sk, f.blekk, "G");
    pil(y, -L * sk, f.f2, "L");
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s   v = " + komma(d.v, 2) + " m/s", l.b - 8, 6);
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const alle = [...spor, sim], tMaks = Math.max(...alle.map((s) => s.tFall)) * 1.05, vMaks = Math.max(3, ...alle.map((s) => s.vSlutt)) * 1.1;
    const { px, py } = Sim.akser(l, { x: [0, tMaks], y: [0, vMaks], xTekst: "t / s", yTekst: "v / (m/s)" });
    for (const s of spor) {
      c.strokeStyle = s.medLuft ? f.f2 : f.dempet; c.globalAlpha = 0.55; c.lineWidth = 1.8; c.beginPath();
      s.data.forEach((d, k) => (k ? c.lineTo(px(d.t), py(d.v)) : c.moveTo(px(d.t), py(d.v)))); c.stroke();
      const sist = s.data[s.data.length - 1];
      c.globalAlpha = 1; c.fillStyle = c.strokeStyle; c.font = "11px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "middle";
      c.fillText(s.medLuft ? "n = " + s.n : "uten luft", px(sist.t) + 4, py(sist.v));
    }
    c.globalAlpha = 1;
    if (sim.medLuft) { c.strokeStyle = f.f1; c.setLineDash([4, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(px(0), py(sim.vt)); c.lineTo(px(tMaks), py(sim.vt)); c.stroke(); c.setLineDash([]); }
    c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath();
    for (const d of sim.data) { if (d.t > tid) break; d.t ? c.lineTo(px(d.t), py(d.v)) : c.moveTo(px(d.t), py(d.v)); }
    c.stroke();
  }

  function tegn() { if (!sim) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    const d = nå();
    $("r-m").textContent = komma(sim.m * 1000, 1) + " g";
    $("r-vt").textContent = sim.medLuft ? komma(sim.vt, 2) + " m/s" : "–";
    $("r-l").textContent = komma(sim.medLuft ? K * d.v * d.v * 1000 : 0, 2) + " mN";
    $("r-g").textContent = komma(sim.m * G * 1000, 2) + " mN";
    $("r-t").textContent = tid >= sim.tFall ? komma(sim.tFall, 2) + " s" : "?";
    tegn();
  }

  for (const id of ["antall", "uten"]) $(id).addEventListener("input", nullstill);
  $("visk").addEventListener("click", () => { spor = []; tegn(); });
  nullstill();
})();
