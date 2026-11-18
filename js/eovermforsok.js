// Forsøk: e/m for elektronet. Eleven skriver inn U, I og diameteren d.
// B = (4/5)^(3/2) · μ0 N I / R, r = d/2 og e/m = 2U/(B²r²). Grafen viser r² mot U/B² med en linje gjennom origo:
// r² = (2m/e) · U/B², så e/m = 2 / stigningstallet.

const EMF_MU0 = 4e-7 * Math.PI, EMF_KJENT = 1.75882e11;
Maaletabell({
  rot: "emforsok", nokkel: "lektorbo-eoverm-forsok", csv: "e-over-m.csv",
  kolonner: [{ k: "U", navn: "U (V)" }, { k: "I", navn: "I (A)" }, { k: "d", navn: "d (cm)" }],
  beregnet: ["B (mT)", "r (cm)", "e/m (10¹¹ C/kg)"],
  innstillinger: ["em-n", "em-r"],
  linje: "origo",
  graf: { xTekst: "U/B² / (10⁸ V/T²)", yTekst: "r² / cm²", xMaks: 1, yMaks: 10, beskrivelse: "Graf over r² mot U/B² med en rett linje gjennom origo." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, N = t(inn["em-n"]) ?? 130, R = (t(inn["em-r"]) ?? 15) / 100;
    const k = (4 / 5) ** 1.5 * EMF_MU0 * N / R, celler = [], pkt = [], verdier = [];
    for (const r of rader) {
      const U = t(r.U), I = t(r.I), d = t(r.d);
      const B = I !== null ? k * I : null;
      if (B === null) { celler.push(["", d !== null ? Sim.komma(d / 2, 2) : "", ""]); continue; }
      if (U === null || d === null || d <= 0 || B === 0) { celler.push([Sim.komma(B * 1000, 3), d !== null ? Sim.komma(d / 2, 2) : "", ""]); continue; }
      const rr = d / 200, em = 2 * U / (B * B * rr * rr);
      verdier.push(em);
      celler.push([Sim.komma(B * 1000, 3), Sim.komma(d / 2, 2), Sim.komma(em / 1e11, 3)]);
      pkt.push({ x: U / (B * B) / 1e8, y: (d / 2) ** 2 });   // 10⁸ V/T² og cm²
    }
    return { celler, pkt, verdier };
  },
  resultater(fit, pkt, inn, s) {
    // Stigningstallet a er i cm² per 10⁸ V/T², så 2m/e = a · 10⁻⁴ / 10⁸ = a · 10⁻¹²
    const em = fit && fit.a > 0 ? 2 / (fit.a * 1e-12) : null;
    const snitt = s.verdier.length ? s.verdier.reduce((a, b) => a + b, 0) / s.verdier.length : null;
    const v = em ?? snitt;
    return {
      "em-fit": em ? Sim.tall(em, 3) + " C/kg" : "–",
      "em-snitt": snitt ? Sim.tall(snitt, 3) + " C/kg" : "–",
      "em-avvik": v ? Sim.komma((v / EMF_KJENT - 1) * 100, 1) + " %" : "–",
    };
  },
  // Oppdiktede tall: diameteren lest av 1 mm for stor, med litt støy. N = 130 og R = 15,0 cm.
  eksempel: {
    inn: { "em-n": "130", "em-r": "15,0" },
    rader: [
      { U: "150", I: "1,40", d: "7,7" }, { U: "200", I: "1,40", d: "9,0" }, { U: "250", I: "1,40", d: "10,0" }, { U: "300", I: "1,40", d: "10,8" },
      { U: "250", I: "1,20", d: "11,5" }, { U: "250", I: "1,70", d: "8,1" }, { U: "250", I: "2,00", d: "7,0" },
    ],
  },
});
