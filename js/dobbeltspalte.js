// Dobbeltspalte med én partikkel om gangen. Hver partikkel treffer skjermen i ett punkt.
// Sannsynligheten for treffpunktet y følger intensiteten I(y) = cos²(π d y / (λL)) · sinc²(π b y / (λL)) for to spalter.
// Med én spalte, eller når vi måler hvilken spalte partikkelen gikk gjennom, forsvinner cos²-leddet.
// Klinkekuler går rett fram og gir to striper bak spaltene.

const DS_H = 6.626e-34, DS_ME = 9.109e-31, DS_E = 1.602e-19;

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("ds-scene");
  if (!el) return;
  let modus, lam, d, bS, L, oppsett, treff = [], tilgode = 0, halv;
  const ls = Sim.lerret(el, tegnScene);
  const lg = Sim.lerret($("ds-graf"), tegnGraf);

  function les() {
    modus = $("ds-type").value;
    oppsett = $("ds-oppsett").value;
    $("rad-lam").hidden = modus !== "foton";
    $("rad-u").hidden = modus !== "elektron";
    $("rad-oppsett-hvem").hidden = modus === "kule";
    if (modus === "foton") {
      lam = Sim.verdi("ds-lam", (x) => komma(x, 0) + " nm") * 1e-9;
      d = Sim.verdi("ds-d", (x) => komma(x, 2) + " mm") * 1e-3; bS = 0.08e-3; L = 1.0;
    } else if (modus === "elektron") {
      const U = Sim.verdi("ds-u", (x) => komma(x, 0) + " V");
      lam = DS_H / Math.sqrt(2 * DS_ME * DS_E * U);
      d = Sim.verdi("ds-d", (x) => komma(x, 2) + " µm") * 1e-6; bS = 0.08e-6; L = 1.0;
    } else {
      d = Sim.verdi("ds-d", (x) => komma(x * 10, 1) + " cm") * 0.1; lam = 0; bS = 0.004; L = 1.0;
    }
    // Halv skjermbredde: tre ganger bredden av det sentrale maksimumet for én spalte
    halv = modus === "kule" ? Math.max(0.05, d * 1.2) : 2.2 * lam * L / bS;
  }

  // Intensitet (ikke normert) i punktet y på skjermen
  function intensitet(y) {
    if (modus === "kule") {
      const s = bS * 0.8, g = (x) => Math.exp(-((y - x) ** 2) / (2 * s * s));
      return oppsett === "en" ? g(-d / 2) : g(-d / 2) + g(d / 2);
    }
    const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
    const en = sinc(Math.PI * bS * y / (lam * L)) ** 2;
    if (oppsett === "en" || oppsett === "maal") return en;
    return Math.cos(Math.PI * d * y / (lam * L)) ** 2 * en;
  }
  function trekk() {
    for (let i = 0; i < 1000; i++) {
      const y = (Math.random() * 2 - 1) * halv;
      if (Math.random() < intensitet(y)) return y;
    }
    return 0;
  }

  function steg(dt) {
    tilgode += dt * Number($("ds-rate").value);
    while (tilgode >= 1 && treff.length < 20000) { tilgode -= 1; treff.push({ y: trekk(), x: Math.random() }); }
    tegnScene(); tegnGraf(); tall();
    return treff.length < 20000;
  }
  const avspiller = Sim.avspiller({ knapp: $("ds-start"), steg, lerret: el });

  function tegnScene() {
    if (!ls.b) return;
    const c = ls.ctx, f = ls.f, b = ls.b, h = ls.h;
    ls.tom();
    const xs = b * 0.08, xv = b * 0.35, xsk = b * 0.62, sb = b * 0.3, cy = h / 2, sy = (h * 0.42) / halv;
    // Kilde
    c.fillStyle = modus === "foton" ? feFargeDS(lam * 1e9) : modus === "elektron" ? f.f2 : f.dempet;
    c.beginPath(); c.arc(xs, cy, 10, 0, 2 * Math.PI); c.fill();
    c.fillStyle = f.dempet; c.font = "12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText(modus === "foton" ? "lyskilde" : modus === "elektron" ? "elektronkanon" : "kulekaster", xs, cy + 14);
    // Vegg med spalter (spaltene tegnes litt større enn i virkeligheten)
    const ds = Math.min(h * 0.18, 40), bs = 6;
    c.fillStyle = f.blekk;
    const apne = oppsett === "en" ? [-ds / 2] : [-ds / 2, ds / 2];
    let y = h * 0.05;
    for (const a of apne.sort((p, q) => p - q)) { c.fillRect(xv - 3, y, 6, cy + a - bs / 2 - y); y = cy + a + bs / 2; }
    c.fillRect(xv - 3, y, 6, h * 0.95 - y);
    if (oppsett === "maal" && modus !== "kule") {
      c.strokeStyle = f.f1; c.lineWidth = 2;
      for (const a of [-ds / 2, ds / 2]) { c.beginPath(); c.arc(xv + 12, cy + a, 7, 0, 2 * Math.PI); c.stroke(); }
      c.fillStyle = f.f1; c.textAlign = "left"; c.fillText("detektorer", xv + 22, cy + ds / 2 + 6);
    }
    // Skjerm med treff
    c.fillStyle = f.flate; c.fillRect(xsk, h * 0.05, sb, h * 0.9);
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.strokeRect(xsk, h * 0.05, sb, h * 0.9);
    c.fillStyle = modus === "foton" ? feFargeDS(lam * 1e9) : f.f1;
    const r = treff.length > 4000 ? 1 : 1.5;
    for (const t of treff) { const yy = cy - t.y * sy; if (yy > h * 0.05 && yy < h * 0.95) c.fillRect(xsk + 2 + t.x * (sb - 4), yy - r / 2, r, r); }
    c.fillStyle = f.dempet; c.textAlign = "center"; c.fillText("skjerm (sett forfra)", xsk + sb / 2, h * 0.95 + 2);
    // Siste partikkel på vei
    if (avspiller.kjorer && treff.length) {
      const t = treff[treff.length - 1];
      c.strokeStyle = f["rute-sterk"]; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(xs, cy); c.lineTo(xv, cy); c.stroke(); c.setLineDash([]);
    }
  }

  function tegnGraf() {
    if (!lg.b) return;
    const c = lg.ctx, f = lg.f;
    lg.tom();
    const skala = modus === "kule" ? 1e2 : 1e3, enh = modus === "kule" ? "cm" : "mm";
    const nb = 120, boks = new Array(nb).fill(0);
    for (const t of treff) { const i = Math.floor((t.y + halv) / (2 * halv) * nb); if (i >= 0 && i < nb) boks[i]++; }
    const maks = Math.max(1, ...boks);
    const { px, py } = Sim.akser(lg, { x: [-halv * skala, halv * skala], y: [0, 1.1], xTekst: "y / " + enh, yTekst: "andel treff (relativ)" });
    c.fillStyle = f.f1; c.globalAlpha = 0.6;
    boks.forEach((n, i) => { const y0 = -halv + 2 * halv * i / nb; c.fillRect(px(y0 * skala), py(n / maks), px((y0 + 2 * halv / nb) * skala) - px(y0 * skala) - 0.5, py(0) - py(n / maks)); });
    c.globalAlpha = 1;
    if ($("ds-teori").checked) {
      let im = 0; for (let i = 0; i <= 400; i++) im = Math.max(im, intensitet(-halv + 2 * halv * i / 400));
      c.strokeStyle = f.f2; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i <= 400; i++) { const y = -halv + 2 * halv * i / 400; const v = py(intensitet(y) / im); i ? c.lineTo(px(y * skala), v) : c.moveTo(px(y * skala), v); }
      c.stroke();
    }
  }

  function tall() {
    $("ds-n").textContent = String(treff.length);
    $("ds-lambda").textContent = modus === "kule" ? "–" : modus === "foton" ? komma(lam * 1e9, 0) + " nm" : komma(lam * 1e9, 3) + " nm";
    const dy = lam * L / d;
    $("ds-dy").textContent = modus === "kule" || oppsett !== "to" ? "ingen striper" : komma(dy * 1e3, 2) + " mm";
  }

  function nullstill() { avspiller.stopp(); treff = []; tilgode = 0; les(); tegnScene(); tegnGraf(); tall(); }
  for (const id of ["ds-type", "ds-oppsett", "ds-lam", "ds-u", "ds-d"]) $(id).addEventListener("input", nullstill);
  $("ds-teori").addEventListener("input", tegnGraf);
  $("ds-nullstill").addEventListener("click", nullstill);
  nullstill();
})();

function feFargeDS(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else { r = 1; }
  const k = (x) => Math.round(255 * Math.pow(Math.max(0, x), 0.8));
  return `rgb(${k(r)},${k(g)},${k(b)})`;
}
