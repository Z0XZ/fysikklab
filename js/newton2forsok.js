// Newtons andre lov med vogn og lodd. Akselerasjonen finnes fra tiden vogna bruker på strekningen s fra ro: a = 2s/t².
// Del A: Samme totale masse, ulik trekkraft. Del B: Samme trekkraft, ulik total masse.

const G_N2 = 9.81;
Maaletabell({
  rot: "n2a", nokkel: "lektorbo-newton2-a", csv: "newton2-del-a.csv", startRader: 6,
  kolonner: [{ k: "mh", navn: "Hengende masse (g)" }, { k: "t", navn: "Tid t (s)" }],
  beregnet: ["F = m<sub>h</sub>g (N)", "a = 2s/t² (m/s²)"],
  innstillinger: ["n2-s", "n2-M"],
  linje: "fri",
  graf: { xTekst: "F / N", yTekst: "a / (m/s²)", xMaks: 0.6, yMaks: 0.6, yMin: -0.1, beskrivelse: "Graf over akselerasjonen mot trekkraften, med en tilpasset rett linje." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    const s = t(inn["n2-s"]);
    for (const r of rader) {
      const mh = t(r.mh), tid = t(r.t);
      const F = mh !== null ? mh / 1000 * G_N2 : null;
      const a = s !== null && tid ? 2 * (s / 100) / (tid * tid) : null;
      celler.push([F !== null ? Sim.komma(F, 3) : "", a !== null ? Sim.komma(a, 3) : ""]);
      if (F !== null && a !== null) pkt.push({ x: F, y: a });
    }
    return { celler, pkt };
  },
  resultater(fit, pkt, inn) {
    const M = Maaletabell.tall(inn["n2-M"]);
    return {
      "n2-stig": fit ? Sim.komma(fit.a, 3) + " 1/kg" : "–",
      "n2-masse": fit && fit.a > 0 ? Sim.komma(1 / fit.a, 2) + " kg" : "–",
      "n2-veid": M !== null ? Sim.komma(M / 1000, 2) + " kg" : "–",
      "n2-R": fit && fit.a > 0 ? Sim.komma(-fit.b / fit.a, 3) + " N" : "–",
    };
  },
  // Oppdiktede tall: total masse 1,00 kg og friksjon 0,05 N
  eksempel: {
    inn: { "n2-s": "80", "n2-M": "1000" },
    rader: [{ mh: "10", t: "5,75" }, { mh: "20", t: "3,33" }, { mh: "30", t: "2,55" }, { mh: "40", t: "2,15" }, { mh: "50", t: "1,89" }, { mh: "60", t: "1,72" }],
  },
});

Maaletabell({
  rot: "n2b", nokkel: "lektorbo-newton2-b", csv: "newton2-del-b.csv",
  kolonner: [{ k: "M", navn: "Total masse M (g)" }, { k: "t", navn: "Tid t (s)" }],
  beregnet: ["1/M (1/kg)", "a = 2s/t² (m/s²)"],
  innstillinger: ["n2-s", "n2-mh"],
  linje: "origo",
  graf: { xTekst: "1/M / (1/kg)", yTekst: "a / (m/s²)", xMaks: 2, yMaks: 0.8, beskrivelse: "Graf over akselerasjonen mot 1/M, med en rett linje gjennom origo." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    const s = t(inn["n2-s"]);
    for (const r of rader) {
      const M = t(r.M), tid = t(r.t);
      const x = M ? 1000 / M : null;
      const a = s !== null && tid ? 2 * (s / 100) / (tid * tid) : null;
      celler.push([x !== null ? Sim.komma(x, 3) : "", a !== null ? Sim.komma(a, 3) : ""]);
      if (x !== null && a !== null) pkt.push({ x, y: a });
    }
    return { celler, pkt };
  },
  resultater(fit, pkt, inn) {
    const mh = Maaletabell.tall(inn["n2-mh"]);
    return {
      "n2b-stig": fit ? Sim.komma(fit.a, 3) + " N" : "–",
      "n2b-F": mh !== null ? Sim.komma(mh / 1000 * G_N2, 3) + " N" : "–",
    };
  },
  // Oppdiktede tall: hengende masse 50 g og friksjon 0,05 N
  eksempel: {
    inn: { "n2-s": "80", "n2-mh": "50" },
    rader: [{ M: "550", t: "1,43" }, { M: "750", t: "1,66" }, { M: "950", t: "1,88" }, { M: "1150", t: "2,05" }, { M: "1350", t: "2,22" }],
  },
});
