// Fotoelektrisk effekt. Lys med bølgelengden λ treffer en metallplate. Hvert foton har energien hf.
// Elektroner slipper løs hvis hf > W (løsrivningsarbeidet), og får kinetisk energi opp til Ek,maks = hf − W.
// En bremsespenning U mellom platene stopper elektroner med Ek < eU. Modell for strømmen:
// Ek er jevnt fordelt mellom 0 og Ek,maks, så andelen som når fram er 1 − eU/Ek,maks.

const FE_H = 4.1357e-15;   // Plancks konstant i eV·s
const FE_C = 2.998e8;
const FE_ME = 9.109e-31, FE_E = 1.602e-19;
// Omtrentlige løsrivningsarbeid i eV. Tabellverdiene varierer litt mellom kilder.
const FE_METALL = { cesium: ["Cesium", 2.1], natrium: ["Natrium", 2.3], kalsium: ["Kalsium", 2.9], sink: ["Sink", 4.3], kobber: ["Kobber", 4.7] };

function feFarge(nm) {
  // Omtrentlig farge for en bølgelengde (synlig 380–750 nm). UV vises som fiolett-grått.
  let r = 0, g = 0, b = 0;
  if (nm < 380) return "rgb(150,120,200)";
  if (nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else { r = 1; }
  const k = (x) => Math.round(255 * Math.pow(x, 0.8));
  return `rgb(${k(r)},${k(g)},${k(b)})`;
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("fe-scene");
  if (!el) return;
  let lam, inten, U, W, punkter = Sim.hent("lektorbo-fotoelektrisk", []), elektroner = [], tilgode = 0;
  const ls = Sim.lerret(el, tegnScene);
  const lg = Sim.lerret($("fe-graf"), tegnGraf);

  function les() {
    lam = Sim.verdi("fe-lam", (x) => komma(x, 0) + " nm");
    inten = Sim.verdi("fe-int", (x) => komma(x, 0) + " %");
    U = Sim.verdi("fe-u", (x) => komma(x, 2) + " V");
    W = FE_METALL[$("fe-metall").value][1];
  }
  const f = () => FE_C / (lam * 1e-9);
  const ef = () => FE_H * f();
  const ekmaks = () => Math.max(0, ef() - W);
  const andel = () => (ekmaks() <= 0 ? 0 : Math.max(0, 1 - U / ekmaks()));
  const strom = () => 2.0 * inten / 100 * andel();   // µA

  // Elektronene i animasjonen. Fart ∝ √Ek, og bremsingen er valgt slik at elektroner med Ek ≥ eU akkurat når fram.
  const D = 1, K = 1.2;
  function steg(dt) {
    if (ekmaks() > 0) {
      tilgode += dt * 60 * inten / 100;
      while (tilgode >= 1) {
        tilgode -= 1;
        const ek = Math.random() * ekmaks();
        elektroner.push({ x: 0, y: 0.15 + 0.7 * Math.random(), v: K * Math.sqrt(ek), ek });
      }
    }
    const a = U > 0 ? K * K * U / (2 * D) : 0;
    for (const e of elektroner) { e.x += e.v * dt; e.v -= a * dt; }
    elektroner = elektroner.filter((e) => e.x >= 0 && e.x <= D);
    tegnScene();
    return true;
  }
  const avspiller = Sim.avspiller({ knapp: $("fe-start"), steg, lerret: el });

  function tegnScene() {
    if (!ls.b) return;
    const c = ls.ctx, fa = ls.f, b = ls.b, h = ls.h;
    ls.tom();
    const x0 = b * 0.25, x1 = b * 0.75, yt = h * 0.18, yb = h * 0.82;
    // Glassrør
    c.strokeStyle = fa["rute-sterk"]; c.lineWidth = 2;
    c.beginPath(); c.roundRect(x0 - 40, yt - 20, x1 - x0 + 80, yb - yt + 40, 40); c.stroke();
    // Katode og anode
    c.fillStyle = fa.f2; c.fillRect(x0 - 8, yt, 8, yb - yt);
    c.fillStyle = fa.blekk; c.fillRect(x1, yt, 6, yb - yt);
    c.fillStyle = fa.dempet; c.font = "12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText(FE_METALL[$("fe-metall").value][0], x0 - 4, yb + 6); c.fillText("samleplate", x1 + 3, yb + 6);
    // Lyset
    const farge = feFarge(lam);
    c.fillStyle = farge; c.globalAlpha = 0.15 + 0.5 * inten / 100;
    c.beginPath(); c.moveTo(b * 0.04, h * 0.04); c.lineTo(x0 - 8, yt); c.lineTo(x0 - 8, yb); c.lineTo(b * 0.04, h * 0.16); c.closePath(); c.fill();
    c.globalAlpha = 1; c.fillStyle = farge; c.beginPath(); c.arc(b * 0.04, h * 0.1, 10, 0, 2 * Math.PI); c.fill();
    c.fillStyle = fa.dempet; c.textAlign = "left"; c.fillText(lam < 380 ? "UV" : "lys", b * 0.04 + 14, h * 0.1 - 6);
    // Elektroner
    c.fillStyle = fa.f1;
    for (const e of elektroner) { c.beginPath(); c.arc(x0 + e.x * (x1 - x0), yt + e.y * (yb - yt), 3, 0, 2 * Math.PI); c.fill(); }
    // Spenning og strøm
    c.fillStyle = fa.blekk; c.font = "13px " + Sim.MONO; c.textAlign = "center";
    c.fillText("bremsespenning " + komma(U, 2) + " V", (x0 + x1) / 2, h * 0.03);
    c.fillText("strøm " + komma(strom(), 2) + " µA", (x0 + x1) / 2, yb + 22);
  }

  function tegnGraf() {
    if (!lg.b) return;
    const c = lg.ctx, fa = lg.f;
    lg.tom();
    const { px, py } = Sim.akser(lg, { x: [0, 16], y: [-5, 6], xTekst: "f / 10¹⁴ Hz", yTekst: "eU / eV" });
    if ($("fe-teori").checked) {
      c.strokeStyle = fa.f2; c.lineWidth = 1.5; c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(px(0), py(-W)); c.lineTo(px(16), py(FE_H * 16e14 - W)); c.stroke(); c.setLineDash([]);
    }
    c.fillStyle = fa.f1;
    for (const p of punkter) { c.beginPath(); c.arc(px(p.f), py(p.u), 5, 0, 2 * Math.PI); c.fill(); }
    // Nåværende innstilling
    c.strokeStyle = fa.blekk; c.lineWidth = 1.5; c.beginPath(); c.arc(px(f() / 1e14), py(U), 6, 0, 2 * Math.PI); c.stroke();
    // Linje gjennom punktene
    if (punkter.length >= 2) {
      const n = punkter.length, mx = punkter.reduce((s, p) => s + p.f, 0) / n, my = punkter.reduce((s, p) => s + p.u, 0) / n;
      let sxy = 0, sxx = 0; for (const p of punkter) { sxy += (p.f - mx) * (p.u - my); sxx += (p.f - mx) ** 2; }
      if (sxx > 0) {
        const a = sxy / sxx, b0 = my - a * mx;
        c.strokeStyle = fa.f1; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px(0), py(b0)); c.lineTo(px(16), py(a * 16 + b0)); c.stroke();
        $("fe-h").textContent = Sim.tall(a / 1e14 * FE_E, 3) + " Js";
        $("fe-w").textContent = komma(-b0, 2) + " eV";
        return;
      }
    }
    $("fe-h").textContent = "–"; $("fe-w").textContent = "–";
  }

  function tall() {
    $("fe-ef").textContent = komma(ef(), 2) + " eV";
    $("fe-ek").textContent = ekmaks() > 0 ? komma(ekmaks(), 2) + " eV" : "ingen elektroner";
    $("fe-v").textContent = ekmaks() > 0 ? Sim.tall(Math.sqrt(2 * ekmaks() * FE_E / FE_ME) / 1000, 3) + " km/s" : "–";
    $("fe-f0").textContent = komma(W / FE_H / 1e14, 2) + " · 10¹⁴ Hz (" + komma(FE_C / (W / FE_H) * 1e9, 0) + " nm)";
    $("fe-i").textContent = komma(strom(), 3) + " µA";
  }

  function oppdater() { les(); tall(); tegnScene(); tegnGraf(); }
  for (const id of ["fe-lam", "fe-int", "fe-u", "fe-metall", "fe-teori"]) $(id).addEventListener("input", oppdater);
  $("fe-metall").addEventListener("change", () => { punkter = []; Sim.lagre("lektorbo-fotoelektrisk", punkter); oppdater(); });
  $("fe-lagre").addEventListener("click", () => { punkter.push({ f: f() / 1e14, u: U }); Sim.lagre("lektorbo-fotoelektrisk", punkter); tegnGraf(); });
  $("fe-tom").addEventListener("click", () => { punkter = []; Sim.lagre("lektorbo-fotoelektrisk", punkter); tegnGraf(); });
  oppdater();
  avspiller.start();
})();
