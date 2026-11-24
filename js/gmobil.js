// Mål g med mobilen: Falltiden måles med akustisk stoppeklokke for ulike høyder.
// h = ½gt², så h mot t² gir en rett linje med stigningstall g/2.

Maaletabell({
  rot: "gm", nokkel: "lektorbo-g-mobil", csv: "g-mobil.csv", startRader: 6,
  kolonner: [{ k: "h", navn: "Fallhøyde h (cm)" }, { k: "t", navn: "Falltid t (s)" }],
  beregnet: ["t² (s²)", "g = 2h/t² (m/s²)"],
  linje: "fri",
  graf: { xTekst: "t² / s²", yTekst: "h / m", xMaks: 0.35, yMaks: 1.6, yMin: -0.1, beskrivelse: "Graf over fallhøyden mot kvadratet av falltiden, med en tilpasset rett linje." },
  analyser(rader) {
    const t = Maaletabell.tall, celler = [], pkt = [], g = [];
    for (const r of rader) {
      const h = t(r.h), tid = t(r.t);
      if (tid === null) { celler.push(["", ""]); continue; }
      celler.push([Sim.komma(tid * tid, 4), h !== null && tid ? Sim.komma(2 * h / 100 / (tid * tid), 2) : ""]);
      if (h !== null) { pkt.push({ x: tid * tid, y: h / 100 }); if (tid) g.push(2 * h / 100 / (tid * tid)); }
    }
    return { celler, pkt, g };
  },
  resultater(fit, pkt, inn, s) {
    return {
      "gm-g": fit ? Sim.komma(2 * fit.a, 2) + " m/s²" : "–",
      "gm-b": fit ? Sim.komma(fit.b * 100, 1) + " cm" : "–",
      "gm-snitt": s.g.length ? Sim.komma(s.g.reduce((a, b) => a + b, 0) / s.g.length, 2) + " m/s²" : "–",
    };
  },
  // Oppdiktede tall: g = 9,81 m/s² og en forsinkelse på omtrent 3 ms
  eksempel: {
    rader: [{ h: "40", t: "0,287" }, { h: "60", t: "0,353" }, { h: "80", t: "0,409" }, { h: "100", t: "0,458" }, { h: "120", t: "0,500" }, { h: "150", t: "0,556" }],
  },
});
