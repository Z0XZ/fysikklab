// Fysikkens historie: en tidslinje du kan dra og zoome i. Hendelsene står i tidslinje-data.js.
// Klikk på en hendelse for å se forklaring, en liten animasjon og lenker til simuleringer og opplegg.
// Styring: dra for å flytte, musehjul eller to fingre for å zoome, piltastene for forrige og neste hendelse.

const TL_KAT = {
  mek: ["Mekanikk", "#d9622b"], grav: ["Gravitasjon", "#8a5cc7"], em: ["Elektromagnetisme", "#2f7fd1"],
  lys: ["Lys og bølger", "#c99a06"], termo: ["Energi og varme", "#c0392b"], rel: ["Relativitet", "#13998a"],
  kvante: ["Kvantefysikk", "#c2185b"], atom: ["Atomer og elektroner", "#4f7fa3"], kjerne: ["Kjerner og partikler", "#5f8a24"],
  astro: ["Astronomi og romfart", "#8c6d46"],
};
const TL_EPOKER = [[-400, 500, "Antikken"], [1543, 1700, "Den vitenskapelige revolusjonen"], [1700, 1900, "Klassisk fysikk"], [1900, 2035, "Moderne fysikk"]];
const TL_MIN = -400, TL_MAKS = 2035;
const tlAar = (h) => (h.aar < 0 ? `${h.ca ? "ca. " : ""}${-h.aar} f.Kr.` : `${h.ca ? "ca. " : ""}${h.aar}`);

