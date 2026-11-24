// Elektrisk felt i et vannbad: Potensialet måles langs en linje mellom to parallelle elektroder.
// Stigningstallet til V(x) er feltstyrken E, som sammenlignes med U/d.

Maaletabell({
  rot: "vb", nokkel: "lektorbo-vannbad", csv: "vannbad.csv", startRader: 9,
  kolonner: [{ k: "x", navn: "Avstand fra minuspolen x (cm)" }, { k: "V", navn: "Potensial V (V)" }],
  beregnet: ["E fra forrige punkt (V/m)"],
  innstillinger: ["vb-U", "vb-d"],
  linje: "fri",
  graf: { xTekst: "x / m", yTekst: "V / V", xMaks: 0.2, yMaks: 6, beskrivelse: "Graf over potensialet mot avstanden fra minuspolen, med en tilpasset rett linje." },
  analyser(rader) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    let forrige = null;
    for (const r of rader) {
      const x = t(r.x), V = t(r.V);
      if (x === null || V === null) { celler.push([""]); continue; }
      celler.push([forrige && x !== forrige.x ? Sim.komma((V - forrige.V) / ((x - forrige.x) / 100), 1) : ""]);
      pkt.push({ x: x / 100, y: V });
      forrige = { x, V };
    }
    return { celler, pkt };
  },
  resultater(fit, pkt, inn) {
    const U = Maaletabell.tall(inn["vb-U"]), d = Maaletabell.tall(inn["vb-d"]);
    return {
      "vb-E": fit ? Sim.komma(fit.a, 1) + " V/m" : "–",
      "vb-Ud": U !== null && d ? Sim.komma(U / (d / 100), 1) + " V/m" : "–",
      "vb-b": fit ? Sim.komma(fit.b, 2) + " V" : "–",
    };
  },
  // Oppdiktede tall
  eksempel: {
    inn: { "vb-U": "6,0", "vb-d": "20,0" },
    rader: [{ x: "2", V: "0,91" }, { x: "4", V: "1,35" }, { x: "6", V: "1,93" }, { x: "8", V: "2,45" }, { x: "10", V: "2,97" }, { x: "12", V: "3,52" }, { x: "14", V: "4,06" }, { x: "16", V: "4,62" }, { x: "18", V: "5,17" }],
  },
});
