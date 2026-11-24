// Effekten din i trappa: P = mgh / t for hver person eller hvert løp.

const G_TR = 9.81;
Maaletabell({
  rot: "tr", nokkel: "lektorbo-trapp-forsok", csv: "effekt-trapp.csv",
  kolonner: [{ k: "m", navn: "Masse m (kg)" }, { k: "t", navn: "Tid t (s)" }],
  beregnet: ["E<sub>p</sub> = mgh (J)", "P = E<sub>p</sub>/t (W)", "hestekrefter"],
  innstillinger: ["tr-n", "tr-trinn"],
  linje: "uten-graf",
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], P = [];
    const n = t(inn["tr-n"]), tr = t(inn["tr-trinn"]);
    const h = n !== null && tr !== null ? n * tr / 100 : null;
    for (const r of rader) {
      const m = t(r.m), tid = t(r.t);
      const e = m !== null && h !== null ? m * G_TR * h : null;
      const p = e !== null && tid ? e / tid : null;
      celler.push([e !== null ? Sim.komma(e, 0) : "", p !== null ? Sim.komma(p, 0) : "", p !== null ? Sim.komma(p / 746, 2) : ""]);
      if (p !== null) P.push(p);
    }
    return { celler, pkt: [], h, P };
  },
  resultater(fit, pkt, inn, s) {
    return {
      "tr-h": s.h !== null ? Sim.komma(s.h, 2) + " m" : "–",
      "tr-maks": s.P.length ? Sim.komma(Math.max(...s.P), 0) + " W" : "–",
      "tr-snitt": s.P.length ? Sim.komma(s.P.reduce((a, b) => a + b, 0) / s.P.length, 0) + " W" : "–",
    };
  },
  // Oppdiktede tall. Rad 4 er samme person som rad 1, men gående.
  eksempel: {
    inn: { "tr-n": "18", "tr-trinn": "17,5" },
    rader: [{ m: "62", t: "3,1" }, { m: "55", t: "2,8" }, { m: "71", t: "3,6" }, { m: "62", t: "9,5" }, { m: "48", t: "3,0" }],
  },
});