(function () {
  const $ = Sim.$;
  const el = $("tl-linje");
  if (!el) return;
  const alle = TL_HENDELSER.map((h, i) => ({ ...h, id: i })).sort((a, b) => a.aar - b.aar);
  let valgt = alle.findIndex((h) => h.aar === 1687);
  let sentrum = 1780, ppa = 1;           // sentrum i år, piksler per år
  let synlige = alle, bokser = [];
  const filter = { kat: new Set(Object.keys(TL_KAT)), niva: "" };
  const l = Sim.lerret(el, tegn);

  // ---------- Filtre ----------
  const fk = $("tl-kat");
  fk.innerHTML = Object.entries(TL_KAT).map(([k, [n, c]]) => `<label class="tl-chip"><input type="checkbox" value="${k}" checked><span style="--c:${c}">${n}</span></label>`).join("");
  fk.addEventListener("change", (e) => { const v = e.target.value; e.target.checked ? filter.kat.add(v) : filter.kat.delete(v); oppdaterFilter(); });
  $("tl-niva").addEventListener("change", (e) => { filter.niva = e.target.value; oppdaterFilter(); });
  function oppdaterFilter() {
    synlige = alle.filter((h) => filter.kat.has(h.kat) && (!filter.niva || (filter.niva === "ingen" ? !h.niva.length : h.niva.includes(filter.niva))));
    $("tl-antall").textContent = `${synlige.length} av ${alle.length} hendelser`;
    fyllListe();
    if (!synlige.includes(alle[valgt]) && synlige.length) velg(alle.indexOf(synlige[0]), true);
    tegn();
  }
  function fyllListe() {
    $("tl-hopp").innerHTML = synlige.map((h) => `<option value="${alle.indexOf(h)}">${tlAar(h)}: ${h.tittel}</option>`).join("");
    $("tl-hopp").value = String(valgt);
  }
  $("tl-hopp").addEventListener("change", (e) => velg(Number(e.target.value), true));

  // ---------- Skala ----------
  const minPpa = () => (l.b - 40) / (TL_MAKS - TL_MIN);
  const xAv = (aar) => l.b / 2 + (aar - sentrum) * ppa;
  function begrens() {
    ppa = Math.max(minPpa(), Math.min(80, ppa));
    const halv = l.b / 2 / ppa;
    sentrum = Math.max(TL_MIN + halv - 20 / ppa, Math.min(TL_MAKS - halv + 20 / ppa, sentrum));
    if (TL_MAKS - TL_MIN < 2 * halv) sentrum = (TL_MIN + TL_MAKS) / 2;
  }
  let startet = false;
  function startVisning() { if (startet || !l.b) return; startet = true; ppa = (l.b - 60) / (2030 - 1530); sentrum = 1780; begrens(); }

  // ---------- Tegning av tidslinjen ----------
  function steg(spenn) { for (const s of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]) if (spenn / s <= 12) return s; return 2000; }
  function tegn() {
    if (!l.b) return;
    startVisning(); begrens();
    const c = l.ctx, f = l.f, B = l.b, H = l.h, akseY = H - 34;
    l.tom();
    // Epoker
    c.font = "11px " + Sim.MONO; c.textBaseline = "top";
    TL_EPOKER.forEach(([a, b, n], i) => {
      const x0 = Math.max(0, xAv(a)), x1 = Math.min(B, xAv(b));
      if (x1 <= x0) return;
      c.fillStyle = f.rute; c.globalAlpha = i % 2 ? 0.55 : 0.3; c.fillRect(x0, akseY, x1 - x0, 34); c.globalAlpha = 1;
      c.fillStyle = f.dempet; c.textAlign = "left";
      if (x1 - x0 > c.measureText(n).width + 10) c.fillText(n, x0 + 5, akseY + 19);
    });
    // Akse og årstall
    c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, akseY); c.lineTo(B, akseY); c.stroke();
    const a0 = sentrum - B / 2 / ppa, a1 = sentrum + B / 2 / ppa, s = steg(a1 - a0);
    c.fillStyle = f.dempet; c.textAlign = "center"; c.lineWidth = 1;
    for (let a = Math.ceil(a0 / s) * s; a <= a1; a += s) {
      const x = xAv(a); c.strokeStyle = f["rute-sterk"]; c.beginPath(); c.moveTo(x, akseY); c.lineTo(x, akseY + 5); c.stroke();
      c.fillText(a < 0 ? -a + " f.Kr." : String(a), x, akseY + 6);
    }
    // Hendelser i rader, så tekstene ikke kolliderer
    c.font = "600 12px " + Sim.SANS; c.textBaseline = "middle";
    const radH = 24, rader = Math.max(1, Math.floor((akseY - 16) / radH)), slutt = new Array(rader).fill(-1e9);
    bokser = [];
    for (const h of synlige) {
      const x = xAv(h.aar); if (x < -200 || x > B + 200) continue;
      const tekst = h.tittel.length > 30 ? h.tittel.slice(0, 29) + "…" : h.tittel, w = c.measureText(tekst).width + 16;
      let r = slutt.findIndex((e) => e < x - 4);
      const plass = r >= 0;
      if (!plass) r = slutt.indexOf(Math.min(...slutt));
      const y = akseY - 18 - r * radH;
      if (plass) slutt[r] = x + w;
      bokser.push({ h, x, y, w, plass, tekst });
    }
    for (const b of bokser) {
      const [, farge] = TL_KAT[b.h.kat], erValgt = alle.indexOf(b.h) === valgt;
      c.strokeStyle = farge; c.globalAlpha = erValgt ? 1 : 0.5; c.lineWidth = erValgt ? 2 : 1;
      c.beginPath(); c.moveTo(b.x, akseY); c.lineTo(b.x, b.y); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = farge; c.beginPath(); c.arc(b.x, akseY, erValgt ? 6 : 4, 0, 2 * Math.PI); c.fill();
      if (!b.plass) continue;
      c.fillStyle = erValgt ? farge : f.flate; c.strokeStyle = farge; c.lineWidth = erValgt ? 2 : 1.2;
      c.beginPath(); c.roundRect(b.x, b.y - 10, b.w, 20, 4); c.fill(); c.stroke();
      c.fillStyle = erValgt ? "#fff" : f.blekk; c.textAlign = "left"; c.fillText(b.tekst, b.x + 8, b.y + 1);
    }
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("Dra for å flytte · zoom med hjulet eller to fingre", B - 8, 6);
  }

  // ---------- Dra, zoom og klikk ----------
  const pekere = new Map(); let start = null, flyttet = 0, pinch = null;
  el.addEventListener("pointerdown", (e) => {
    el.setPointerCapture(e.pointerId); pekere.set(e.pointerId, Sim.punkt(el, e));
    if (pekere.size === 1) { start = { x: Sim.punkt(el, e)[0], sentrum }; flyttet = 0; }
    if (pekere.size === 2) { const [p, q] = [...pekere.values()]; pinch = { d: Math.hypot(p[0] - q[0], p[1] - q[1]), ppa, sentrum, mx: (p[0] + q[0]) / 2 }; }
  });
  el.addEventListener("pointermove", (e) => {
    if (!pekere.has(e.pointerId)) return;
    pekere.set(e.pointerId, Sim.punkt(el, e));
    if (pekere.size === 2 && pinch) {
      const [p, q] = [...pekere.values()], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      const aarMidt = pinch.sentrum + (pinch.mx - l.b / 2) / pinch.ppa;
      ppa = pinch.ppa * d / pinch.d; begrens(); sentrum = aarMidt - (pinch.mx - l.b / 2) / ppa; flyttet = 99; tegn(); return;
    }
    if (start) { const dx = Sim.punkt(el, e)[0] - start.x; flyttet = Math.max(flyttet, Math.abs(dx)); sentrum = start.sentrum - dx / ppa; tegn(); }
  });
  const slipp = (e) => {
    const p = Sim.punkt(el, e);
    if (pekere.size === 1 && flyttet < 5) klikk(p[0], p[1]);
    pekere.delete(e.pointerId); if (pekere.size < 2) pinch = null; if (!pekere.size) start = null;
  };
  el.addEventListener("pointerup", slipp);
  el.addEventListener("pointercancel", (e) => { pekere.delete(e.pointerId); start = null; pinch = null; });
  el.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [mx] = Sim.punkt(el, e), aar = sentrum + (mx - l.b / 2) / ppa;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { sentrum += e.deltaX / ppa; tegn(); return; }
    ppa *= Math.exp(-e.deltaY * 0.0015); begrens(); sentrum = aar - (mx - l.b / 2) / ppa; tegn();
  }, { passive: false });
  function klikk(x, y) {
    let best = null, bd = 1e9;
    for (const b of bokser) {
      if (b.plass && x >= b.x && x <= b.x + b.w && Math.abs(y - b.y) <= 11) { best = b; bd = 0; break; }
      const d = Math.hypot(x - b.x, y - (l.h - 34)); if (d < 14 && d < bd) { best = b; bd = d; }
    }
    if (best) velg(alle.indexOf(best.h), false);
  }
  el.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); naboer(e.key === "ArrowRight" ? 1 : -1); }
    if (e.key === "+" || e.key === "=") { zoom(1.4); } if (e.key === "-") { zoom(1 / 1.4); }
  });
  function zoom(k) { ppa *= k; begrens(); tegn(); }
  $("tl-inn").addEventListener("click", () => zoom(1.6));
  $("tl-ut").addEventListener("click", () => zoom(1 / 1.6));
  $("tl-alt").addEventListener("click", () => { ppa = minPpa(); begrens(); tegn(); });
  $("tl-forrige").addEventListener("click", () => naboer(-1));
  $("tl-neste").addEventListener("click", () => naboer(1));
  function naboer(d) {
    const i = synlige.indexOf(alle[valgt]); const j = Math.max(0, Math.min(synlige.length - 1, (i < 0 ? 0 : i + d)));
    if (synlige[j]) velg(alle.indexOf(synlige[j]), true);
  }

  // ---------- Valgt hendelse ----------
  let glid = null;
  function velg(i, sentrer) {
    valgt = i; const h = alle[i];
    $("tl-hopp").value = String(i);
    const [katNavn, farge] = TL_KAT[h.kat];
    const niva = h.niva.length ? h.niva.map((n) => (n === "f1" ? "Fysikk 1" : "Fysikk 2")).join(" og ") : "Utenfor pensum";
    $("tl-tittel").textContent = h.tittel;
    $("tl-meta").textContent = `${tlAar(h)} · ${h.hvem}`;
    $("tl-merker").innerHTML = `<span class="tl-merke" style="--c:${farge}">${katNavn}</span><span class="tl-merke tl-niva">${niva}</span>`;
    $("tl-tekst").textContent = h.tekst;
    $("tl-lenker").innerHTML = h.lenker.length
      ? h.lenker.map(([href, t]) => `<li><a href="${href.startsWith("http") ? href : "../" + href}"${href.startsWith("http") ? ' rel="noopener"' : ""}>${t}</a></li>`).join("")
      : '<li class="tl-ingen">Ingen ressurser på fysikklab.no til denne hendelsen ennå.</li>';
    animStart = performance.now();
    const x = xAv(h.aar);
    if (sentrer || x < 60 || x > l.b - 220) {
      const fra = sentrum, til = h.aar + (l.b * 0.15) / ppa, t0 = performance.now();
      cancelAnimationFrame(glid);
      const gå = (n) => { const u = Math.min(1, (n - t0) / 350), e = u * (2 - u); sentrum = fra + (til - fra) * e; tegn(); if (u < 1) glid = requestAnimationFrame(gå); };
      glid = requestAnimationFrame(gå);
    } else tegn();
  }

  // ---------- Animasjonene ----------
  const la = Sim.lerret($("tl-anim"), () => {});
  let animStart = performance.now(), synlig = true;
  new IntersectionObserver(([e]) => { synlig = e.isIntersecting; }).observe($("tl-anim"));
  function loop(n) {
    requestAnimationFrame(loop);
    if (!synlig || !la.b) return;
    const c = la.ctx, f = la.f;
    la.tom();
    const fn = ANIM[alle[valgt].anim] || ANIM.straaling;
    c.save(); fn(c, la.b, la.h, (n - animStart) / 1000, f, TL_KAT[alle[valgt].kat][1]); c.restore();
  }
  requestAnimationFrame(loop);

  oppdaterFilter();
  velg(valgt, true);
})();

