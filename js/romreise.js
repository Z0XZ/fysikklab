// Romreise: Et romskip reiser med konstant fart v fra Jorda til en stjerne i avstanden D (i jordas system).
// Jordas system: tiden er t = D/v. Skipets system: avstanden er D/γ, og reisetiden er τ = D/(γv) = t/γ.
// Akselerasjon og oppbremsing er ikke med. Enheter: lysår og år, så c = 1.

const MAL = {
  alfa: { navn: "Alfa Centauri", D: 4.37 },
  sirius: { navn: "Sirius", D: 8.6 },
  vega: { navn: "Vega", D: 25 },
  trappist: { navn: "TRAPPIST-1", D: 40.7 },
  sentrum: { navn: "sentrum av Melkeveien", D: 26000 },
};
const gamma = (b) => 1 / Math.sqrt(1 - b * b);
function reise(D, b) { const g = gamma(b), t = D / b; return { g, t, tau: t / g, Dskip: D / g }; }
// Farten som gir reisetiden tau på skipsklokka: βγ = D/τ
function fartFor(D, tau) { const k = D / tau; return k / Math.sqrt(1 + k * k); }

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("rom");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("romgraf"), tegn);
  let inn, r, andel = 0;

  const år = (x) => (x >= 1000 ? Sim.tall(x, 3) : komma(x, x < 10 ? 2 : 1)) + " år";
  const lysår = (x) => (x >= 1000 ? Sim.tall(x, 3) : komma(x, x < 10 ? 2 : 1)) + " lysår";

  function les() {
    const ekstrem = $("ekstrem").checked, s = $("fart");
    if (ekstrem && Number(s.min) < 0.99) { s.min = 0.99; s.max = 0.99999; s.step = 0.00001; s.value = 0.999; }
    if (!ekstrem && Number(s.min) >= 0.99) { s.min = 0.1; s.max = 0.99; s.step = 0.01; s.value = 0.9; }
    const b = Sim.verdi("fart", (v) => (ekstrem ? komma(v, 5) : komma(v, 2)) + "c");
    const m = MAL[Sim.verdi("mal")];
    inn = { b, m, sys: Sim.verdi("system"), alder: Sim.verdi("alder", (v) => v + " år") };
    r = reise(m.D, b);
  }
  function nullstill() { avspiller.stopp(); les(); andel = 0; oppdater(); }
  function steg(dt) { andel = Math.min(1, andel + dt / 5); oppdater(); return andel < 1; }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f, smal = l.b < 560;
    l.tom();
    const marg = smal ? 30 : 60, y = l.h * 0.55, full = l.b - 2 * marg;
    // Lengden av strekningen på skjermen: full lengde i jordas system, D/γ i skipets system
    const lengde = inn.sys === "jord" ? full : full / r.g;
    let jordX, stjerneX, skipX;
    if (inn.sys === "jord") { jordX = marg; stjerneX = marg + full; skipX = marg + andel * full; }
    else { skipX = marg + full * 0.12; jordX = skipX - andel * lengde; stjerneX = jordX + lengde; }
    // Linjal i lysår mellom Jorda og stjerna, kontrahert i skipets system
    const steg = Sim.steglengde(inn.m.D, smal ? 4 : 8);
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.fillStyle = f.dempet; c.font = "10px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
    c.beginPath(); c.moveTo(jordX, y + 22); c.lineTo(stjerneX, y + 22); c.stroke();
    for (let d = 0; d <= inn.m.D + 1e-9; d += steg) {
      const x = jordX + d / inn.m.D * lengde; c.beginPath(); c.moveTo(x, y + 18); c.lineTo(x, y + 26); c.stroke();
      if (lengde > 120 || d === 0) c.fillText(komma(d, steg < 1 ? 1 : 0), x, y + 30);
    }
    c.textAlign = "right"; c.fillText("lysår (målt fra Jorda)", stjerneX, y + 44);
    // Jorda, stjerna og skipet
    c.fillStyle = f.f2; c.beginPath(); c.arc(jordX, y, 10, 0, 2 * Math.PI); c.fill();
    c.fillStyle = f.f1; c.beginPath(); c.arc(stjerneX, y, 9, 0, 2 * Math.PI); c.fill();
    c.strokeStyle = f.f1; c.lineWidth = 1.5; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.beginPath(); c.moveTo(stjerneX + Math.cos(a) * 11, y + Math.sin(a) * 11); c.lineTo(stjerneX + Math.cos(a) * 16, y + Math.sin(a) * 16); c.stroke(); }
    c.fillStyle = f.blekk; c.beginPath(); c.moveTo(skipX + 12, y - 26); c.lineTo(skipX - 10, y - 32); c.lineTo(skipX - 10, y - 20); c.closePath(); c.fill();
    c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "bottom";
    c.fillStyle = f.f2; c.fillText("Jorda", jordX, y - 14);
    c.fillStyle = f.f1; c.fillText(inn.m.navn, Math.min(l.b - 50, stjerneX), y - 18);
    // Klokker
    const tJord = andel * r.t, tSkip = andel * r.tau;
    c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top"; c.fillStyle = f.dempet;
    c.fillText(inn.sys === "jord" ? "Jordas system: Skipet beveger seg" : "Skipets system: Jorda og stjerna beveger seg", 10, 8);
    if (inn.sys === "jord") {
      c.fillStyle = f.f2; c.fillText("Jordklokka: " + år(tJord), 10, 26);
      c.fillStyle = f.blekk; c.fillText("Skipsklokka: " + år(tSkip), 10, 44);
    } else {
      // I skipets system går klokkene på Jorda og ved stjerna saktere, og de er ikke synkronisert.
      // Derfor vises bare skipsklokka her.
      c.fillStyle = f.blekk; c.fillText("Skipsklokka: " + år(tSkip), 10, 26);
      c.fillStyle = f.dempet; if (!smal) c.fillText("(Klokkene på Jorda og ved stjerna er ikke synkronisert i dette systemet.)", 10, 44);
    }
    c.fillStyle = f.dempet; c.textAlign = "right"; c.fillText("avstand: " + lysår(inn.sys === "jord" ? inn.m.D : r.Dskip), l.b - 10, 8);
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const tMaks = inn.m.D / 0.1;
    const { px, py } = Sim.akser(l, { x: [0, 1], y: [0, Math.min(tMaks, inn.m.D * 4)], xTekst: "v / c", yTekst: "reisetid / år" });
    for (const [fn, farge] of [[(b) => inn.m.D / b, f.f2], [(b) => inn.m.D / b / gamma(b), f.blekk]]) {
      c.strokeStyle = farge; c.lineWidth = 2.5; c.beginPath(); let start = true;
      for (let i = 1; i < 1000; i++) { const b = i / 1000, y = fn(b); if (y > inn.m.D * 4) continue; start ? c.moveTo(px(b), py(y)) : c.lineTo(px(b), py(y)); start = false; }
      c.stroke();
    }
    c.fillStyle = f.f1; for (const y of [r.t, r.tau]) if (y <= inn.m.D * 4) { c.beginPath(); c.arc(px(inn.b), py(y), 5, 0, 2 * Math.PI); c.fill(); }
  }

  function tegn() { if (!r) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    $("r-gamma").textContent = Sim.tall(r.g, 4);
    $("r-djord").textContent = lysår(inn.m.D);
    $("r-dskip").textContent = lysår(r.Dskip);
    $("r-tjord").textContent = år(r.t);
    $("r-tskip").textContent = år(r.tau);
    $("r-alder").textContent = `${komma(inn.alder + r.tau, 1)} år (på Jorda har det gått ${år(r.t)})`;
    tegn();
  }

  for (const id of ["fart", "mal", "system", "alder", "ekstrem"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
