// Fartsvelger: kryssede elektriske og magnetiske felt. Øvre plate er negativ og nedre positiv,
// og B peker ut av planet. For en positiv partikkel peker FE opp og FB ned.
// Bare partikler med v = E/B går rett fram og gjennom spalten. Banen regnes ut med RK4.

const E_LADNING = 1.602176634e-19;
const PARTIKLER = {
  proton: { navn: "proton", q: E_LADNING, m: 1.67262192e-27 },
  elektron: { navn: "elektron", q: -E_LADNING, m: 9.1093837e-31 },
  alfa: { navn: "alfapartikkel", q: 2 * E_LADNING, m: 6.6446573e-27 },
};
const LENGDE = 0.10;     // platenes lengde i m
const AVSTAND = 0.020;   // avstand mellom platene i m
const SPALTE = 0.001;    // spaltebredde i m

// Bane gjennom fartsvelgeren. E peker fra den positive til den negative plata, altså oppover: Ey = +E.
// B peker ut av planet: Bz = +B.
function bane(p, v0, E, B) {
  const k = p.q / p.m;
  const akselerasjon = (vx, vy) => [k * (vy * B), k * (E - vx * B)];   // a = (q/m)(E + v × B)
  let x = 0, y = 0, vx = v0, vy = 0, t = 0;
  const dt = LENGDE / v0 / 3000, pkt = [[0, 0, 0]];
  let utfall = "ut";
  for (let n = 0; n < 20000; n++) {
    const [a1x, a1y] = akselerasjon(vx, vy);
    const [a2x, a2y] = akselerasjon(vx + a1x * dt / 2, vy + a1y * dt / 2);
    const [a3x, a3y] = akselerasjon(vx + a2x * dt / 2, vy + a2y * dt / 2);
    const [a4x, a4y] = akselerasjon(vx + a3x * dt, vy + a3y * dt);
    x += (vx + (vx + a1x * dt / 2) * 2 + (vx + a2x * dt / 2) * 2 + (vx + a3x * dt)) / 6 * dt;
    y += (vy + (vy + a1y * dt / 2) * 2 + (vy + a2y * dt / 2) * 2 + (vy + a3y * dt)) / 6 * dt;
    vx += (a1x + 2 * a2x + 2 * a3x + a4x) / 6 * dt;
    vy += (a1y + 2 * a2y + 2 * a3y + a4y) / 6 * dt;
    t += dt;
    if (n % 10 === 0) pkt.push([x, y, t]);
    if (Math.abs(y) >= AVSTAND / 2) { utfall = y > 0 ? "opp" : "ned"; break; }
    if (x >= LENGDE) break;
    if (x < 0) { utfall = "tilbake"; break; }
  }
  pkt.push([x, y, t]);
  const gjennom = utfall === "ut" && Math.abs(y) <= SPALTE / 2;
  return { pkt, tSlutt: t, utfall, gjennom, yUt: y };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("fartsvelger");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, baner = [], fase = 0;

  const tall = (x) => {
    if (!isFinite(x) || x === 0 || Math.abs(x) < 1e4) return Sim.tall(x, 3);
    let e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
    if (Math.abs(Number(m.toFixed(2))) >= 10) { m /= 10; e += 1; }
    return komma(m, 2) + " · 10" + String(e).split("").map((s) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[s]).join("");
  };
  const lesTall = (id, min, maks, standard) => {
    const v = parseFloat(String($(id).value).replace(",", "."));
    return isFinite(v) ? Math.min(maks, Math.max(min, v)) : standard;
  };

  function les() {
    const p = PARTIKLER[Sim.verdi("partikkel")];
    const Ua = lesTall("ua", 0.01, 100000, 800), B = lesTall("b", 0, 1000, 50) / 1000, Up = lesTall("up", 0, 10000, 300);
    const v = Math.sqrt(2 * Math.abs(p.q) * Ua / p.m), E = Up / AVSTAND;
    inn = { p, Ua, B, Up, v, E, straale: $("straale").checked };
    const faktorer = inn.straale ? [0.8, 0.9, 0.95, 1, 1.05, 1.1, 1.25] : [1];
    baner = faktorer.map((k) => ({ k, v: v * k, ...bane(p, v * k, E, B) }));
  }

  function nullstill() { avspiller.stopp(); les(); fase = 0; oppdater(); }
  // Skjermtid: 2,5 s for partikkelen med valgt fart gjennom platene
  function steg(dt) {
    fase += dt / 2.5;
    const tNå = fase * LENGDE / inn.v;
    const ferdig = baner.every((b) => tNå >= b.tSlutt) || fase > 4;
    oppdater();
    return !ferdig;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function pil(c, x0, y0, x1, y1, farge, navn) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 3) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, h = 8;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.7, y1 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * h - uy * h * 0.5, y1 - uy * h + ux * h * 0.5); c.lineTo(x1 - ux * h + uy * h * 0.5, y1 - uy * h - ux * h * 0.5); c.closePath(); c.fill();
    c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(navn, x1 + 6, y1 + uy * 6);
  }

  function tegn() {
    if (!l.b || !inn) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    const venstre = smal ? 30 : 60, høyre = smal ? 50 : 110;
    const sk = Math.min((l.b - venstre - høyre) / LENGDE, (l.h - 70) / AVSTAND);
    const my = l.h / 2, X = (x) => venstre + x * sk, Y = (y) => my - y * sk;
    // Feltområdet med ⊙ for B
    c.fillStyle = f.flate; c.fillRect(X(0), Y(AVSTAND / 2), LENGDE * sk, AVSTAND * sk);
    c.fillStyle = f.dempet; c.strokeStyle = f.dempet; c.lineWidth = 1; c.globalAlpha = 0.45;
    const nx = smal ? 7 : 12, ny = 3;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = X(LENGDE * (i + 0.5) / nx), y = Y(AVSTAND * ((j + 0.5) / ny - 0.5));
      c.beginPath(); c.arc(x, y, 1.6, 0, 2 * Math.PI); c.fill(); c.beginPath(); c.arc(x, y, 4.5, 0, 2 * Math.PI); c.stroke();
    }
    c.globalAlpha = 1;
    // Platene: øvre negativ, nedre positiv
    c.fillStyle = f.f2; c.fillRect(X(0), Y(AVSTAND / 2) - 6, LENGDE * sk, 6);
    c.fillStyle = f.f1; c.fillRect(X(0), Y(-AVSTAND / 2), LENGDE * sk, 6);
    c.font = "700 13px " + Sim.SANS; c.textAlign = "center";
    c.textBaseline = "bottom"; c.fillStyle = f.f2; for (let k = 0; k < 7; k++) c.fillText("−", X(LENGDE * (k + 0.5) / 7), Y(AVSTAND / 2) - 8);
    c.textBaseline = "top"; c.fillStyle = f.f1; for (let k = 0; k < 7; k++) c.fillText("+", X(LENGDE * (k + 0.5) / 7), Y(-AVSTAND / 2) + 8);
    // Vegg med spalte ved utgangen
    const xv = X(LENGDE) + 14;
    c.fillStyle = f.blekk; c.fillRect(xv, Y(AVSTAND / 2) - 6, 4, (AVSTAND / 2 - SPALTE / 2) * sk + 6); c.fillRect(xv, Y(-SPALTE / 2), 4, (AVSTAND / 2 - SPALTE / 2) * sk + 6);
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("B = " + Sim.tall(inn.B * 1000, 3) + " mT ut av planet", X(0), 6);
    c.textAlign = "right"; c.fillText("spalte " + komma(SPALTE * 1000, 0) + " mm", l.b - 6, 6);
    // Banene
    const tNå = fase * LENGDE / inn.v;
    const farge = (b) => (inn.straale ? (b.k < 1 ? f.f1 : b.k > 1 ? f.f2 : f.blekk) : inn.p.q > 0 ? f.f1 : f.f2);
    for (const b of baner) {
      c.strokeStyle = farge(b); c.lineWidth = b.k === 1 ? 2.5 : 1.8; c.globalAlpha = b.k === 1 ? 1 : 0.8;
      c.beginPath(); c.moveTo(4, Y(0)); c.lineTo(X(0), Y(0));
      let siste = [0, 0];
      for (const [x, y, t] of b.pkt) { if (t > tNå) break; c.lineTo(X(x), Y(y)); siste = [x, y]; }
      // Etter platene går partikkelen rett fram; gjennom spalten hvis den treffer den
      if (tNå >= b.tSlutt && b.utfall === "ut") {
        const etter = Math.min(1, (tNå - b.tSlutt) / (0.4 * LENGDE / b.v));
        const [x1, y1] = b.pkt[b.pkt.length - 1];
        const xEnd = b.gjennom ? X(x1) + etter * (l.b - X(x1)) : X(x1) + etter * (xv - X(x1));
        c.lineTo(xEnd, Y(y1)); siste = null;
        c.stroke();
        c.fillStyle = farge(b); c.beginPath(); c.arc(xEnd, Y(y1), 4, 0, 2 * Math.PI); c.fill();
      } else {
        c.stroke();
        c.fillStyle = farge(b); c.beginPath(); c.arc(X(siste[0]), Y(siste[1]), 4, 0, 2 * Math.PI); c.fill();
      }
      c.globalAlpha = 1;
    }
    // Kreftene på partikkelen med valgt fart ved inngangen
    if (!inn.straale || fase === 0) {
      const FE = Math.abs(inn.p.q) * inn.E, FB = Math.abs(inn.p.q) * inn.v * inn.B, maks = Math.max(FE, FB) || 1;
      const L = (smal ? 26 : 40), x0 = X(LENGDE * 0.06), y0 = Y(0);
      const tegnE = inn.p.q > 0 ? -1 : 1;   // på skjermen: −1 betyr opp
      if (FE > 0) pil(c, x0, y0, x0, y0 + tegnE * L * FE / maks, f.blekk, "Fₑ");
      if (FB > 0) pil(c, x0 + 26, y0, x0 + 26, y0 - tegnE * L * FB / maks, f.dempet, "Fᵦ");
    }
  }

  function oppdater() {
    const FE = Math.abs(inn.p.q) * inn.E, FB = Math.abs(inn.p.q) * inn.v * inn.B;
    $("r-v").textContent = tall(inn.v) + " m/s";
    $("r-e").textContent = tall(inn.E) + " V/m";
    $("r-vok").textContent = inn.B > 0 ? tall(inn.E / inn.B) + " m/s" : "–";
    $("r-fe").textContent = tall(FE) + " N";
    $("r-fb").textContent = tall(FB) + " N";
    const b = baner.find((x) => x.k === 1);
    const ferdig = fase * LENGDE / inn.v >= b.tSlutt;
    $("r-avvik").textContent = !ferdig ? "?" : b.utfall === "ut" ? komma(Math.abs(b.yUt) * 1000, 2) + " mm " + (b.yUt > 5e-6 ? "over" : b.yUt < -5e-6 ? "under" : "fra") + " midten" : "–";
    $("r-utfall").textContent = !ferdig ? "?" : b.gjennom ? "går gjennom spalten" : b.utfall === "opp" ? "treffer øvre plate" : b.utfall === "ned" ? "treffer nedre plate" : b.utfall === "ut" ? "treffer veggen ved siden av spalten" : "snur";
    tegn();
  }

  for (const id of ["partikkel", "ua", "b", "up", "straale"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
