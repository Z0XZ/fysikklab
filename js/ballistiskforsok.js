// Ballistisk pendel (forsøk): Farten til kula regnes ut på to måter for hvert skudd,
// fra kastlengden (horisontalt kast) og fra utslaget til pendelen (bevaring av bevegelsesmengde og energi).

const G_BP = 9.81;
Maaletabell({
  rot: "bp", nokkel: "lektorbo-ballistisk-forsok", csv: "ballistisk-pendel.csv",
  kolonner: [{ k: "x", navn: "Kastlengde x (cm)" }, { k: "th", navn: "Utslag θ (°)" }],
  beregnet: ["v fra kastet (m/s)", "v fra pendelen (m/s)", "forskjell (%)"],
  innstillinger: ["bp-m", "bp-M", "bp-L", "bp-h"],
  linje: "uten-graf",
  analyser(rader, inn) {
    const t = Maaletabell.tall, celler = [], vk = [], vp = [];
    const m = t(inn["bp-m"]), M = t(inn["bp-M"]), L = t(inn["bp-L"]), h = t(inn["bp-h"]);
    for (const r of rader) {
      const x = t(r.x), th = t(r.th);
      const a = x !== null && h > 0 ? (x / 100) * Math.sqrt(G_BP / (2 * h / 100)) : null;
      const b = th !== null && m > 0 && M !== null && L > 0 ? ((m + M) / m) * Math.sqrt(2 * G_BP * (L / 100) * (1 - Math.cos(th * Math.PI / 180))) : null;
      if (a !== null) vk.push(a);
      if (b !== null) vp.push(b);
      celler.push([a !== null ? Sim.komma(a, 2) : "", b !== null ? Sim.komma(b, 2) : "", a && b ? Sim.komma((b - a) / a * 100, 1) : ""]);
    }
    return { celler, pkt: [], vk, vp };
  },
  resultater(fit, pkt, inn, s) {
    const t = Maaletabell.tall, m = t(inn["bp-m"]), M = t(inn["bp-M"]);
    const snitt = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const halv = (a) => (Math.max(...a) - Math.min(...a)) / 2;
    const fmt = (a) => a.length ? `${Sim.komma(snitt(a), 2)} ± ${Sim.komma(halv(a), 2)} m/s` : "–";
    const ok = s.vk.length && s.vp.length;
    const andel = m > 0 && M !== null ? m / (m + M) : null;
    const ek = ok && m > 0 ? 0.5 * (m / 1000) * snitt(s.vk) ** 2 : null;
    return {
      "bp-vk": fmt(s.vk), "bp-vp": fmt(s.vp),
      "bp-diff": ok ? Sim.komma((snitt(s.vp) - snitt(s.vk)) / snitt(s.vk) * 100, 1) + " %" : "–",
      "bp-andel": andel !== null ? Sim.komma(andel * 100, 1) + " %" : "–",
      "bp-tap": ek !== null && andel !== null ? Sim.komma(ek * (1 - andel), 3) + " J av " + Sim.komma(ek, 3) + " J" : "–",
    };
  },
  // Oppdiktede tall: v ≈ 4,6 m/s med litt spredning
  eksempel: {
    inn: { "bp-m": "28,0", "bp-M": "246", "bp-L": "29,5", "bp-h": "104,0" },
    rader: [{ x: "215,1", th: "16,2" }, { x: "212,0", th: "15,7" }, { x: "209,0", th: "15,9" }, { x: "209,2", th: "15,6" }, { x: "212,3", th: "15,9" }],
  },
});
