// Elektrisk felt rundt punktladninger. Ladningene og målepunktet P kan dras rundt.
// Koordinater i cm (x mot høyre, y oppover), ladninger i nC. Feltet regnes i SI-enheter.

const K = 8.99e9;            // coulombkonstanten i N m²/C²
const BREDDE = 40, HOYDE = 25; // området i cm

// Feltet i punktet (x, y) fra én ladning, i N/C
function feltFra(l, x, y) {
  const dx = (x - l.x) / 100, dy = (y - l.y) / 100, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
  if (r < 1e-6) return { x: 0, y: 0, E: Infinity, r };
  const E = K * l.q * 1e-9 / r2;
  return { x: E * dx / r, y: E * dy / r, E: Math.abs(E), r };
}

function felt(ladninger, x, y) {
  let ex = 0, ey = 0;
  for (const l of ladninger) { const f = feltFra(l, x, y); ex += f.x; ey += f.y; }
  return { x: ex, y: ey, E: Math.hypot(ex, ey) };
}

// Coulombkraften på ladning i fra de andre, i N
function kraftPaa(ladninger, i) {
  const a = ladninger[i];
  const andre = ladninger.filter((_, k) => k !== i);
  const E = felt(andre, a.x, a.y);
  return { x: a.q * 1e-9 * E.x, y: a.q * 1e-9 * E.y, F: Math.abs(a.q * 1e-9) * E.E };
}

// Følger en feltlinje fra (x, y). retning = 1 følger feltet, −1 går mot feltet.
function feltlinje(ladninger, x, y, retning, start) {
  const ds = 0.15, pkt = [[x, y]];
  let slutt = null;
  for (let n = 0; n < 2000; n++) {
    const f1 = felt(ladninger, x, y);
    if (f1.E === 0) break;
    const mx = x + retning * f1.x / f1.E * ds / 2, my = y + retning * f1.y / f1.E * ds / 2;
    const f2 = felt(ladninger, mx, my);
    if (f2.E === 0) break;
    x += retning * f2.x / f2.E * ds; y += retning * f2.y / f2.E * ds;
    pkt.push([x, y]);
    if (x < -8 || x > BREDDE + 8 || y < -8 || y > HOYDE + 8) break;
    const treff = ladninger.findIndex((l, k) => k !== start && Math.hypot(x - l.x, y - l.y) < 0.4);
    if (treff >= 0) { slutt = treff; break; }
  }
  return { pkt, slutt };
}

const OPPSETT = {
  en: { ladninger: [{ x: 20, y: 12.5, q: 2 }], P: { x: 30, y: 12.5 } },
  dipol: { ladninger: [{ x: 14, y: 12.5, q: 2 }, { x: 26, y: 12.5, q: -2 }], P: { x: 20, y: 12.5 } },
  like: { ladninger: [{ x: 14, y: 12.5, q: 2 }, { x: 26, y: 12.5, q: 2 }], P: { x: 20, y: 18 } },
  ulike: { ladninger: [{ x: 11, y: 12.5, q: 4 }, { x: 29, y: 12.5, q: 1 }], P: { x: 20, y: 12.5 } },
  tre: { ladninger: [{ x: 14, y: 8, q: 2 }, { x: 26, y: 8, q: 2 }, { x: 20, y: 18.4, q: -2 }], P: { x: 20, y: 11.5 } },
};

