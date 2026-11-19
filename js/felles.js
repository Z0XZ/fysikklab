// Felles hjelpefunksjoner for simuleringene på fysikklab.no.
// Lastes før selve simuleringen: <script src="../js/felles.js"></script>

const Sim = (() => {
  const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

  const $ = (id) => document.getElementById(id);

  // 3.14159 → "3,14". Bruker ekte minustegn og unngår "−0,00".
  function komma(n, d = 0) {
    if (!isFinite(n)) return "–";
    if (Math.abs(n) < 0.5 * 10 ** -d) n = 0;
    return n.toFixed(d).replace(".", ",").replace("-", "−");
  }

  const HEVET = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  // Tall med et fast antall gjeldende siffer. Veldig store og små tall får tierpotens: 1,23 · 10⁻⁶
  function tall(n, siffer = 3) {
    if (n === 0 || !isFinite(n)) return komma(n);
    let e = Math.floor(Math.log10(Math.abs(n)));
    if (e >= -2 && e <= 5) return komma(n, Math.max(0, siffer - 1 - e));
    let m = n / 10 ** e;
    if (Math.abs(Number(m.toFixed(siffer - 1))) >= 10) { m /= 10; e += 1; }
    return komma(m, siffer - 1) + " · 10" + String(e).split("").map((t) => HEVET[t]).join("");
  }

  function farger() {
    const s = getComputedStyle(document.documentElement), f = {};
    for (const n of ["blekk", "dempet", "rute", "rute-sterk", "f1", "f2", "flate", "papir", "serif"]) {
      f[n] = s.getPropertyValue("--" + n).trim();
    }
    return f;
  }

  // Leser en glidebryter, nedtrekksliste eller avkrysningsboks, og skriver verdien i <output id="…-ut">.
  function verdi(id, format) {
    const el = $(id), ut = $(id + "-ut");
    const v = el.type === "checkbox" ? el.checked : el.tagName === "SELECT" ? el.value : Number(el.value);
    if (ut && format) ut.textContent = format(v);
    return v;
  }

  // Setter opp et lerret som tegnes skarpt på alle skjermer.
  // l.tegn() kalles når lerretet endrer størrelse og når fargetemaet byttes.
  function lerret(el, tegn) {
    const ctx = el.getContext("2d");
    const l = { el, ctx, b: 0, h: 0, f: farger(), tegn };
    l.tilpass = () => {
      const r = el.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      el.width = Math.round(r.width * dpr);
      el.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      l.b = r.width; l.h = r.height;
      if (l.b > 0) l.tegn();
    };
    l.tom = () => ctx.clearRect(0, 0, l.b, l.h);
    new ResizeObserver(l.tilpass).observe(el);
    const forny = () => { l.f = farger(); if (l.b > 0) l.tegn(); };
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", forny);
    window.addEventListener("temaendring", forny);
    return l;
  }

  // Start/pause-knapp med animasjonsløkke. steg(dt) får tiden siden forrige bilde i sekunder
  // og returnerer false når simuleringen er ferdig. Pauser når lerretet rulles ut av skjermen.
  function avspiller({ knapp, steg, nullstill, lerret: el, tekster }) {
    let tilstand = "klar", forrige = null, id = null;
    const tekst = Object.assign({ klar: "Start", kjorer: "Pause", pause: "Fortsett", ferdig: "Kjør igjen" }, tekster);
    const sett = (t) => { tilstand = t; knapp.textContent = tekst[t]; };
    function bilde(naa) {
      id = null;
      if (tilstand !== "kjorer") return;
      const dt = forrige === null ? 0 : Math.min((naa - forrige) / 1000, 0.1);
      forrige = naa;
      if (steg(dt) === false) { sett("ferdig"); return; }
      id = requestAnimationFrame(bilde);
    }
    function start() {
      if (tilstand === "ferdig" && nullstill) nullstill();
      sett("kjorer");
      forrige = null;
      id = id || requestAnimationFrame(bilde);
    }
    function pause() { if (tilstand === "kjorer") sett("pause"); }
    function stopp() { if (id) cancelAnimationFrame(id); id = null; forrige = null; sett("klar"); }
    knapp.addEventListener("click", () => (tilstand === "kjorer" ? pause() : start()));
    if (el) new IntersectionObserver(([e]) => { if (!e.isIntersecting) pause(); }).observe(el);
    return { start, pause, stopp, get kjorer() { return tilstand === "kjorer"; }, get tilstand() { return tilstand; } };
  }

  function steglengde(spenn, antall = 4) {
    const r = spenn / antall, p = 10 ** Math.floor(Math.log10(r));
    return [1, 2, 5, 10].map((k) => k * p).find((s) => s >= r * 0.999);
  }
  const desimaler = (s) => Math.max(0, -Math.floor(Math.log10(s) + 1e-9));

  // Tegner akser med rutenett og returnerer px(x) og py(y).
  // o = { x: [min, maks], y: [min, maks], xTekst, yTekst, marg, logX, xMerke(v), yMerke(v), xSteg, ySteg }
  function akser(l, o) {
    const { ctx, b, h, f } = l;
    const m = Object.assign({ v: 46, h: 14, o: 20, n: 30, topp: 0 }, o.marg || {});
    const tx = o.logX ? Math.log10 : (x) => x;
    const [x0, x1] = o.x.map(tx), [y0, y1] = o.y;
    const px = (x) => m.v + (tx(x) - x0) / (x1 - x0) * (b - m.v - m.h);
    const py = (y) => h - m.n - (y - y0) / (y1 - y0) * (h - m.n - m.o - m.topp);
    ctx.save();
    ctx.font = "11px " + MONO;
    ctx.lineWidth = 1;

    const xs = [];
    let xd = 0;
    if (o.logX) {
      for (let k = Math.ceil(x0 - 1e-9); k <= x1 + 1e-9; k++) xs.push(10 ** k);
    } else {
      const s = o.xSteg || steglengde(o.x[1] - o.x[0]);
      xd = desimaler(s);
      for (let k = Math.ceil(o.x[0] / s - 1e-9); k * s <= o.x[1] + s * 1e-6; k++) xs.push(k * s);
    }
    const sy = o.ySteg || steglengde(y1 - y0), yd = desimaler(sy), ys = [];
    for (let k = Math.ceil(y0 / sy - 1e-9); k * sy <= y1 + sy * 1e-6; k++) ys.push(k * sy);

    ctx.strokeStyle = f.rute; ctx.fillStyle = f.dempet;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (const v of xs) {
      ctx.beginPath(); ctx.moveTo(px(v), py(y0)); ctx.lineTo(px(v), py(y1)); ctx.stroke();
      ctx.fillText(o.xMerke ? o.xMerke(v) : komma(v, xd), px(v), py(y0) + 5);
    }
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (const v of ys) {
      ctx.beginPath(); ctx.moveTo(px(o.x[0]), py(v)); ctx.lineTo(px(o.x[1]), py(v)); ctx.stroke();
      ctx.fillText(o.yMerke ? o.yMerke(v) : komma(v, yd), px(o.x[0]) - 6, py(v));
    }
    ctx.strokeStyle = f.blekk; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px(o.x[0]), py(y1)); ctx.lineTo(px(o.x[0]), py(y0)); ctx.lineTo(px(o.x[1]), py(y0)); ctx.stroke();
    if (y0 < 0 && y1 > 0) {
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px(o.x[0]), py(0)); ctx.lineTo(px(o.x[1]), py(0)); ctx.stroke();
    }
    ctx.fillStyle = f.dempet;
    if (o.xTekst) { ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(o.xTekst, px(o.x[1]), py(y0) - 4); }
    if (o.yTekst) { ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(o.yTekst, px(o.x[0]) + 6, m.topp + 2); }
    ctx.restore();
    return { px, py };
  }

  // Lokal lagring som tåler at nettleseren blokkerer den.
  function hent(nokkel, standard) {
    try { const v = localStorage.getItem(nokkel); return v === null ? standard : JSON.parse(v); } catch { return standard; }
  }
  function lagre(nokkel, verdi) {
    try { localStorage.setItem(nokkel, JSON.stringify(verdi)); } catch { /* ikke lagret */ }
  }

  // Kopierer tekst til utklippstavla og gir beskjed på knappen.
  async function kopier(tekst, knapp) {
    const gammel = knapp.textContent;
    try { await navigator.clipboard.writeText(tekst); knapp.textContent = "Kopiert!"; }
    catch { knapp.textContent = "Kunne ikke kopiere"; }
    setTimeout(() => { knapp.textContent = gammel; }, 1600);
  }

  function lastNed(tekst, filnavn, type = "text/csv") {
    const url = URL.createObjectURL(new Blob(["﻿" + tekst], { type: type + ";charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = filnavn;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { MONO, SANS, $, komma, tall, farger, verdi, lerret, avspiller, akser, steglengde, hent, lagre, kopier, lastNed };
})();
