// Induksjon med fallende magnet.
// Del A: Lim inn spenningen over en spole (t og U) mens en magnet faller gjennom den. Verktøyet tegner U(t),
// finner toppene og regner ut arealet under hver puls (∫U dt = NΔΦ).
// Del B: Falltiden gjennom rør av plast, aluminium og kobber (Maaletabell).

(function () {
  const $ = Sim.$;
  if (!$("fm")) return;
  const NOKKEL = "lektorbo-fallende-magnet";
  const lagret = Sim.hent(NOKKEL, {});
  if (lagret.data) $("fm-data").value = lagret.data;
  let pkt = [];

  function les() {
    pkt = [];
    for (const linje of $("fm-data").value.split(/\r?\n/)) {
      const d = linje.trim().split(/[\t;]+|\s+/).filter(Boolean);
      if (d.length < 2) continue;
      const t = Maaletabell.tall(d[0]), u = Maaletabell.tall(d[1]);
      if (t === null || u === null) continue;
      pkt.push({ t, u });
    }
    pkt.sort((a, b) => a.t - b.t);
  }

  function analyser() {
    const ut = { maks: null, min: null, pos: 0, neg: 0 };
    for (let i = 0; i < pkt.length; i++) {
      const p = pkt[i];
      if (!ut.maks || p.u > ut.maks.u) ut.maks = p;
      if (!ut.min || p.u < ut.min.u) ut.min = p;
      if (i) {
        const q = pkt[i - 1], dt = p.t - q.t, snitt = (p.u + q.u) / 2;
        if (snitt > 0) ut.pos += snitt * dt; else ut.neg += snitt * dt;
      }
    }
    return ut;
  }

  const l = Sim.lerret($("fm-graf"), tegn);
  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const t0 = pkt.length ? pkt[0].t : 0, t1 = pkt.length ? pkt[pkt.length - 1].t : 1;
    const um = Math.max(0.1, ...pkt.map((p) => Math.abs(p.u))) * 1.15;
    const { px, py } = Sim.akser(l, { x: [t0, t1 > t0 ? t1 : t0 + 1], y: [-um, um], xTekst: "t / s", yTekst: "U / V" });
    if (!pkt.length) return;
    c.save();
    for (const [fortegn, farge] of [[1, f.f1], [-1, f.f2]]) {
      c.fillStyle = farge; c.globalAlpha = 0.25; c.beginPath(); c.moveTo(px(pkt[0].t), py(0));
      for (const p of pkt) c.lineTo(px(p.t), py(fortegn * p.u > 0 ? p.u : 0));
      c.lineTo(px(pkt[pkt.length - 1].t), py(0)); c.closePath(); c.fill();
    }
    c.globalAlpha = 1; c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.beginPath();
    pkt.forEach((p, i) => (i ? c.lineTo(px(p.t), py(p.u)) : c.moveTo(px(p.t), py(p.u))));
    c.stroke();
    c.restore();
  }

  function oppdater() {
    les();
    const a = analyser();
    const ms = (x) => Sim.komma(x * 1000, 2) + " mV·s";
    $("fm-maks").textContent = a.maks ? `${Sim.komma(a.maks.u, 3)} V ved ${Sim.komma(a.maks.t, 3)} s` : "–";
    $("fm-min").textContent = a.min ? `${Sim.komma(a.min.u, 3)} V ved ${Sim.komma(a.min.t, 3)} s` : "–";
    $("fm-pos").textContent = pkt.length ? ms(a.pos) : "–";
    $("fm-neg").textContent = pkt.length ? ms(a.neg) : "–";
    $("fm-dt").textContent = a.maks && a.min ? Sim.komma(Math.abs(a.maks.t - a.min.t) * 1000, 0) + " ms" : "–";
    tegn();
    Sim.lagre(NOKKEL, { data: $("fm-data").value });
  }

  // Eksempel: magnet sluppet 20 cm over midten av spolen. Fluksen gjennom spolen er modellert som
  // NΦ = NΦ₀ / (1 + (z/a)²)^(3/2), med NΦ₀ = 8,7 mWb og a = 1,5 cm, og litt tilfeldig støy.
  $("fm-eksempel").addEventListener("click", () => {
    const g = 9.81, h = 0.20, a = 0.015, NF = 8.7e-3, t0 = 0.05;
    let frø = 11, s = "t\tU\n";
    const tilfeldig = () => { frø = (frø * 16807) % 2147483647; return frø / 2147483647 - 0.5; };
    for (let i = 0; i <= 300; i++) {
      const t = 0.1 + i * 0.001;
      const tt = Math.max(0, t - t0), z = -h + 0.5 * g * tt * tt, v = g * tt, u = z / a;
      const eps = -NF * (-3 * u / a) * Math.pow(1 + u * u, -2.5) * v;
      s += `${t.toFixed(3).replace(".", ",")}\t${(eps + 0.01 * tilfeldig()).toFixed(3).replace(".", ",")}\n`;
    }
    $("fm-data").value = s;
    oppdater();
  });
  $("fm-tom").addEventListener("click", () => { $("fm-data").value = ""; oppdater(); });
  $("fm-data").addEventListener("input", oppdater);
  oppdater();
})();

Maaletabell({
  rot: "fr", nokkel: "lektorbo-magnet-ror", csv: "magnet-i-ror.csv", startRader: 3,
  kolonner: [{ k: "L", navn: "Lengde på røret L (cm)" }, { k: "t", navn: "Falltid t (s)" }],
  beregnet: ["gjennomsnittsfart (m/s)", "fritt fall (s)", "t / fritt fall"],
  linje: "uten-graf",
  analyser(rader) {
    const t = Maaletabell.tall, celler = [];
    for (const r of rader) {
      const L = t(r.L), tid = t(r.t);
      const tf = L !== null ? Math.sqrt(2 * (L / 100) / 9.81) : null;
      celler.push([L !== null && tid ? Sim.komma(L / 100 / tid, 2) : "", tf !== null ? Sim.komma(tf, 2) : "", tf && tid ? Sim.komma(tid / tf, 1) : ""]);
    }
    return { celler, pkt: [] };
  },
  // Oppdiktede tall: rad 1 plast, rad 2 aluminium, rad 3 kobber
  eksempel: { rader: [{ L: "100", t: "0,47" }, { L: "100", t: "2,1" }, { L: "100", t: "4,3" }] },
});
