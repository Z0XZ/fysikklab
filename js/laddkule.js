// Ladd kule i en snor mellom to parallelle plater. Feltet mellom platene er homogent: E = U/d.
// Kula svinger med litt demping og finner likevekt der tan θ = qE / mg.
// Enheter: SI inne i beregningene, cm, g, nC og kV på skjermen.

const G = 9.81;
const SNOR = 0.08;     // snorlengde i m
const RADIUS = 0.005;  // kulas radius i m
const DEMPING = 1.2;   // 1/s

function likevekt(U, d, q, m, venstrePluss) {
  const E = U / d, Fx = q * E * (venstrePluss ? 1 : -1);
  return { E, F: Math.abs(q) * E, G: m * G, theta: Math.atan2(Fx, m * G), Fx };
}

// Ett tidssteg for pendelen. θ er positiv mot høyre.
function pendelSteg(s, Fx, m, dt) {
  const a = (-m * G * Math.sin(s.theta) + Fx * Math.cos(s.theta)) / (m * SNOR) - DEMPING * s.omega;
  s.omega += a * dt;
  s.theta += s.omega * dt;
}

(function () {
  const $ = Sim.$, komma = Sim.komma, tall = Sim.tall;
  const el = $("kule");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, lv, tilstand = { theta: 0, omega: 0 }, treffer = false, id = null, forrige = null;
  let ukjentQ = nyUkjent(), visUkjent = false;

  function nyUkjent() {
    const verdier = [4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16];
    return verdier[Math.floor(Math.random() * verdier.length)] * (Math.random() < 0.5 ? 1 : -1) * 1e-9;
  }

  function les() {
    const ukjent = Sim.verdi("modus") === "ukjent";
    inn = {
      U: Sim.verdi("spenning", (v) => komma(v, 1) + " kV") * 1000,
      d: Sim.verdi("avstand", (v) => komma(v, 0) + " cm") / 100,
      q: ukjent ? ukjentQ : Sim.verdi("ladning", (v) => (v > 0 ? "+" : "") + komma(v, 0) + " nC") * 1e-9,
      m: Sim.verdi("masse", (v) => komma(v, 2) + " g") / 1000,
      venstrePluss: Sim.verdi("polaritet") === "venstre",
      ukjent,
    };
    $("rad-ladning").hidden = ukjent;
    $("ukjent-knapper").hidden = !ukjent;
    lv = likevekt(inn.U, inn.d, inn.q, inn.m, inn.venstrePluss);
  }

  function endret() { les(); treffer = false; start(); oppdater(); }

  function start() {
    if (!id) { forrige = null; id = requestAnimationFrame(bilde); }
  }

  function bilde(naa) {
    id = null;
    const dt = forrige === null ? 0 : Math.min((naa - forrige) / 1000, 0.05);
    forrige = naa;
    for (let k = 0; k < 20; k++) {
      pendelSteg(tilstand, lv.Fx, inn.m, dt / 20);
      // Kula stopper mot plata
      const xMaks = Math.asin(Math.min(1, (inn.d / 2 - RADIUS) / SNOR));
      if (Math.abs(tilstand.theta) >= xMaks) { tilstand.theta = Math.sign(tilstand.theta) * xMaks; tilstand.omega = 0; treffer = true; }
      else treffer = false;
    }
    oppdater();
    const ro = Math.abs(tilstand.omega) < 1e-4 && (treffer || Math.abs(tilstand.theta - lv.theta) < 1e-4);
    if (!ro) id = requestAnimationFrame(bilde);
  }

  function oppdater() {
    $("r-e").textContent = tall(lv.E, 3) + " V/m";
    $("r-fe").textContent = inn.ukjent && !visUkjent ? "?" : tall(lv.F, 3) + " N";
    $("r-g").textContent = tall(lv.G, 3) + " N";
    $("r-vinkel").textContent = komma(Math.abs(tilstand.theta) * 180 / Math.PI, 1) + "°";
    $("r-q").textContent = inn.ukjent && !visUkjent ? "?" : (inn.q > 0 ? "+" : "") + komma(inn.q * 1e9, 0) + " nC";
    $("melding").textContent = treffer ? "Kula ligger inntil plata. I virkeligheten får kula da ladning fra plata og blir skjøvet bort igjen." : "";
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
    c.fillText(navn, x1 + ux * 12 + (Math.abs(ux) < 0.3 ? 12 : 0), y1 + uy * 12);
  }

  function tegn() {
    if (!l.b || !inn) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    // Platene er 16 cm høye
    const sk = Math.min(l.h / 0.21, (smal ? l.b : l.b * 0.62) / 0.25);
    const mx = smal ? l.b / 2 : l.b * 0.33, topp = l.h * 0.08;
    const X = (x) => mx + x * sk, Y = (y) => topp + y * sk;
    const hPlate = 0.16;
    // Platene med ladningstegn
    for (const side of [-1, 1]) {
      const pluss = (side < 0) === inn.venstrePluss;
      const x = X(side * inn.d / 2);
      c.fillStyle = pluss ? f.f1 : f.f2;
      c.fillRect(x + (side < 0 ? -7 : 0), Y(0), 7, hPlate * sk);
      c.font = "700 14px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
      for (let k = 0; k < 6; k++) c.fillText(pluss ? "+" : "−", x + side * 16, Y(0.015 + k * 0.026));
    }
    // Feltlinjer
    c.strokeStyle = f["rute-sterk"]; c.fillStyle = f["rute-sterk"]; c.lineWidth = 1;
    const retning = inn.venstrePluss ? 1 : -1;
    if (inn.U > 0) for (let k = 0; k < 6; k++) {
      const y = Y(0.015 + k * 0.026), x0 = X(-inn.d / 2) + 3, x1 = X(inn.d / 2) - 3;
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
      const xm = (x0 + x1) / 2 + retning * 4;
      c.beginPath(); c.moveTo(xm, y); c.lineTo(xm - retning * 7, y - 4); c.lineTo(xm - retning * 7, y + 4); c.closePath(); c.fill();
    }
    // Oppheng, snor og kule
    const th = tilstand.theta, bx = X(SNOR * Math.sin(th)), by = Y(0.02 + SNOR * Math.cos(th));
    c.strokeStyle = f.blekk; c.lineWidth = 3;
    c.beginPath(); c.moveTo(X(-0.02), Y(0.02)); c.lineTo(X(0.02), Y(0.02)); c.stroke();
    c.strokeStyle = f.dempet; c.setLineDash([3, 4]); c.lineWidth = 1;
    c.beginPath(); c.moveTo(X(0), Y(0.02)); c.lineTo(X(0), Y(0.02 + SNOR + 0.02)); c.stroke(); c.setLineDash([]);
    // Vinkelbue
    if (Math.abs(th) > 0.01) {
      c.strokeStyle = f.dempet; c.beginPath();
      c.arc(X(0), Y(0.02), 0.035 * sk, Math.PI / 2, Math.PI / 2 - th, th > 0); c.stroke();
      c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
      c.fillText("θ", X(0.045 * Math.sin(th / 2)), Y(0.02 + 0.045 * Math.cos(th / 2)) - 6);
    }
    c.strokeStyle = f.blekk; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(X(0), Y(0.02)); c.lineTo(bx, by); c.stroke();
    c.fillStyle = inn.ukjent && !visUkjent ? f.dempet : inn.q > 0 ? f.f1 : inn.q < 0 ? f.f2 : f.dempet;
    c.beginPath(); c.arc(bx, by, Math.max(5, RADIUS * sk), 0, 2 * Math.PI); c.fill();
    // Krefter på kula. G er alltid like lang. De andre har samme målestokk.
    if ($("vis-krefter").checked) {
      const kSk = 0.04 * sk / lv.G;
            pil(c, bx, by, bx, by + lv.G * kSk, f.blekk, "G");
      if (Math.abs(lv.Fx) > 0) pil(c, bx, by, bx + lv.Fx * kSk, by, inn.q > 0 ? f.f1 : f.f2, "Fₑ");
      if (!treffer) {
        const S = lv.G / Math.cos(th);
        pil(c, bx, by, bx - S * Math.sin(th) * kSk, by - S * Math.cos(th) * kSk, f.dempet, "S");
      }
    }
    // Kraftdiagram til høyre på brede skjermer
    if (!smal && $("vis-krefter").checked && !treffer) {
      const ox = l.b * 0.72, oy = l.h * 0.22, kSk = Math.min(l.h * 0.4, l.b * 0.2) / lv.G;
      c.fillStyle = f.dempet; c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "bottom";
      c.fillText("Kreftene etter hverandre", ox - 30, oy - 30);
      const gx = ox, gy = oy + lv.G * kSk, fx = gx + lv.Fx * kSk;
      pil(c, ox, oy, gx, gy, f.blekk, "G");
      pil(c, gx, gy, fx, gy, inn.q > 0 ? f.f1 : f.f2, "Fₑ");
      pil(c, fx, gy, ox, oy, f.dempet, "S");
      c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
      c.fillText("ΣF = 0", ox - 30, gy + 22);
    }
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText("d = " + komma(inn.d * 100, 0) + " cm", X(0), Y(hPlate) + 8);
  }

  for (const id of ["spenning", "avstand", "ladning", "masse", "polaritet", "modus"]) $(id).addEventListener("input", endret);
  $("vis-krefter").addEventListener("input", tegn);
  $("ny-ukjent").addEventListener("click", () => { ukjentQ = nyUkjent(); visUkjent = false; endret(); });
  $("vis-ukjent").addEventListener("click", () => { visUkjent = true; oppdater(); });
  $("dytt").addEventListener("click", () => { tilstand.omega += 1.2; treffer = false; start(); });
  les();
  tilstand.theta = 0;
  start();
  oppdater();
})();
