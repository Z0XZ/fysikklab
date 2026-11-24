// Fritt fall med mobilen: Akselerometeret viser nesten null mens mobilen faller fritt.
// Varigheten t av «null-platået» og fallhøyden h gir g = 2h/t². Grafen h mot t² har stigningstall g/2.

Maaletabell({
  rot: "ff", nokkel: "lektorbo-fritt-fall-mobil", csv: "fritt-fall-mobil.csv",
  kolonner: [{ k: "h", navn: "Fallhøyde h (cm)" }, { k: "t", navn: "Tid med a ≈ 0 (s)" }],
  beregnet: ["t² (s²)", "g = 2h/t² (m/s²)"],
  linje: "origo",
  graf: { xTekst: "t² / s²", yTekst: "h / m", xMaks: 0.25, yMaks: 1.2, beskrivelse: "Graf over fallhøyden mot kvadratet av falltiden, med en rett linje gjennom origo." },
  analyser(rader) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    for (const r of rader) {
      const h = t(r.h), tid = t(r.t);
      if (h === null || !tid) { celler.push(["", ""]); continue; }
      celler.push([Sim.komma(tid * tid, 4), Sim.komma(2 * h / 100 / (tid * tid), 2)]);
      pkt.push({ x: tid * tid, y: h / 100 });
    }
    return { celler, pkt };
  },
  resultater(fit) {
    return { "ff-g": fit ? Sim.komma(2 * fit.a, 2) + " m/s²" : "–" };
  },
  // Oppdiktede tall
  eksempel: { rader: [{ h: "50", t: "0,32" }, { h: "70", t: "0,38" }, { h: "90", t: "0,43" }, { h: "110", t: "0,47" }] },
});
