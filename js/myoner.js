// Myoner fra atmosfæren. 1000 myoner lages høyt oppe og går rett ned mot bakken.
// Hvert myon får en tilfeldig levetid i sitt eget system, trukket fra eksponentialfordelingen.
// Enheter: meter og mikrosekunder.

const C = 299.792458;   // m/µs
const TAU = 2.197;      // Myonets midlere levetid i µs
const N0 = 1000;
const gamma = (b) => 1 / Math.sqrt(1 - b * b);

// Forventet antall som når bakken. Med relativitet går myonets klokke γ ganger saktere.
function forventet(H, beta, relativistisk) {
  const t = H / (beta * C);
  return N0 * Math.exp(-t / (relativistisk ? gamma(beta) * TAU : TAU));
}

function lagMyoner() {
  return Array.from({ length: N0 }, () => ({ x: Math.random(), j: Math.random(), tau: -TAU * Math.log(1 - Math.random()) }));
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("myoner");
  if (!el) return;

  let H, beta, system, tempo, myoner = lagMyoner(), t = 0;
  const l = Sim.lerret(el, tegn);

  function lesInnstillinger() {
    H = Sim.verdi("hoyde", (v) => komma(v, 1) + " km") * 1000;
    beta = Sim.verdi("fart", (v) => komma(v, 3) + "c");
    system = Sim.verdi("system");
    tempo = Number(Sim.verdi("tempo"));
  }

  // Varigheten av turen i valgt system for hver kolonne (0: uten, 1: med relativitet)
  function turTid(kol) {
    const tJord = H / (beta * C);
    return system === "myon" && kol === 1 ? tJord / gamma(beta) : tJord;
  }
  // Tiden et myon henfaller på, målt i valgt system
  function henfallTid(m, kol) {
    if (kol === 0 || system === "myon") return m.tau;
    return gamma(beta) * m.tau;
  }
  const tSlutt = () => Math.max(turTid(0), turTid(1));

  function nullstill(nyeMyoner) {
    avspiller.stopp();
    lesInnstillinger();
    if (nyeMyoner) myoner = lagMyoner();
    t = 0;
    tegn();
  }

  function steg(dt) {
    t = Math.min(tSlutt(), t + dt * tempo * tSlutt() / 7);
    tegn();
    return t < tSlutt();
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill: () => nullstill(true), lerret: el });

  function telling(kol) {
    const tt = turTid(kol);
    let lufta = 0, bakken = 0;
    for (const m of myoner) {
      const th = henfallTid(m, kol);
      if (th >= tt) { if (t >= tt) bakken++; else lufta++; }
      else if (t < th) lufta++;
    }
    return { lufta, bakken, henfalt: N0 - lufta - bakken };
  }

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const venstre = 46, gap = 18, toppY = 34, bunnY = l.h - 22;
    const kolB = (l.b - venstre - gap - 8) / 2;
    const yAv = (hoyde) => bunnY - hoyde / H * (bunnY - toppY);
    const band = Math.min(14, (bunnY - toppY) * 0.05);

    // Høydeakse i km
    c.font = "11px " + Sim.MONO;
    const s = Sim.steglengde(H / 1000);
    c.fillStyle = f.dempet; c.textAlign = "right"; c.textBaseline = "middle";
    c.strokeStyle = f.rute; c.lineWidth = 1;
    for (let k = 0; k * s <= H / 1000 + 1e-9; k++) {
      const y = yAv(k * s * 1000);
      c.beginPath(); c.moveTo(venstre, y); c.lineTo(l.b - 8, y); c.stroke();
      c.fillText(komma(k * s, s < 1 ? 1 : 0), venstre - 6, y);
    }
    c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("km", 4, 4);

    for (const kol of [0, 1]) {
      const x0 = venstre + kol * (kolB + gap), farge = kol === 0 ? f.f1 : f.f2;
      const tt = turTid(kol), myonSys = system === "myon";
      c.fillStyle = farge; c.font = "600 13px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "top";
      c.fillText(kol === 0 ? "Uten relativitet" : "Med relativitet", x0 + 4, 4);

      // I myonenes system står myonene stille øverst, og bakken kommer mot dem
      let bakkeY = bunnY;
      if (myonSys) {
        const avstand = (kol === 1 ? H / gamma(beta) : H) - beta * C * t;
        bakkeY = yAv(H - Math.max(0, avstand));
        if (kol === 1) {
          c.fillStyle = farge; c.globalAlpha = 0.08;
          c.fillRect(x0, yAv(H), kolB, bakkeY - yAv(H));
          c.globalAlpha = 1;
        }
      }
      c.strokeStyle = f.blekk; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0, bakkeY); c.lineTo(x0 + kolB, bakkeY); c.stroke();
      c.lineWidth = 1;
      for (let x = x0 + 4; x < x0 + kolB; x += 8) { c.beginPath(); c.moveTo(x, bakkeY); c.lineTo(x - 5, bakkeY + 6); c.stroke(); }

      // Myonene
      for (const m of myoner) {
        const th = henfallTid(m, kol), x = x0 + 3 + m.x * (kolB - 6);
        const lever = t < th, fremme = th >= tt && t >= tt;
        let y;
        if (fremme) y = bakkeY - 3 - m.j * 6;
        else if (myonSys) y = yAv(H) + m.j * band;
        else y = yAv(H - beta * C * Math.min(t, th)) + m.j * band;
        if (lever || fremme) { c.fillStyle = farge; c.fillRect(x - 1.25, y - 1.25, 2.5, 2.5); }
        else if (!myonSys) { c.fillStyle = f["rute-sterk"]; c.fillRect(x - 0.75, y - 0.75, 1.5, 1.5); }
      }
    }
    oppdaterTall();
  }

  function oppdaterTall() {
    const g = gamma(beta), tJord = H / (beta * C);
    $("tid").textContent = komma(t, 2) + " µs";
    $("gamma").textContent = komma(g, 2);
    $("t-jord").textContent = komma(tJord, 1) + " µs";
    $("l-myon").textContent = komma(H / g / 1000, 2) + " km";
    for (const kol of [0, 1]) {
      const id = kol === 0 ? "u" : "m", n = telling(kol);
      $(id + "-tid").textContent = komma(kol === 0 ? tJord : tJord / g, 2) + " µs";
      $(id + "-forventet").textContent = komma(forventet(H, beta, kol === 1), forventet(H, beta, kol === 1) < 10 ? 2 : 0);
      $(id + "-lufta").textContent = n.lufta;
      $(id + "-bakken").textContent = n.bakken;
      $(id + "-henfalt").textContent = n.henfalt;
    }
  }

  $("nullstill").addEventListener("click", () => nullstill(true));
  for (const id of ["hoyde", "fart", "system"]) $(id).addEventListener("input", () => nullstill(false));
  $("tempo").addEventListener("input", () => { tempo = Number(Sim.verdi("tempo")); });

  nullstill(false);
  l.tilpass();
})();
