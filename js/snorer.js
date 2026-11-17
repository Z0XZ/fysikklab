// Lodd i to snorer: Et lodd henger i en knute som holdes av to snorer med vinklene α og β med vannrett.
// Likevekt: S1 cos α = S2 cos β og S1 sin α + S2 sin β = G.
// Det gir S1 = G cos β / sin(α + β) og S2 = G cos α / sin(α + β).

const G = 9.81;
function snorkrefter(alfa, beta, m) {
  const a = alfa * Math.PI / 180, b = beta * Math.PI / 180, Gk = m * G;
  return { G: Gk, S1: Gk * Math.cos(b) / Math.sin(a + b), S2: Gk * Math.cos(a) / Math.sin(a + b), a, b };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("snorer");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, r;

  function les() {
    inn = {
      alfa: Sim.verdi("alfa", (v) => komma(v, 0) + "°"),
      beta: Sim.verdi("beta", (v) => komma(v, 0) + "°"),
      m: Sim.verdi("masse", (v) => komma(v, 1) + " kg"),
    };
    r = snorkrefter(inn.alfa, inn.beta, inn.m);
    $("r-g").textContent = komma(r.G, 1) + " N";
    $("r-s1").textContent = komma(r.S1, 1) + " N";
    $("r-s2").textContent = komma(r.S2, 1) + " N";
    $("r-x").textContent = komma(r.S1 * Math.cos(r.a), 1) + " N og " + komma(r.S2 * Math.cos(r.b), 1) + " N";
    $("r-y").textContent = komma(r.S1 * Math.sin(r.a) + r.S2 * Math.sin(r.b), 1) + " N";
    tegn();
  }

  function pil(c, x0, y0, x1, y1, farge, navn, tykk = 3) {
    const len = Math.hypot(x1 - x0, y1 - y0); if (len < 3) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = tykk;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * 6, y1 - uy * 6); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * 10 - uy * 5, y1 - uy * 10 + ux * 5); c.lineTo(x1 - ux * 10 + uy * 5, y1 - uy * 10 - ux * 5); c.closePath(); c.fill();
    if (navn) { c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(navn, (x0 + x1) / 2 - uy * 14, (y0 + y1) / 2 + ux * 14); }
  }

  function tegn() {
    if (!l.b || !r) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560, bredde = smal ? l.b : l.b * 0.55;
    // Oppheng: A og B i taket, knuten K under
    const D = bredde - 60, h = Math.min(D / (1 / Math.tan(r.a) + 1 / Math.tan(r.b)), l.h * (smal ? 0.4 : 0.55));
    const skala = h / (D / (1 / Math.tan(r.a) + 1 / Math.tan(r.b)));
    const Dv = D * skala, ax = 30 + (D - Dv) / 2, ay = 26, kx = ax + h / Math.tan(r.a), ky = ay + h, bx = ax + Dv;
    c.strokeStyle = f.blekk; c.lineWidth = 3; c.beginPath(); c.moveTo(16, ay); c.lineTo(bredde - 16, ay); c.stroke();
    c.strokeStyle = f.dempet; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(kx, ky); c.lineTo(bx, ay); c.moveTo(kx, ky); c.lineTo(kx, ky + 30); c.stroke();
    c.fillStyle = f.f2; c.fillRect(kx - 16, ky + 30, 32, 26);
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("α", ax + 26, ay + 4); c.textAlign = "right"; c.fillText("β", bx - 26, ay + 4);
    // Kreftene på knuten
    const maks = Math.max(r.G, r.S1, r.S2), sk = Math.min(110, l.h * 0.3) / maks;
    const u1 = [ax - kx, ay - ky], n1 = Math.hypot(...u1), u2 = [bx - kx, ay - ky], n2 = Math.hypot(...u2);
    pil(c, kx, ky, kx + u1[0] / n1 * r.S1 * sk, ky + u1[1] / n1 * r.S1 * sk, f.f1, "S₁");
    pil(c, kx, ky, kx + u2[0] / n2 * r.S2 * sk, ky + u2[1] / n2 * r.S2 * sk, f.f2, "S₂");
    pil(c, kx, ky, kx, ky + r.G * sk, f.blekk, "G");
    // Kreftene etter hverandre (lukket trekant)
    const ox = smal ? l.b * 0.25 : l.b * 0.62, oy = smal ? l.h * 0.6 : l.h * 0.15;
    const sk2 = Math.min(smal ? l.h * 0.33 : l.h * 0.6, (smal ? l.b : l.b * 0.4) * 0.8) / maks / 1.1;
    const p1 = [ox, oy + r.G * sk2];
    const p2 = [p1[0] + r.S2 * Math.cos(r.b) * sk2, p1[1] - r.S2 * Math.sin(r.b) * sk2];
    pil(c, ox, oy, ...p1, f.blekk, "G", 2.5);
    pil(c, ...p1, ...p2, f.f2, "S₂", 2.5);
    pil(c, ...p2, ox, oy, f.f1, "S₁", 2.5);
    c.fillStyle = f.dempet; c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "bottom";
    c.fillText("Summen er null", ox + (p2[0] - ox) / 2, oy - 8);
  }

  for (const id of ["alfa", "beta", "masse"]) $(id).addEventListener("input", les);
  les();
})();
