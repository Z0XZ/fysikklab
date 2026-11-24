// Følg grafen med bevegelsessensor: Velg en målgraf x(t), gå foran sensoren, og lim inn målingene (t og x).
// Verktøyet tegner målingene oppå målgrafen og regner ut det gjennomsnittlige avviket.

(function () {
  const $ = Sim.$;
  const rot = $("fg");
  if (!rot) return;
  // Målgrafene. x i meter fra sensoren, t fra 0 til 10 s.
  const MAAL = {
    A: { navn: "A: Stå, gå jevnt bort, stå", x: (t) => (t < 2 ? 1 : t < 7 ? 1 + 0.3 * (t - 2) : 2.5) },
    B: { navn: "B: Gå mot, stå, gå bort", x: (t) => (t < 5 ? 2.5 - 0.3 * t : t < 7 ? 1 : 1 + (t - 7) / 3) },
    C: { navn: "C: Fra ro med økende fart bort", x: (t) => 0.6 + 0.02 * t * t },
    D: { navn: "D: Bremse ned til ro", x: (t) => 0.6 + 0.4 * t - 0.02 * t * t },
    E: { navn: "E: Sakte bort, fort tilbake", x: (t) => (t < 6 ? 1 + 0.25 * t : t < 9 ? 2.5 - 0.5 * (t - 6) : 1) },
    F: { navn: "F: Bort og tilbake, jevnt og mykt", x: (t) => 1.75 - 0.75 * Math.cos(2 * Math.PI * t / 10) },
  };
  const valg = $("fg-maal");
  valg.innerHTML = Object.entries(MAAL).map(([k, m]) => `<option value="${k}">${m.navn}</option>`).join("");
  const lagret = Sim.hent("lektorbo-folg-grafen", {});
  if (lagret.maal && MAAL[lagret.maal]) valg.value = lagret.maal;
  if (lagret.data) $("fg-data").value = lagret.data;

  let pkt = [];
  function les() {
    pkt = [];
    for (const linje of $("fg-data").value.split(/\r?\n/)) {
      const deler = linje.trim().split(/[\t;]+|\s+/).filter(Boolean);
      if (deler.length < 2) continue;
      const t = Maaletabell.tall(deler[0]), x = Maaletabell.tall(deler[1]);
      if (t === null || x === null) continue;   // overskrifter hoppes over
      pkt.push({ t, x });
    }
  }

  function regn() {
    const m = MAAL[valg.value];
    const inne = pkt.filter((p) => p.t >= 0 && p.t <= 10);
    if (!inne.length) { $("fg-avvik").textContent = "–"; $("fg-n").textContent = "0"; $("fg-dom").textContent = "–"; return; }
    const avvik = inne.reduce((s, p) => s + Math.abs(p.x - m.x(p.t)), 0) / inne.length;
    $("fg-avvik").textContent = Sim.komma(avvik * 100, 0) + " cm";
    $("fg-n").textContent = String(inne.length);
    $("fg-dom").textContent = avvik < 0.08 ? "Svært god" : avvik < 0.15 ? "God" : avvik < 0.3 ? "Nesten" : "Prøv igjen";
  }

  const l = Sim.lerret($("fg-graf"), tegn);
  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f, m = MAAL[valg.value];
    l.tom();
    const { px, py } = Sim.akser(l, { x: [0, 10], y: [0, 3], xTekst: "t / s", yTekst: "x / m" });
    c.save();
    c.strokeStyle = f.f2; c.globalAlpha = 0.35; c.lineWidth = 14; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath();
    for (let i = 0; i <= 400; i++) { const t = i / 40; i ? c.lineTo(px(t), py(m.x(t))) : c.moveTo(px(t), py(m.x(t))); }
    c.stroke();
    c.globalAlpha = 1; c.lineWidth = 2; c.stroke();
    c.restore();
    if (pkt.length) {
      c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath();
      pkt.forEach((p, i) => (i ? c.lineTo(px(p.t), py(p.x)) : c.moveTo(px(p.t), py(p.x))));
      c.stroke();
    }
  }

  function oppdater() {
    les(); regn(); tegn();
    Sim.lagre("lektorbo-folg-grafen", { maal: valg.value, data: $("fg-data").value });
  }
  valg.addEventListener("change", oppdater);
  $("fg-data").addEventListener("input", oppdater);
  // Eksempel: en elev som går etter målgraf A, litt for sent i starten og med litt støy fra sensoren.
  $("fg-eksempel").addEventListener("click", () => {
    valg.value = "A";
    let s = "t\tx\n", frø = 7;
    const tilfeldig = () => { frø = (frø * 16807) % 2147483647; return frø / 2147483647 - 0.5; };
    for (let i = 0; i <= 200; i++) {
      const t = i * 0.05;
      const x = t < 2.6 ? 1.02 : t < 7.4 ? 1.02 + 0.31 * (t - 2.6) : 2.51 - 0.04 * Math.exp(-(t - 7.4) * 2);
      s += `${t.toFixed(2).replace(".", ",")}\t${(Math.min(x, 2.52) + 0.012 * tilfeldig()).toFixed(3).replace(".", ",")}\n`;
    }
    $("fg-data").value = s;
    oppdater();
  });
  $("fg-tom").addEventListener("click", () => { $("fg-data").value = ""; oppdater(); });
  oppdater();
})();
