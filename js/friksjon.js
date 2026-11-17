// Friksjon: En kloss dras langs et vannrett underlag. Hvilefriksjonen er høyst μs·N, glidefriksjonen er μk·N.
// «Økende kraft»: kraften øker jevnt til klossen glipper, og så drar vi med konstant (lav) fart, som i forsøket.
// «Konstant kraft»: kraften er fast, og klossen enten står i ro eller akselererer.

const G = 9.81;
const FLATER = {
  tre: { navn: "tre mot tre", s: 0.5, k: 0.3 },
  gummi: { navn: "gummi mot betong", s: 0.9, k: 0.7 },
  staal: { navn: "stål mot stål", s: 0.7, k: 0.55 },
  is: { navn: "is mot is", s: 0.1, k: 0.03 },
};

// Simulerer 10 s. Returnerer målinger hvert 0,02 s.
function dra({ m, mus, muk, modus, F0, rate }) {
  const N = m * G, dt = 0.001, data = [];
  let v = 0, x = 0, glir = false, tGlipp = null;
  for (let i = 0, t = 0; t <= 10 + 1e-9; i++, t = i * dt) {
    let F, R, a = 0;
    if (modus === "okende") {
      if (!glir) { F = rate * t; if (F > mus * N) { glir = true; tGlipp = t; } }
      if (glir) { F = muk * N; v = 0.1; }     // drar med jevn fart etter at klossen har glippet
      R = glir ? muk * N : Math.min(F, mus * N);
    } else {
      F = F0;
      if (v === 0 && F <= mus * N) { R = F; a = 0; }
      else { R = muk * N; a = (F - R) / m; if (!glir) { glir = true; tGlipp = t; } }
      v = Math.max(0, v + a * dt);
      if (v === 0 && a < 0) a = 0;
    }
    x += v * dt;
    if (i % 20 === 0) data.push({ t, F, R, v, x, a, glir });
  }
  return { data, N, Rmaks: mus * N, Rglid: muk * N, tGlipp };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("kloss");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("friksjonsgraf"), tegn);
  let inn, sim, tid = 0;

  function les() {
    const fl = FLATER[Sim.verdi("flate")];
    inn = {
      m: Sim.verdi("masse", (v) => komma(v, 1) + " kg"),
      mus: fl.s, muk: fl.k, fl,
      modus: Sim.verdi("modus"),
      F0: Sim.verdi("kraft", (v) => komma(v, 1) + " N"),
      rate: 2,
    };
    $("rad-kraft").hidden = inn.modus !== "konstant";
    sim = dra(inn);
  }
  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(10, tid + dt); oppdater(); return tid < 10; }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });
  const nå = () => sim.data[Math.min(sim.data.length - 1, Math.round(tid / 0.02))];

  function pil(c, x0, y0, x1, y1, farge, navn, under) {
    const len = Math.hypot(x1 - x0, y1 - y0); if (len < 3) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, h = 8;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.7, y1 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * h - uy * h * 0.5, y1 - uy * h + ux * h * 0.5); c.lineTo(x1 - ux * h + uy * h * 0.5, y1 - uy * h - ux * h * 0.5); c.closePath(); c.fill();
    c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(navn, x1 + ux * 14, y1 + uy * 14 + (under ? 12 : 0));
  }

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const d = nå(), y = l.h * 0.55, w = 90, hK = 46;
    const maksX = Math.max(1, sim.data[sim.data.length - 1].x);
    const x0 = l.b * 0.18 + Math.min(1, d.x / maksX) * l.b * 0.45 * (maksX > 0.05 ? 1 : 0);
    c.fillStyle = f.flate; c.fillRect(0, y, l.b, l.h - y);
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(0, y); c.lineTo(l.b, y); c.stroke();
    c.fillStyle = f.f2; c.globalAlpha = 0.85; c.fillRect(x0, y - hK, w, hK); c.globalAlpha = 1;
    c.fillStyle = f.dempet; c.font = "600 12px " + Sim.SANS; c.textAlign = "right"; c.textBaseline = "bottom";
    c.fillText(komma(inn.m, 1) + " kg", x0 + w, y - hK - 4);
    // Kraftmåler og snor
    c.strokeStyle = f.dempet; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 + w, y - hK / 2); c.lineTo(x0 + w + 40, y - hK / 2); c.stroke();
    // Kreftene med felles målestokk
    const maks = Math.max(sim.N, sim.Rmaks, inn.modus === "konstant" ? inn.F0 : sim.Rmaks), sk = Math.min(l.h * 0.36, 110) / maks;
    const mx = x0 + w / 2, my = y - hK / 2;
    pil(c, mx, my, mx, my + sim.N * sk, f.blekk, "G");
    pil(c, mx - 14, my, mx - 14, my - sim.N * sk, f.dempet, "N");
    if (d.F > 0) pil(c, x0 + w + 40, my, x0 + w + 40 + d.F * sk, my, f.f1, "F");
    if (d.R > 0) pil(c, x0, y - 6, x0 - d.R * sk, y - 6, f.f2, "R", true);
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 1) + " s   " + (d.glir ? "klossen glir" : "klossen står i ro"), l.b - 8, 6);
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const maks = Math.max(sim.Rmaks, inn.modus === "konstant" ? inn.F0 : 0) * 1.25 || 1;
    const { px, py } = Sim.akser(l, { x: [0, 10], y: [0, maks], xTekst: "t / s", yTekst: "kraft / N" });
    for (const [verdi, farge] of [[sim.Rmaks, f.dempet], [sim.Rglid, f.dempet]]) {
      c.strokeStyle = farge; c.setLineDash([4, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(px(0), py(verdi)); c.lineTo(px(10), py(verdi)); c.stroke();
    }
    c.setLineDash([]);
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "bottom";
    c.fillText("μs·N", px(10) - 4, py(sim.Rmaks) - 2); c.fillText("μk·N", px(10) - 4, py(sim.Rglid) - 2);
    const kurve = (fn, farge, tykk) => {
      c.strokeStyle = farge; c.lineWidth = tykk; c.beginPath();
      for (const d of sim.data) { if (d.t > tid) break; d.t ? c.lineTo(px(d.t), py(fn(d))) : c.moveTo(px(d.t), py(fn(d))); }
      c.stroke();
    };
    kurve((d) => d.F, f.f1, 6); kurve((d) => d.R, f.f2, 2.5);
  }

  function tegn() { if (!sim) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    const d = nå();
    $("r-n").textContent = komma(sim.N, 2) + " N";
    $("r-rmaks").textContent = komma(sim.Rmaks, 2) + " N";
    $("r-rglid").textContent = komma(sim.Rglid, 2) + " N";
    $("r-r").textContent = komma(d.R, 2) + " N";
    $("r-a").textContent = komma(d.a, 2) + " m/s²";
    $("r-v").textContent = komma(d.v, 2) + " m/s";
    $("r-flate").textContent = `${inn.fl.navn}: μs = ${komma(inn.mus, 2)}, μk = ${komma(inn.muk, 2)}`;
    tegn();
  }

  for (const id of ["flate", "masse", "modus", "kraft"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
