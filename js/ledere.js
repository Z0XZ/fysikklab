// Magnetfelt rundt lange, rette ledere som står vinkelrett på planet.
// Positiv strøm går ut av planet (⊙), negativ inn i planet (⊗). B = μ0 I / (2π r).
// Feltlinjene er nivåkurver for A = −(μ0/2π) Σ I ln r, slik at tettheten viser feltstyrken.
// Koordinater i cm (x mot høyre, y oppover), strøm i A, felt i µT.

const MU0 = 4 * Math.PI * 1e-7;
const BREDDE = 20, HOYDE = 12.5;

// Feltet i (x, y) fra én leder, i tesla
function feltFra(l, x, y) {
  const rx = (x - l.x) / 100, ry = (y - l.y) / 100, r2 = rx * rx + ry * ry, r = Math.sqrt(r2);
  if (r < 1e-6) return { x: 0, y: 0, B: Infinity, r };
  const B = MU0 * l.I / (2 * Math.PI * r);
  return { x: -B * ry / r, y: B * rx / r, B: Math.abs(B), r };
}
function felt(ledere, x, y) {
  let bx = 0, by = 0;
  for (const l of ledere) { const f = feltFra(l, x, y); bx += f.x; by += f.y; }
  return { x: bx, y: by, B: Math.hypot(bx, by) };
}
// Kraft per meter på leder i: F = I ẑ × B
function kraftPaa(ledere, i) {
  const a = ledere[i], B = felt(ledere.filter((_, k) => k !== i), a.x, a.y);
  return { x: -a.I * B.y, y: a.I * B.x, F: Math.abs(a.I) * B.B };
}
const potensial = (ledere, x, y) => ledere.reduce((s, l) => s - l.I * Math.log(Math.max(1e-3, Math.hypot(x - l.x, y - l.y))), 0);

const OPPSETT = {
  en: { ledere: [{ x: 10, y: 6.5, I: 10 }], P: { x: 15, y: 6.5 } },
  samme: { ledere: [{ x: 5, y: 6.5, I: 10 }, { x: 15, y: 6.5, I: 10 }], P: { x: 10, y: 6.5 } },
  motsatt: { ledere: [{ x: 5, y: 6.5, I: 10 }, { x: 15, y: 6.5, I: -10 }], P: { x: 10, y: 6.5 } },
  ulike: { ledere: [{ x: 4, y: 6.5, I: 10 }, { x: 16, y: 6.5, I: 5 }], P: { x: 10, y: 6.5 } },
};

