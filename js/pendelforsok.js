// Pendelens svingetid: Tiden for ti svingninger måles for ulike snorlengder.
// Modellen T = 2π√(L/g) gir T² = (4π²/g) · L, en rett linje gjennom origo.

Maaletabell({
  rot: "pe", nokkel: "lektorbo-pendel-forsok", csv: "pendel.csv", startRader: 6,
  kolonner: [{ k: "L", navn: "Lengde L (cm)" }, { k: "t10", navn: "Tid for 10 svingninger (s)" }],
  beregnet: ["T (s)", "T² (s²)"],
  linje: "origo",
  graf: { xTekst: "L / m", yTekst: "T² / s²", xMaks: 1.2, yMaks: 5, beskrivelse: "Graf over T² mot L med en rett linje gjennom origo." },
  analyser(rader) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    for (const r of rader) {
      const L = t(r.L), t10 = t(r.t10);
      if (t10 === null) { celler.push(["", ""]); continue; }
      const T = t10 / 10;
      celler.push([Sim.komma(T, 3), Sim.komma(T * T, 3)]);
      if (L !== null) pkt.push({ x: L / 100, y: T * T });
    }
    return { celler, pkt };
  },
  resultater(fit) {
    const g = fit && fit.a > 0 ? 4 * Math.PI ** 2 / fit.a : null;
    return {
      "pe-stig": fit ? Sim.komma(fit.a, 3) + " s²/m" : "–",
      "pe-g": g !== null ? Sim.komma(g, 2) + " m/s²" : "–",
      "pe-avvik": g !== null ? Sim.komma((g - 9.81) / 9.81 * 100, 1) + " %" : "–",
    };
  },
  // Oppdiktede tall
  eksempel: {
    rader: [{ L: "20", t10: "8,93" }, { L: "40", t10: "12,70" }, { L: "60", t10: "15,55" }, { L: "80", t10: "17,99" }, { L: "100", t10: "20,20" }, { L: "120", t10: "21,93" }],
  },
});