(function () {
  const $ = Sim.$, komma = Sim.komma, tall = Sim.tall;
  const el = $("felt");
  if (!el) return;
  let ladninger = [], P = { x: 30, y: 12.5 }, valgt = 0, linjer = null;
  const l = Sim.lerret(el, tegn);

  function lastOppsett(navn) {
    const o = OPPSETT[navn];
    if (!o) return;
    ladninger = o.ladninger.map((a) => ({ ...a }));
    P = { ...o.P };
    valgt = 0;
    endret();
  }

  function endret() { linjer = null; oppdater(); }

  function beregnLinjer() {
    linjer = [];
    const harPositiv = ladninger.some((a) => a.q > 0);
    ladninger.forEach((a, i) => {
      if (a.q === 0) return;
      const n = Math.max(4, Math.round(4 * Math.abs(a.q)));
      const positiv = a.q > 0;
      for (let k = 0; k < n; k++) {
        const v = 2 * Math.PI * (k + 0.5) / n;
        const lin = feltlinje(ladninger, a.x + 0.45 * Math.cos(v), a.y + 0.45 * Math.sin(v), positiv ? 1 : -1, i);
        // Linjer fra negative ladninger tas bare med når de ikke ender på en positiv ladning
        if (!positiv && harPositiv && lin.slutt !== null && ladninger[lin.slutt].q > 0) continue;
        linjer.push({ pkt: positiv ? lin.pkt : lin.pkt.slice().reverse() });
      }
    });
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
    // Rutenett for hver cm, sterkere for hver 5. cm
    c.lineWidth = 1;
    for (let x = 0; x <= BREDDE; x++) { c.strokeStyle = x % 5 ? f.rute : f["rute-sterk"]; c.globalAlpha = x % 5 ? 0.5 : 0.7; c.beginPath(); c.moveTo(px(x), 0); c.lineTo(px(x), l.h); c.stroke(); }
    for (let y = 0; y <= HOYDE; y++) { c.strokeStyle = y % 5 ? f.rute : f["rute-sterk"]; c.globalAlpha = y % 5 ? 0.5 : 0.7; c.beginPath(); c.moveTo(0, py(y)); c.lineTo(l.b, py(y)); c.stroke(); }
    c.globalAlpha = 1;
    c.fillStyle = f.dempet; c.font = "10px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "bottom";
    for (let x = 5; x < BREDDE; x += 5) c.fillText(x, px(x) + 2, l.h - 2);
    c.textBaseline = "top";
    for (let y = 5; y < HOYDE; y += 5) c.fillText(y, 2, py(y) + 2);
    c.textAlign = "right"; c.textBaseline = "bottom"; c.fillText("cm", l.b - 3, l.h - 2);

    // Feltpiler i et rutenett
    if ($("vis-piler").checked) {
      const steg = l.b < 560 ? 4 : 2.5;
      for (let x = steg / 2; x < BREDDE; x += steg) for (let y = steg / 2; y < HOYDE; y += steg) {
        if (ladninger.some((a) => Math.hypot(x - a.x, y - a.y) < steg * 0.6)) continue;
        const E = felt(ladninger, x, y);
        if (E.E === 0) continue;
        const lengde = steg * sk * 0.85 * Math.min(1, Math.sqrt(E.E / 4000));
        const ux = E.x / E.E, uy = E.y / E.E;
        c.globalAlpha = 0.35 + 0.65 * Math.min(1, Math.sqrt(E.E / 4000));
        pil(c, px(x) - ux * lengde / 2, py(y) + uy * lengde / 2, px(x) + ux * lengde / 2, py(y) - uy * lengde / 2, f.dempet, 1.3);
      }
      c.globalAlpha = 1;
    }

    // Feltlinjer med pil i retning feltet
    if ($("vis-linjer").checked) {
      if (!linjer) beregnLinjer();
      c.strokeStyle = f.blekk; c.lineWidth = 1.2; c.globalAlpha = 0.75;
      for (const lin of linjer) {
        c.beginPath();
        lin.pkt.forEach(([x, y], k) => (k ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y))));
        c.stroke();
        const k = Math.min(lin.pkt.length - 2, 30);
        if (k > 2) {
          const [x0, y0] = lin.pkt[k - 1], [x1, y1] = lin.pkt[k + 1];
          const vx = px(x1) - px(x0), vy = py(y1) - py(y0), len = Math.hypot(vx, vy) || 1, ux = vx / len, uy = vy / len;
          const [xm, ym] = [px(lin.pkt[k][0]), py(lin.pkt[k][1])];
          c.fillStyle = f.blekk; c.beginPath(); c.moveTo(xm + ux * 5, ym + uy * 5); c.lineTo(xm - ux * 4 - uy * 4, ym - uy * 4 + ux * 4); c.lineTo(xm - ux * 4 + uy * 4, ym - uy * 4 - ux * 4); c.closePath(); c.fill();
        }
      }
      c.globalAlpha = 1;
    }

    // Krefter på ladningene
    if ($("vis-krefter").checked && ladninger.length > 1) {
      const krefter = ladninger.map((_, i) => kraftPaa(ladninger, i));
      const maks = Math.max(...krefter.map((k) => k.F)) || 1;
      krefter.forEach((k, i) => {
        const a = ladninger[i], lengde = 5 * sk * k.F / maks;
        if (k.F > 0) pil(c, px(a.x), py(a.y), px(a.x) + k.x / k.F * lengde, py(a.y) - k.y / k.F * lengde, a.q > 0 ? f.f1 : f.f2, 3);
      });
    }

    // Feltet i P med bidragene fra hver ladning
    const bidrag = ladninger.map((a) => feltFra(a, P.x, P.y));
    const sum = felt(ladninger, P.x, P.y);
    const maksE = Math.max(sum.E, ...bidrag.map((b) => (isFinite(b.E) ? b.E : 0))) || 1;
    const skalaE = 6 * sk / maksE;
    if ($("vis-bidrag").checked && ladninger.length > 1) {
      bidrag.forEach((b, i) => { if (isFinite(b.E)) { c.globalAlpha = 0.8; pil(c, px(P.x), py(P.y), px(P.x) + b.x * skalaE, py(P.y) - b.y * skalaE, ladninger[i].q > 0 ? f.f1 : f.f2, 1.8); } });
      c.globalAlpha = 1;
    }
    if (isFinite(sum.E)) pil(c, px(P.x), py(P.y), px(P.x) + sum.x * skalaE, py(P.y) - sum.y * skalaE, f.blekk, 3);
    c.fillStyle = f.papir; c.strokeStyle = f.blekk; c.lineWidth = 2;
    c.beginPath(); c.arc(px(P.x), py(P.y), 6, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.fillStyle = f.blekk; c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "bottom";
    c.strokeStyle = f.papir; c.lineWidth = 4; c.lineJoin = "round"; c.strokeText("P", px(P.x) + 7, py(P.y) - 5); c.fillText("P", px(P.x) + 7, py(P.y) - 5);

    // Ladningene
    const r = Math.max(9, Math.min(14, sk * 0.55));
    ladninger.forEach((a, i) => {
      c.fillStyle = a.q > 0 ? f.f1 : a.q < 0 ? f.f2 : f.dempet;
      c.beginPath(); c.arc(px(a.x), py(a.y), r, 0, 2 * Math.PI); c.fill();
      if (i === valgt) { c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.arc(px(a.x), py(a.y), r + 4, 0, 2 * Math.PI); c.stroke(); }
      c.fillStyle = f.papir; c.font = "700 " + Math.round(r * 1.3) + "px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(a.q > 0 ? "+" : a.q < 0 ? "−" : "0", px(a.x), py(a.y) + 1);
      c.fillStyle = f.blekk; c.font = "11px " + Sim.MONO; c.textBaseline = "top";
      c.strokeStyle = f.papir; c.lineWidth = 4; c.lineJoin = "round";
      const merke = (i + 1) + ": " + komma(a.q, 1) + " nC";
      c.strokeText(merke, px(a.x), py(a.y) + r + 4); c.fillText(merke, px(a.x), py(a.y) + r + 4);
    });
  }

  function oppdater() {
    const sum = felt(ladninger, P.x, P.y);
    $("p-pos").textContent = `(${komma(P.x, 1)}, ${komma(P.y, 1)}) cm`;
    $("p-e").textContent = isFinite(sum.E) ? tall(sum.E, 3) + " N/C" : "–";
    $("p-ex").textContent = isFinite(sum.E) ? `(${tall(sum.x, 3)}, ${tall(sum.y, 3)}) N/C` : "–";
    $("p-retning").textContent = sum.E > 0 && isFinite(sum.E) ? komma(Math.atan2(sum.y, sum.x) * 180 / Math.PI, 0) + "°" : "–";
    if (ladninger.length === 2) {
      const [a, b] = ladninger, r = Math.hypot(a.x - b.x, a.y - b.y) / 100;
      const F = K * Math.abs(a.q * b.q) * 1e-18 / (r * r);
      $("f-12").textContent = r > 0 ? tall(F, 3) + " N, " + (a.q * b.q > 0 ? "frastøtende" : a.q * b.q < 0 ? "tiltrekkende" : "ingen") : "–";
    } else $("f-12").textContent = "bare med to ladninger";
    $("ladning-rader").innerHTML = ladninger.map((a, i) => {
      const b = feltFra(a, P.x, P.y);
      return `<tr${i === valgt ? ' class="valgt"' : ""}><th scope="row">${i + 1}</th><td class="${a.q > 0 ? "f1" : "f2"}">${komma(a.q, 1)}</td><td>(${komma(a.x, 1)}, ${komma(a.y, 1)})</td><td>${komma(b.r * 100, 1)}</td><td>${isFinite(b.E) ? tall(b.E, 3) : "–"}</td></tr>`;
    }).join("");
    const a = ladninger[valgt];
    $("ladning").disabled = $("fjern").disabled = !a;
    if (a) { $("ladning").value = a.q; }
    $("ladning-ut").textContent = a ? `nr. ${valgt + 1}: ${komma(a.q, 1)} nC` : "";
    $("legg-til").disabled = ladninger.length >= 4;
    tegn();
  }

  // Dra ladninger og P. Posisjonen festes til nærmeste halve cm.
  let dras = null;
  const iVerden = (e) => { const r = el.getBoundingClientRect(), sk = l.b / BREDDE; return { x: (e.clientX - r.left) / sk, y: (l.h - (e.clientY - r.top)) / sk }; };
  el.addEventListener("pointerdown", (e) => {
    const p = iVerden(e), grense = Math.max(1, 16 / (l.b / BREDDE));
    let best = null, bestAvst = grense;
    ladninger.forEach((a, i) => { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < bestAvst) { best = i; bestAvst = d; } });
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
    const mål = dras === "P" ? P : ladninger[dras];
    if (mål.x === x && mål.y === y) return;
    mål.x = x; mål.y = y;
    $("oppsett").value = "egen";
    if (dras === "P") oppdater(); else endret();
  });
  const slipp = () => { dras = null; };
  el.addEventListener("pointerup", slipp);
  el.addEventListener("pointercancel", slipp);

  $("oppsett").addEventListener("input", () => lastOppsett($("oppsett").value));
  $("ladning").addEventListener("input", () => {
    if (!ladninger[valgt]) return;
    ladninger[valgt].q = Number($("ladning").value);
    $("oppsett").value = "egen";
    endret();
  });
  $("legg-til").addEventListener("click", () => {
    if (ladninger.length >= 4) return;
    const ledig = [[20, 20], [8, 6], [32, 6], [8, 20], [32, 20], [20, 5]].find(([x, y]) => !ladninger.some((a) => a.x === x && a.y === y)) || [20, 20];
    ladninger.push({ x: ledig[0], y: ledig[1], q: 1 });
    valgt = ladninger.length - 1;
    $("oppsett").value = "egen";
    endret();
  });
  $("fjern").addEventListener("click", () => {
    ladninger.splice(valgt, 1);
    valgt = Math.max(0, valgt - 1);
    $("oppsett").value = "egen";
    endret();
  });
  for (const id of ["vis-linjer", "vis-piler", "vis-krefter", "vis-bidrag"]) $(id).addEventListener("input", tegn);
  lastOppsett("en");
})();