(function () {
  const $ = Sim.$, komma = Sim.komma, tall = Sim.tall;
  const el = $("ledere");
  if (!el) return;
  let ledere = [], P = { x: 15, y: 6.5 }, valgt = 0, konturer = null;
  const l = Sim.lerret(el, () => { konturer = null; tegn(); });
  const mikro = (B) => tall(B * 1e6, 3) + " µT";

  function lastOppsett(navn) {
    const o = OPPSETT[navn];
    if (!o) return;
    ledere = o.ledere.map((a) => ({ ...a }));
    P = { ...o.P }; valgt = 0;
    endret();
  }
  function endret() { konturer = null; oppdater(); }

  // Marching squares på et grovt rutenett
  function beregnKonturer() {
    konturer = [];
    if (!ledere.some((a) => a.I !== 0)) return;
    const sk = l.b / BREDDE, steg = 4 / sk;
    const nx = Math.ceil(BREDDE / steg) + 1, ny = Math.ceil(HOYDE / steg) + 1;
    const v = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = potensial(ledere, i * steg, j * steg);
    const Imaks = Math.max(...ledere.map((a) => Math.abs(a.I)));
    const dA = Imaks * 0.32;
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const x = i * steg, y = j * steg;
      if (ledere.some((a) => Math.hypot(x + steg / 2 - a.x, y + steg / 2 - a.y) < 0.35)) continue;
      const a = v[j * nx + i], b = v[j * nx + i + 1], c = v[(j + 1) * nx + i + 1], d = v[(j + 1) * nx + i];
      const lo = Math.min(a, b, c, d), hi = Math.max(a, b, c, d);
      for (let k = Math.ceil(lo / dA); k * dA <= hi; k++) {
        const n = k * dA, pkt = [];
        const kant = (p, q, x0, y0, x1, y1) => { if ((p < n) !== (q < n)) { const t = (n - p) / (q - p); pkt.push([x0 + t * (x1 - x0), y0 + t * (y1 - y0)]); } };
        kant(a, b, x, y, x + steg, y);
        kant(b, c, x + steg, y, x + steg, y + steg);
        kant(c, d, x + steg, y + steg, x, y + steg);
        kant(d, a, x, y + steg, x, y);
        if (pkt.length >= 2) konturer.push(pkt[0], pkt[1]);
        if (pkt.length === 4) konturer.push(pkt[2], pkt[3]);
      }
    }
  }

  function pil(c, x0, y0, x1, y1, farge, tykk) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 1) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, h = Math.min(9, len * 0.45);
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = tykk;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.7, y1 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * h - uy * h * 0.5, y1 - uy * h + ux * h * 0.5); c.lineTo(x1 - ux * h + uy * h * 0.5, y1 - uy * h - ux * h * 0.5); c.closePath(); c.fill();
  }

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f, sk = l.b / BREDDE;
    const px = (x) => x * sk, py = (y) => l.h - y * sk;
    l.tom();
    c.lineWidth = 1;
    for (let x = 0; x <= BREDDE; x++) { c.strokeStyle = x % 5 ? f.rute : f["rute-sterk"]; c.globalAlpha = x % 5 ? 0.45 : 0.7; c.beginPath(); c.moveTo(px(x), 0); c.lineTo(px(x), l.h); c.stroke(); }
    for (let y = 0; y <= HOYDE; y++) { c.strokeStyle = y % 5 ? f.rute : f["rute-sterk"]; c.globalAlpha = y % 5 ? 0.45 : 0.7; c.beginPath(); c.moveTo(0, py(y)); c.lineTo(l.b, py(y)); c.stroke(); }
    c.globalAlpha = 1;
    c.fillStyle = f.dempet; c.font = "10px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "bottom";
    for (let x = 5; x < BREDDE; x += 5) c.fillText(x, px(x) + 2, l.h - 2);
    c.textAlign = "right"; c.fillText("cm", l.b - 3, l.h - 2);

    if ($("vis-linjer").checked) {
      if (!konturer) beregnKonturer();
      c.strokeStyle = f.blekk; c.lineWidth = 1.1; c.globalAlpha = 0.7;
      c.beginPath();
      for (let k = 0; k < konturer.length; k += 2) { c.moveTo(px(konturer[k][0]), py(konturer[k][1])); c.lineTo(px(konturer[k + 1][0]), py(konturer[k + 1][1])); }
      c.stroke(); c.globalAlpha = 1;
    }
    // Kompassnåler: nordenden (farget) peker i feltretningen
    if ($("vis-kompass").checked) {
      const steg = l.b < 560 ? 2.5 : 1.25, len = Math.min(steg * sk * 0.38, 12);
      for (let x = steg / 2; x < BREDDE; x += steg) for (let y = steg / 2; y < HOYDE; y += steg) {
        if (ledere.some((a) => Math.hypot(x - a.x, y - a.y) < steg * 0.7)) continue;
        const B = felt(ledere, x, y);
        if (!(B.B > 0)) continue;
        const ux = B.x / B.B, uy = -B.y / B.B, cx = px(x), cy = py(y), w = len * 0.3;
        c.fillStyle = f.f1; c.beginPath(); c.moveTo(cx + ux * len, cy + uy * len); c.lineTo(cx - uy * w, cy + ux * w); c.lineTo(cx + uy * w, cy - ux * w); c.closePath(); c.fill();
        c.fillStyle = f.dempet; c.beginPath(); c.moveTo(cx - ux * len, cy - uy * len); c.lineTo(cx - uy * w, cy + ux * w); c.lineTo(cx + uy * w, cy - ux * w); c.closePath(); c.fill();
      }
    }
    // Krefter på lederne
    if ($("vis-krefter").checked && ledere.length > 1) {
      const kr = ledere.map((_, i) => kraftPaa(ledere, i)), maks = Math.max(...kr.map((k) => k.F)) || 1;
      kr.forEach((k, i) => { const a = ledere[i], L = 3 * sk * k.F / maks; if (k.F > 0) pil(c, px(a.x), py(a.y), px(a.x) + k.x / k.F * L, py(a.y) - k.y / k.F * L, f.f2, 3); });
    }
    // Feltet i P
    const bidrag = ledere.map((a) => feltFra(a, P.x, P.y)), sum = felt(ledere, P.x, P.y);
    const maksB = Math.max(sum.B, ...bidrag.map((b) => (isFinite(b.B) ? b.B : 0))) || 1, skB = 3 * sk / maksB;
    if ($("vis-bidrag").checked && ledere.length > 1) {
      for (const b of bidrag) if (isFinite(b.B)) { c.globalAlpha = 0.8; pil(c, px(P.x), py(P.y), px(P.x) + b.x * skB, py(P.y) - b.y * skB, f.f2, 1.8); }
      c.globalAlpha = 1;
    }
    if (isFinite(sum.B)) pil(c, px(P.x), py(P.y), px(P.x) + sum.x * skB, py(P.y) - sum.y * skB, f.blekk, 3);
    c.fillStyle = f.papir; c.strokeStyle = f.blekk; c.lineWidth = 2;
    c.beginPath(); c.arc(px(P.x), py(P.y), 6, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.fillStyle = f.blekk; c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "bottom";
    c.strokeStyle = f.papir; c.lineWidth = 4; c.lineJoin = "round"; c.strokeText("P", px(P.x) + 7, py(P.y) - 5); c.fillText("P", px(P.x) + 7, py(P.y) - 5);
    // Lederne
    const r = Math.max(10, Math.min(15, sk * 0.5));
    ledere.forEach((a, i) => {
      const cx = px(a.x), cy = py(a.y);
      c.fillStyle = f.papir; c.strokeStyle = f.blekk; c.lineWidth = 2;
      c.beginPath(); c.arc(cx, cy, r, 0, 2 * Math.PI); c.fill(); c.stroke();
      if (i === valgt) { c.strokeStyle = f.f1; c.beginPath(); c.arc(cx, cy, r + 4, 0, 2 * Math.PI); c.stroke(); }
      c.strokeStyle = f.blekk; c.fillStyle = f.blekk; c.lineWidth = 2;
      if (a.I > 0) { c.beginPath(); c.arc(cx, cy, 3.5, 0, 2 * Math.PI); c.fill(); }
      else if (a.I < 0) { const k = r * 0.5; c.beginPath(); c.moveTo(cx - k, cy - k); c.lineTo(cx + k, cy + k); c.moveTo(cx + k, cy - k); c.lineTo(cx - k, cy + k); c.stroke(); }
      c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
      const merke = (i + 1) + ": " + komma(Math.abs(a.I), 1) + " A";
      c.strokeStyle = f.papir; c.lineWidth = 4; c.lineJoin = "round"; c.strokeText(merke, cx, cy + r + 4); c.fillText(merke, cx, cy + r + 4);
    });
  }

  function oppdater() {
    const sum = felt(ledere, P.x, P.y);
    $("p-pos").textContent = `(${komma(P.x, 1)}, ${komma(P.y, 1)}) cm`;
    $("p-b").textContent = isFinite(sum.B) ? mikro(sum.B) : "–";
    $("p-retning").textContent = sum.B > 0 && isFinite(sum.B) ? komma(Math.atan2(sum.y, sum.x) * 180 / Math.PI, 0) + "°" : "–";
    if (ledere.length === 2) {
      const [a, b] = ledere, d = Math.hypot(a.x - b.x, a.y - b.y) / 100;
      const F = MU0 * Math.abs(a.I * b.I) / (2 * Math.PI * d);
      $("f-12").textContent = d > 0 ? tall(F, 3) + " N/m, " + (a.I * b.I > 0 ? "tiltrekkende" : a.I * b.I < 0 ? "frastøtende" : "ingen") : "–";
    } else $("f-12").textContent = "bare med to ledere";
    $("leder-rader").innerHTML = ledere.map((a, i) => {
      const b = feltFra(a, P.x, P.y);
      return `<tr${i === valgt ? ' class="valgt"' : ""}><th scope="row">${i + 1}</th><td>${komma(Math.abs(a.I), 1)} ${a.I > 0 ? "ut ⊙" : a.I < 0 ? "inn ⊗" : ""}</td><td>(${komma(a.x, 1)}, ${komma(a.y, 1)})</td><td>${komma(b.r * 100, 1)}</td><td>${isFinite(b.B) ? tall(b.B * 1e6, 3) : "–"}</td></tr>`;
    }).join("");
    const a = ledere[valgt];
    $("strom").disabled = $("fjern").disabled = !a;
    if (a) $("strom").value = a.I;
    $("strom-ut").textContent = a ? `nr. ${valgt + 1}: ${komma(Math.abs(a.I), 0)} A ${a.I > 0 ? "⊙" : a.I < 0 ? "⊗" : ""}` : "";
    $("legg-til").disabled = ledere.length >= 4;
    tegn();
  }

  let dras = null;
  const iVerden = (e) => { const [X, Y] = Sim.punkt(el, e), sk = l.b / BREDDE; return { x: X / sk, y: (l.h - Y) / sk }; };
  el.addEventListener("pointerdown", (e) => {
    const p = iVerden(e), grense = Math.max(0.6, 16 / (l.b / BREDDE));
    let best = null, bestAvst = grense;
    ledere.forEach((a, i) => { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < bestAvst) { best = i; bestAvst = d; } });
    if (Math.hypot(P.x - p.x, P.y - p.y) < Math.min(bestAvst, grense)) best = "P";
    if (best === null) return;
    dras = best;
    if (best !== "P") valgt = best;
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
    oppdater();
  });
  el.addEventListener("pointermove", (e) => {
    if (dras === null) return;
    const p = iVerden(e);
    const x = Math.min(BREDDE - 0.5, Math.max(0.5, Math.round(p.x * 2) / 2)), y = Math.min(HOYDE - 0.5, Math.max(0.5, Math.round(p.y * 2) / 2));
    const mål = dras === "P" ? P : ledere[dras];
    if (mål.x === x && mål.y === y) return;
    mål.x = x; mål.y = y;
    $("oppsett").value = "egen";
    if (dras === "P") oppdater(); else endret();
  });
  const slipp = () => { dras = null; };
  el.addEventListener("pointerup", slipp);
  el.addEventListener("pointercancel", slipp);

  $("oppsett").addEventListener("input", () => lastOppsett($("oppsett").value));
  $("strom").addEventListener("input", () => { if (!ledere[valgt]) return; ledere[valgt].I = Number($("strom").value); $("oppsett").value = "egen"; endret(); });
  $("legg-til").addEventListener("click", () => {
    if (ledere.length >= 4) return;
    const ledig = [[10, 10.5], [10, 2.5], [3, 10.5], [17, 2.5]].find(([x, y]) => !ledere.some((a) => a.x === x && a.y === y)) || [10, 10];
    ledere.push({ x: ledig[0], y: ledig[1], I: 5 });
    valgt = ledere.length - 1; $("oppsett").value = "egen";
    endret();
  });
  $("fjern").addEventListener("click", () => { ledere.splice(valgt, 1); valgt = Math.max(0, valgt - 1); $("oppsett").value = "egen"; endret(); });
  for (const id of ["vis-linjer", "vis-kompass", "vis-krefter", "vis-bidrag"]) $(id).addEventListener("input", tegn);
  lastOppsett("en");
})();
