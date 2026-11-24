// Rekyl med to vogner: Vognene skytes fra hverandre og treffer endeklossene samtidig.
// Da er farten proporsjonal med strekningen, og bevaring av bevegelsesmengde gir d1/d2 = m2/m1.

Maaletabell({
  rot: "rk", nokkel: "lektorbo-rekyl-forsok", csv: "rekyl.csv",
  kolonner: [{ k: "m1", navn: "m<sub>1</sub> (g)" }, { k: "m2", navn: "m<sub>2</sub> (g)" }, { k: "d1", navn: "d<sub>1</sub> (cm)" }, { k: "d2", navn: "d<sub>2</sub> (cm)" }],
  beregnet: ["m<sub>2</sub>/m<sub>1</sub>", "d<sub>1</sub>/d<sub>2</sub>", "forskjell (%)"],
  linje: "origo",
  graf: { xTekst: "m₂/m₁", yTekst: "d₁/d₂", xMaks: 3, yMaks: 3, beskrivelse: "Graf over d₁/d₂ mot m₂/m₁ med en rett linje gjennom origo." },
  analyser(rader) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    for (const r of rader) {
      const m1 = t(r.m1), m2 = t(r.m2), d1 = t(r.d1), d2 = t(r.d2);
      const x = m1 && m2 !== null ? m2 / m1 : null, y = d2 && d1 !== null ? d1 / d2 : null;
      celler.push([x !== null ? Sim.komma(x, 2) : "", y !== null ? Sim.komma(y, 2) : "", x && y !== null ? Sim.komma((y - x) / x * 100, 1) : ""]);
      if (x !== null && y !== null) pkt.push({ x, y });
    }
    return { celler, pkt };
  },
  resultater(fit) {
    return { "rk-stig": fit ? Sim.komma(fit.a, 3) : "–", "rk-avvik": fit ? Sim.komma((fit.a - 1) * 100, 1) + " %" : "–" };
  },
  // Oppdiktede tall
  eksempel: {
    rader: [{ m1: "500", m2: "500", d1: "49,3", d2: "50,8" }, { m1: "500", m2: "750", d1: "59,8", d2: "40,0" }, { m1: "500", m2: "1000", d1: "67,3", d2: "32,7" }, { m1: "500", m2: "1250", d1: "71,2", d2: "29,5" }, { m1: "500", m2: "1500", d1: "74,6", d2: "24,9" }],
  },
});
