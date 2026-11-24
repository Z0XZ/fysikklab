// Energitap i en sprettball: Fra tiden mellom to sprett regnes høyden ut, h = g·Δt²/8,
// og andelen av høyden (og dermed av energien) som er igjen etter hvert sprett.

const G_SP = 9.81;
Maaletabell({
  rot: "sp", nokkel: "lektorbo-sprettball-forsok", csv: "sprettball.csv", startRader: 6,
  kolonner: [{ k: "dt", navn: "Tid mellom sprett Δt (s)" }],
  beregnet: ["høyde h (cm)", "andel av forrige høyde (%)"],
  innstillinger: ["sp-h0"],
  linje: "punkter",
  graf: { xTekst: "sprett nr.", yTekst: "h / cm", xMaks: 6, yMaks: 100, beskrivelse: "Graf over sprett­høyden etter hvert sprett." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], pkt = [], andel = [];
    const h0 = t(inn["sp-h0"]);
    let forrige = h0;
    rader.forEach((r, i) => {
      const dt = t(r.dt);
      if (dt === null) { celler.push(["", ""]); forrige = null; return; }
      const h = G_SP * dt * dt / 8 * 100;
      const a = forrige ? h / forrige : null;
      celler.push([Sim.komma(h, 1), a !== null ? Sim.komma(a * 100, 0) : ""]);
      if (a !== null && i > 0) andel.push(a);
      pkt.push({ x: i + 1, y: h });
      forrige = h;
    });
    if (h0 !== null) pkt.unshift({ x: 0, y: h0 });
    return { celler, pkt, andel, forste: h0 && rader[0] && t(rader[0].dt) !== null ? G_SP * t(rader[0].dt) ** 2 / 8 * 100 / h0 : null };
  },
  resultater(fit, pkt, inn, s) {
    const snitt = s.andel.length ? s.andel.reduce((a, b) => a + b, 0) / s.andel.length : null;
    return {
      "sp-forste": s.forste !== null ? Sim.komma(s.forste * 100, 0) + " %" : "–",
      "sp-snitt": snitt !== null ? Sim.komma(snitt * 100, 0) + " %" : "–",
      "sp-tap": snitt !== null ? Sim.komma((1 - snitt) * 100, 0) + " %" : "–",
    };
  },
  // Oppdiktede tall: omtrent 80 % av høyden igjen etter hvert sprett
  eksempel: {
    inn: { "sp-h0": "100" },
    rader: [{ dt: "0,804" }, { dt: "0,720" }, { dt: "0,635" }, { dt: "0,565" }, { dt: "0,507" }, { dt: "0,450" }],
  },
});
