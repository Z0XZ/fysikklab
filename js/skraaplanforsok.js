// Energibevaring på skråplan: En vogn ruller ned og går gjennom en fotoport nederst.
// v = b/Δt, og verktøyet sammenligner mgh med ½mv² og finner friksjonskraften fra energitapet.

const G_SK = 9.81;
Maaletabell({
  rot: "sk", nokkel: "lektorbo-skraaplan-energi", csv: "energi-skraaplan.csv",
  kolonner: [{ k: "d", navn: "Strekning d (cm)" }, { k: "h", navn: "Høyde h (cm)" }, { k: "dt", navn: "Tid i fotoporten Δt (ms)" }],
  beregnet: ["v (m/s)", "mgh (J)", "½mv² (J)", "energi igjen (%)", "friksjon R (N)"],
  innstillinger: ["sk-m", "sk-b"],
  linje: "origo",
  graf: { xTekst: "h / m", yTekst: "v² / (m/s)²", xMaks: 0.1, yMaks: 2, beskrivelse: "Graf over v² mot h med en rett linje gjennom origo." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [], andel = [], R = [];
    const m = t(inn["sk-m"]), b = t(inn["sk-b"]);
    for (const r of rader) {
      const d = t(r.d), h = t(r.h), dt = t(r.dt);
      const v = b !== null && dt ? (b / 100) / (dt / 1000) : null;
      const ep = m !== null && h !== null ? m / 1000 * G_SK * h / 100 : null;
      const ek = m !== null && v !== null ? 0.5 * m / 1000 * v * v : null;
      const rr = ep !== null && ek !== null && d ? (ep - ek) / (d / 100) : null;
      celler.push([v !== null ? Sim.komma(v, 3) : "", ep !== null ? Sim.komma(ep, 3) : "", ek !== null ? Sim.komma(ek, 3) : "", ep && ek !== null ? Sim.komma(ek / ep * 100, 0) : "", rr !== null ? Sim.komma(rr, 3) : ""]);
      if (h !== null && v !== null) pkt.push({ x: h / 100, y: v * v });
      if (ep && ek !== null) andel.push(ek / ep);
      if (rr !== null) R.push(rr);
    }
    return { celler, pkt, andel, R };
  },
  resultater(fit, pkt, inn, s) {
    const snitt = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    return {
      "sk-stig": fit ? Sim.komma(fit.a, 1) + " m/s²" : "–",
      "sk-g": fit ? Sim.komma(fit.a / 2, 2) + " m/s²" : "–",
      "sk-andel": s.andel.length ? Sim.komma(snitt(s.andel) * 100, 0) + " %" : "–",
      "sk-R": s.R.length ? Sim.komma(snitt(s.R), 3) + " N" : "–",
    };
  },
  // Oppdiktede tall
  eksempel: {
    inn: { "sk-m": "500", "sk-b": "2,0" },
    rader: [{ d: "20", h: "2,0", dt: "35,4" }, { d: "40", h: "4,0", dt: "24,8" }, { d: "60", h: "6,1", dt: "20,0" }, { d: "80", h: "7,9", dt: "17,6" }, { d: "100", h: "9,9", dt: "15,5" }],
  },
});
