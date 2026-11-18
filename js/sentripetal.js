// Sentripetalakselerasjon med mobilen: Eleven skriver inn ω og a fra phyphox.
// Verktøyet plotter a mot ω² og tilpasser a = r · ω² gjennom origo. Stigningstallet er radien til sensoren.

Maaletabell({
  rot: "sentripetal", nokkel: "lektorbo-sentripetal", csv: "sentripetalakselerasjon.csv",
  kolonner: [{ k: "w", navn: "ω (rad/s)" }, { k: "a", navn: "a (m/s²)" }],
  beregnet: ["ω² (rad²/s²)", "a/ω² (cm)"],
  innstillinger: ["r-maalt"],
  linje: "origo",
  graf: { xTekst: "ω² / (rad/s)²", yTekst: "a / (m/s²)", xMaks: 100, yMaks: 10, beskrivelse: "Graf over a mot ω² med en rett linje gjennom origo." },
  analyser(rader) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    for (const r of rader) {
      const w = t(r.w), a = t(r.a);
      if (w === null) { celler.push(["", ""]); continue; }
      celler.push([Sim.komma(w * w, 1), a !== null && w !== 0 ? Sim.komma(a / (w * w) * 100, 2) : ""]);
      if (a !== null) pkt.push({ x: w * w, y: a });
    }
    return { celler, pkt };
  },
  resultater(fit, pkt, inn) {
    const m = Maaletabell.tall(inn["r-maalt"]);
    return {
      "s-r": fit ? Sim.komma(fit.a * 100, 2) + " cm" : "–",
      "s-maalt": m !== null ? Sim.komma(m, 1) + " cm" : "–",
      "s-diff": fit && m !== null ? Sim.komma(Math.abs(m - fit.a * 100), 1) + " cm " + (fit.a * 100 < m ? "nærmere aksen" : "lenger ut") : "–",
    };
  },
  // Oppdiktede tall: r = 7,0 cm og 3 % støy
  eksempel: {
    inn: { "r-maalt": "7,0" },
    rader: [{ w: "8,1", a: "4,9" }, { w: "11,4", a: "8,4" }, { w: "14,0", a: "13,9" }, { w: "16,8", a: "19,4" }, { w: "19,5", a: "26,3" }, { w: "22,3", a: "34,6" }],
  },
});
