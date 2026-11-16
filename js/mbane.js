// Ladde partikler i et homogent magnetfelt. Partikkelen akselereres gjennom spenningen U og kommer
// inn i feltet gjennom en spalte i y = 0 med farten rett opp. Feltet fyller området y > 0.
// I massespektrometeret er det ioner med ladning +e. Massene er atommasser i u (elektronmassen er neglisjert).

const E_LADNING = 1.602176634e-19;
const U_MASSE = 1.66053907e-27;
const PARTIKLER = {
  proton: { navn: "proton", q: E_LADNING, m: 1.67262192e-27 },
  elektron: { navn: "elektron", q: -E_LADNING, m: 9.1093837e-31 },
  alfa: { navn: "alfapartikkel", q: 2 * E_LADNING, m: 6.6446573e-27 },
};
const GRUNNSTOFF = {
  karbon: { navn: "Karbon", isotoper: [["¹²C", 12.0], ["¹³C", 13.003355], ["¹⁴C", 14.003242]] },
  neon: { navn: "Neon", isotoper: [["²⁰Ne", 19.99244], ["²¹Ne", 20.993847], ["²²Ne", 21.991385]] },
  klor: { navn: "Klor", isotoper: [["³⁵Cl", 34.968853], ["³⁷Cl", 36.965903]] },
  uran: { navn: "Uran", isotoper: [["²³⁵U", 235.04393], ["²³⁸U", 238.050788]] },
};

