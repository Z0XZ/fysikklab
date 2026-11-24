// Horisontalt kast: treff koppen. Farten ved bordkanten måles med fotoport (v = b/Δt),
// og verktøyet sammenligner målt kastlengde med x = v₀ · √(2h/g).

const G_HK = 9.81;
Maaletabell({
  rot: "hk", nokkel: "lektorbo-treff-koppen", csv: "horisontalt-kast.csv",
  kolonner: [{ k: "dt", navn: "Tid i fotoporten Δt (ms)" }, { k: "x", navn: "Målt kastlengde x (cm)" }],
  beregnet: ["v₀ (m/s)", "x forutsagt (cm)", "avvik (%)"],
  innstillinger: ["hk-b", "hk-h"],
  linje: "origo",
  graf: { xTekst: "v₀ / (m/s)", yTekst: "x / m", xMaks: 2.4, yMaks: 1, beskrivelse: "Graf over målt kastlengde mot farten ved bordkanten, med en rett linje gjennom origo." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    const b = t(inn["hk-b"]), h = t(inn["hk-h"]);
    const tf = h > 0 ? Math.sqrt(2 * (h / 100) / G_HK) : null;
    for (const r of rader) {
      const dt = t(r.dt), x = t(r.x);
      const v = b !== null && dt ? (b / 100) / (dt / 1000) : null;
      const xp = v !== null && tf !== null ? v * tf * 100 : null;
      celler.push([v !== null ? Sim.komma(v, 3) : "", xp !== null ? Sim.komma(xp, 1) : "", xp && x !== null ? Sim.komma((x - xp) / xp * 100, 1) : ""]);
      if (v !== null && x !== null) pkt.push({ x: v, y: x / 100 });
    }
    return { celler, pkt, tf };
  },
  resultater(fit, pkt, inn, s) {
    const h = Maaletabell.tall(inn["hk-h"]);
    return {
      "hk-tf": s.tf !== null ? Sim.komma(s.tf, 3) + " s" : "–",
      "hk-stig": fit ? Sim.komma(fit.a, 3) + " s" : "–",
      "hk-g": fit && h > 0 ? Sim.komma(2 * (h / 100) / fit.a ** 2, 2) + " m/s²" : "–",
    };
  },
  // Oppdiktede tall: bordhøyde 90 cm og kule med diameter 2,50 cm
  eksempel: {
    inn: { "hk-b": "2,50", "hk-h": "90,0" },
    rader: [{ dt: "24,8", x: "43,9" }, { dt: "19,4", x: "54,7" }, { dt: "15,6", x: "70,2" }, { dt: "13,1", x: "80,6" }, { dt: "11,4", x: "93,5" }],
  },
});
