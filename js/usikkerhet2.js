// Usikkerhet i beregnede størrelser. Resultatet er et produkt av potenser: R = C · x₁^n₁ · x₂^n₂ · …
// Enkel regel: ΔR/R = Σ |nᵢ| Δxᵢ/xᵢ. Kvadratsum: ΔR/R = √Σ (nᵢ Δxᵢ/xᵢ)².
// Monte Carlo: hver måling trekkes fra en normalfordeling med standardavvik Δx, og resultatet regnes ut 5000 ganger.

const FORSOK = {
  pendel: {
    navn: "g fra pendel", resultat: "g", enhet: "m/s²", formel: "g = 4π²L / T²", C: 4 * Math.PI ** 2,
    målinger: [{ id: "L", navn: "lengde L", enhet: "m", n: 1, x: 0.8, dx: 0.005 }, { id: "T", navn: "svingetid T", enhet: "s", n: -2, x: 1.79, dx: 0.02 }],
  },
  fall: {
    navn: "g fra fritt fall", resultat: "g", enhet: "m/s²", formel: "g = 2s / t²", C: 2,
    målinger: [{ id: "s", navn: "fallhøyde s", enhet: "m", n: 1, x: 1.5, dx: 0.01 }, { id: "t", navn: "falltid t", enhet: "s", n: -2, x: 0.553, dx: 0.01 }],
  },
  tetthet: {
    navn: "tetthet til en kloss", resultat: "ρ", enhet: "kg/m³", formel: "ρ = m / (abc)", C: 1,
    målinger: [{ id: "m", navn: "masse m", enhet: "kg", n: 1, x: 0.0612, dx: 0.0001 }, { id: "a", navn: "lengde a", enhet: "m", n: -1, x: 0.050, dx: 0.0005 }, { id: "b", navn: "bredde b", enhet: "m", n: -1, x: 0.040, dx: 0.0005 }, { id: "c", navn: "høyde c", enhet: "m", n: -1, x: 0.012, dx: 0.0005 }],
  },
  fart: {
    navn: "fart", resultat: "v", enhet: "m/s", formel: "v = s / t", C: 1,
    målinger: [{ id: "s", navn: "strekning s", enhet: "m", n: 1, x: 100, dx: 0.5 }, { id: "t", navn: "tid t", enhet: "s", n: -1, x: 12.4, dx: 0.2 }],
  },
};

function beregn(f, verdier) {
  const R = f.C * verdier.reduce((p, v, i) => p * v.x ** f.målinger[i].n, 1);
  const bidrag = verdier.map((v, i) => Math.abs(f.målinger[i].n) * v.dx / Math.abs(v.x));
  const enkel = bidrag.reduce((a, b) => a + b, 0), kvadrat = Math.sqrt(bidrag.reduce((a, b) => a + b * b, 0));
  return { R, bidrag, enkel, kvadrat };
}
function normal() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function monteCarlo(f, verdier, n = 5000) {
  const ut = [];
  for (let k = 0; k < n; k++) ut.push(f.C * verdier.reduce((p, v, i) => p * (v.x + v.dx * normal()) ** f.målinger[i].n, 1));
  const m = ut.reduce((a, b) => a + b, 0) / n, s = Math.sqrt(ut.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1));
  return { ut, m, s };
}

