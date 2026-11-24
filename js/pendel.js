// Pendel med pinne. Snora treffer en pinne rett under opphenget og svinger videre om pinnen.
// Koordinater i meter med opphenget i origo og y oppover. Pinnen står i (0, −d).

const G = 9.81;
const SNOR_L = 1.0;
const MASSE = 0.2;
const DT = 0.0005;

function nyPendel(vinkelGrader, d) {
  return { modus: "oppheng", th: -vinkelGrader * Math.PI / 180, om: 0, d, R: SNOR_L - d, t: 0, tap: 0, x: 0, y: 0, vx: 0, vy: 0 };
}

// Radius og sentrum for sirkelen kula følger i nåværende modus
const radius = (p) => (p.modus === "oppheng" ? SNOR_L : p.R);
const sentrumY = (p) => (p.modus === "oppheng" ? 0 : -p.d);

function tilstand(p) {
  if (p.modus === "fritt") return { x: p.x, y: p.y, vx: p.vx, vy: p.vy };
  const r = radius(p), s = Math.sin(p.th), c = Math.cos(p.th);
  return { x: r * s, y: sentrumY(p) - r * c, vx: r * c * p.om, vy: r * s * p.om };
}

// Snorkraft delt på masse: S/m = v²/r + g·cos φ
function snorkraftPerMasse(p) {
  if (p.modus === "fritt") return 0;
  const r = radius(p);
  return r * p.om * p.om + G * Math.cos(p.th);
}

// Mekanisk energi per masse, med nullnivå i laveste punkt
function energiPerMasse(p) {
  const s = tilstand(p);
  return { ek: 0.5 * (s.vx * s.vx + s.vy * s.vy), ep: G * (s.y + SNOR_L) };
}

