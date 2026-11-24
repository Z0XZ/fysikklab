// Plancks konstant med lysdioder: Terskelspenningen U for lysdioder med ulik bølgelengde.
// eU ≈ hf, så U mot f gir en rett linje med stigningstall h/e.

const E_PL = 1.602e-19, C_PL = 2.998e8;
Maaletabell({
  rot: "pl", nokkel: "lektorbo-planck", csv: "planck-lysdioder.csv",
  kolonner: [{ k: "lam", navn: "Bølgelengde λ (nm)" }, { k: "U", navn: "Terskelspenning U (V)" }],
  beregnet: ["f (10¹⁴ Hz)", "eU (10⁻¹⁹ J)", "eU/f (10⁻³⁴ Js)"],
  linje: "fri",
  graf: { xTekst: "f / 10¹⁴ Hz", yTekst: "U / V", xMaks: 8, yMaks: 3, yMin: -0.5, beskrivelse: "Graf over terskelspenningen mot frekvensen, med en tilpasset rett linje." },
  analyser(rader) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    for (const r of rader) {
      const lam = t(r.lam), U = t(r.U);
      const f = lam ? C_PL / (lam * 1e-9) / 1e14 : null;
      celler.push([f !== null ? Sim.komma(f, 2) : "", U !== null ? Sim.komma(E_PL * U * 1e19, 2) : "", f && U !== null ? Sim.komma(E_PL * U / (f * 1e14) * 1e34, 2) : ""]);
      if (f !== null && U !== null) pkt.push({ x: f, y: U });
    }
    return { celler, pkt };
  },
  resultater(fit) {
    const h = fit ? fit.a / 1e14 * E_PL : null;
    return {
      "pl-stig": fit ? Sim.komma(fit.a / 1e14 * 1e15, 2) + " · 10⁻¹⁵ V·s" : "–",
      "pl-h": h !== null ? Sim.komma(h * 1e34, 2) + " · 10⁻³⁴ Js" : "–",
      "pl-avvik": h !== null ? Sim.komma((h / 6.626e-34 - 1) * 100, 0) + " %" : "–",
    };
  },
  // Oppdiktede tall
  eksempel: {
    rader: [{ lam: "630", U: "1,65" }, { lam: "590", U: "1,76" }, { lam: "525", U: "2,05" }, { lam: "470", U: "2,34" }, { lam: "405", U: "2,76" }],
  },
});