// ---------- Små animasjoner til hendelsene ----------
// Hver funksjon tegner ett bilde: (ctx, bredde, høyde, tid i sekunder, farger, kategorifarge)
function sirkel(c, x, y, r, fyll, strek) { c.beginPath(); c.arc(x, y, r, 0, 2 * Math.PI); if (fyll) { c.fillStyle = fyll; c.fill(); } if (strek) { c.strokeStyle = strek; c.stroke(); } }
function strek(c, x0, y0, x1, y1, farge, b = 2) { c.strokeStyle = farge; c.lineWidth = b; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
function pil(c, x0, y0, x1, y1, farge, b = 2) {
  strek(c, x0, y0, x1, y1, farge, b); const v = Math.atan2(y1 - y0, x1 - x0), k = 8;
  c.fillStyle = farge; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - k * Math.cos(v - 0.4), y1 - k * Math.sin(v - 0.4)); c.lineTo(x1 - k * Math.cos(v + 0.4), y1 - k * Math.sin(v + 0.4)); c.closePath(); c.fill();
}
function foton(c, x0, y0, x1, y1, farge, bl = 10, fase = 0) {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L; c.strokeStyle = farge; c.lineWidth = 2; c.beginPath();
  for (let s = 0; s <= L; s += 2) { const a = 4 * Math.sin(2 * Math.PI * s / bl - fase) * Math.min(1, s / 10, (L - s) / 10); const x = x0 + ux * s - uy * a, y = y0 + uy * s + ux * a; s ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke();
}
function tekst(c, t, x, y, farge, str = 12, just = "center") { c.fillStyle = farge; c.font = str + "px " + Sim.SANS; c.textAlign = just; c.textBaseline = "middle"; c.fillText(t, x, y); }
const ANIM = {
  oppdrift(c, B, H, t, f, k) {
    c.fillStyle = "#4a90c2"; c.globalAlpha = 0.35; c.fillRect(B * 0.2, H * 0.45, B * 0.6, H * 0.45); c.globalAlpha = 1;
    const y = H * 0.42 + 8 * Math.sin(t * 2), s = H * 0.22;
    c.fillStyle = "#a0703c"; c.fillRect(B / 2 - s / 2, y, s, s);
    pil(c, B / 2, y + s * 0.5, B / 2, y - 30, "#2f7fd1", 3); pil(c, B / 2 + 10, y + s * 0.5, B / 2 + 10, y + s + 30, k, 3);
    tekst(c, "oppdrift", B / 2 - 40, y - 26, f.blekk); tekst(c, "tyngde", B / 2 + 54, y + s + 26, f.blekk);
  },
  eratosthenes(c, B, H, t, f) {
    const R = H * 1.6, cx = B / 2, cy = H + R * 0.55;
    c.fillStyle = "#3d8f5b"; c.beginPath(); c.arc(cx, cy, R, 0, 2 * Math.PI); c.fill();
    const vink = [-0.06, 0.06];
    vink.forEach((v, i) => {
      const x = cx + R * Math.sin(v), y = cy - R * Math.cos(v), ux = Math.sin(v), uy = -Math.cos(v);
      strek(c, x, y, x + ux * 40, y + uy * 40, f.blekk, 3);
      for (let j = -1; j <= 1; j++) strek(c, x + ux * 40 + j * 10, 0, x + ux * 40 + j * 10, y + uy * 40, "#e0a400", 1);
      if (i === 1) { c.fillStyle = f.dempet; c.globalAlpha = 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + ux * 40, y + uy * 40); c.lineTo(x + ux * 40 + 10 * uy * -1, y + uy * 40); c.closePath(); c.fill(); c.globalAlpha = 1; }
      tekst(c, i ? "Alexandria" : "Syene", x, y + 18, "#fff", 12);
    });
    tekst(c, "Sollyset kommer parallelt. Vinkelen på skyggen gir en del av en hel sirkel.", B / 2, 18, f.blekk, 12);
  },
  bane(c, B, H, t, f, k) {
    const a = Math.min(B, H * 1.8) * 0.38, e = 0.6, b = a * Math.sqrt(1 - e * e), cx = B / 2, cy = H / 2, fx = cx - a * e;
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI); c.stroke();
    sirkel(c, fx, cy, 12, "#f4b400");
    const M = (t * 0.9) % (2 * Math.PI); let E = M; for (let i = 0; i < 8; i++) E = M + e * Math.sin(E);
    const px = cx - a * Math.cos(E) * -1, py = cy + b * Math.sin(E);
    const M0 = M - 0.6; let E0 = M0; for (let i = 0; i < 8; i++) E0 = M0 + e * Math.sin(E0);
    c.fillStyle = k; c.globalAlpha = 0.25; c.beginPath(); c.moveTo(fx, cy);
    for (let j = 0; j <= 20; j++) { const Ej = E0 + (E - E0) * j / 20; c.lineTo(cx + a * Math.cos(Ej), cy + b * Math.sin(Ej)); }
    c.closePath(); c.fill(); c.globalAlpha = 1;
    sirkel(c, px, py, 6, k);
    tekst(c, "Like store arealer på like lang tid", B / 2, H - 14, f.dempet, 12);
  },
  maaner(c, B, H, t, f) {
    const cy = H / 2, cx = B / 2; sirkel(c, cx, cy, 26, "#d9a066");
    [[60, 1.8], [95, 0.9], [150, 0.45], [230, 0.19]].forEach(([r, w], i) => {
      const s = Math.min(1, B / 520), x = cx + r * s * Math.cos(t * w + i), bak = Math.sin(t * w + i) < 0;
      if (bak && Math.abs(x - cx) < 26) return; sirkel(c, x, cy, 4, f.blekk);
    });
    tekst(c, "Månene ser ut til å vandre fram og tilbake langs en linje", B / 2, H - 14, f.dempet, 12);
  },
  fall(c, B, H, t, f, k) {
    const T = (t % 2.4), g = 260, n = Math.floor(T / 0.12);
    for (let i = 0; i <= n; i++) { const tt = i * 0.12, y = 20 + 0.5 * g * tt * tt; if (y < H - 20) { sirkel(c, B * 0.25, y, 5, i === n ? k : f["rute-sterk"]); sirkel(c, B * 0.6 + 70 * tt, y, 5, i === n ? "#2f7fd1" : f["rute-sterk"]); } }
    tekst(c, "Fritt fall", B * 0.25, H - 10, f.dempet, 12); tekst(c, "Vannrett kast", B * 0.68, H - 10, f.dempet, 12);
  },
  pendel(c, B, H, t, f, k) {
    const L = H * 0.7, v = 0.45 * Math.cos(t * Math.sqrt(9.81 / 1.2)), x = B / 2 + L * Math.sin(v), y = 18 + L * Math.cos(v);
    strek(c, B / 2 - 40, 18, B / 2 + 40, 18, f.blekk, 3); strek(c, B / 2, 18, x, y, f.blekk, 1.5); sirkel(c, x, y, 12, k);
  },
  eple(c, B, H, t, f, k) {
    const ex = B * 0.32, ey = H * 0.55; sirkel(c, ex, ey, H * 0.18, "#2f7fd1");
    const r = Math.min(B * 0.5, H * 0.42), v = t * 0.5; sirkel(c, ex + r * Math.cos(v), ey + r * Math.sin(v), 7, f.dempet);
    c.strokeStyle = f["rute-sterk"]; c.setLineDash([3, 4]); c.beginPath(); c.arc(ex, ey, r, 0, 2 * Math.PI); c.stroke(); c.setLineDash([]);
    const T = t % 1.6, y = ey - H * 0.18 - 40 + Math.min(40, 0.5 * 60 * T * T);
    strek(c, ex, ey - H * 0.18, ex, ey - H * 0.18 - 46, "#6b4a2b", 4); sirkel(c, ex + 2, y, 5, "#c0392b");
    tekst(c, "Samme kraft på eplet og månen", B * 0.75, H - 14, f.dempet, 12);
  },
  felt(c, B, H, t, f) {
    const q = [[B * 0.35, H / 2, 1], [B * 0.65, H / 2, -1]];
    const E = (x, y) => { let ex = 0, ey = 0; for (const [qx, qy, s] of q) { const dx = x - qx, dy = y - qy, r3 = Math.pow(dx * dx + dy * dy, 1.5) + 1; ex += s * dx / r3; ey += s * dy / r3; } return [ex, ey]; };
    c.strokeStyle = "#2f7fd1"; c.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
      const v = (i / 14) * 2 * Math.PI; let x = q[0][0] + 14 * Math.cos(v), y = q[0][1] + 14 * Math.sin(v); c.beginPath(); c.moveTo(x, y);
      for (let s = 0; s < 400; s++) { const [ex, ey] = E(x, y), n = Math.hypot(ex, ey); x += 3 * ex / n; y += 3 * ey / n; c.lineTo(x, y); if (Math.hypot(x - q[1][0], y - q[1][1]) < 10 || x < 0 || x > B || y < 0 || y > H) break; }
      c.stroke();
    }
    sirkel(c, q[0][0], q[0][1], 12, "#c0392b"); sirkel(c, q[1][0], q[1][1], 12, "#2f7fd1"); tekst(c, "+", q[0][0], q[0][1], "#fff", 16); tekst(c, "−", q[1][0], q[1][1], "#fff", 16);
    sirkel(c, B / 2, H / 2 + 6 * Math.sin(t * 6), 3, "#e0a400");
  },
  torsjon(c, B, H, t, f, k) {
    const cx = B / 2, cy = H / 2, v = 0.12 * (1 - Math.cos(t * 0.8)), L = Math.min(B, H) * 0.38;
    sirkel(c, cx - L, cy - 34, 22, f.dempet); sirkel(c, cx + L, cy + 34, 22, f.dempet);
    const dx = L * Math.cos(v), dy = L * Math.sin(v); strek(c, cx - dx, cy - dy, cx + dx, cy + dy, f.blekk, 2);
    sirkel(c, cx - dx, cy - dy, 7, k); sirkel(c, cx + dx, cy + dy, 7, k); sirkel(c, cx, cy, 3, f.blekk);
    tekst(c, "Små kuler trekkes svakt mot store blykuler (sett ovenfra)", B / 2, H - 12, f.dempet, 12);
  },
  batteri(c, B, H, t, f) {
    const x0 = B * 0.2, y0 = H * 0.2, x1 = B * 0.8, y1 = H * 0.8;
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "#b87333" : "#9aa0a6"; c.fillRect(x0 - 20, y0 + 10 + i * 10, 40, 8); }
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.strokeRect(x0, y0, x1 - x0, y1 - y0);
    sirkel(c, x1, (y0 + y1) / 2, 14, "#ffd23f", f.blekk);
    const L = 2 * (x1 - x0 + y1 - y0);
    for (let i = 0; i < 16; i++) { let s = (i / 16 * L + t * 60) % L; let x, y; const w = x1 - x0, h = y1 - y0;
      if (s < w) { x = x0 + s; y = y0; } else if ((s -= w) < h) { x = x1; y = y0 + s; } else if ((s -= h) < w) { x = x1 - s; y = y1; } else { s -= w; x = x0; y = y1 - s; }
      sirkel(c, x, y, 2.5, "#2f7fd1"); }
  },
  interferens(c, B, H, t, f, k) {
    const sx = B * 0.25, s1 = H / 2 - 18, s2 = H / 2 + 18, skjerm = B * 0.85;
    strek(c, sx, 0, sx, s1 - 4, f.blekk, 4); strek(c, sx, s1 + 4, sx, s2 - 4, f.blekk, 4); strek(c, sx, s2 + 4, sx, H, f.blekk, 4);
    c.strokeStyle = k; c.lineWidth = 1.2;
    for (let n = 0; n < 12; n++) { const r = ((t * 30 + n * 18) % 216); c.globalAlpha = 1 - r / 216; for (const sy of [s1, s2]) { c.beginPath(); c.arc(sx, sy, r, -1.2, 1.2); c.stroke(); } }
    c.globalAlpha = 1;
    for (let y = 0; y < H; y += 2) { const d = Math.hypot(skjerm - sx, y - s1) - Math.hypot(skjerm - sx, y - s2); const I = Math.cos(Math.PI * d / 18) ** 2; c.fillStyle = k; c.globalAlpha = I; c.fillRect(skjerm, y, 12, 2); }
    c.globalAlpha = 1;
  },
  kompass(c, B, H, t, f) {
    const paa = Math.floor(t / 2) % 2 === 1, cx = B / 2, cy = H / 2;
    strek(c, cx - 60, 10, cx - 60, H - 10, paa ? "#c0392b" : f.dempet, 4);
    if (paa) pil(c, cx - 75, H * 0.75, cx - 75, H * 0.35, "#c0392b", 2);
    sirkel(c, cx + 30, cy, 34, null, f.blekk);
    const mål = paa ? 0 : -Math.PI / 2, v = mål + 0.15 * Math.sin(t * 9) * Math.exp(-(t % 2) * 2);
    const ux = Math.cos(v), uy = Math.sin(v); strek(c, cx + 30 - 26 * ux, cy - 26 * uy, cx + 30, cy, "#2f7fd1", 4); strek(c, cx + 30, cy, cx + 30 + 26 * ux, cy + 26 * uy, "#c0392b", 4);
    tekst(c, paa ? "Strøm på: nåla dreier" : "Ingen strøm: nåla peker mot nord", B / 2, H - 12, f.dempet, 12);
  },
  induksjon(c, B, H, t, f, k) {
    const cx = B * 0.55, cy = H * 0.42, x = cx - 110 + 70 * Math.sin(t * 1.5), v = Math.cos(t * 1.5);
    c.fillStyle = "#c0392b"; c.fillRect(x - 30, cy - 9, 30, 18); c.fillStyle = "#2f7fd1"; c.fillRect(x - 60, cy - 9, 30, 18);
    for (let i = 0; i < 8; i++) { c.strokeStyle = k; c.lineWidth = 2; c.beginPath(); c.ellipse(cx + i * 8, cy, 6, 26, 0, 0, 2 * Math.PI); c.stroke(); }
    const mx = B * 0.55 + 28, my = H * 0.9; c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.beginPath(); c.arc(mx, my, 30, Math.PI, 0); c.stroke();
    const vk = -Math.PI / 2 + 0.9 * v; strek(c, mx, my, mx + 26 * Math.cos(vk), my + 26 * Math.sin(vk), f.blekk, 2);
  },
  joule(c, B, H, t, f, k) {
    const cx = B * 0.45, cy = H * 0.62; c.fillStyle = "#4a90c2"; c.globalAlpha = 0.3; c.fillRect(cx - 60, cy - 40, 120, 80); c.globalAlpha = 1;
    const v = t * 2; for (let i = 0; i < 4; i++) { const a = v + i * Math.PI / 2; strek(c, cx, cy, cx + 34 * Math.cos(a), cy + 18 * Math.sin(a), f.blekk, 3); }
    const T = t % 6, y = 20 + T * 12; strek(c, cx + 70, 10, cx + 70, y, f.blekk, 1); c.fillStyle = f.dempet; c.fillRect(cx + 60, y, 20, 20);
    const tx = B * 0.85; c.strokeStyle = f.blekk; c.strokeRect(tx - 5, 20, 10, H - 50); c.fillStyle = "#c0392b"; const nivå = 10 + T * (H - 70) / 6; c.fillRect(tx - 3, H - 30 - nivå, 6, nivå);
  },
  emboelge(c, B, H, t, f) {
    const cy = H / 2; strek(c, 10, cy, B - 10, cy, f["rute-sterk"], 1);
    for (let x = 10; x < B - 10; x += 10) { const a = Math.sin((x / 50) - t * 4); strek(c, x, cy, x, cy - 50 * a, "#c0392b", 1.5); strek(c, x, cy, x + 18 * a, cy + 18 * a * 0.6, "#2f7fd1", 1.5); }
    tekst(c, "E", 20, cy - 60, "#c0392b", 14); tekst(c, "B", 30, cy + 30, "#2f7fd1", 14);
  },
  interferometer(c, B, H, t, f, k) {
    const cx = B * 0.4, cy = H * 0.55; strek(c, cx - 14, cy + 14, cx + 14, cy - 14, f.blekk, 3);
    strek(c, B * 0.85, cy - 22, B * 0.85, cy + 22, f.blekk, 4); strek(c, cx - 22, 18, cx + 22, 18, f.blekk, 4);
    strek(c, 10, cy, B * 0.85, cy, "#e0a400", 1); strek(c, cx, 18, cx, H - 10, "#e0a400", 1);
    const s = (t * 120) % 300; const p = (x, y) => sirkel(c, x, y, 4, "#e0a400");
    if (s < cx - 10) p(10 + s, cy); else { const r = s - (cx - 10); p(cx + Math.min(r, B * 0.85 - cx) - Math.max(0, r - (B * 0.85 - cx)), cy); p(cx, cy - Math.min(r, cy - 18) + Math.max(0, r - (cy - 18))); }
    tekst(c, "Lys delt i to armer: ingen forskjell i lysfarten", B / 2, H - 10, f.dempet, 12);
  },
  straaling(c, B, H, t, f, k) {
    const cx = B / 2, cy = H / 2; sirkel(c, cx, cy, 12, k);
    for (let i = 0; i < 24; i++) { const v = i * 2.4, r = ((t * 70 + i * 23) % 160) + 16; sirkel(c, cx + r * Math.cos(v), cy + r * Math.sin(v), 2.5, k); }
  },
  katode(c, B, H, t, f, k) {
    const cy = H / 2; c.strokeStyle = f["rute-sterk"]; c.lineWidth = 2; c.beginPath(); c.roundRect(20, cy - 50, B - 40, 100, 30); c.stroke();
    strek(c, B * 0.4, cy - 30, B * 0.6, cy - 30, "#c0392b", 4); strek(c, B * 0.4, cy + 30, B * 0.6, cy + 30, "#2f7fd1", 4);
    c.strokeStyle = "#2fbf71"; c.lineWidth = 2; c.beginPath(); const avb = 25 * (0.5 + 0.5 * Math.sin(t));
    for (let x = 40; x < B - 40; x += 4) { const u = Math.max(0, Math.min(1, (x - B * 0.4) / (B * 0.2))); const y = cy - avb * u * u - (x > B * 0.6 ? 2 * avb * (x - B * 0.6) / (B * 0.4) : 0); x === 40 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
  },
  planck(c, B, H, t, f) {
    const T = 0.5 + 0.5 * Math.sin(t * 0.7), r = 255, g = Math.round(80 + 170 * T), b = Math.round(40 + 200 * T * T);
    sirkel(c, B * 0.25, H / 2, 30, `rgb(${r},${g},${b})`);
    for (let i = 0; i < 4; i++) { const s = ((t * 80 + i * 60) % 240); foton(c, B * 0.25 + 36 + s, H / 2 - 30 + i * 20, B * 0.25 + 86 + s, H / 2 - 30 + i * 20, `rgb(${r},${g},${b})`, 14 - 6 * T, t * 6); }
    tekst(c, "Energi i porsjoner: E = hf", B * 0.7, H - 14, f.dempet, 12);
  },
  nordlys(c, B, H, t, f) {
    const cx = B * 0.62, cy = H / 2, R = 30; c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1;
    for (const k of [1.8, 2.6, 3.6]) { c.beginPath(); for (let v = -Math.PI / 2 + 0.3; v < Math.PI / 2 - 0.3; v += 0.05) { const r = k * R * Math.cos(v) ** 2; c.lineTo(cx - r * Math.cos(v), cy - r * Math.sin(v)); } c.stroke(); }
    sirkel(c, cx, cy, R, "#2f7fd1"); c.fillStyle = "#2fbf71"; c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3); c.fillRect(cx - 14, cy - R - 6, 28, 5); c.fillRect(cx - 14, cy + R + 1, 28, 5); c.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { const x = ((t * 60 + i * 40) % (cx - R - 20)); sirkel(c, x, cy - 40 + i * 16 + 4 * Math.sin(t * 8 + i), 2, "#e0a400"); }
    tekst(c, "sola", 16, 14, f.dempet, 11, "left");
  },
  foton(c, B, H, t, f, k) {
    strek(c, B * 0.55, 10, B * 0.55, H - 10, f.dempet, 6);
    for (let i = 0; i < 3; i++) { const s = (t * 90 + i * 70) % 200, x0 = 10 + s; if (x0 < B * 0.55 - 60) foton(c, x0, H * 0.3 + i * 30, x0 + 50, H * 0.3 + i * 30, "#7b4fd1", 10, t * 8); else { const u = x0 - (B * 0.55 - 60); sirkel(c, B * 0.55 + 6 + u * 1.2, H * 0.3 + i * 30 - u * 0.4, 4, "#2f7fd1"); } }
    tekst(c, "Ett foton slår løs ett elektron", B / 2, H - 10, f.dempet, 12);
  },
  lysklokke(c, B, H, t, f, k) {
    const x = (t * 40) % (B + 60) - 30, h = H - 40, T = 2.0, u = (t % T) / T, y = 20 + h * (u < 0.5 ? 2 * u : 2 - 2 * u);
    strek(c, x - 20, 20, x + 20, 20, f.blekk, 3); strek(c, x - 20, 20 + h, x + 20, 20 + h, f.blekk, 3); sirkel(c, x, y, 5, "#e0a400");
    c.strokeStyle = "#e0a400"; c.globalAlpha = 0.4; c.beginPath(); for (let s = 0; s <= 1; s += 0.02) { const xx = x - (1 - s) * T * 40 * u, uu = u * s, yy = 20 + h * (uu < 0.5 ? 2 * uu : 2 - 2 * uu); s ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); c.globalAlpha = 1;
  },
  oljedraape(c, B, H, t, f, k) {
    strek(c, 20, 20, B - 20, 20, "#c0392b", 5); strek(c, 20, H - 20, B - 20, H - 20, "#2f7fd1", 5);
    for (let i = 0; i < 6; i++) sirkel(c, 40 + i * (B - 80) / 5, H / 2 + 20 * Math.sin(t * (0.4 + i * 0.15) + i), 4, "#e0a400");
  },
  rutherford(c, B, H, t, f, k) {
    const cx = B * 0.6, cy = H / 2; sirkel(c, cx, cy, 5, "#c0392b");
    for (let i = 0; i < 9; i++) { const b0 = (i - 4) * 12 + 0.5; let x = 10, y = cy + b0, vx = 3, vy = 0; c.strokeStyle = k; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y);
      const n = Math.min(400, ((t * 120 + i * 37) % 500)); for (let s = 0; s < n; s++) { const dx = x - cx, dy = y - cy, r3 = Math.pow(dx * dx + dy * dy, 1.5) + 20; vx += 600 * dx / r3; vy += 600 * dy / r3; x += vx; y += vy; c.lineTo(x, y); if (x < 0 || x > B || y < 0 || y > H) break; } c.stroke(); }
  },
  bohr(c, B, H, t, f, k) {
    const cx = B * 0.35, cy = H / 2; sirkel(c, cx, cy, 6, "#c0392b");
    [20, 45, 75].forEach((r) => sirkel(c, cx, cy, r, null, f["rute-sterk"]));
    const T = t % 3, r = T < 1.5 ? 75 : 45, v = t * (r === 75 ? 1.2 : 2); sirkel(c, cx + r * Math.cos(v), cy + r * Math.sin(v), 4, "#2f7fd1");
    if (T > 1.5 && T < 2.6) { const s = (T - 1.5) * 200; foton(c, cx + 80 + s, cy, cx + 130 + s, cy, "#c0392b", 14, t * 8); }
    tekst(c, "n = 3 → n = 2: et foton sendes ut", B * 0.7, H - 14, f.dempet, 12);
  },
  krumning(c, B, H, t, f, k) {
    const cx = B / 2, cy = H / 2; c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1;
    for (let i = -6; i <= 6; i++) { c.beginPath(); for (let j = -40; j <= 40; j++) { const x = cx + j * B / 80, y0 = cy + i * 14; const d = Math.hypot(x - cx, (y0 - cy) * 2); c.lineTo(x, y0 + 30 * Math.exp(-d * d / 4000)); } c.stroke(); }
    sirkel(c, cx, cy + 30, 14, "#f4b400");
    const v = t * 1.3; sirkel(c, cx + 80 * Math.cos(v), cy + 30 + 28 * Math.sin(v), 5, k);
  },
  "lysbøy"(c, B, H, t, f) {
    const sx = B * 0.45, sy = H * 0.62; sirkel(c, sx, sy, 22, "#f4b400");
    const y = sy - 34; strek(c, 10, y, sx, y, "#e0a400", 2); strek(c, sx, y, B - 20, y + 40, "#e0a400", 2);
    c.setLineDash([5, 4]); strek(c, B - 20, y + 40, 10, y + 40 - (B - 30) * 40 / (B - 20 - sx), f.dempet, 1); c.setLineDash([]);
    sirkel(c, B - 20, y + 40, 5, "#2f7fd1"); sirkel(c, 14, y, 4, "#e0a400"); tekst(c, "Vinkelen er sterkt forstørret", B / 2, H - 12, f.dempet, 12);
  },
  compton(c, B, H, t, f, k) {
    const T = t % 3, cx = B * 0.5, cy = H * 0.5;
    if (T < 1.2) { const s = T / 1.2; foton(c, 20 + s * (cx - 80), cy, 20 + s * (cx - 80) + 60, cy, "#7b4fd1", 8, t * 10); sirkel(c, cx, cy, 6, "#2f7fd1"); }
    else { const s = (T - 1.2) * 90; foton(c, cx + s * 0.8, cy - s * 0.5, cx + s * 0.8 + 50, cy - s * 0.5 - 30, "#c0392b", 14, t * 10); sirkel(c, cx + s * 0.9, cy + s * 0.5, 6, "#2f7fd1"); }
    tekst(c, "Fotonet får lengre bølgelengde etter støtet", B / 2, H - 12, f.dempet, 12);
  },
  uskarphet(c, B, H, t, f, k) {
    const s = 20 + 60 * (0.5 + 0.5 * Math.sin(t * 0.8)), cy = H * 0.55; c.strokeStyle = k; c.lineWidth = 2; c.beginPath();
    for (let x = 0; x <= B; x += 2) { const u = x - B / 2, y = cy - 50 * Math.exp(-u * u / (2 * s * s)) * Math.cos(u * (12 / s)); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    tekst(c, s < 50 ? "Smal bølgepakke: skarp posisjon, uskarp bølgelengde" : "Bred bølgepakke: skarp bølgelengde, uskarp posisjon", B / 2, H - 12, f.dempet, 12);
  },
  utvidelse(c, B, H, t, f, k) {
    const cx = B / 2, cy = H / 2, s = 1 + ((t * 0.15) % 1.5);
    for (let i = 0; i < 30; i++) { const v = i * 2.39996, r = 8 + (i * 7) % 90; sirkel(c, cx + r * s * Math.cos(v), cy + r * s * Math.sin(v) * 0.7, 3, i === 0 ? k : f.dempet); }
    tekst(c, "Avstanden mellom alle galakser øker", B / 2, H - 12, f.dempet, 12);
  },
  kjerne(c, B, H, t, f) {
    const cx = B / 2, cy = H / 2;
    for (let i = 0; i < 18; i++) { const v = i * 2.39996, r = 5 * Math.sqrt(i); sirkel(c, cx + r * 2.2 * Math.cos(v) + Math.sin(t * 9 + i), cy + r * 2.2 * Math.sin(v), 7, i % 2 ? "#c0392b" : "#9aa0a6"); }
    const s = (t * 80) % (B * 0.4); sirkel(c, 20 + s, cy - 50, 7, "#9aa0a6"); tekst(c, "nøytron", 20 + s, cy - 66, f.dempet, 11);
  },
  fisjon(c, B, H, t, f, k) {
    const T = t % 3, cx = B / 2, cy = H / 2;
    if (T < 1) { sirkel(c, cx, cy, 30, k); sirkel(c, 20 + T * (cx - 50), cy, 5, "#9aa0a6"); }
    else { const s = (T - 1) * 60; sirkel(c, cx - s, cy - s * 0.3, 20, k); sirkel(c, cx + s, cy + s * 0.3, 18, k); for (const v of [0.8, 2.4, 4.2]) sirkel(c, cx + s * 2 * Math.cos(v), cy + s * 2 * Math.sin(v), 4, "#9aa0a6"); }
  },
  myon(c, B, H, t, f, k) {
    c.fillStyle = "#4a90c2"; c.globalAlpha = 0.15; c.fillRect(0, 0, B, H - 20); c.globalAlpha = 1; strek(c, 0, H - 20, B, H - 20, "#3d8f5b", 6);
    const T = (t % 2.5) / 2.5; sirkel(c, B / 2, 10 + T * (H - 34), 5, k); tekst(c, "μ", B / 2 + 14, 10 + T * (H - 34), f.blekk, 13);
    tekst(c, "Myonene når bakken fordi tiden går saktere for dem", B / 2, 10, f.dempet, 12);
  },
  satellitt(c, B, H, t, f, k) {
    const cx = B / 2, cy = H / 2, R = H * 0.25; sirkel(c, cx, cy, R, "#2f7fd1");
    const r = R * 1.7, v = t * 0.9; c.strokeStyle = f["rute-sterk"]; c.setLineDash([3, 4]); c.beginPath(); c.arc(cx, cy, r, 0, 2 * Math.PI); c.stroke(); c.setLineDash([]);
    c.fillStyle = k; c.fillRect(cx + r * Math.cos(v) - 4, cy + r * Math.sin(v) - 4, 8, 8);
  },
  rakett(c, B, H, t, f, k) {
    const ex = B * 0.2, mx = B * 0.82, cy = H / 2; sirkel(c, ex, cy, 26, "#2f7fd1"); sirkel(c, mx, cy, 10, "#9aa0a6");
    const T = (t % 4) / 4, x = ex + 30 + T * (mx - ex - 44), y = cy - 50 * Math.sin(Math.PI * T); sirkel(c, x, y, 4, k);
  },
  fly(c, B, H, t, f, k) {
    const cx = B / 2, cy = H / 2, R = H * 0.3; sirkel(c, cx, cy, R, "#2f7fd1");
    const r = R + 12, v = t * 0.8; for (const [s, farge] of [[1, k], [-1, "#c0392b"]]) { const a = s * v; c.fillStyle = farge; c.beginPath(); c.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 5, 0, 2 * Math.PI); c.fill(); }
    tekst(c, "Østover og vestover med atomklokker", B / 2, H - 10, f.dempet, 12);
  },
  sammenfiltring(c, B, H, t, f, k) {
    const cx = B / 2, cy = H / 2, s = (t * 70) % (B / 2 - 30); sirkel(c, cx, cy, 8, f.dempet);
    const v = (Math.floor(t * 70 / (B / 2 - 30)) % 2) ? 0 : Math.PI / 2;
    for (const d of [-1, 1]) { const x = cx + d * s; sirkel(c, x, cy, 6, k); const a = d < 0 ? v : v + Math.PI / 2; strek(c, x - 12 * Math.cos(a), cy - 12 * Math.sin(a), x + 12 * Math.cos(a), cy + 12 * Math.sin(a), f.blekk, 2); }
    strek(c, 18, cy - 24, 18, cy + 24, f.blekk, 4); strek(c, B - 18, cy - 24, B - 18, cy + 24, f.blekk, 4);
    tekst(c, "Målingene på de to fotonene henger alltid sammen", B / 2, H - 12, f.dempet, 12);
  },
  kollisjon(c, B, H, t, f, k) {
    const T = t % 2.5, cx = B / 2, cy = H / 2;
    if (T < 0.8) { const s = T / 0.8 * (cx - 20); sirkel(c, 20 + s, cy, 5, "#c0392b"); sirkel(c, B - 20 - s, cy, 5, "#2f7fd1"); }
    else { const s = (T - 0.8) * 140; for (let i = 0; i < 14; i++) { const v = i * 0.45 + 0.2; c.strokeStyle = i % 3 ? k : "#e0a400"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(cx + s * 0.5 * Math.cos(v), cy + s * 0.5 * Math.sin(v), cx + s * Math.cos(v + 0.2), cy + s * Math.sin(v + 0.2)); c.stroke(); } }
  },
  "gravbølger"(c, B, H, t, f, k) {
    const cx = B / 2, cy = H / 2, T = t % 6, r = Math.max(3, 40 * (1 - T / 5)), v = 2 / Math.pow(Math.max(0.05, 1 - T / 5), 1.2) * T;
    c.strokeStyle = k; for (let i = 0; i < 6; i++) { const rr = ((t * 50 + i * 30) % 180) + 20; c.globalAlpha = 1 - rr / 200; c.beginPath(); c.arc(cx, cy, rr, 0, 2 * Math.PI); c.stroke(); } c.globalAlpha = 1;
    if (T < 5) { sirkel(c, cx + r * Math.cos(v), cy + r * Math.sin(v), 8, f.blekk); sirkel(c, cx - r * Math.cos(v), cy - r * Math.sin(v), 8, f.blekk); } else sirkel(c, cx, cy, 11, f.blekk);
  },
  svarthull(c, B, H, t, f) {
    const cx = B / 2, cy = H / 2, R = Math.min(B, H) * 0.28;
    for (let i = 0; i < 40; i++) { const v = i / 40 * 2 * Math.PI, lys = 0.5 + 0.5 * Math.sin(v * 2 + t); c.strokeStyle = `rgba(255,${Math.round(120 + 80 * lys)},40,${0.4 + 0.5 * lys})`; c.lineWidth = 10; c.beginPath(); c.arc(cx, cy, R, v, v + 0.17); c.stroke(); }
    sirkel(c, cx, cy, R * 0.75, "#000");
  },
};
