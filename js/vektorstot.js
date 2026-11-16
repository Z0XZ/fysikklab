// Støt i to dimensjoner. Elevene skriver inn fartskomponenter målt i Tracker, og verktøyet tegner
// bevegelsesmengdevektorene før og etter støtet etter hverandre (hode mot hale) med summen.

function summer(mA, mB, a, b) {
  const px = mA * a.x + mB * b.x, py = mA * a.y + mB * b.y;
  return { px, py, p: Math.hypot(px, py), ek: 0.5 * mA * (a.x ** 2 + a.y ** 2) + 0.5 * mB * (b.x ** 2 + b.y ** 2) };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("vektorer");
  if (!el) return;
  const NOKKEL = "lektorbo-vektorstot";
  const FELT = ["mA", "mB", "aFx", "aFy", "bFx", "bFy", "aEx", "aEy", "bEx", "bEy"];
  const l = Sim.lerret(el, tegn);
  const lagret = Sim.hent(NOKKEL, null);
  if (lagret) for (const id of FELT) $("v-" + id).value = lagret[id] ?? "";

  const tall = (id) => { const v = parseFloat(String($("v-" + id).value).replace(",", ".").replace("−", "-")); return isFinite(v) ? v : 0; };
  let data = null;

  function beregn() {
    const v = Object.fromEntries(FELT.map((id) => [id, tall(id)]));
    data = {
      mA: v.mA, mB: v.mB,
      før: [{ x: v.aFx, y: v.aFy }, { x: v.bFx, y: v.bFy }],
      etter: [{ x: v.aEx, y: v.aEy }, { x: v.bEx, y: v.bEy }],
    };
    const sf = summer(v.mA, v.mB, ...data.før), se = summer(v.mA, v.mB, ...data.etter);
    const p = (s) => `(${komma(s.px, 3)}, ${komma(s.py, 3)})`;
    $("r-pfor").textContent = p(sf) + " kg m/s";
    $("r-petter").textContent = p(se) + " kg m/s";
    $("r-forhold").textContent = sf.p > 1e-9 ? komma(se.p / sf.p * 100, 0) + " %" : "–";
    $("r-ekfor").textContent = komma(sf.ek, 4) + " J";
    $("r-eketter").textContent = komma(se.ek, 4) + " J";
    $("r-ekforhold").textContent = sf.ek > 1e-12 ? komma(se.ek / sf.ek * 100, 0) + " %" : "–";
    Sim.lagre(NOKKEL, Object.fromEntries(FELT.map((id) => [id, $("v-" + id).value])));
    tegn();
  }

  function pil(c, x0, y0, x1, y1, farge, tykk, stiplet) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = tykk; c.setLineDash(stiplet ? [5, 4] : []);
    if (len < 2) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, h = Math.min(10, len * 0.4);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.8, y1 - uy * h * 0.8); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * h - uy * h * 0.5, y1 - uy * h + ux * h * 0.5); c.lineTo(x1 - ux * h + uy * h * 0.5, y1 - uy * h - ux * h * 0.5); c.closePath(); c.fill();
  }

  function tegn() {
    if (!l.b || !data) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    const ruter = smal ? [[0, 0, l.b, l.h / 2], [0, l.h / 2, l.b, l.h / 2]] : [[0, 0, l.b / 2, l.h], [l.b / 2, 0, l.b / 2, l.h]];
    // Felles skala for begge diagrammene
    const pkt = [];
    for (const v of [data.før, data.etter]) {
      const a = { x: data.mA * v[0].x, y: data.mA * v[0].y }, b = { x: data.mB * v[1].x, y: data.mB * v[1].y };
      pkt.push([0, 0], [a.x, a.y], [a.x + b.x, a.y + b.y]);
    }
    const xs = pkt.map((p) => p[0]), ys = pkt.map((p) => p[1]);
    const spenn = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1e-6);
    [["Før støtet", data.før], ["Etter støtet", data.etter]].forEach(([navn, v], k) => {
      const [rx, ry, rb, rh] = ruter[k];
      const skala = Math.min(rb - 60, rh - 60) / spenn;
      const mx = (Math.max(...xs) + Math.min(...xs)) / 2, my = (Math.max(...ys) + Math.min(...ys)) / 2;
      const sx = (x) => rx + rb / 2 + (x - mx) * skala, sy = (y) => ry + rh / 2 + 10 - (y - my) * skala;
      c.fillStyle = f.dempet; c.font = "600 13px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "top";
      c.fillText(navn, rx + 12, ry + 8);
      c.fillStyle = f.blekk; c.beginPath(); c.arc(sx(0), sy(0), 3, 0, 2 * Math.PI); c.fill();
      const a = { x: data.mA * v[0].x, y: data.mA * v[0].y }, b = { x: data.mB * v[1].x, y: data.mB * v[1].y };
      pil(c, sx(0), sy(0), sx(a.x + b.x), sy(a.y + b.y), f.blekk, 2, true);
      pil(c, sx(0), sy(0), sx(a.x), sy(a.y), f.f1, 3);
      pil(c, sx(a.x), sy(a.y), sx(a.x + b.x), sy(a.y + b.y), f.f2, 3);
      if (k === 0 && !smal) { c.strokeStyle = f.rute; c.lineWidth = 1; c.beginPath(); c.moveTo(l.b / 2, 10); c.lineTo(l.b / 2, l.h - 10); c.stroke(); }
      if (k === 0 && smal) { c.strokeStyle = f.rute; c.lineWidth = 1; c.beginPath(); c.moveTo(10, l.h / 2); c.lineTo(l.b - 10, l.h / 2); c.stroke(); }
    });
  }

  for (const id of FELT) $("v-" + id).addEventListener("input", beregn);
  $("v-eksempel").addEventListener("click", () => {
    const eks = { mA: "0,10", mB: "0,10", aFx: "0,80", aFy: "0", bFx: "0", bFy: "0", aEx: "0,38", aEy: "0,37", bEx: "0,40", bEy: "−0,38" };
    for (const id of FELT) $("v-" + id).value = eks[id];
    beregn();
  });
  $("v-tom").addEventListener("click", () => { for (const id of FELT) $("v-" + id).value = ""; beregn(); });
  beregn();
})();
