// To kuler i snorer. Kule A trekkes ut og slippes mot kule B, som henger i ro.
// Begge snorene er like lange, så kulene berører hverandre når de har samme utslag.
// Støtet regnes som momentant og sentralt. Mellom støtene svinger kulene som vanlige pendler (RK4).
// Enheter: kg, m, s. Vinkler i radianer, positiv mot høyre.

const G = 9.81;
const L = 1.0;
const STOTTALL = { elastisk: 1, uelastisk: 0.5, fullstendig: 0 };

function etterStot(mA, vA, mB, vB, e) {
  const p = mA * vA + mB * vB, M = mA + mB;
  return [(p + mB * e * (vB - vA)) / M, (p + mA * e * (vA - vB)) / M];
}

// Høyde og vinkel som en kule med farten u i bunnen når opp til
function utslag(u) {
  const h = u * u / (2 * G);
  return { h, vinkel: h >= 2 * L ? 180 : Math.acos(Math.max(-1, 1 - h / L)) * 180 / Math.PI };
}

function lagSystem({ vinkel, mA, mB, type }) {
  return { thA: -vinkel * Math.PI / 180, wA: 0, thB: 0, wB: 0, mA, mB, e: STOTTALL[type], laast: false, t: 0, stot: [] };
}

function rk4(th, w, dt) {
  const a = (x) => -G / L * Math.sin(x);
  const k1t = w, k1w = a(th);
  const k2t = w + k1w * dt / 2, k2w = a(th + k1t * dt / 2);
  const k3t = w + k2w * dt / 2, k3w = a(th + k2t * dt / 2);
  const k4t = w + k3w * dt, k4w = a(th + k3t * dt);
  return [th + (k1t + 2 * k2t + 2 * k3t + k4t) * dt / 6, w + (k1w + 2 * k2w + 2 * k3w + k4w) * dt / 6];
}

