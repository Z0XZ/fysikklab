// Jupiters måner og Keplers tredje lov: T² = (4π²/(GM)) · a³. Stigningstallet for T² mot a³ gir massen til Jupiter.

const G_JU = 6.674e-11;
Maaletabell({
  rot: "ju", nokkel: "lektorbo-jupiter", csv: "jupiters-maner.csv", startRader: 4,
  kolonner: [{ k: "a", navn: "Baneradius a (km)" }, { k: "T", navn: "Omløpstid T (døgn)" }],
  beregnet: ["a³ (10²⁴ m³)", "T² (10¹⁰ s²)", "M = 4π²a³/(GT²) (10²⁷ kg)"],
  linje: "origo",
  graf: { xTekst: "a³ / 10²⁴ m³", yTekst: "T² / 10¹⁰ s²", xMaks: 7000, yMaks: 220, beskrivelse: "Graf over T² mot a³ med en rett linje gjennom origo." },
  analyser(rader) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    for (const r of rader) {
      const a = t(r.a), T = t(r.T);
      if (a === null || T === null || !T) { celler.push(["", "", ""]); continue; }
      const a3 = (a * 1e3) ** 3, T2 = (T * 86400) ** 2;
      celler.push([Sim.komma(a3 / 1e24, 1), Sim.komma(T2 / 1e10, 2), Sim.komma(4 * Math.PI ** 2 * a3 / (G_JU * T2) / 1e27, 3)]);
      pkt.push({ x: a3 / 1e24, y: T2 / 1e10 });
    }
    return { celler, pkt };
  },
  resultater(fit) {
    const k = fit ? fit.a * 1e10 / 1e24 : null;     // s²/m³
    return {
      "ju-stig": k ? Sim.tall(k, 3) + " s²/m³" : "–",
      "ju-M": k ? Sim.tall(4 * Math.PI ** 2 / (G_JU * k), 3) + " kg" : "–",
    };
  },
  // Omtrentlige tabellverdier for de fire store månene (Io, Europa, Ganymedes, Callisto)
  eksempel: {
    rader: [{ a: "421700", T: "1,769" }, { a: "671100", T: "3,551" }, { a: "1070400", T: "7,155" }, { a: "1882700", T: "16,689" }],
  },
});