// Fart etter akselerasjon, radius og omløpstid
function sirkel(q, m, U, B) {
  const v = Math.sqrt(2 * Math.abs(q) * U / m);
  const r = m * v / (Math.abs(q) * B);
  return { v, r, T: 2 * Math.PI * m / (Math.abs(q) * B), F: Math.abs(q) * v * B };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("mbane");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, baner = [], fase = 0;
  const VARIGHET = 2.5;   // sekunder på skjermen for den tregeste halvsirkelen

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
    const modus = Sim.verdi("modus");
    inn = {
      modus,
      U: lesTall("spenning", 1, 100000, 1000),
      B: lesTall("felt", 0.01, 5000, 50) / 1000,
      inn: Sim.verdi("retning") === "inn",
    };
    $("rad-partikkel").hidden = modus !== "sirkel";
    $("rad-stoff").hidden = modus !== "spektrometer";
    if (modus === "sirkel") {
      const p = PARTIKLER[Sim.verdi("partikkel")];
      baner = [{ navn: p.navn, q: p.q, m: p.m, ...sirkel(p.q, p.m, inn.U, inn.B) }];
    } else {
      const g = GRUNNSTOFF[Sim.verdi("stoff")];
      baner = g.isotoper.map(([navn, u]) => ({ navn, u, q: E_LADNING, m: u * U_MASSE, ...sirkel(E_LADNING, u * U_MASSE, inn.U, inn.B) }));
    }
    // Retningen på kraften: F = qv × B. Med v rett opp og B inn i planet bøyer en positiv ladning mot venstre.
    for (const b of baner) b.side = (b.q > 0) === inn.inn ? -1 : 1;
  }

  function nullstill() { avspiller.stopp(); les(); fase = 0; oppdater(); }
  function steg(dt) { fase = Math.min(1, fase + dt / VARIGHET); oppdater(); return fase < 1; }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function pil(c, x0, y0, x1, y1, farge, navn) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 3) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, h = 8;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.7, y1 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * h - uy * h * 0.5, y1 - uy * h + ux * h * 0.5); c.lineTo(x1 - ux * h + uy * h * 0.5, y1 - uy * h - ux * h * 0.5); c.closePath(); c.fill();
    if (navn) { c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(navn, x1 + ux * 12, y1 + uy * 12); }
  }

  function tegn() {
    if (!l.b || !inn) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    const rMaks = Math.max(...baner.map((b) => b.r));
    const side = baner[0].side;
    const bunn = inn.modus === "spektrometer" ? 58 : 34;
    const sk = Math.min((l.b - 40) / (2.25 * rMaks), (l.h - bunn - 24) / (1.08 * rMaks));
    const x0 = l.b / 2 - side * rMaks * sk, y0 = l.h - bunn;
    const X = (x) => x0 + x * sk, Y = (y) => y0 - y * sk;
    // Feltområdet med symboler for B
    c.fillStyle = f.flate; c.fillRect(0, 0, l.b, y0);
    c.fillStyle = f.dempet; c.strokeStyle = f.dempet; c.lineWidth = 1.2;
    const avst = smal ? 30 : 44;
    for (let x = avst / 2; x < l.b; x += avst) for (let y = y0 - avst / 2; y > 0; y -= avst) {
      c.globalAlpha = 0.45;
      if (inn.inn) { c.beginPath(); c.moveTo(x - 4, y - 4); c.lineTo(x + 4, y + 4); c.moveTo(x + 4, y - 4); c.lineTo(x - 4, y + 4); c.stroke(); }
      else { c.beginPath(); c.arc(x, y, 1.8, 0, 2 * Math.PI); c.fill(); c.beginPath(); c.arc(x, y, 5, 0, 2 * Math.PI); c.stroke(); }
    }
    c.globalAlpha = 1;
    c.font = "12px " + Sim.MONO; c.textBaseline = "top"; c.fillStyle = f.blekk;
    c.textAlign = side < 0 ? "right" : "left";
    c.fillText("B = " + Sim.tall(inn.B * 1000, 3) + " mT " + (inn.inn ? "inn i planet" : "ut av planet"), side < 0 ? l.b - 8 : 8, 8);
    // Vegg med spalte
    c.fillStyle = f.blekk; c.fillRect(0, y0, X(0) - 6, 3); c.fillRect(X(0) + 6, y0, l.b - X(0) - 6, 3);
    // Detektor langs veggen i spektrometeret
    if (inn.modus === "spektrometer") {
      const xa = X(0) + side * 8, xb = X(side * 2.2 * rMaks);
      c.fillStyle = f.dempet; c.fillRect(Math.min(xa, xb), y0 - 3, Math.abs(xb - xa), 6);
    }
    // Akselerasjonen nedenfra (ikke i målestokk)
    c.strokeStyle = f.dempet; c.setLineDash([4, 4]); c.lineWidth = 1;
    c.beginPath(); c.moveTo(X(0), l.h); c.lineTo(X(0), y0); c.stroke(); c.setLineDash([]);
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textBaseline = "bottom";
    c.textAlign = side < 0 ? "left" : "right";
    c.fillText("U = " + komma(inn.U, 0) + " V", X(0) - side * 8, l.h - 4);
    // Målestokk
    const lengde = Sim.steglengde(rMaks, 2), lPx = lengde * sk;
    const xs = side < 0 ? 12 : l.b - 12 - lPx, ys = 34;
    c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xs, ys); c.lineTo(xs + lPx, ys); c.moveTo(xs, ys - 4); c.lineTo(xs, ys + 4); c.moveTo(xs + lPx, ys - 4); c.lineTo(xs + lPx, ys + 4); c.stroke();
    c.fillStyle = f.blekk; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText(lengde >= 0.01 ? komma(lengde * 100, lengde >= 0.1 ? 0 : 1) + " cm" : komma(lengde * 1000, lengde >= 0.001 ? 0 : 2) + " mm", xs + lPx / 2, ys + 6);

    const tMaks = Math.max(...baner.map((b) => b.T / 2));
    baner.forEach((b, k) => {
      const farge = inn.modus === "sirkel" ? (b.q > 0 ? f.f1 : f.f2) : k === 0 ? f.f1 : k === 1 ? f.f2 : f.blekk;
      const s = b.side;
      // Vinkelen partikkelen har gått, fra 0 til π. Tiden er ekte tid i samme skala for alle ionene.
      const vinkel = Math.min(Math.PI, fase * tMaks / (b.T / 2) * Math.PI);
      const sentrum = { x: s * b.r, y: 0 };
      const pos = (v) => ({ x: s * b.r - s * b.r * Math.cos(v), y: b.r * Math.sin(v) });
      c.strokeStyle = farge; c.lineWidth = 1; c.globalAlpha = 0.3; c.setLineDash([4, 4]);
      c.beginPath(); for (let v = 0; v <= Math.PI + 1e-9; v += Math.PI / 60) { const p = pos(v); v ? c.lineTo(X(p.x), Y(p.y)) : c.moveTo(X(p.x), Y(p.y)); } c.stroke();
      c.setLineDash([]); c.globalAlpha = 1; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(X(0), l.h); c.lineTo(X(0), Y(0));
      for (let v = 0; v <= vinkel + 1e-9; v += Math.PI / 90) { const p = pos(v); c.lineTo(X(p.x), Y(p.y)); }
      const p = pos(vinkel); c.lineTo(X(p.x), Y(p.y));
      c.stroke();
      c.fillStyle = farge; c.beginPath(); c.arc(X(p.x), Y(p.y), 5, 0, 2 * Math.PI); c.fill();
      if (inn.modus === "sirkel" && vinkel < Math.PI - 1e-9) {
        const vx = s * Math.sin(vinkel), vy = Math.cos(vinkel), L = Math.min(60, b.r * sk * 0.6);
        pil(c, X(p.x), Y(p.y), X(p.x) + vx * L, Y(p.y) - vy * L, f.blekk, "v");
        const fx = (sentrum.x - p.x) / b.r, fy = (sentrum.y - p.y) / b.r;
        pil(c, X(p.x), Y(p.y), X(p.x) + fx * L, Y(p.y) - fy * L, farge, "F");
      }
      if (inn.modus === "spektrometer") {
        const xT = X(s * 2 * b.r);
        c.strokeStyle = farge; c.lineWidth = 1; c.beginPath(); c.moveTo(xT, y0 + 4); c.lineTo(xT, y0 + 10 + k * 14); c.stroke();
        c.fillStyle = farge; c.font = "600 12px " + Sim.SANS; c.textAlign = s < 0 ? "right" : "left"; c.textBaseline = "middle";
        c.fillText(b.navn, xT - s * 4, y0 + 12 + k * 14);
      }
    });
  }

  function oppdater() {
    const ferdig = fase >= 1;
    if (inn.modus === "sirkel") {
      const b = baner[0];
      $("resultat").innerHTML = `<dl class="sim-tall"><div><dt>fart v</dt><dd>${tall(b.v)} m/s</dd></div><div><dt>magnetisk kraft F = qvB</dt><dd>${tall(b.F)} N</dd></div><div><dt>radius r</dt><dd>${ferdig ? Sim.tall(b.r * 100, 3) + " cm" : "?"}</dd></div><div><dt>tid i feltet (T/2)</dt><dd>${ferdig ? tall(b.T / 2) + " s" : "?"}</dd></div></dl>`;
    } else {
      $("resultat").innerHTML = `<div class="tabell-ramme"><table class="sim-tabell"><thead><tr><th scope="col">Ion</th><th scope="col">masse (u)</th><th scope="col">fart (m/s)</th><th scope="col">radius (cm)</th><th scope="col">treffer detektoren (cm fra spalten)</th></tr></thead><tbody>${baner.map((b) => `<tr><th scope="row">${b.navn}</th><td>${komma(b.u, 3)}</td><td>${tall(b.v)}</td><td>${ferdig ? komma(b.r * 100, 2) : "?"}</td><td>${ferdig ? komma(2 * b.r * 100, 2) : "?"}</td></tr>`).join("")}</tbody></table></div>`;
    }
    tegn();
  }

  for (const id of ["modus", "partikkel", "stoff", "retning", "spenning", "felt"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
