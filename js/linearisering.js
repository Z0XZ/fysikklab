// Linearisering: Elevene velger transformasjoner av x og y til punktene ligger på en rett linje,
// og bruker stigningstallet til å finne en fysisk konstant. Datasettene er laget med en modell og
// en fast «tilfeldig» støy, slik at tallene er de samme hver gang.

function frø(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function lagData(xs, fn, rel, seed) { const r = frø(seed); return xs.map((x) => [x, fn(x) * (1 + rel * (2 * r() - 1))]); }

const DATASETT = {
  pendel: {
    navn: "Pendel", x: "L", xe: "m", y: "T", ye: "s",
    data: lagData([0.2, 0.35, 0.5, 0.65, 0.8, 0.95, 1.1], (L) => 2 * Math.PI * Math.sqrt(L / 9.81), 0.012, 11),
    riktig: ["x", "y2"], konstant: (a) => ({ tekst: "g = 4π² / stigningstall", verdi: 4 * Math.PI ** 2 / a, enhet: "m/s²" }),
  },
  fall: {
    navn: "Fritt fall", x: "t", xe: "s", y: "s", ye: "m",
    data: lagData([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], (t) => 0.5 * 9.81 * t * t, 0.025, 5),
    riktig: ["x2", "y"], konstant: (a) => ({ tekst: "g = 2 · stigningstall", verdi: 2 * a, enhet: "m/s²" }),
  },
  leder: {
    navn: "Magnetfelt rundt leder (I = 5,0 A)", x: "r", xe: "m", y: "B", ye: "µT",
    data: lagData([0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.06], (r) => 1.0 / r, 0.03, 23),
    riktig: ["1/x", "y"], konstant: (a) => ({ tekst: "μ₀ = 2π · stigningstall / I", verdi: 2 * Math.PI * a * 1e-6 / 5.0, enhet: "T m/A" }),
  },
  muffins: {
    navn: "Muffinsformer", x: "n", xe: "", y: "vₜ", ye: "m/s",
    data: lagData([1, 2, 3, 4, 5, 6, 7, 8], (n) => 1.1 * Math.sqrt(n), 0.015, 17),
    riktig: ["x", "y2"], konstant: (a) => ({ tekst: "vₜ² for én form = stigningstall", verdi: a, enhet: "m²/s²" }),
  },
};

const TX = { x: (v) => v, x2: (v) => v * v, rot: (v) => Math.sqrt(v), "1/x": (v) => 1 / v, "1/x2": (v) => 1 / (v * v) };
const TY = { y: (v) => v, y2: (v) => v * v, rot: (v) => Math.sqrt(v), "1/y": (v) => 1 / v };
const NAVN_X = { x: (n) => n, x2: (n) => n + "²", rot: (n) => "√" + n, "1/x": (n) => "1/" + n, "1/x2": (n) => "1/" + n + "²" };
const NAVN_Y = { y: (n) => n, y2: (n) => n + "²", rot: (n) => "√" + n, "1/y": (n) => "1/" + n };

function regresjon(p) {
  const n = p.length, mx = p.reduce((s, q) => s + q[0], 0) / n, my = p.reduce((s, q) => s + q[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of p) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  const a = sxy / sxx, b = my - a * mx;
  return { a, b, r2: sxy * sxy / (sxx * syy) };
}

(function () {
  const $ = Sim.$, komma = Sim.komma, tall = Sim.tall;
  const el = $("linplot");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let sett;

  function egneData() {
    const linjer = $("egne").value.split(/\n/).map((s) => s.trim()).filter(Boolean);
    const data = [];
    for (const linje of linjer) {
      const deler = linje.replace(/;/g, "\t").split(/\t|\s+/).map((s) => parseFloat(s.replace(",", ".")));
      if (deler.length >= 2 && isFinite(deler[0]) && isFinite(deler[1])) data.push([deler[0], deler[1]]);
    }
    return { navn: "Egne data", x: "x", xe: "", y: "y", ye: "", data, riktig: null };
  }

  function punkter() {
    const tx = TX[Sim.verdi("tx")], ty = TY[Sim.verdi("ty")];
    return sett.data.map(([x, y]) => [tx(x), ty(y)]).filter(([x, y]) => isFinite(x) && isFinite(y));
  }

  function oppdater() {
    const valg = Sim.verdi("sett");
    sett = valg === "egne" ? egneData() : DATASETT[valg];
    $("rad-egne").hidden = valg !== "egne";
    $("data-rader").innerHTML = sett.data.map(([x, y]) => `<tr><td>${tall(x, 3)}</td><td>${tall(y, 3)}</td></tr>`).join("");
    $("data-hode").innerHTML = `<tr><th scope="col">${sett.x}${sett.xe ? " (" + sett.xe + ")" : ""}</th><th scope="col">${sett.y}${sett.ye ? " (" + sett.ye + ")" : ""}</th></tr>`;
    const p = punkter();
    if (p.length >= 2) {
      const r = regresjon(p);
      $("r-a").textContent = tall(r.a, 4);
      $("r-b").textContent = tall(r.b, 3);
      $("r-r2").textContent = komma(r.r2, 4);
      const tx = Sim.verdi("tx"), ty = Sim.verdi("ty");
      if (sett.riktig && sett.riktig[0] === tx && sett.riktig[1] === ty) {
        const k = sett.konstant(r.a);
        $("r-k").textContent = `${k.tekst}: ${tall(k.verdi, 3)} ${k.enhet}`;
      } else $("r-k").textContent = sett.riktig ? "Finn transformasjonen som gir en rett linje gjennom origo." : "–";
    } else for (const id of ["r-a", "r-b", "r-r2", "r-k"]) $(id).textContent = "–";
    tegn();
  }

  function tegn() {
    if (!l.b || !sett) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const p = punkter();
    if (p.length < 2) return;
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    const x0 = Math.min(0, ...xs), x1 = Math.max(...xs) * 1.08, y0 = Math.min(0, ...ys), y1 = Math.max(...ys) * 1.1;
    const tx = Sim.verdi("tx"), ty = Sim.verdi("ty");
    const { px, py } = Sim.akser(l, { x: [x0, x1 || 1], y: [y0, y1 || 1], xTekst: NAVN_X[tx](sett.x), yTekst: NAVN_Y[ty](sett.y) });
    const r = regresjon(p);
    c.strokeStyle = f.blekk; c.setLineDash([6, 4]); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(px(x0), py(r.a * x0 + r.b)); c.lineTo(px(x1), py(r.a * x1 + r.b)); c.stroke(); c.setLineDash([]);
    c.fillStyle = f.f1;
    for (const [x, y] of p) { c.beginPath(); c.arc(px(x), py(y), 5, 0, 2 * Math.PI); c.fill(); }
  }

  for (const id of ["sett", "tx", "ty"]) $(id).addEventListener("input", oppdater);
  $("egne").addEventListener("input", oppdater);
  oppdater();
})();
