// Millikans oljedråpeforsøk: Små, negativt ladde oljedråper mellom to vannrette plater med avstand d.
// Den øverste plata er positiv, så den elektriske kraften på dråpen peker oppover: F = qU/d.
// Dråpen faller så sakte at den hele tiden har terminalfart (Stokes' lov): 6πηrv = qU/d − mg.
// Når dråpen svever, er qU/d = mg, så q = mgd/U. Dråpene har faste radier og ladninger, slik at oppgavene har fasit.
// Brownsk bevegelse og oppdrift i lufta er ikke tatt med.

const MI = { e: 1.602176634e-19, rho: 875, g: 9.81, d: 0.005, eta: 1.81e-5 };
const DRAPER = [[0.62, 2], [0.55, 1], [0.71, 3], [0.48, 1], [0.80, 5], [0.66, 2], [0.52, 3], [0.75, 4]];   // radius i µm, antall elementærladninger
function draape(rMy, n) {
  const r = rMy * 1e-6, m = MI.rho * 4 / 3 * Math.PI * r ** 3;
  return { rMy, n, r, m, q: -n * MI.e };
}
// Farten oppover (m/s) med spenningen U
const fart = (d, U) => (d.n * MI.e * U / MI.d - d.m * MI.g) / (6 * Math.PI * MI.eta * d.r);

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("millikan");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  const FELT = 1.0e-3;               // synsfeltet i mikroskopet er 1,0 mm høyt
  let nr = 0, dr = draape(...DRAPER[0]), y = 0, tilfeldig = false;

  function velg(i) {
    if (i === "tilfeldig") {
      tilfeldig = true;
      dr = draape(Math.round((0.45 + Math.random() * 0.4) * 100) / 100, 1 + Math.floor(Math.random() * 6));
    } else { tilfeldig = false; nr = i; dr = draape(...DRAPER[i]); }
    y = 0;
    $("mi-nr").textContent = tilfeldig ? "tilfeldig" : `${nr + 1} av ${DRAPER.length}`;
    $("mi-r").textContent = komma(dr.rMy, 2) + " µm";
    tegn();
  }
  const U = () => Sim.verdi("mi-u", (v) => v + " V");

  const spiller = Sim.avspiller({
    knapp: $("mi-start"), lerret: el,
    steg(dt) {
      const v = fart(dr, U()) * Number(Sim.verdi("mi-tid"));
      y = Math.max(-FELT * 0.55, Math.min(FELT * 0.55, y + v * dt));
      $("mi-y").textContent = Math.abs(y) >= FELT * 0.55 ? "utenfor synsfeltet" : komma(y * 1000, 3) + " mm";
      tegn();
    },
  });

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f, { b, h } = l;
    l.tom();
    const smal = h > b * 0.8;   // høyt lerret (mobil): mikroskopet under platene
    // Venstre: plater og dråpe skjematisk
    const sb = smal ? b : b * 0.48, x0 = 16, bredde = sb - 32;
    const pTopp = smal ? 22 : h * 0.18, pBunn = smal ? h * 0.42 : h * 0.82;
    c.fillStyle = f.dempet;
    c.fillRect(x0, pTopp - 8, bredde, 8); c.fillRect(x0, pBunn, bredde, 8);
    c.font = "600 13px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "middle";
    c.fillStyle = f.blekk; c.fillText("+", x0 + 4, pTopp - 16); c.fillText("−", x0 + 4, pBunn + 18);
    c.font = "12px " + Sim.SANS; c.fillStyle = f.dempet; c.textAlign = "right";
    c.fillText(`U = ${U()} V`, x0 + bredde, pTopp - 16);
    c.fillText(`d = ${komma(MI.d * 1000, 1)} mm`, x0 + bredde, pBunn + 18);
    // E-feltet peker nedover
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const x = x0 + bredde * i / 6, y1 = pTopp + 6, y2 = pBunn - 6;
      c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2); c.lineTo(x - 4, y2 - 7); c.moveTo(x, y2); c.lineTo(x + 4, y2 - 7); c.stroke();
    }
    c.fillStyle = f.dempet; c.textAlign = "left"; c.fillText("E", x0 + bredde / 6 + 6, (pTopp + pBunn) / 2);
    // Dråpen midt mellom platene (forstørret)
    const midt = (pTopp + pBunn) / 2 - y / FELT * (pBunn - pTopp) * 0.12;
    c.fillStyle = f.f1; c.beginPath(); c.arc(x0 + bredde * 0.58, midt, 5, 0, 2 * Math.PI); c.fill();
    // Kreftene på dråpen (piler, ikke i målestokk)
    const Fe = dr.n * MI.e * U() / MI.d, Gk = dr.m * MI.g, sk = 30 / Gk;
    const pil = (x, ya, lengde, farge, tekst) => {
      if (Math.abs(lengde) < 2) return;
      const yb = ya - lengde;
      c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, ya); c.lineTo(x, yb); c.stroke();
      const s = Math.sign(lengde);
      c.beginPath(); c.moveTo(x, yb); c.lineTo(x - 4, yb + 7 * s); c.lineTo(x + 4, yb + 7 * s); c.closePath(); c.fill();
      c.font = "12px " + Sim.SANS; c.textAlign = "left"; c.fillText(tekst, x + 7, yb + 6 * s);
    };
    const xd = x0 + bredde * 0.58;
    pil(xd, midt - 6, Math.min(60, Fe * sk), f.f2, "qE");
    pil(xd, midt + 6, -30, f.blekk, "mg");

    // Høyre (eller under): synsfeltet i mikroskopet
    const R = smal ? Math.min(b * 0.36, h * 0.27) : Math.min(b * 0.22, h * 0.42);
    const cx = smal ? b / 2 : b * 0.74, cy = smal ? h * 0.72 : h / 2;
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, 2 * Math.PI); c.fillStyle = f.flate; c.fill(); c.clip();
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.font = "10px " + Sim.MONO; c.fillStyle = f.dempet; c.textAlign = "left"; c.textBaseline = "middle";
    for (let k = -5; k <= 5; k++) {
      const Y = cy - k / 10 * 2 * R;
      c.beginPath(); c.moveTo(cx - R, Y); c.lineTo(cx + R, Y); c.stroke();
    }
    c.strokeStyle = f["rute-sterk"];
    c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.stroke();
    const Yd = cy - y / FELT * 2 * R;
    if (Math.abs(y) < FELT * 0.55) {
      const g = c.createRadialGradient(cx, Yd, 0, cx, Yd, 9);
      g.addColorStop(0, f.f1); g.addColorStop(1, "transparent");
      c.fillStyle = g; c.beginPath(); c.arc(cx, Yd, 9, 0, 2 * Math.PI); c.fill();
    }
    c.restore();
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, 0, 2 * Math.PI); c.stroke();
    c.fillStyle = f.dempet; c.font = "11px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText("mikroskopet: 0,1 mm mellom linjene", cx, cy + R + 6);
  }

  $("mi-neste").addEventListener("click", () => velg((nr + (tilfeldig ? 0 : 1)) % DRAPER.length));
  $("mi-tilfeldig").addEventListener("click", () => velg("tilfeldig"));
  $("mi-tilbake").addEventListener("click", () => { y = 0; $("mi-y").textContent = "0,000 mm"; tegn(); });
  $("mi-minus").addEventListener("click", () => { $("mi-u").value = Number($("mi-u").value) - 1; U(); tegn(); });
  $("mi-pluss").addEventListener("click", () => { $("mi-u").value = Number($("mi-u").value) + 1; U(); tegn(); });
  $("mi-u").addEventListener("input", () => { U(); tegn(); });
  Sim.verdi("mi-tid");
  U();
  velg(0);
  $("mi-y").textContent = "0,000 mm";
})();
