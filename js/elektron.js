// Akselerer et elektron (eller et proton) gjennom spenningen U og sammenlign klassisk og relativistisk fart.
// Etter akselerasjonen går partiklene gjennom et 3 m langt rør sammen med en lyspuls.

const C = 2.99792458e8;
const E_LADNING = 1.602176634e-19;
const PARTIKLER = {
  elektron: { navn: "elektron", m: 9.1093837e-31, mc2eV: 0.51099895e6 },
  proton: { navn: "proton", m: 1.67262192e-27, mc2eV: 938.27209e6 },
};
const ROR_L = 3;

// Fart som andel av c. Ek i eV.
const fartKlassisk = (ekEV, mc2eV) => Math.sqrt(2 * ekEV / mc2eV);
function fartRelativistisk(ekEV, mc2eV) {
  // v/c = √(1 − 1/γ²) med γ = 1 + ε, skrevet slik at det er nøyaktig også når γ er nær 1
  const eps = ekEV / mc2eV;
  return Math.sqrt(eps * (2 + eps)) / (1 + eps);
}

(function () {
  const $ = Sim.$, komma = Sim.komma, tall = Sim.tall;
  const el = $("ror");
  if (!el) return;

  let partikkel, U, tempo, t = 0;
  const ror = Sim.lerret(el, tegnAlt);
  const graf = Sim.lerret($("fartsgraf"), tegnAlt);

  function spenningTekst(u) {
    if (u >= 1e9) return komma(u / 1e9, u < 1e10 ? 2 : 1) + " GV";
    if (u >= 1e6) return komma(u / 1e6, u < 1e7 ? 2 : 1) + " MV";
    if (u >= 1e3) return komma(u / 1e3, u < 1e4 ? 2 : 1) + " kV";
    return komma(u, u < 10 ? 2 : 1) + " V";
  }
  const energiTekst = (ev) => spenningTekst(ev).replace("V", "eV");

  function lesInnstillinger() {
    partikkel = PARTIKLER[Sim.verdi("partikkel")];
    U = 10 ** Sim.verdi("spenning", (s) => spenningTekst(10 ** s));
    tempo = Number(Sim.verdi("tempo"));
  }

  const lysTid = ROR_L / C;           // 10 ns
  const visTid = () => lysTid * 2.2;  // Kappløpet vises til lyset har gått rørets lengde 2,2 ganger

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    t = 0;
    tegnAlt();
  }
  function steg(dt) {
    t = Math.min(visTid(), t + dt * tempo * lysTid / 2.5);
    tegnAlt();
    return t < visTid();
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function tegnRor() {
    const c = ror.ctx, f = ror.f;
    ror.tom();
    const venstre = 112, hoyre = ror.b - 18, baner = 3, hb = (ror.h - 34) / baner;
    const sx = (s) => venstre + Math.min(1.04, s / ROR_L) * (hoyre - venstre) / 1.04;
    const bk = fartKlassisk(U, partikkel.mc2eV), br = fartRelativistisk(U, partikkel.mc2eV);
    const rader = [
      { navn: "Lys", b: 1, farge: f.blekk },
      { navn: "Klassisk", b: bk, farge: f.f1 },
      { navn: "Relativistisk", b: br, farge: f.f2 },
    ];
    c.font = "12px " + Sim.MONO;
    // Mållinje
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(sx(ROR_L), 8); c.lineTo(sx(ROR_L), ror.h - 22); c.stroke(); c.setLineDash([]);
    c.fillStyle = f.dempet; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText("3,0 m", sx(ROR_L), ror.h - 18);
    c.fillText("0", sx(0), ror.h - 18);

    rader.forEach((r, i) => {
      const y = 10 + hb * (i + 0.5);
      c.strokeStyle = f.rute; c.lineWidth = 1;
      c.beginPath(); c.moveTo(sx(0), y); c.lineTo(sx(ROR_L * 1.04), y); c.stroke();
      c.fillStyle = r.farge; c.font = "600 13px " + Sim.SANS; c.textAlign = "right"; c.textBaseline = "middle";
      c.fillText(r.navn, venstre - 12, y);
      const s = r.b * C * t;
      const x = sx(s);
      if (i === 0) {
        c.strokeStyle = r.farge; c.lineWidth = 3;
        c.beginPath(); c.moveTo(Math.max(sx(0), x - 26), y); c.lineTo(x, y); c.stroke();
      } else {
        c.fillStyle = r.farge;
        c.beginPath(); c.arc(x, y, 6, 0, 2 * Math.PI); c.fill();
      }
      // Tid i mål
      const tMal = ROR_L / (r.b * C);
      c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.fillStyle = f.dempet; c.textBaseline = "bottom";
      if (t >= tMal) c.fillText(komma(tMal * 1e9, 2) + " ns" + (r.b > 1 ? "  raskere enn lyset!" : ""), sx(0) + 4, y - 7);
    });
  }

  function tegnGraf() {
    const c = graf.ctx, f = graf.f;
    graf.tom();
    const uMin = 1, uMaks = 1e9;
    const { px, py } = Sim.akser(graf, {
      x: [uMin, uMaks], y: [0, 1.6], logX: true, ySteg: 0.2, xTekst: "U", yTekst: "v / c",
      xMerke: (u) => (Math.round(Math.log10(u)) % 3 === 0 ? spenningTekst(u).replace(",00", "") : ""), marg: { v: 40, n: 28 },
    });
    // Lysfarten
    c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.setLineDash([6, 4]);
    c.beginPath(); c.moveTo(px(uMin), py(1)); c.lineTo(px(uMaks), py(1)); c.stroke(); c.setLineDash([]);
    c.fillStyle = f.blekk; c.font = "11px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "bottom";
    c.fillText("c", px(uMin) + 4, py(1) - 2);
    const kurve = (fn, farge) => {
      c.strokeStyle = farge; c.lineWidth = 2.5; c.beginPath();
      let start = true;
      for (let e = 0; e <= 9.0001; e += 0.02) {
        const b = fn(10 ** e, partikkel.mc2eV);
        if (b > 1.6) break;
        start ? c.moveTo(px(10 ** e), py(b)) : c.lineTo(px(10 ** e), py(b));
        start = false;
      }
      c.stroke();
    };
    kurve(fartKlassisk, f.f1);
    kurve(fartRelativistisk, f.f2);
    // Valgt spenning
    c.strokeStyle = f.dempet; c.lineWidth = 1;
    c.beginPath(); c.moveTo(px(U), py(0)); c.lineTo(px(U), py(1.6)); c.stroke();
    for (const [fn, farge] of [[fartKlassisk, f.f1], [fartRelativistisk, f.f2]]) {
      const b = fn(U, partikkel.mc2eV);
      if (b > 1.6) continue;
      c.fillStyle = farge; c.beginPath(); c.arc(px(U), py(b), 5, 0, 2 * Math.PI); c.fill();
    }
  }

  function oppdaterTall() {
    const mc2 = partikkel.mc2eV, ekJ = U * E_LADNING, g = 1 + U / mc2;
    const bk = fartKlassisk(U, mc2), br = fartRelativistisk(U, mc2);
    $("ek").textContent = energiTekst(U);
    $("ek-j").textContent = tall(ekJ, 3) + " J";
    $("gamma").textContent = g < 1.001 ? komma(g, 6) : komma(g, 3);
    $("hvile").textContent = energiTekst(mc2);
    for (const [id, b, p] of [["k", bk, partikkel.m * bk * C], ["r", br, g * partikkel.m * br * C]]) {
      $(id + "-andel").textContent = b < 0.001 ? tall(b, 3) + "c" : komma(b, 4) + "c";
      $(id + "-fart").textContent = tall(b * C, 4) + " m/s";
      $(id + "-p").textContent = tall(p, 3) + " kg·m/s";
      $(id + "-tid").textContent = tall(ROR_L / (b * C) * 1e9, 3) + " ns";
    }
    $("avvik").textContent = komma((bk / br - 1) * 100, (bk / br - 1) * 100 < 1 ? 3 : 1) + " %";
    $("navn-partikkel").textContent = partikkel.navn;
  }

  function tegnAlt() {
    if (!partikkel) return;
    if (ror.b) tegnRor();
    if (graf.b) tegnGraf();
    oppdaterTall();
  }

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["partikkel", "spenning"]) $(id).addEventListener("input", nullstill);
  $("tempo").addEventListener("input", () => { tempo = Number(Sim.verdi("tempo")); });

  nullstill();
  ror.tilpass();
  graf.tilpass();
})();
