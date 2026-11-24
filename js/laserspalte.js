// Bølgelengden til laserlys med dobbeltspalte: Avstanden mellom stripene er Δy = λL/d.
// Grafen av Δy mot L har stigningstall λ/d, så λ = d · stigningstall.

Maaletabell({
  rot: "ls", nokkel: "lektorbo-laserspalte", csv: "laser-dobbeltspalte.csv",
  kolonner: [{ k: "L", navn: "Avstand til veggen L (cm)" }, { k: "y10", navn: "Avstand over 10 striper (mm)" }],
  beregnet: ["Δy (mm)", "λ = dΔy/L (nm)"],
  innstillinger: ["ls-d"],
  linje: "origo",
  graf: { xTekst: "L / m", yTekst: "Δy / mm", xMaks: 3, yMaks: 8, beskrivelse: "Graf over avstanden mellom stripene mot avstanden til veggen, med en rett linje gjennom origo." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    const d = t(inn["ls-d"]);
    for (const r of rader) {
      const L = t(r.L), y10 = t(r.y10);
      if (L === null || y10 === null) { celler.push(["", ""]); continue; }
      const dy = y10 / 10;
      celler.push([Sim.komma(dy, 2), d && L ? Sim.komma(d * 1e-3 * dy * 1e-3 / (L / 100) * 1e9, 0) : ""]);
      pkt.push({ x: L / 100, y: dy });
    }
    return { celler, pkt };
  },
  resultater(fit, pkt, inn) {
    const d = Maaletabell.tall(inn["ls-d"]);
    return {
      "ls-stig": fit ? Sim.komma(fit.a, 3) + " mm/m" : "–",
      "ls-lam": fit && d ? Sim.komma(d * 1e-3 * fit.a * 1e-3 * 1e9, 0) + " nm" : "–",
    };
  },
  // Oppdiktede tall: rød laser (650 nm) og spalteavstand 0,25 mm
  eksempel: {
    inn: { "ls-d": "0,25" },
    rader: [{ L: "100", y10: "26,2" }, { L: "150", y10: "39,0" }, { L: "200", y10: "51,1" }, { L: "250", y10: "65,9" }, { L: "300", y10: "78,4" }],
  },
});
