// Sprettball. Ballen beholder en fast andel k av høyden i hvert sprett. Uten luftmotstand.
// Høyden måles fra bakken til undersiden av ballen.

const G = 9.81;
const BALLER = {
  tennis: { navn: "Tennisball", k: 0.56, m: 0.057 },
  basket: { navn: "Basketball", k: 0.72, m: 0.60 },
  bordtennis: { navn: "Bordtennisball", k: 0.75, m: 0.0027 },
  sprett: { navn: "Sprettball", k: 0.85, m: 0.020 },
  ukjent: { navn: "Ukjent ball", k: null, m: 0.050 },
};
const MIN_HOYDE = 0.004;
const MAKS_SPRETT = 25;

// Lager hele bevegelsen på forhånd: en liste med flygninger som starter i bakken (eller i slipphøyden)
function lagSprett(h0, k) {
  const flygninger = [];
  let t = 0, v = 0, y = h0, n = 0;
  while (n <= MAKS_SPRETT) {
    const tLand = (v + Math.sqrt(v * v + 2 * G * y)) / G;
    flygninger.push({ n, start: t, y0: y, v0: v, slutt: t + tLand, topp: y + v * v / (2 * G), tTopp: t + v / G });
    t += tLand;
    const vNed = v - G * tLand;
    v = -Math.sqrt(k) * vNed;
    y = 0; n++;
    if (v * v / (2 * G) < MIN_HOYDE) break;
  }
  return { flygninger, slutt: t };
}

