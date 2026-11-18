// Heisen med mobilen: Hver rad er en fase med konstant akselerasjon a i tiden Δt.
// Verktøyet regner ut farten og strekningen fase for fase, og hva en badevekt ville vist: m(g + a)/g.

const G_HEIS = 9.81;
Maaletabell({
  rot: "heismobil", nokkel: "lektorbo-heismobil", csv: "heis.csv",
  kolonner: [{ k: "a", navn: "a (m/s²)" }, { k: "dt", navn: "Δt (s)" }],
  beregnet: ["fart på slutten (m/s)", "strekning (m)", "badevekta viser (kg)"],
  innstillinger: ["h-masse", "h-baro"],
  startRader: 3,
  linje: "punkter",
  graf: { xTekst: "t / s", yTekst: "v / (m/s)", xMaks: 5, yMaks: 1, yMin: 0, beskrivelse: "Farten til heisen mot tiden, fase for fase." },
  analyser(rader, inn) {
    const t = Maaletabell.tall, m = t(inn["h-masse"]) ?? 60, celler = [], pkt = [{ x: 0, y: 0 }];
    let v = 0, tid = 0, h = 0, vMaks = 0, vekter = [];
    for (const r of rader) {
      const a = t(r.a), dt = t(r.dt);
      if (a === null || dt === null || dt < 0) { celler.push(["", "", a !== null ? Sim.komma(m * (G_HEIS + a) / G_HEIS, 1) : ""]); continue; }
      const s = v * dt + 0.5 * a * dt * dt;
      v += a * dt; tid += dt; h += s;
      vMaks = Math.max(vMaks, Math.abs(v));
      vekter.push(m * (G_HEIS + a) / G_HEIS);
      celler.push([Sim.komma(v, 2), Sim.komma(s, 2), Sim.komma(m * (G_HEIS + a) / G_HEIS, 1)]);
      pkt.push({ x: tid, y: v });
    }
    return { celler, pkt: pkt.length > 1 ? pkt : [], v, h, vMaks, vekter };
  },
  resultater(fit, pkt, inn, s) {
    const baro = Maaletabell.tall(inn["h-baro"]), har = pkt.length > 1;
    return {
      "h-vmaks": har ? Sim.komma(s.vMaks, 2) + " m/s" : "–",
      "h-h": har ? Sim.komma(s.h, 1) + " m" : "–",
      "h-avvik": har && baro ? Sim.komma((s.h / baro - 1) * 100, 0) + " %" : "–",
      "h-vslutt": har ? Sim.komma(s.v, 2) + " m/s" : "–",
      "h-vekt-maks": s.vekter.length ? Sim.komma(Math.max(...s.vekter), 1) + " kg" : "–",
      "h-vekt-min": s.vekter.length ? Sim.komma(Math.min(...s.vekter), 1) + " kg" : "–",
    };
  },
  // Oppdiktede tall for en tur oppover på omtrent fem etasjer
  eksempel: {
    inn: { "h-masse": "60", "h-baro": "16,2" },
    rader: [{ a: "0,90", dt: "1,8" }, { a: "0", dt: "8,0" }, { a: "−0,86", dt: "1,88" }],
  },
});
