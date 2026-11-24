// Transformatoren: Primærspolen har Np vindinger og spenningen Up. Sekundærspenningen måles for ulike Ns.
// Ideell transformator: Us/Up = Ns/Np. Grafen Us mot Ns har stigningstall Up/Np for en ideell transformator.

Maaletabell({
  rot: "tr2", nokkel: "lektorbo-transformator", csv: "transformator.csv",
  kolonner: [{ k: "ns", navn: "Vindinger sekundær N<sub>s</sub>" }, { k: "us", navn: "Målt U<sub>s</sub> (V)" }],
  beregnet: ["N<sub>s</sub>/N<sub>p</sub>", "U<sub>s</sub>/U<sub>p</sub>", "ideell U<sub>s</sub> (V)", "målt/ideell (%)"],
  innstillinger: ["tr-np", "tr-up"],
  linje: "origo",
  graf: { xTekst: "Nₛ", yTekst: "Uₛ / V", xMaks: 1600, yMaks: 24, beskrivelse: "Graf over sekundærspenningen mot antall vindinger på sekundærspolen." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    const np = t(inn["tr-np"]), up = t(inn["tr-up"]);
    for (const r of rader) {
      const ns = t(r.ns), us = t(r.us);
      const ideell = ns !== null && np && up !== null ? up * ns / np : null;
      celler.push([ns !== null && np ? Sim.komma(ns / np, 2) : "", us !== null && up ? Sim.komma(us / up, 2) : "", ideell !== null ? Sim.komma(ideell, 2) : "", ideell && us !== null ? Sim.komma(us / ideell * 100, 0) : ""]);
      if (ns !== null && us !== null) pkt.push({ x: ns, y: us });
    }
    return { celler, pkt };
  },
  resultater(fit, pkt, inn) {
    const np = Maaletabell.tall(inn["tr-np"]), up = Maaletabell.tall(inn["tr-up"]);
    const ideell = np && up !== null ? up / np : null;
    return {
      "tr-stig": fit ? Sim.tall(fit.a, 3) + " V per vinding" : "–",
      "tr-ideell": ideell !== null ? Sim.tall(ideell, 3) + " V per vinding" : "–",
      "tr-andel": fit && ideell ? Sim.komma(fit.a / ideell * 100, 0) + " %" : "–",
    };
  },
  // Oppdiktede tall
  eksempel: {
    inn: { "tr-np": "400", "tr-up": "6,0" },
    rader: [{ ns: "100", us: "1,40" }, { ns: "200", us: "2,79" }, { ns: "400", us: "5,60" }, { ns: "800", us: "11,1" }, { ns: "1600", us: "22,1" }],
  },
});
