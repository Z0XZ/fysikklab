// Akselerasjon og avbøyning. En partikkel starter i ro, akselereres gjennom spenningen Ua
// og kommer inn midt mellom to avbøyningsplater med spenningen Ud. Øvre plate er positiv.
// Tyngden er neglisjert. Enheter: SI.

const E_LADNING = 1.602176634e-19;
const PARTIKLER = {
  proton: { navn: "proton", q: E_LADNING, m: 1.67262192e-27 },
  elektron: { navn: "elektron", q: -E_LADNING, m: 9.1093837e-31 },
  alfa: { navn: "alfapartikkel", q: 2 * E_LADNING, m: 6.6446573e-27 },
};

// Hele bevegelsen mellom avbøyningsplatene på lukket form. y er positiv oppover (mot den positive plata).
function bane(p, Ua, Ud, d, l) {
  const v0 = Math.sqrt(2 * Math.abs(p.q) * Ua / p.m);
  const E = Ud / d, F = Math.abs(p.q) * E, a = -p.q * E / p.m;   // positiv ladning går nedover
  // Treffer den en plate før enden?
  let tUt = l / v0, treff = false;
  if (Math.abs(a) > 0) {
    const tTreff = Math.sqrt(d / Math.abs(a));
    if (tTreff < tUt) { tUt = tTreff; treff = true; }
  }
  const xUt = v0 * tUt, yUt = 0.5 * a * tUt * tUt, vy = a * tUt;
  return { v0, E, F, a, tUt, treff, xUt, yUt, vy, vinkel: Math.atan2(vy, v0) };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  // Tall med tre gjeldende siffer, og tierpotens fra 10 000 og oppover
  const tall = (x) => {
    if (!isFinite(x) || x === 0 || Math.abs(x) < 1e4) return Sim.tall(x, 3);
    let e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
    if (Math.abs(Number(m.toFixed(2))) >= 10) { m /= 10; e += 1; }
    return komma(m, 2) + " · 10" + String(e).split("").map((s) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[s]).join("");
  };
  const el = $("avboyning");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, b, fase = 0, spor = [];   // fase: 0–1 akselerasjon, 1–2 mellom platene, 2–3 etter platene

  const TA = 0.8, TB = 2.4, TC = 0.8;  // sekunder på skjermen for hver del

  function les() {
    const p = PARTIKLER[Sim.verdi("partikkel")];
    inn = {
      p,
      Ua: Sim.verdi("ua", (v) => komma(v, 0) + " V"),
      Ud: Sim.verdi("ud", (v) => komma(v, 1) + " V"),
      d: Sim.verdi("d", (v) => komma(v, 1) + " cm") / 100,
      l: Sim.verdi("l", (v) => komma(v, 0) + " cm") / 100,
    };
    b = bane(inn.p, inn.Ua, inn.Ud, inn.d, inn.l);
  }

  function nullstill() { avspiller.stopp(); les(); fase = 0; oppdater(); }

  function steg(dt) {
    if (fase < 1) fase = Math.min(1, fase + dt / TA);
    else if (fase < 2) fase = Math.min(2, fase + dt / (TB * (b.treff ? b.tUt * b.v0 / inn.l : 1)));
    else if (fase < 3) fase = Math.min(3, fase + dt / TC);
    const ferdig = b.treff ? fase >= 2 : fase >= 3;
    if (ferdig) {
      const sist = spor[spor.length - 1];
      if (!sist || sist.navn !== inn.p.navn || sist.nøkkel !== nøkkel()) spor.push({ navn: inn.p.navn, q: inn.p.q, nøkkel: nøkkel(), ...b, l: inn.l, d: inn.d });
      if (spor.length > 4) spor.shift();
    }
    oppdater();
    return !ferdig;
  }
  const nøkkel = () => [inn.Ua, inn.Ud, inn.d, inn.l].join("|");
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  // Posisjon (x, y) i meter etter platene starter, for en gitt tid i platene
  const posisjon = (bb, t) => {
    if (t <= bb.tUt) return { x: bb.v0 * t, y: 0.5 * bb.a * t * t };
    return { x: bb.xUt + bb.v0 * (t - bb.tUt), y: bb.yUt + bb.vy * (t - bb.tUt) };
  };

  function tegn() {
    if (!l.b || !inn) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    const venstre = smal ? 64 : 110, høyre = 14, lengde = inn.l * 1.3;
    const sx = (l.b - venstre - høyre) / lengde;
    let sy = sx, forstørr = 1;
    const gapPx = inn.d * sx;
    if (gapPx < l.h * 0.2) { forstørr = Math.min(20, Math.round(l.h * 0.55 / gapPx)); sy = sx * forstørr; }
    if (inn.d * sy > l.h * 0.8) sy = l.h * 0.8 / inn.d;
    const my = l.h / 2;
    const X = (x) => venstre + x * sx, Y = (y) => my - y * sy;
    // Avbøyningsplatene: øvre positiv, nedre negativ
    c.fillStyle = f.f1; c.fillRect(X(0), Y(inn.d / 2) - 6, inn.l * sx, 6);
    c.fillStyle = f.f2; c.fillRect(X(0), Y(-inn.d / 2), inn.l * sx, 6);
    c.font = "700 13px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "bottom";
    c.fillStyle = f.f1; for (let k = 0; k < 5; k++) c.fillText("+", X(inn.l * (k + 0.5) / 5), Y(inn.d / 2) - 8);
    c.textBaseline = "top"; c.fillStyle = f.f2; for (let k = 0; k < 5; k++) c.fillText("−", X(inn.l * (k + 0.5) / 5), Y(-inn.d / 2) + 8);
    // Akselerasjonsplatene (ikke i målestokk)
    const ax0 = venstre * 0.25, ax1 = venstre * 0.7;
    c.fillStyle = inn.p.q > 0 ? f.f1 : f.f2; c.fillRect(ax0 - 3, my - 34, 4, 68);
    c.fillStyle = inn.p.q > 0 ? f.f2 : f.f1; c.fillRect(ax1 - 1, my - 34, 4, 28); c.fillRect(ax1 - 1, my + 6, 4, 28);
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText("Ua", (ax0 + ax1) / 2, my + 40);
    c.fillText("Ud = " + komma(inn.Ud, 1) + " V", X(inn.l / 2), Y(-inn.d / 2) + 26);
    c.textAlign = "left"; c.textBaseline = "top";
    if (forstørr > 1) c.fillText("y-retningen er forstørret " + forstørr + " ganger", 8, 8);
    // Midtlinje
    c.strokeStyle = f.rute; c.setLineDash([4, 5]); c.lineWidth = 1;
    c.beginPath(); c.moveTo(ax1, my); c.lineTo(l.b - høyre, my); c.stroke(); c.setLineDash([]);
    // Tidligere baner
    spor.forEach((s, k) => {
      if (k === spor.length - 1 && fase < (s.treff ? 2 : 3)) return;
      c.strokeStyle = s.q < 0 ? f.f2 : f.f1; c.globalAlpha = 0.35; c.lineWidth = 2;
      tegnBane(c, s, s.treff ? s.tUt : s.tUt + 0.3 * s.l / s.v0, X, Y);
      c.globalAlpha = 1;
    });
    // Partikkelen nå
    let px, py;
    if (fase < 1) { px = ax0 + (ax1 - ax0) * fase * fase; py = my; }
    else {
      const tSlutt = b.tUt + (b.treff ? 0 : 0.3 * inn.l / b.v0);
      const t = fase < 2 ? (fase - 1) * b.tUt : b.tUt + (fase - 2) * (tSlutt - b.tUt);
      c.strokeStyle = inn.p.q < 0 ? f.f2 : f.f1; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(ax1, my); c.lineTo(X(0), my);
      tegnBane(c, b, t, X, Y, true);
      const p = posisjon(b, t); px = X(p.x); py = Y(p.y);
    }
    c.fillStyle = inn.p.q < 0 ? f.f2 : f.f1;
    c.beginPath(); c.arc(px, py, 5, 0, 2 * Math.PI); c.fill();
  }

  function tegnBane(c, bb, tMaks, X, Y, fortsett) {
    if (!fortsett) { c.beginPath(); c.moveTo(X(0), Y(0)); }
    const n = 60;
    for (let k = 1; k <= n; k++) { const p = posisjon(bb, tMaks * k / n); c.lineTo(X(p.x), Y(p.y)); }
    c.stroke();
  }

  function oppdater() {
    $("r-v0").textContent = tall(b.v0) + " m/s";
    $("r-e").textContent = tall(b.E) + " V/m";
    $("r-a").textContent = tall(Math.abs(b.a)) + " m/s²";
    const ferdig = fase >= 2;
    $("r-t").textContent = ferdig ? tall(b.tUt) + " s" : "?";
    $("r-ut").textContent = !ferdig ? "?" : b.treff ? "treffer plata ved x = " + komma(b.xUt * 100, 1) + " cm" : komma(Math.abs(b.yUt) * 1000, 2) + " mm mot " + (b.yUt > 0 ? "den positive" : b.yUt < 0 ? "den negative" : "ingen av") + " plata";
    $("r-vinkel").textContent = !ferdig || b.treff ? (ferdig ? "–" : "?") : komma(Math.abs(b.vinkel) * 180 / Math.PI, 2) + "°";
    tegn();
  }

  for (const id of ["partikkel", "ua", "ud", "d", "l"]) $(id).addEventListener("input", nullstill);
  $("visk").addEventListener("click", () => { spor = []; tegn(); });
  nullstill();
})();
