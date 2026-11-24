// Ballstabelen (forsøk): En tennisball oppå en basketball slippes fra høyden h0.
// Verktøyet regner ut hvor mange ganger høyere tennisballen spretter, og hvor mye av energien som er igjen.

const G_BS = 9.81;
Maaletabell({
  rot: "bs", nokkel: "lektorbo-ballstabel-forsok", csv: "ballstabel.csv",
  kolonner: [{ k: "h0", navn: "Slipphøyde h<sub>0</sub> (cm)" }, { k: "ht", navn: "Tennisball h<sub>t</sub> (cm)" }, { k: "hb", navn: "Basketball h<sub>b</sub> (cm)" }],
  beregnet: ["h<sub>t</sub>/h<sub>0</sub>", "E før (J)", "E etter (J)", "energi igjen (%)"],
  innstillinger: ["bs-m", "bs-M"],
  linje: "origo",
  graf: { xTekst: "h₀ / cm", yTekst: "hₜ / cm", xMaks: 80, yMaks: 300, beskrivelse: "Graf over sprett­høyden til tennisballen mot slipphøyden, med en rett linje gjennom origo." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [], andeler = [];
    const m = t(inn["bs-m"]), M = t(inn["bs-M"]);
    for (const r of rader) {
      const h0 = t(r.h0), ht = t(r.ht), hb = t(r.hb);
      const ef = h0 !== null && m !== null && M !== null ? (m + M) / 1000 * G_BS * h0 / 100 : null;
      const ee = ht !== null && hb !== null && m !== null && M !== null ? (m * ht + M * hb) / 1000 * G_BS / 100 : null;
      celler.push([h0 && ht !== null ? Sim.komma(ht / h0, 2) : "", ef !== null ? Sim.komma(ef, 2) : "", ee !== null ? Sim.komma(ee, 2) : "", ef && ee !== null ? Sim.komma(ee / ef * 100, 0) : ""]);
      if (h0 !== null && ht !== null) pkt.push({ x: h0, y: ht });
      if (ef && ee !== null) andeler.push(ee / ef);
    }
    return { celler, pkt, andeler };
  },
  resultater(fit, pkt, inn, s) {
    const t = Maaletabell.tall, m = t(inn["bs-m"]), M = t(inn["bs-M"]);
    const ideell = m && M ? ((3 * M - m) / (M + m)) ** 2 : null;
    return {
      "bs-stig": fit ? Sim.komma(fit.a, 2) + " ganger" : "–",
      "bs-ideell": ideell !== null ? Sim.komma(ideell, 2) + " ganger" : "–",
      "bs-andel": s.andeler.length ? Sim.komma(s.andeler.reduce((a, b) => a + b, 0) / s.andeler.length * 100, 0) + " %" : "–",
    };
  },
  // Oppdiktede tall
  eksempel: {
    inn: { "bs-m": "58", "bs-M": "600" },
    rader: [{ h0: "30", ht: "126", hb: "8" }, { h0: "40", ht: "162", hb: "11" }, { h0: "50", ht: "208", hb: "12" }, { h0: "60", ht: "271", hb: "15" }, { h0: "70", ht: "293", hb: "19" }],
  },
});
