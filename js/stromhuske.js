// Strømhuske: En metallstav henger i to snorer i et loddrett magnetfelt. Vi ser staven fra enden.
// Strømmen går inn i planet (⊗) når I er positiv. Kraften F = I l × B er vannrett.
// Huska svinger med litt demping og finner likevekt der tan α = IlB / mg.

const G = 9.81;
const SNOR = 0.15;      // snorlengde i m
const DEMPING = 0.4;    // 1/s

// Vannrett kraft på staven, positiv mot høyre. I > 0 er inn i planet, opp = true betyr B oppover.
// (inn i planet) × (opp) = mot høyre.
function kraft(I, l, B, opp) { return I * l * B * (opp ? 1 : -1); }

function pendelSteg(s, Fx, m, dt) {
  const a = (-m * G * Math.sin(s.theta) + Fx * Math.cos(s.theta)) / (m * SNOR) - DEMPING * s.omega;
  s.omega += a * dt;
  s.theta += s.omega * dt;
}

(function () {
  const $ = Sim.$, komma = Sim.komma, tall = Sim.tall;
  const el = $("huske");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, Fx = 0, tilstand = { theta: 0, omega: 0 }, maksVinkel = 0, id = null, forrige = null;
  let ukjentB = nyUkjent(), visUkjent = false;

  function nyUkjent() { return [0.15, 0.2, 0.25, 0.3, 0.35, 0.45, 0.55, 0.6, 0.65, 0.7][Math.floor(Math.random() * 10)]; }

  function les() {
    const ukjent = Sim.verdi("modus") === "ukjent";
    inn = {
      I: Sim.verdi("strom", (v) => komma(Math.abs(v), 1) + " A " + (v > 0 ? "⊗" : v < 0 ? "⊙" : "")),
      B: ukjent ? ukjentB : Sim.verdi("felt", (v) => komma(v, 2) + " T"),
      opp: Sim.verdi("retning") === "opp",
      l: Sim.verdi("lengde", (v) => komma(v, 0) + " cm") / 100,
      m: Sim.verdi("masse", (v) => komma(v, 0) + " g") / 1000,
      ukjent,
    };
    $("rad-felt").hidden = ukjent;
    $("ukjent-knapper").hidden = !ukjent;
    Fx = kraft(inn.I, inn.l, inn.B, inn.opp);
  }

  function endret() { les(); maksVinkel = 0; start(); oppdater(); }
  function start() { if (!id) { forrige = null; id = requestAnimationFrame(bilde); } }

  function bilde(naa) {
    id = null;
    const dt = forrige === null ? 0 : Math.min((naa - forrige) / 1000, 0.05);
    forrige = naa;
    for (let k = 0; k < 20; k++) pendelSteg(tilstand, Fx, inn.m, dt / 20);
    maksVinkel = Math.max(maksVinkel, Math.abs(tilstand.theta));
    oppdater();
    const likevekt = Math.atan2(Fx, inn.m * G);
    if (Math.abs(tilstand.omega) > 1e-4 || Math.abs(tilstand.theta - likevekt) > 1e-4) id = requestAnimationFrame(bilde);
  }

  function oppdater() {
    const F = Math.abs(Fx), Gk = inn.m * G;
    const skjul = inn.ukjent && !visUkjent;
    $("r-f").textContent = skjul ? "?" : tall(F, 3) + " N";
    $("r-g").textContent = tall(Gk, 3) + " N";
    $("r-vinkel").textContent = komma(Math.abs(tilstand.theta) * 180 / Math.PI, 1) + "°";
    $("r-maks").textContent = komma(maksVinkel * 180 / Math.PI, 1) + "°";
    $("r-b").textContent = skjul ? "?" : komma(inn.B, 2) + " T " + (inn.opp ? "opp" : "ned");
    tegn();
  }

  function pil(c, x0, y0, x1, y1, farge, navn) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 3) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, h = 8;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.7, y1 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * h - uy * h * 0.5, y1 - uy * h + ux * h * 0.5); c.lineTo(x1 - ux * h + uy * h * 0.5, y1 - uy * h - ux * h * 0.5); c.closePath(); c.fill();
    c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(navn, x1 + ux * 13 + (Math.abs(ux) < 0.3 ? 12 : 0), y1 + uy * 13);
  }

  function tegn() {
    if (!l.b || !inn) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    const sk = Math.min(l.h / 0.25, (smal ? l.b : l.b * 0.6) / 0.36);
    const mx = smal ? l.b / 2 : l.b * 0.32, topp = l.h * 0.1;
    const X = (x) => mx + x * sk, Y = (y) => topp + y * sk;
    // Magnetfeltet: loddrette feltlinjer
    const skjul = inn.ukjent && !visUkjent;
    c.strokeStyle = f["rute-sterk"]; c.fillStyle = f["rute-sterk"]; c.lineWidth = 1;
    if (inn.B > 0) for (let k = -4; k <= 4; k++) {
      const x = X(k * 0.035), y0 = Y(0.03), y1 = Y(0.23);
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
      const ym = (y0 + y1) / 2 + (inn.opp ? -4 : 4), r = inn.opp ? -1 : 1;
      c.beginPath(); c.moveTo(x, ym); c.lineTo(x - 4, ym - r * 7); c.lineTo(x + 4, ym - r * 7); c.closePath(); c.fill();
    }
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("B " + (inn.opp ? "opp" : "ned") + (skjul ? "" : " = " + komma(inn.B, 2) + " T"), X(-0.16), Y(0.235));
    // Oppheng, snor og stav
    const th = tilstand.theta, sx = X(SNOR * Math.sin(th)), sy = Y(0.02 + SNOR * Math.cos(th));
    c.strokeStyle = f.blekk; c.lineWidth = 3;
    c.beginPath(); c.moveTo(X(-0.03), Y(0.02)); c.lineTo(X(0.03), Y(0.02)); c.stroke();
    c.strokeStyle = f.dempet; c.setLineDash([3, 4]); c.lineWidth = 1;
    c.beginPath(); c.moveTo(X(0), Y(0.02)); c.lineTo(X(0), Y(0.02 + SNOR + 0.02)); c.stroke(); c.setLineDash([]);
    if (Math.abs(th) > 0.01) {
      c.beginPath(); c.arc(X(0), Y(0.02), 0.04 * sk, Math.PI / 2, Math.PI / 2 - th, th > 0); c.stroke();
      c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
      c.fillText("α", X(0.05 * Math.sin(th / 2)), Y(0.02 + 0.05 * Math.cos(th / 2)) - 6);
    }
    c.strokeStyle = f.blekk; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(X(0), Y(0.02)); c.lineTo(sx, sy); c.stroke();
    const r = 11;
    c.fillStyle = f.f1; c.beginPath(); c.arc(sx, sy, r, 0, 2 * Math.PI); c.fill();
    c.strokeStyle = f.papir; c.fillStyle = f.papir; c.lineWidth = 2;
    if (inn.I > 0) { c.beginPath(); c.moveTo(sx - 5, sy - 5); c.lineTo(sx + 5, sy + 5); c.moveTo(sx + 5, sy - 5); c.lineTo(sx - 5, sy + 5); c.stroke(); }
    else if (inn.I < 0) { c.beginPath(); c.arc(sx, sy, 3, 0, 2 * Math.PI); c.fill(); }
    // Kreftene på staven
    if ($("vis-krefter").checked) {
      const Gk = inn.m * G, kSk = 0.05 * sk / Gk;
      pil(c, sx, sy, sx, sy + Gk * kSk, f.blekk, "G");
      if (Math.abs(Fx) > 0) pil(c, sx, sy, sx + Fx * kSk, sy, f.f2, "F");
      const S = Math.hypot(Gk, Fx);
      pil(c, sx, sy, sx - S * Math.sin(th) * kSk, sy - S * Math.cos(th) * kSk, f.dempet, "S");
      if (!smal) {
        const ox = l.b * 0.74, oy = l.h * 0.2, k2 = Math.min(l.h * 0.45, l.b * 0.18) / Math.max(Gk, Math.abs(Fx));
        c.fillStyle = f.dempet; c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "bottom";
        c.fillText("Kreftene i likevekt", ox - 30, oy - 28);
        pil(c, ox, oy, ox, oy + Gk * k2, f.blekk, "G");
        pil(c, ox, oy + Gk * k2, ox + Fx * k2, oy + Gk * k2, f.f2, "F");
        pil(c, ox + Fx * k2, oy + Gk * k2, ox, oy, f.dempet, "S");
      }
    }
  }

  for (const id of ["strom", "felt", "retning", "lengde", "masse", "modus"]) $(id).addEventListener("input", endret);
  $("vis-krefter").addEventListener("input", tegn);
  $("ny-ukjent").addEventListener("click", () => { ukjentB = nyUkjent(); visUkjent = false; endret(); });
  $("vis-ukjent").addEventListener("click", () => { visUkjent = true; oppdater(); });
  $("slipp").addEventListener("click", () => { tilstand = { theta: 0, omega: 0 }; maksVinkel = 0; start(); oppdater(); });
  les();
  // Start i likevekt
  tilstand.theta = Math.atan2(Fx, inn.m * G);
  maksVinkel = Math.abs(tilstand.theta);
  oppdater();
})();