// Ett tidssteg. Kulene støter når A har kommet like langt eller lenger mot høyre enn B og nærmer seg B.
function steg(s, dt) {
  [s.thA, s.wA] = rk4(s.thA, s.wA, dt);
  if (s.laast) { s.thB = s.thA; s.wB = s.wA; }
  else [s.thB, s.wB] = rk4(s.thB, s.wB, dt);
  s.t += dt;
  if (!s.laast && s.thA >= s.thB && s.wA > s.wB) {
    // Flytt kulene tilbake til felles vinkel og regn støtet med fartene langs banen
    const th = (s.thA + s.thB) / 2;
    s.thA = s.thB = th;
    const før = [s.wA * L, s.wB * L];
    const [uA, uB] = etterStot(s.mA, før[0], s.mB, før[1], s.e);
    s.wA = uA / L; s.wB = uB / L;
    if (s.e === 0) s.laast = true;
    s.stot.push({ t: s.t, før, etter: [uA, uB] });
  }
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("kuler");
  if (!el) return;

  const DT = 0.0005;
  let inn, sys, spor = [], maks = { A: 0, B: 0 };
  const l = Sim.lerret(el, tegn);
  const radius = (m) => 9 * Math.cbrt(m / 0.03);

  function lesInnstillinger() {
    inn = {
      vinkel: Sim.verdi("vinkel", (v) => v + "°"),
      mA: Sim.verdi("masse-a", (v) => v + " g") / 1000,
      mB: Sim.verdi("masse-b", (v) => v + " g") / 1000,
      type: Sim.verdi("type"),
    };
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    sys = lagSystem(inn);
    spor = []; maks = { A: 0, B: 0 };
    tegn();
  }

  function framover(dt) {
    const n = Math.max(1, Math.round(dt * Number($("tempo").value) / DT));
    for (let i = 0; i < n; i++) {
      steg(sys, DT);
      if (sys.stot.length === 1) {
        maks.A = Math.max(maks.A, Math.abs(sys.thA));
        maks.B = Math.max(maks.B, Math.abs(sys.thB));
      }
    }
    tegn();
    return sys.t < 60;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg: framover, nullstill, lerret: el });

  function tegn() {
    if (!l.b || !sys) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const rA = radius(inn.mA), rB = radius(inn.mB);
    const skala = Math.min((l.h - 40 - Math.max(rA, rB)) / L, (l.b / 2 - 30) / L);
    const ox = l.b / 2, oy = 18;
    const posA = [ox - rA + L * skala * Math.sin(sys.thA), oy + L * skala * Math.cos(sys.thA)];
    const posB = [ox + rB + L * skala * Math.sin(sys.thB), oy + L * skala * Math.cos(sys.thB)];
    spor.push([posA, posB]); if (spor.length > 400) spor.shift();

    // Gradskive
    c.strokeStyle = f.rute; c.lineWidth = 1; c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO;
    c.textAlign = "center"; c.textBaseline = "middle";
    for (let g = -90; g <= 90; g += 15) {
      const r = g * Math.PI / 180, x = ox + Math.sin(r) * L * skala, y = oy + Math.cos(r) * L * skala;
      c.beginPath(); c.moveTo(ox + Math.sin(r) * L * skala * 0.93, oy + Math.cos(r) * L * skala * 0.93); c.lineTo(x, y); c.stroke();
      if (g % 30 === 0 && g !== 0 && Math.abs(g) !== 90) c.fillText(Math.abs(g) + "°", ox + Math.sin(r) * L * skala * 0.86, oy + Math.cos(r) * L * skala * 0.86);
    }
    c.beginPath(); c.arc(ox, oy, L * skala, Math.PI * 0.02, Math.PI * 0.98); c.stroke();
    // Største utslag etter første støt
    if (sys.stot.length) {
      for (const [hvem, th, farge, r0] of [["A", -maks.A, f.f1, -rA], ["B", maks.B, f.f2, rB]]) {
        if (Math.abs(th) < 0.01) continue;
        c.strokeStyle = farge; c.setLineDash([4, 4]); c.lineWidth = 1;
        const sgn = hvem === "A" ? (sys.stot[0].etter[0] >= 0 ? 1 : -1) : 1;
        const vinkel = sgn * Math.abs(th);
        c.beginPath(); c.moveTo(ox + r0, oy); c.lineTo(ox + r0 + Math.sin(vinkel) * L * skala, oy + Math.cos(vinkel) * L * skala); c.stroke();
        c.setLineDash([]);
      }
    }
    // Spor
    if ($("spor").checked) {
      for (const [i, farge] of [[0, f.f1], [1, f.f2]]) {
        c.strokeStyle = farge; c.globalAlpha = 0.35; c.lineWidth = 1.5; c.beginPath();
        spor.forEach((p, k) => (k ? c.lineTo(p[i][0], p[i][1]) : c.moveTo(p[i][0], p[i][1])));
        c.stroke(); c.globalAlpha = 1;
      }
    }
    // Oppheng, snorer og kuler
    c.strokeStyle = f.blekk; c.lineWidth = 3;
    c.beginPath(); c.moveTo(ox - 70, oy); c.lineTo(ox + 70, oy); c.stroke();
    c.lineWidth = 1.2; c.strokeStyle = f.dempet;
    c.beginPath(); c.moveTo(ox - rA, oy); c.lineTo(...posA); c.moveTo(ox + rB, oy); c.lineTo(...posB); c.stroke();
    for (const [p, r, farge, navn] of [[posA, rA, f.f1, "A"], [posB, rB, f.f2, "B"]]) {
      c.fillStyle = farge; c.beginPath(); c.arc(p[0], p[1], r, 0, 2 * Math.PI); c.fill();
      c.fillStyle = f.papir; c.font = "600 " + Math.max(10, Math.round(r * 0.9)) + "px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(navn, p[0], p[1] + 1);
    }
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("t = " + komma(sys.t, 2) + " s", 10, 8);
    c.textAlign = "right";
    c.fillText(sys.stot.length + " støt", l.b - 10, 8);
    oppdaterTall();
  }

  function oppdaterTall() {
    const vFør = Math.sqrt(2 * G * L * (1 - Math.cos(inn.vinkel * Math.PI / 180)));
    const fasit = etterStot(inn.mA, vFør, inn.mB, 0, STOTTALL[inn.type]);
    const første = sys.stot[0];
    const vis = (x) => (første ? x : "?");
    const ek = (a, b) => 0.5 * inn.mA * a * a + 0.5 * inn.mB * b * b;
    $("v-for").textContent = komma(vFør, 2) + " m/s";
    $("u-a").textContent = vis(komma(fasit[0], 2) + " m/s");
    $("u-b").textContent = vis(komma(fasit[1], 2) + " m/s");
    $("p-for").textContent = komma(inn.mA * vFør, 4) + " kg m/s";
    $("p-etter").textContent = vis(komma(inn.mA * fasit[0] + inn.mB * fasit[1], 4) + " kg m/s");
    $("ek-for").textContent = komma(ek(vFør, 0), 4) + " J";
    $("ek-etter").textContent = vis(komma(ek(...fasit), 4) + " J");
    const a = utslag(fasit[0]), b = utslag(fasit[1]);
    $("utslag-a").textContent = vis(komma(a.vinkel, 1) + "° " + (fasit[0] < -1e-9 ? "mot venstre" : fasit[0] > 1e-9 ? "mot høyre" : "") + " (h = " + komma(a.h * 100, 1) + " cm)");
    $("utslag-b").textContent = vis(komma(b.vinkel, 1) + "° (h = " + komma(b.h * 100, 1) + " cm)");
  }

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["vinkel", "masse-a", "masse-b", "type"]) $(id).addEventListener("input", nullstill);
  $("spor").addEventListener("input", tegn);

  nullstill();
})();