function hoydeVed(bev, t) {
  for (const f of bev.flygninger) {
    if (t <= f.slutt) { const s = t - f.start; return f.y0 + f.v0 * s - 0.5 * G * s * s; }
  }
  return 0;
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("sprett");
  if (!el) return;

  let ball, h0, tempo, k, bev, t = 0;
  const l = Sim.lerret(el, tegn);

  function lesInnstillinger() {
    ball = Sim.verdi("ball");
    h0 = Sim.verdi("slipp", (v) => komma(v, 2) + " m");
    tempo = Number(Sim.verdi("tempo"));
  }

  function nullstill() {
    avspiller.stopp();
    const forrige = ball;
    lesInnstillinger();
    if (ball === "ukjent") {
      // Ny tilfeldig ball når man velger «Ukjent ball» på nytt, men ikke ved hver nullstilling
      if (forrige !== "ukjent" || k === null) k = Math.round((0.35 + Math.random() * 0.55) * 100) / 100;
    } else k = BALLER[ball].k;
    bev = lagSprett(h0, k);
    t = 0;
    tegn();
  }

  function steg(dt) {
    t = Math.min(bev.slutt, t + dt * tempo);
    tegn();
    return t < bev.slutt;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  // Toppene ballen har nådd så langt (uten slipphøyden)
  const nadde = () => bev.flygninger.filter((f) => f.n > 0 && f.tTopp <= t);

  function tegn() {
    if (!bev || !l.b) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const venstreB = Math.min(170, l.b * 0.3);
    const bunn = l.h - 30, toppY = 18;
    const hMaks = 2.2;
    const sy = (y) => bunn - y / hMaks * (bunn - toppY);

    // Målestav
    const stavX = 44;
    c.font = "11px " + Sim.MONO;
    c.strokeStyle = f.blekk; c.fillStyle = f.dempet; c.lineWidth = 1;
    c.beginPath(); c.moveTo(stavX, sy(0)); c.lineTo(stavX, sy(hMaks)); c.stroke();
    c.textAlign = "right"; c.textBaseline = "middle";
    for (let cm = 0; cm <= hMaks * 100 + 1e-6; cm += 10) {
      const lang = cm % 50 === 0;
      c.beginPath(); c.moveTo(stavX, sy(cm / 100)); c.lineTo(stavX + (lang ? 12 : 6), sy(cm / 100)); c.stroke();
      if (lang) c.fillText(komma(cm / 100, 1), stavX - 5, sy(cm / 100));
    }
    c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("h / m", 4, 2);

    // Bakken
    c.strokeStyle = f.blekk; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(stavX, sy(0)); c.lineTo(venstreB, sy(0)); c.stroke();

    // Merker for toppene
    const topper = nadde();
    c.strokeStyle = f.f1; c.fillStyle = f.f1; c.lineWidth = 1.5;
    c.textAlign = "left"; c.textBaseline = "middle";
    for (const tp of topper.slice(0, 6)) {
      c.beginPath(); c.moveTo(stavX + 14, sy(tp.topp)); c.lineTo(stavX + 30, sy(tp.topp)); c.stroke();
      c.fillText(String(tp.n), stavX + 33, sy(tp.topp));
    }

    // Ballen
    const r = Math.max(6, Math.min(14, 0.06 / hMaks * (bunn - toppY)));
    const y = hoydeVed(bev, t), bx = (stavX + 46 + venstreB) / 2;
    c.fillStyle = f.f2;
    c.beginPath(); c.arc(bx, sy(y) - r, r, 0, 2 * Math.PI); c.fill();

    // Graf over høyden
    const ga = { b: l.b - venstreB, h: l.h, ctx: c, f };
    c.save(); c.translate(venstreB, 0);
    const { px, py } = Sim.akser(ga, { x: [0, Math.max(1, bev.slutt * 1.02)], y: [0, hMaks], xTekst: "t / s", ySteg: 0.5, marg: { v: 40, o: 18 } });
    c.strokeStyle = f.f2; c.lineWidth = 2; c.lineJoin = "round";
    c.beginPath();
    for (let s = 0, i = 0; s <= t + 1e-9; s += 0.004, i++) {
      const yy = hoydeVed(bev, Math.min(s, t));
      i ? c.lineTo(px(s), py(yy)) : c.moveTo(px(s), py(yy));
    }
    c.stroke();
    c.fillStyle = f.f1;
    for (const tp of topper) { c.beginPath(); c.arc(px(tp.tTopp), py(tp.topp), 3, 0, 2 * Math.PI); c.fill(); }
    c.restore();

    oppdaterTabell(topper);
  }

  let forrigeRader = -1;
  function oppdaterTabell(topper) {
    $("tid").textContent = komma(t, 2) + " s";
    $("antall").textContent = String(topper.length);
    $("andel").textContent = ball === "ukjent" ? "?" : komma(k, 2);
    $("masse").textContent = komma(BALLER[ball].m * 1000, BALLER[ball].m < 0.01 ? 1 : 0) + " g";
    if (topper.length === forrigeRader) return;
    forrigeRader = topper.length;
    const m = BALLER[ball].m, skjul = ball === "ukjent";
    let forrige = h0;
    const rader = topper.slice(0, 12).map((tp) => {
      const andel = tp.topp / forrige, ep = m * G * tp.topp, tapt = 1 - andel;
      const rad = `<tr><th scope="row">${tp.n}</th><td>${komma(tp.topp * 100, 1)} cm</td>` +
        `<td>${skjul ? "?" : komma(andel, 2)}</td><td>${skjul ? "?" : Sim.tall(ep, 3) + " J"}</td><td>${skjul ? "?" : komma(tapt * 100, 0) + " %"}</td></tr>`;
      forrige = tp.topp;
      return rad;
    });
    $("rader").innerHTML = `<tr><th scope="row">0 (slipp)</th><td>${komma(h0 * 100, 1)} cm</td><td>–</td><td>${skjul ? "?" : Sim.tall(m * G * h0, 3) + " J"}</td><td>–</td></tr>` + rader.join("");
  }

  $("nullstill").addEventListener("click", () => { forrigeRader = -1; nullstill(); });
  for (const id of ["ball", "slipp"]) $(id).addEventListener("input", () => { forrigeRader = -1; nullstill(); });
  $("tempo").addEventListener("input", () => { tempo = Number(Sim.verdi("tempo")); });
  $("ny-ukjent").addEventListener("click", () => {
    $("ball").value = "ukjent"; k = null; ball = null; forrigeRader = -1; nullstill();
  });

  nullstill();
  l.tilpass();
})();

