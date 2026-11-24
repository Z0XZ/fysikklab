// Statisk elektrisitet: To like store kuler henger i tråder fra samme punkt og har fått like stor ladning.
// De frastøter hverandre til avstanden d. Hver tråd danner vinkelen θ med loddlinja, der sin θ = (d/2)/L.
// Kraftbalanse: F_e = mg tan θ. Coulombs lov med like ladninger: F_e = kq²/d², så q = d√(F_e/k).

const ST_K = 8.99e9, ST_G = 9.81, ST_E = 1.602e-19;
Maaletabell({
  rot: "st", nokkel: "lektorbo-statisk", csv: "statisk-elektrisitet.csv",
  kolonner: [{ k: "d", navn: "Avstand mellom kulene d (cm)" }],
  beregnet: ["vinkel θ (°)", "F<sub>e</sub> = mg tan θ (mN)", "ladning q (nC)", "elektroner for mye eller for lite"],
  innstillinger: ["st-m", "st-L"],
  linje: "uten-graf",
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], qs = [];
    const m = t(inn["st-m"]), L = t(inn["st-L"]);
    for (const r of rader) {
      const d = t(r.d);
      if (d === null || !m || !L || d / 2 >= L) { celler.push(["", "", "", ""]); continue; }
      const th = Math.asin((d / 2) / L), F = (m / 1000) * ST_G * Math.tan(th), q = (d / 100) * Math.sqrt(F / ST_K);
      qs.push(q);
      celler.push([Sim.komma(th * 180 / Math.PI, 1), Sim.komma(F * 1000, 3), Sim.komma(q * 1e9, 2), Sim.tall(q / ST_E, 2)]);
    }
    return { celler, pkt: [], qs };
  },
  resultater(fit, pkt, inn, s) {
    const snitt = s.qs.length ? s.qs.reduce((a, b) => a + b, 0) / s.qs.length : null;
    return {
      "st-q": snitt !== null ? Sim.komma(snitt * 1e9, 2) + " nC" : "–",
      "st-n": snitt !== null ? Sim.tall(snitt / ST_E, 2) + " elektroner" : "–",
      "st-fall": s.qs.length > 1 ? Sim.komma((1 - s.qs[s.qs.length - 1] / s.qs[0]) * 100, 0) + " %" : "–",
    };
  },
  // Oppdiktede tall: to aluminiumskuler på 0,12 g i tråder på 30 cm. Ladningen lekker sakte ut mellom målingene.
  eksempel: { inn: { "st-m": "0,12", "st-L": "30" }, rader: [{ d: "5,2" }, { d: "4,8" }, { d: "4,5" }, { d: "4,1" }, { d: "3,6" }] },
});
