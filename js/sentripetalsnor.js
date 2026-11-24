// Sentripetalkraft med snor og rør: En gummipropp svinges rundt, og snora går gjennom et rør ned til et lodd.
// Snordraget er tyngden Mg av loddet, og verktøyet sammenligner med mω²L, der L er snorlengden fra røret til proppen.

const G_SS = 9.81;
Maaletabell({
  rot: "ss", nokkel: "lektorbo-sentripetal-snor", csv: "sentripetalkraft.csv",
  kolonner: [{ k: "M", navn: "Loddet M (g)" }, { k: "t20", navn: "Tid for 20 runder (s)" }],
  beregnet: ["T (s)", "ω² (rad²/s²)", "Mg (N)", "mω²L (N)"],
  innstillinger: ["ss-m", "ss-L"],
  linje: "origo",
  graf: { xTekst: "Mg / N", yTekst: "mω²L / N", xMaks: 2.5, yMaks: 2.5, beskrivelse: "Graf over mω²L mot Mg med en rett linje gjennom origo." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    const m = t(inn["ss-m"]), L = t(inn["ss-L"]);
    for (const r of rader) {
      const M = t(r.M), t20 = t(r.t20);
      const T = t20 ? t20 / 20 : null, w2 = T ? (2 * Math.PI / T) ** 2 : null;
      const F = M !== null ? M / 1000 * G_SS : null;
      const Fs = w2 !== null && m !== null && L !== null ? m / 1000 * w2 * L / 100 : null;
      celler.push([T !== null ? Sim.komma(T, 3) : "", w2 !== null ? Sim.komma(w2, 1) : "", F !== null ? Sim.komma(F, 3) : "", Fs !== null ? Sim.komma(Fs, 3) : ""]);
      if (F !== null && Fs !== null) pkt.push({ x: F, y: Fs });
    }
    return { celler, pkt };
  },
  resultater(fit) {
    return { "ss-stig": fit ? Sim.komma(fit.a, 3) : "–", "ss-avvik": fit ? Sim.komma((fit.a - 1) * 100, 1) + " %" : "–" };
  },
  // Oppdiktede tall: propp på 25 g og snorlengde 60 cm
  eksempel: {
    inn: { "ss-m": "25", "ss-L": "60" },
    rader: [{ M: "50", t20: "22,4" }, { M: "100", t20: "15,8" }, { M: "150", t20: "13,3" }, { M: "200", t20: "11,2" }, { M: "250", t20: "10,0" }],
  },
});