// Egne data: elevene skriver inn høyder fra en ekte ball
(function () {
  const $ = Sim.$, komma = Sim.komma;
  const skjema = $("egne-data");
  if (!skjema) return;
  const NOKKEL = "lektorbo-sprettball";
  const felt = ["e-masse", "e-h0", "e-h1", "e-h2", "e-h3", "e-h4", "e-h5", "e-h6"];
  const l = Sim.lerret($("egne-graf"), tegn);

  const lagret = Sim.hent(NOKKEL, {});
  for (const id of felt) if (lagret[id] !== undefined) $(id).value = lagret[id];

  const tallFra = (id) => { const v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : null; };

  function beregn() {
    const m = tallFra("e-masse");
    const h = [0, 1, 2, 3, 4, 5, 6].map((i) => tallFra("e-h" + i));
    const andeler = [];
    for (let i = 1; i <= 6; i++) {
      const andel = h[i] && h[i - 1] ? h[i] / h[i - 1] : null;
      if (andel) andeler.push(andel);
      $("e-andel" + i).textContent = andel ? komma(andel, 2) : "";
      $("e-tap" + i).textContent = andel && m ? komma(m / 1000 * G * (h[i - 1] - h[i]) / 100, 3) + " J" : "";
      $("e-tapp" + i).textContent = andel ? komma((1 - andel) * 100, 0) + " %" : "";
    }
    const snitt = andeler.length ? andeler.reduce((a, b) => a + b, 0) / andeler.length : null;
    $("e-snitt").textContent = snitt ? komma(snitt, 2) : "–";
    $("e-stottall").textContent = snitt ? komma(Math.sqrt(snitt), 2) : "–";
    return { h, snitt };
  }

  function tegn() {
    const { h, snitt } = beregn();
    if (!l.b) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const hm = Math.max(10, ...h.filter(Boolean)) * 1.1;
    const { px, py } = Sim.akser(l, { x: [-0.5, 6.5], y: [0, hm], xSteg: 1, xTekst: "sprett nr.", yTekst: "h / cm", marg: { v: 44 } });
    const bredde = (px(1) - px(0)) * 0.55;
    h.forEach((v, i) => {
      if (!v) return;
      c.fillStyle = i === 0 ? f.dempet : f.f2;
      c.fillRect(px(i) - bredde / 2, py(v), bredde, py(0) - py(v));
    });
    // Modell: h0 · kⁿ med gjennomsnittlig andel
    if (snitt && h[0]) {
      c.strokeStyle = f.f1; c.lineWidth = 2; c.setLineDash([5, 4]);
      c.beginPath();
      for (let x = 0; x <= 6.001; x += 0.05) { const y = h[0] * snitt ** x; x ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y)); }
      c.stroke(); c.setLineDash([]);
    }
  }

  function endret() {
    const lagre = {};
    for (const id of felt) lagre[id] = $(id).value;
    Sim.lagre(NOKKEL, lagre);
    tegn();
  }
  skjema.addEventListener("input", endret);

  $("e-eksempel").addEventListener("click", () => {
    const eks = { "e-masse": "57", "e-h0": "150", "e-h1": "86", "e-h2": "50", "e-h3": "29", "e-h4": "17", "e-h5": "", "e-h6": "" };
    for (const id of felt) $(id).value = eks[id];
    endret();
  });
  $("e-tom").addEventListener("click", () => { for (const id of felt) $(id).value = ""; endret(); });
  $("e-kopier").addEventListener("click", (e) => {
    const linjer = ["sprett\thøyde (cm)"];
    for (let i = 0; i <= 6; i++) { const v = $("e-h" + i).value; if (v) linjer.push(i + "\t" + v); }
    Sim.kopier(linjer.join("\n"), e.currentTarget);
  });

  l.tilpass();
})();
