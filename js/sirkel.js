// Jevn sirkelbevegelse sett ovenfra: fart og akselerasjon, Δv-konstruksjonen, og hva som skjer når snora kuttes.
// a = v²/r mot sentrum, T = 2πr/v, ω = v/r, F = mv²/r.

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("sirkel");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, vinkel = 0, kuttet = null, forrige = null, synlig = true;

  function les() {
    inn = {
      r: Sim.verdi("radius", (v) => komma(v, 1) + " m"),
      v: Sim.verdi("fart", (v) => komma(v, 1) + " m/s"),
      m: Sim.verdi("masse", (v) => komma(v, 1) + " kg"),
    };
    const a = inn.v ** 2 / inn.r, T = 2 * Math.PI * inn.r / inn.v;
    $("r-t").textContent = komma(T, 2) + " s";
    $("r-f").textContent = komma(1 / T, 3) + " Hz";
    $("r-w").textContent = komma(inn.v / inn.r, 2) + " rad/s";
    $("r-a").textContent = komma(a, 2) + " m/s²";
    $("r-fs").textContent = komma(inn.m * a, 2) + " N";
  }

  function pil(c, x0, y0, x1, y1, farge, navn, tykk = 2.5) {
    const len = Math.hypot(x1 - x0, y1 - y0); if (len < 3) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = tykk;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * 6, y1 - uy * 6); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * 10 - uy * 5, y1 - uy * 10 + ux * 5); c.lineTo(x1 - ux * 10 + uy * 5, y1 - uy * 10 - ux * 5); c.closePath(); c.fill();
    if (navn) { c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(navn, x1 + ux * 14, y1 + uy * 14); }
  }

  function tegn() {
    if (!l.b || !inn) return;
    const c = l.ctx, f = l.f, smal = l.b < 560;
    l.tom();
    const vis = $("dv").checked && !smal;
    const cx = vis ? l.b * 0.32 : l.b / 2, cy = l.h / 2, R = Math.min(l.h * 0.36, (vis ? l.b * 0.3 : l.b * 0.38));
    c.strokeStyle = f.rute; c.lineWidth = 1.5; c.setLineDash([5, 5]); c.beginPath(); c.arc(cx, cy, R, 0, 2 * Math.PI); c.stroke(); c.setLineDash([]);
    c.fillStyle = f.blekk; c.beginPath(); c.arc(cx, cy, 4, 0, 2 * Math.PI); c.fill();
    const vSk = R * 0.09;   // v-pila: 0,09 R per m/s. a-pila: 0,04 R per m/s², høyst 0,95 R
    const aLengde = Math.min(0.95 * R, 0.04 * R * inn.v ** 2 / inn.r);
    if (kuttet) {
      const { x, y, ux, uy } = kuttet;
      c.strokeStyle = f.f1; c.setLineDash([3, 4]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx + kuttet.x0 * R, cy - kuttet.y0 * R); c.lineTo(cx + x * R, cy - y * R); c.stroke(); c.setLineDash([]);
      c.fillStyle = f.f1; c.beginPath(); c.arc(cx + x * R, cy - y * R, 9, 0, 2 * Math.PI); c.fill();
      pil(c, cx + x * R, cy - y * R, cx + x * R + ux * inn.v * vSk, cy - y * R - uy * inn.v * vSk, f.blekk, "v");
      return;
    }
    const x = Math.cos(vinkel), y = Math.sin(vinkel), px = cx + x * R, py = cy - y * R;
    c.strokeStyle = f.dempet; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(px, py); c.stroke();
    c.fillStyle = f.f1; c.beginPath(); c.arc(px, py, 9, 0, 2 * Math.PI); c.fill();
    if ($("vis-v").checked) pil(c, px, py, px - y * inn.v * vSk, py - x * inn.v * vSk, f.blekk, "v");
    if ($("vis-a").checked) pil(c, px, py, px - x * aLengde, py + y * aLengde, f.f2, "a");
    // Δv: farten nå og en tid Δt senere, satt med felles startpunkt
    if (vis) {
      const dth = 0.6, ox = l.b * 0.8, oy = l.h * 0.5, s = Math.min(l.h * 0.32, l.b * 0.14);
      const v1 = [-Math.sin(vinkel), -Math.cos(vinkel)], v2 = [-Math.sin(vinkel + dth), -Math.cos(vinkel + dth)];
      c.fillStyle = f.dempet; c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "top";
      c.fillText("v₁, v₂ og Δv = v₂ − v₁", ox, 12);
      pil(c, ox, oy, ox + v1[0] * s, oy + v1[1] * s, f.blekk, "v₁");
      pil(c, ox, oy, ox + v2[0] * s, oy + v2[1] * s, f.dempet, "v₂");
      pil(c, ox + v1[0] * s, oy + v1[1] * s, ox + v2[0] * s, oy + v2[1] * s, f.f2, "Δv");
      // Samme punkter på banen
      const x2 = Math.cos(vinkel + dth), y2 = Math.sin(vinkel + dth);
      c.fillStyle = f.dempet; c.globalAlpha = 0.6; c.beginPath(); c.arc(cx + x2 * R, cy - y2 * R, 6, 0, 2 * Math.PI); c.fill(); c.globalAlpha = 1;
    }
  }

  function løkke(naa) {
    const dt = forrige === null ? 0 : Math.min(0.05, (naa - forrige) / 1000);
    forrige = naa;
    if (synlig && inn) {
      const tempo = Number($("tempo").value);
      if (kuttet) {
        kuttet.x += kuttet.ux * inn.v / inn.r * dt * tempo; kuttet.y += kuttet.uy * inn.v / inn.r * dt * tempo;
        if (Math.hypot(kuttet.x, kuttet.y) > 2.5) { kuttet = null; }
      } else vinkel += inn.v / inn.r * dt * tempo;
      tegn();
    }
    requestAnimationFrame(løkke);
  }

  for (const id of ["radius", "fart", "masse"]) $(id).addEventListener("input", les);
  for (const id of ["vis-v", "vis-a", "dv"]) $(id).addEventListener("input", tegn);
  $("kutt").addEventListener("click", () => {
    if (kuttet) return;
    const x = Math.cos(vinkel), y = Math.sin(vinkel);
    kuttet = { x, y, x0: x, y0: y, ux: -y, uy: x };
  });
  new IntersectionObserver(([e]) => { synlig = e.isIntersecting; }).observe(el);
  les();
  requestAnimationFrame(løkke);
})();
