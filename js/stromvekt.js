// Strømvekt: En magnet står på en vekt, og en leder går gjennom magnetfeltet uten å røre magneten.
// Kraften på lederen er F = BIL, og magneten får like stor kraft motsatt vei (Newtons tredje lov), som vekta viser.

const G_SV = 9.81;
Maaletabell({
  rot: "sv", nokkel: "lektorbo-stromvekt", csv: "stromvekt.csv", startRader: 6,
  kolonner: [{ k: "I", navn: "Strøm I (A)" }, { k: "m", navn: "Vekta viser (g)" }],
  beregnet: ["Δm (g)", "F = Δm · g (mN)"],
  innstillinger: ["sv-m0", "sv-L"],
  linje: "origo",
  graf: { xTekst: "I / A", yTekst: "F / mN", xMaks: 3, yMaks: 12, beskrivelse: "Graf over kraften mot strømmen, med en rett linje gjennom origo." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    const m0 = t(inn["sv-m0"]);
    for (const r of rader) {
      const I = t(r.I), m = t(r.m);
      const dm = m !== null && m0 !== null ? m - m0 : null;
      const F = dm !== null ? dm / 1000 * G_SV * 1000 : null;
      celler.push([dm !== null ? Sim.komma(dm, 2) : "", F !== null ? Sim.komma(F, 2) : ""]);
      if (I !== null && F !== null) pkt.push({ x: I, y: F });
    }
    return { celler, pkt };
  },
  resultater(fit, pkt, inn) {
    const L = Maaletabell.tall(inn["sv-L"]);
    return {
      "sv-stig": fit ? Sim.komma(fit.a, 2) + " mN/A" : "–",
      "sv-B": fit && L ? Sim.komma(Math.abs(fit.a) / 1000 / (L / 100) * 1000, 0) + " mT" : "–",
    };
  },
  // Oppdiktede tall: B = 80 mT og L = 5,0 cm
  eksempel: {
    inn: { "sv-m0": "152,30", "sv-L": "5,0" },
    rader: [{ I: "0,5", m: "152,50" }, { I: "1,0", m: "152,70" }, { I: "1,5", m: "152,92" }, { I: "2,0", m: "153,14" }, { I: "2,5", m: "153,32" }, { I: "3,0", m: "153,53" }],
  },
});
