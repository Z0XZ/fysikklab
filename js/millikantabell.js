// Tabell til Millikans forsøk: Eleven skriver inn radien og spenningen der dråpen svever.
// m = ρ · 4/3 · π r³ og q = mgd/U. Grafen viser ladningen til hver dråpe.
Maaletabell({
  rot: "mi-tabell", nokkel: "lektorbo-millikan", csv: "millikan.csv",
  kolonner: [{ k: "r", navn: "r (µm)" }, { k: "U", navn: "U når dråpen svever (V)" }],
  beregnet: ["m (10⁻¹⁵ kg)", "q (10⁻¹⁹ C)"],
  innstillinger: ["mi-linjer"],
  startRader: 4,
  linje: "ingen",
  graf: {
    xTekst: "dråpe nr.", yTekst: "|q| / (10⁻¹⁹ C)", xMin: 0, xMaks: 4, yMin: 0, yMaks: 5, beskrivelse: "Ladningen til hver dråpe.",
    hjelpelinjer: () => (document.getElementById("mi-linjer").checked ? Array.from({ length: 12 }, (_, i) => (i + 1) * 1.602) : []),
  },
  analyser(rader) {
    const t = Maaletabell.tall, celler = [], pkt = [];
    rader.forEach((rad, i) => {
      const r = t(rad.r), U = t(rad.U);
      if (r === null) { celler.push(["", ""]); return; }
      const m = MI.rho * 4 / 3 * Math.PI * (r * 1e-6) ** 3;
      if (U === null || U <= 0) { celler.push([Sim.komma(m * 1e15, 3), ""]); return; }
      const q = m * MI.g * MI.d / U;
      celler.push([Sim.komma(m * 1e15, 3), Sim.komma(q * 1e19, 2)]);
      pkt.push({ x: i + 1, y: q * 1e19 });
    });
    return { celler, pkt };
  },
});