(function () {
  const $ = Sim.$, komma = Sim.komma, tall = Sim.tall;
  const el = $("fordeling");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let f, mc = null;

  const les = (s) => { const v = parseFloat(String(s).replace(",", ".").replace("−", "-")); return isFinite(v) ? v : null; };

  function byggTabell() {
    f = FORSOK[Sim.verdi("forsok")];
    $("formel").textContent = f.formel;
    $("maal-rader").innerHTML = f.målinger.map((m) => `<tr><th scope="row">${m.navn}</th><td><input id="x-${m.id}" type="text" inputmode="decimal" value="${String(m.x).replace(".", ",")}" aria-label="${m.navn}, verdi"></td><td><input id="dx-${m.id}" type="text" inputmode="decimal" value="${String(m.dx).replace(".", ",")}" aria-label="${m.navn}, usikkerhet"></td><td>${m.enhet}</td><td id="b-${m.id}"></td></tr>`).join("");
    mc = null;
    oppdater();
  }

  function verdier() { return f.målinger.map((m) => ({ x: les($("x-" + m.id).value) ?? m.x, dx: Math.abs(les($("dx-" + m.id).value) ?? 0) })); }

  function oppdater() {
    const v = verdier(), r = beregn(f, v);
    const fmt = (rel) => `${f.resultat} = (${tall(r.R, 4)} ± ${tall(r.R * rel, 2)}) ${f.enhet}, ${komma(rel * 100, 1)} %`;
    $("r-verdi").textContent = tall(r.R, 4) + " " + f.enhet;
    $("r-enkel").textContent = fmt(r.enkel);
    $("r-kvadrat").textContent = fmt(r.kvadrat);
    f.målinger.forEach((m, i) => { $("b-" + m.id).textContent = komma(r.bidrag[i] * 100, 2) + " %"; });
    $("r-mc").textContent = mc ? `${f.resultat} = (${tall(mc.m, 4)} ± ${tall(mc.s, 2)}) ${f.enhet}, ${komma(mc.s / mc.m * 100, 1)} %` : "trykk på knappen";
    tegn();
  }

  function tegn() {
    if (!l.b || !f) return;
    const c = l.ctx, fa = l.f;
    l.tom();
    const v = verdier(), r = beregn(f, v), smal = l.b < 560;
    // Søyler for bidragene til venstre
    const sb = smal ? l.b : l.b * 0.38, maks = Math.max(...r.bidrag, 1e-9);
    c.fillStyle = fa.dempet; c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("Bidrag til relativ usikkerhet", 12, 8);
    const rad = Math.min(34, (smal ? l.h * 0.45 : l.h - 40) / f.målinger.length);
    f.målinger.forEach((m, i) => {
      const y = 32 + i * rad, w = (sb - 130) * r.bidrag[i] / maks;
      c.fillStyle = fa.blekk; c.font = "11px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "middle";
      c.fillText(m.id + (Math.abs(m.n) !== 1 ? " (·" + Math.abs(m.n) + ")" : ""), 12, y + rad * 0.35);
      c.fillStyle = fa.f1; c.fillRect(70, y + 4, Math.max(1, w), rad * 0.6);
      c.fillStyle = fa.dempet; c.fillText(komma(r.bidrag[i] * 100, 2) + " %", 76 + w, y + rad * 0.35);
    });
    // Histogram fra Monte Carlo til høyre
    if (!mc) return;
    const x0 = smal ? 10 : sb + 20, y0 = smal ? l.h * 0.5 : 10, b = l.b - x0 - 10, h = l.h - y0 - 30;
    const lo = mc.m - 4 * mc.s, hi = mc.m + 4 * mc.s, n = 40, bøtter = new Array(n).fill(0);
    for (const x of mc.ut) { const k = Math.floor((x - lo) / (hi - lo) * n); if (k >= 0 && k < n) bøtter[k]++; }
    const toppen = Math.max(...bøtter);
    const X = (x) => x0 + (x - lo) / (hi - lo) * b;
    c.fillStyle = fa.f2; c.globalAlpha = 0.75;
    bøtter.forEach((antall, k) => { const hh = antall / toppen * h; c.fillRect(x0 + k * b / n + 1, y0 + h - hh, b / n - 2, hh); });
    c.globalAlpha = 1;
    c.strokeStyle = fa.blekk; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0 + h); c.lineTo(x0 + b, y0 + h); c.stroke();
    // Intervallene fra de to reglene
    const strek = (rel, farge, yy, navn) => {
      c.strokeStyle = farge; c.lineWidth = 2.5; c.beginPath(); c.moveTo(X(r.R * (1 - rel)), yy); c.lineTo(X(r.R * (1 + rel)), yy); c.stroke();
      c.fillStyle = farge; c.font = "11px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(navn, Math.min(X(r.R * (1 + rel)) + 4, x0 + b - 70), yy);
    };
    strek(r.enkel, fa.f1, y0 + 10, "enkel regel");
    strek(r.kvadrat, fa.blekk, y0 + 24, "kvadratsum");
    c.fillStyle = fa.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
    for (const k of [-2, 0, 2]) c.fillText(tall(mc.m + k * mc.s, 3), X(mc.m + k * mc.s), y0 + h + 4);
  }

  $("forsok").addEventListener("input", byggTabell);
  $("maal-rader").addEventListener("input", () => { mc = null; oppdater(); });
  $("simuler").addEventListener("click", () => { mc = monteCarlo(f, verdier()); oppdater(); });
  byggTabell();
})();