function stegPendel(p, dt) {
  p.t += dt;
  if (p.modus === "fritt") {
    p.x += p.vx * dt;
    p.y += p.vy * dt - 0.5 * G * dt * dt;
    p.vy -= G * dt;
    const dx = p.x, dy = p.y + p.d, r = Math.hypot(dx, dy);
    const ux = dx / r, uy = dy / r, vr = p.vx * ux + p.vy * uy;
    if (r >= p.R && vr > 0) {
      // Snora strammes med et rykk. Farten langs snora forsvinner, og den energien går tapt.
      p.tap += 0.5 * vr * vr * MASSE;
      p.vx -= vr * ux; p.vy -= vr * uy;
      let phi = Math.atan2(dx, -dy);
      while (phi - p.thSlakk > Math.PI) phi -= 2 * Math.PI;
      while (phi - p.thSlakk < -Math.PI) phi += 2 * Math.PI;
      p.th = phi;
      p.om = (p.vx * Math.cos(phi) + p.vy * Math.sin(phi)) / p.R;
      p.modus = "pinne";
    }
    return;
  }

  // RK4 for θ'' = −(g/r)·sin θ
  const k = G / radius(p);
  const f = (th, om) => [om, -k * Math.sin(th)];
  const [a1, b1] = f(p.th, p.om);
  const [a2, b2] = f(p.th + a1 * dt / 2, p.om + b1 * dt / 2);
  const [a3, b3] = f(p.th + a2 * dt / 2, p.om + b2 * dt / 2);
  const [a4, b4] = f(p.th + a3 * dt, p.om + b3 * dt);
  const forrige = p.th;
  p.th += (a1 + 2 * a2 + 2 * a3 + a4) * dt / 6;
  p.om += (b1 + 2 * b2 + 2 * b3 + b4) * dt / 6;

  if (p.modus === "oppheng" && p.d > 0 && forrige < 0 && p.th >= 0 && p.om > 0) {
    // Snora treffer pinnen. Farten er den samme, men radien blir mindre.
    p.modus = "pinne";
    p.th *= SNOR_L / p.R; p.om *= SNOR_L / p.R;
  } else if (p.modus === "pinne" && forrige > 0 && p.th <= 0 && p.om < 0) {
    p.modus = "oppheng";
    p.th *= p.R / SNOR_L; p.om *= p.R / SNOR_L;
  } else if (p.modus === "pinne" && snorkraftPerMasse(p) < 0) {
    // Snora blir slakk, og kula følger en kastebane
    Object.assign(p, tilstand(p));
    p.thSlakk = p.th;
    p.modus = "fritt";
  }
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("pendel");
  if (!el) return;

  let p, vinkel, d, tempo, visSpor, spor = [], hMaks = null, hoyreSide = false;

  const l = Sim.lerret(el, tegn);
  let skala = 1, ox = 0, oy = 0;
  function oppsett() {
    const xMin = -1.2, xMax = 1.2, yMin = -1.13, yMax = 0.14;
    skala = Math.min(l.b / (xMax - xMin), l.h / (yMax - yMin));
    ox = l.b / 2;
    oy = (l.h - (yMax - yMin) * skala) / 2 + yMax * skala;
  }
  const sx = (x) => ox + x * skala;
  const sy = (y) => oy - y * skala;

  function lesInnstillinger() {
    vinkel = Sim.verdi("vinkel", (v) => v + "°");
    d = Sim.verdi("pinne", (v) => (v === 0 ? "ingen pinne" : komma(v, 2) + " m"));
    tempo = Number(Sim.verdi("tempo"));
    visSpor = Sim.verdi("spor");
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    p = nyPendel(vinkel, d);
    spor = []; hMaks = null; hoyreSide = false;
    tegn();
  }

  function steg(dt) {
    const slutt = p.t + dt * tempo;
    while (p.t < slutt) {
      stegPendel(p, Math.min(DT, slutt - p.t + 1e-12));
      const s = tilstand(p);
      if (s.x > 0 && !hoyreSide) { hoyreSide = true; hMaks = s.y + SNOR_L; }
      if (s.x < 0) hoyreSide = false;
      if (hoyreSide) hMaks = Math.max(hMaks, s.y + SNOR_L);
    }
    const s = tilstand(p);
    spor.push([s.x, s.y]);
    if (spor.length > 240) spor.shift();
    tegn();
    return p.t < 120;
  }

  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function strek(fra, til, farge, bredde, stiplet) {
    const c = l.ctx;
    c.strokeStyle = farge; c.lineWidth = bredde;
    c.setLineDash(stiplet ? [5, 5] : []);
    c.beginPath(); c.moveTo(sx(fra[0]), sy(fra[1])); c.lineTo(sx(til[0]), sy(til[1])); c.stroke();
    c.setLineDash([]);
  }

  function tegn() {
    if (!p || !l.b) return;
    oppsett();
    const c = l.ctx, f = l.f;
    l.tom();
    c.font = "12px " + Sim.MONO;

    // Høydelinjer
    const y0 = -SNOR_L * Math.cos(vinkel * Math.PI / 180);
    strek([-1.18, y0], [1.18, y0], f["rute-sterk"], 1, true);
    strek([-1.18, -SNOR_L], [1.18, -SNOR_L], f.rute, 1, true);
    c.fillStyle = f.dempet; c.textAlign = "right"; c.textBaseline = "bottom";
    c.fillText("starthøyde", sx(1.18), sy(y0) - 3);
    c.textBaseline = "top";
    c.fillText("laveste punkt", sx(1.18), sy(-SNOR_L) + 3);

    // Taket og opphenget
    c.strokeStyle = f.blekk; c.lineWidth = 2;
    c.beginPath(); c.moveTo(sx(-0.3), sy(0)); c.lineTo(sx(0.3), sy(0)); c.stroke();
    c.lineWidth = 1;
    for (let x = -0.28; x <= 0.3; x += 0.07) { c.beginPath(); c.moveTo(sx(x), sy(0)); c.lineTo(sx(x + 0.05), sy(0.06)); c.stroke(); }

    // Høyeste punkt på høyre side
    if (hMaks !== null) {
      const y = hMaks - SNOR_L;
      c.strokeStyle = f.f1; c.lineWidth = 2;
      c.beginPath(); c.moveTo(sx(0.62), sy(y)); c.lineTo(sx(0.86), sy(y)); c.stroke();
      c.fillStyle = f.f1; c.textAlign = "left"; c.textBaseline = "middle";
      c.fillText("høyest", sx(0.88), sy(y));
    }

    // Spor
    if (visSpor && spor.length > 1) {
      c.strokeStyle = f.f1; c.globalAlpha = 0.35; c.lineWidth = 2;
      c.beginPath();
      spor.forEach(([x, y], i) => (i ? c.lineTo(sx(x), sy(y)) : c.moveTo(sx(x), sy(y))));
      c.stroke(); c.globalAlpha = 1;
    }

    // Snora
    const s = tilstand(p), pinne = [0, -d];
    if (p.modus === "oppheng") strek([0, 0], [s.x, s.y], f.blekk, 1.5);
    else {
      strek([0, 0], pinne, f.blekk, 1.5);
      if (p.modus === "pinne") strek(pinne, [s.x, s.y], f.blekk, 1.5);
      else {
        // Slakk snor: tegnes som en bue som henger ned
        const mx = (s.x + pinne[0]) / 2, my = (s.y + pinne[1]) / 2 - 0.25 * (p.R - Math.hypot(s.x, s.y + d));
        c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(sx(pinne[0]), sy(pinne[1])); c.quadraticCurveTo(sx(mx), sy(my), sx(s.x), sy(s.y)); c.stroke();
        c.setLineDash([]);
      }
    }
    c.fillStyle = f.blekk;
    c.beginPath(); c.arc(sx(0), sy(0), 3.5, 0, 2 * Math.PI); c.fill();
    if (d > 0) {
      c.fillStyle = f.flate; c.strokeStyle = f.blekk; c.lineWidth = 2;
      c.beginPath(); c.arc(sx(0), sy(-d), 5, 0, 2 * Math.PI); c.fill(); c.stroke();
      c.fillStyle = f.dempet; c.textAlign = "right"; c.textBaseline = "middle";
      c.fillText("pinne", sx(0) - 10, sy(-d));
    }

    // Kula
    c.fillStyle = f.f1;
    c.beginPath(); c.arc(sx(s.x), sy(s.y), Math.max(7, 0.045 * skala), 0, 2 * Math.PI); c.fill();

    oppdaterTall();
  }

  function oppdaterTall() {
    const e = energiPerMasse(p), e0 = G * SNOR_L * (1 - Math.cos(vinkel * Math.PI / 180));
    const ek = MASSE * e.ek, ep = MASSE * e.ep, etot = MASSE * e0;
    $("tid").textContent = komma(p.t, 2) + " s";
    $("fart").textContent = komma(Math.sqrt(2 * e.ek), 2) + " m/s";
    $("hoyde").textContent = komma(e.ep / G, 3) + " m";
    $("snorkraft").textContent = p.modus === "fritt" ? "slakk" : komma(MASSE * snorkraftPerMasse(p), 2) + " N";
    $("h-start").textContent = komma(e0 / G, 3) + " m";
    $("h-maks").textContent = hMaks === null ? "–" : komma(hMaks, 3) + " m";
    $("tap").textContent = komma(p.tap, 3) + " J";
    $("stolpe-ep").style.width = (100 * ep / etot) + "%";
    $("stolpe-ek").style.width = (100 * ek / etot) + "%";
    $("stolpe-q").style.width = (100 * p.tap / etot) + "%";
  }

  // Dra kula for å velge startvinkel
  let drar = false;
  function vinkelFraPeker(e) {
    const [X, Y] = Sim.punkt(el, e);
    const x = (X - ox) / skala, y = (oy - Y) / skala;
    const v = Math.round(Math.abs(Math.atan2(x, -y)) * 180 / Math.PI);
    $("vinkel").value = Math.min(90, Math.max(5, v));
    nullstill();
  }
  el.addEventListener("pointerdown", (e) => {
    if (avspiller.kjorer) return;
    drar = true; el.setPointerCapture(e.pointerId); vinkelFraPeker(e);
  });
  el.addEventListener("pointermove", (e) => { if (drar) vinkelFraPeker(e); });
  el.addEventListener("pointerup", () => { drar = false; });

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["vinkel", "pinne"]) $(id).addEventListener("input", nullstill);
  $("tempo").addEventListener("input", () => { tempo = Number(Sim.verdi("tempo")); });
  $("spor").addEventListener("input", () => { visSpor = Sim.verdi("spor"); tegn(); });

  nullstill();
  l.tilpass();
})();
